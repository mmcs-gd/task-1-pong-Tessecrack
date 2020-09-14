const canvas = document.getElementById("cnvs");
const buttonStart = document.querySelector("#startButton");
const gameState = {};
let isLose = false;

let isBonusTime = false;
let takeBonus = false;

let timeInGame = 0;
let bonusTrigger = false;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

buttonStart.addEventListener("click", function() {
    setup();
    run();
    buttonStart.style.display = "none";
  });
  
function onMouseMove(e) {
    gameState.pointer.x = e.pageX;
    gameState.pointer.y = e.pageY
}

function queueUpdates(numTicks) {
    for (let i = 0; i < numTicks; i++) {
        gameState.lastTick = gameState.lastTick + gameState.tickLength;
        update(gameState.lastTick);
    }
}

function draw(tFrame) {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    // clear canvas
    if (!isLose) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawCells(context);
        drawPlatform(context);
        drawBall(context);
        drawBonus(context);
    }
    else {
        windowLoser(context);
    }
    drawTime(context);
}

function speedBall(ball) {
    ball.y += ball.vy;
    ball.x += ball.vx;
}

function speedBonus(bonus) {
    bonus.x += bonus.vx;
    bonus.y += bonus.vy;
}

function update(tick) {
    const vx = (gameState.pointer.x - gameState.player.x) / 10;
    gameState.player.x += vx;
    const ball = gameState.ball;
    if (isBonusTime) bonusTrigger = true;
    moveBall(ball);
    moveBonus(gameState.bonus);
}

function moveBall(ball) {
    speedBall(ball);
    checkLoseBall(ball);
    ballCollisionOnBorders(ball);
    ballCollisionOnPlatform(ball);
}

function moveBonus(bonus) {
    if (isBonusTime || bonusTrigger) {
        speedBonus(bonus);
        checkLoseBonus(bonus);
        bonusCollisionOnBorders(bonus);
        bonusCollisionOnPlatform(bonus);
    }
}
function bonusCollisionOnBorders(bonus) {
    bonus.vx *= bonus.x <= bonus.width || bonus.x + bonus.width >= canvas.width ? -1 : 1;
}
function bonusCollisionOnPlatform(bonus) {
    let inBorderPlatform = gameState.player.x - gameState.player.width / 2 < bonus.x 
        && gameState.player.x + gameState.player.width / 2 > bonus.x;
    let onPlatform = bonus.y + bonus.height >= gameState.player.y - gameState.player.height / 2;
    if (inBorderPlatform && onPlatform) {
        bonusTrigger = false;
        takeBonus = true;
    }
}

function ballCollisionOnBorders(ball) {    
    ball.vy *= ball.y <= ball.radius ? -1 : 1;
    ball.vx *= ball.x <= ball.radius || ball.x + ball.radius >= canvas.width ? -1 : 1;
}

function ballCollisionOnPlatform(ball){
    if (ballOnPlatform(ball)) {
        return;
    }
    //ballOutPlatform(ball);
}

function ballOutPlatform(object) {
    let leftDownSidePlatform = gameState.player.x - gameState.player.width/2 + gameState.player.height/2; 
    let leftUpSidePlatform = gameState.player.x - gameState.player.width/2 - gameState.player.height/2;

    let rightUpSidePlatform = gameState.player.x + gameState.player.width/2 - gameState.player.height/2;
    let rightDownSidePlatform = gameState.player.x + gameState.player.width/2 + gameState.player.height/2;
    
    let onLeftSidePlatform = object.x + object.radius >= gameState.player.x - gameState.player.width / 2
    && leftUpSidePlatform <= object.y && leftDownSidePlatform >= object.y;

    let onRightSidePlatform = object.x - object.radius >= gameState.player.x + gameState.player.width / 2 
    && rightUpSidePlatform <= object.y && rightDownSidePlatform >= object.y;

    if (onLeftSidePlatform || onRightSidePlatform) {
        object.vx *= -1;
        object.vy *= -1;
    }
}

function ballOnPlatform(object) {
    let leftAnglePlatform = gameState.player.x - gameState.player.width / 2;

    let rightAnglePlatform = gameState.player.x + gameState.player.width / 2;

    let insidePlatform = object.x > leftAnglePlatform && object.x < rightAnglePlatform;

    let onPlatform = object.y + object.radius >= canvas.height - gameState.player.height;

    let besidePlatform = object.x <= leftAnglePlatform && object.x + object.radius >= leftAnglePlatform
    || object.x >= rightAnglePlatform && object.x - object.radius <= rightAnglePlatform;

    if ((insidePlatform || besidePlatform) && onPlatform) {
        object.vy *= -1;
        return true;
    }
    return false;
}

