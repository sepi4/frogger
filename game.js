const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const ROWS = 12;
const COLS = 10;
const CELL_SIZE = 50;
const FROG_SIZE = 40;
const CAR_WIDTH = 50;
const CAR_HEIGHT = 40;
const FPS = 60;

// Frog
let frog = {
    x: Math.floor(COLS / 2) * CELL_SIZE + 5,
    y: (ROWS - 1) * CELL_SIZE + 5,
    width: FROG_SIZE,
    height: FROG_SIZE,
    color: 'lime',
};

// Cars (obstacles)
// Update lanes to match wider road
const lanes = [2, 3, 4, 5, 6, 7, 8, 9]; // More lanes for wider road
let cars = [];
function spawnCars() {
    cars = [];
    for (let lane of lanes) {
        let dir = lane % 2 === 0 ? 1 : -1;
        for (let i = 0; i < 3; i++) {
            cars.push({
                x: dir === 1 ? -i * 200 : canvas.width + i * 200,
                y: lane * CELL_SIZE + 5,
                width: CAR_WIDTH,
                height: CAR_HEIGHT,
                speed: 2 + Math.random() * 2,
                dir: dir,
                color: 'red',
            });
        }
    }
}

// Input
let keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function moveFrog() {
    if (keys['ArrowUp'] && frog.y > 0) frog.y -= CELL_SIZE;
    if (keys['ArrowDown'] && frog.y < (ROWS - 1) * CELL_SIZE) frog.y += CELL_SIZE;
    if (keys['ArrowLeft'] && frog.x > 0) frog.x -= CELL_SIZE;
    if (keys['ArrowRight'] && frog.x < (COLS - 1) * CELL_SIZE) frog.x += CELL_SIZE;
    // Prevent holding key for continuous move
    keys = {};
}

function updateCars() {
    for (let car of cars) {
        car.x += car.speed * car.dir;
        if (car.dir === 1 && car.x > canvas.width) car.x = -CAR_WIDTH;
        if (car.dir === -1 && car.x < -CAR_WIDTH) car.x = canvas.width;
    }
}

function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function drawFrog() {
    // Draw a simple frog shape (body, eyes, legs)
    const centerX = frog.x + frog.width / 2;
    const centerY = frog.y + frog.height / 2;
    // Body
    ctx.fillStyle = 'lime';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, frog.width/2, frog.height/2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX - 10, centerY - 12, 6, 0, Math.PI * 2);
    ctx.arc(centerX + 10, centerY - 12, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(centerX - 10, centerY - 12, 2, 0, Math.PI * 2);
    ctx.arc(centerX + 10, centerY - 12, 2, 0, Math.PI * 2);
    ctx.fill();
    // Legs
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - 15, centerY + 15); ctx.lineTo(centerX - 25, centerY + 25);
    ctx.moveTo(centerX + 15, centerY + 15); ctx.lineTo(centerX + 25, centerY + 25);
    ctx.moveTo(centerX - 15, centerY - 5); ctx.lineTo(centerX - 25, centerY - 15);
    ctx.moveTo(centerX + 15, centerY - 5); ctx.lineTo(centerX + 25, centerY - 15);
    ctx.stroke();
}

function drawCars() {
    for (let car of cars) {
        // Draw a simple car shape (body, windows, wheels)
        // Body
        ctx.fillStyle = car.color;
        ctx.fillRect(car.x, car.y + 8, car.width, car.height - 16);
        // Roof
        ctx.fillStyle = '#eee';
        ctx.fillRect(car.x + 10, car.y + 12, car.width - 20, car.height - 28);
        // Wheels
        ctx.fillStyle = 'black';
        ctx.fillRect(car.x + 4, car.y + car.height - 8, 12, 6);
        ctx.fillRect(car.x + car.width - 16, car.y + car.height - 8, 12, 6);
        ctx.fillRect(car.x + 4, car.y + 2, 12, 6);
        ctx.fillRect(car.x + car.width - 16, car.y + 2, 12, 6);
    }
}

function drawBackground() {
    // Grass
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 0, canvas.width, CELL_SIZE * 2);
    ctx.fillRect(0, (ROWS - 2) * CELL_SIZE, canvas.width, CELL_SIZE * 2);
    // Road (wider)
    ctx.fillStyle = '#444';
    ctx.fillRect(0, CELL_SIZE * 2, canvas.width, CELL_SIZE * 8); // Make road 8 cells tall
}

function drawGoal() {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(0, 0, canvas.width, CELL_SIZE);
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText('GOAL', canvas.width / 2 - 35, CELL_SIZE / 1.5);
}

// Add lives
let lives = 3;
function drawLives() {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Lives: ' + lives, 10, canvas.height - 10);
}

let gameOver = false;
function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Press R to Restart', canvas.width / 2 - 110, canvas.height / 2 + 40);
}

function drawWin() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'yellow';
    ctx.font = '48px Arial';
    ctx.fillText('You Win!', canvas.width / 2 - 100, canvas.height / 2);
}

function resetGame(fullReset = false) {
    frog.x = Math.floor(COLS / 2) * CELL_SIZE + 5;
    frog.y = (ROWS - 1) * CELL_SIZE + 5;
    spawnCars();
    gameOver = false;
    if (fullReset) lives = 3;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawGoal();
    drawCars();
    drawFrog();
    drawLives();

    if (!gameOver) {
        moveFrog();
        updateCars();
        for (let car of cars) {
            if (checkCollision(frog, car)) {
                lives--;
                if (lives > 0) {
                    frog.x = Math.floor(COLS / 2) * CELL_SIZE + 5;
                    frog.y = (ROWS - 1) * CELL_SIZE + 5;
                } else {
                    gameOver = true;
                }
                break;
            }
        }
        if (frog.y < CELL_SIZE) {
            drawWin();
            setTimeout(() => resetGame(true), 2000);
            return;
        }
    } else {
        drawGameOver();
        // Wait for R key to restart
        return;
    }
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', function(e) {
    if (gameOver && (e.key === 'r' || e.key === 'R')) {
        resetGame(true);
        gameLoop();
    }
});

spawnCars();
gameLoop();