function initBonus() {
    if (isBonusTime)
    {
        let directionX = Math.random() <= 0.5 ? -1 : 1;
        let directionY = 1;
        gameState.bonus.x = getRandom(gameState.bonus.width, canvas.width - gameState.bonus.width);
        gameState.bonus.y = getRandom(gameState.bonus.height * 2, canvas.height/2);
        gameState.bonus.vx = getRandom(5, 10) * directionX; 
        gameState.bonus.vy = getRandom(5, 10) * directionY;
    }

}

function checkLoseBall(ball) {
    if (ball.y > gameState.player.y)
        isLose = true;
}

function checkLoseBonus(bonus) {
    if (bonus.y > gameState.player.y) {
        bonusTrigger = false;
        takeBonus = false;
    }

}

function run(tFrame) {
    gameState.stopCycle = window.requestAnimationFrame(run);
    const nextTick = gameState.lastTick + gameState.tickLength;
    let numTicks = 0;
    if (tFrame > nextTick) {
        const timeSinceTick = tFrame - gameState.lastTick;
        numTicks = Math.floor(timeSinceTick / gameState.tickLength);
    }
    queueUpdates(numTicks);
    draw(tFrame);
    gameState.lastRender = tFrame;
    if (isLose) stopGame(run);
}

function stopGame(handle) {
    window.cancelAnimationFrame(handle);
}

function drawPlatform(context) {
    const {x, y, width, height} = gameState.player;
    context.beginPath();
    let grad = context.createLinearGradient(x, y, x, y + height / 2);
    grad.addColorStop(0, "cyan");
    grad.addColorStop(1, "darkmagenta");
    context.fillStyle = grad;
    context.fillRect(x - width / 2, y - height / 2, width, height);
    context.fill();
    context.closePath();
}
function drawBonus(context) {
    if (bonusTrigger) {
        const {x, y, width, height} = gameState.bonus;
        context.beginPath();
        context.strokeStyle = "yellow";
        context.lineWidth = "10";
        context.moveTo(x - width, y);
        context.lineTo(x + width, y);
        context.stroke();
        context.moveTo(x, y - height);
        context.lineTo(x, y + height);
        context.stroke();
        context.closePath();
    }
}
function drawTime(context) {
    context.beginPath();
    context.strokeStyle = "#19ff19";
    context.lineWidth = "1";
    context.font = "italic 30pt Impact";
    context.shadowColor = "8b00ff";
    context.shadowOffsetX = 5; 
    context.shadowOffsetY = 5;
    context.shadowBlur = 10;
    context.strokeText(timeInGame, 20, 20, 50);
    context.textBaseline = "top";
    context.closePath();
}
function drawBall(context) {
    const {x, y, radius} = gameState.ball;
    context.beginPath();
    let grad = context.createRadialGradient(x, y, 1, x, y, radius);
    grad.addColorStop(0, "red");
    grad.addColorStop(1, "magenta");
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fillStyle = grad;
    context.fill();
    context.closePath();
}

function drawCells(context) {
    const widthField = 50;
    const heightField = 50;
    let x = widthField;
    let y = heightField;
    context.beginPath();
    context.lineWidth = "1";
    context.strokeStyle = "darkmagenta";
    while(true) {
        if (x < canvas.width) {
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
            context.stroke();
        }
        if (y < canvas.height) {
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
            context.stroke();
        }
        x += widthField;
        y += heightField;
        if (x >= canvas.width && y >= canvas.height)
            break;
    }
    context.closePath();
}

function windowLoser(context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    context.textAlign = "center";
    context.fillStyle = "#ff0000";
    context.font = "italic 30pt Impact";
    context.fillText("ПОТРАЧЕНО",canvas.width / 2, canvas.height / 2, canvas.width/2);
    context.textBaseline = "top";
    context.closePath();
}
function valueOfSec()
{
    if (!isLose) timeInGame++;
    if (takeBonus) {
        timeInGame += 15;
        takeBonus = false;
    }
    if (timeInGame % 30 == 0) {
        gameState.ball.vx *= 2;
        gameState.ball.vy *= 2;
    }
    isBonusTime = timeInGame % 15 == 0;
    if (isBonusTime) initBonus();
}
function setup() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    canvas.addEventListener('mousemove', onMouseMove, false);

    gameState.lastTick = performance.now();
    gameState.lastRender = gameState.lastTick;
    gameState.tickLength = 15; //ms
    let directionX = Math.random() <= 0.5 ? -1 : 1;
    let directionY = Math.random() <= 0.5 ? -1 : 1;
    setInterval(valueOfSec, 1000);
    const platform = {
        width: 300,
        height: 50,
    };

    gameState.player = {
        x: 100,
        y: canvas.height - platform.height / 2,
        width: platform.width,
        height: platform.height
    };
    gameState.pointer = {
        x: 0,
        y: 0,
    };
    gameState.ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 25,
        vx: getRandom(3, 5) * directionX,
        vy: getRandom(3, 5) * directionY,
    };
    gameState.bonus = {
        x: 0,
        y: 0,
        width: 20,
        height: 20,
        vx: 0, 
        vy: 0
    }
}
function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
