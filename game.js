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

// Frog (smaller)
let frog = {
    x: Math.floor(COLS / 2) * CELL_SIZE + 15,
    y: (ROWS - 1) * CELL_SIZE + 15,
    width: 20,
    height: 20,
    color: 'lime',
};

// Cars (obstacles)
const carColors = ['red', 'blue', 'orange', 'purple', 'yellow', 'cyan', 'magenta', 'green'];
// Update lanes to match wider road
const lanes = [2, 3, 4, 5, 6, 7, 8, 9]; // More lanes for wider road
let cars = [];
function spawnCars() {
    cars = [];
    for (let laneIdx = 0; laneIdx < lanes.length; laneIdx++) {
        let lane = lanes[laneIdx];
        let dir = lane % 2 === 0 ? 1 : -1;
        let carSpacing = 180 + Math.random() * 40 - (level * 8); // less spacing as level increases
        carSpacing = Math.max(carSpacing, 80); // minimum spacing
        let carCount = Math.floor(canvas.width / carSpacing);
        for (let i = 0; i < carCount; i++) {
            let x = dir === 1 ? -i * carSpacing : canvas.width + i * carSpacing;
            cars.push({
                x: x,
                y: lane * CELL_SIZE + 5,
                width: CAR_WIDTH,
                height: CAR_HEIGHT,
                speed: 2 + Math.random() * 2 + (level - 1) * 0.5, // increase speed per level
                dir: dir,
                color: carColors[(laneIdx + i) % carColors.length],
                lane: lane
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
    for (let i = 0; i < cars.length; i++) {
        let car = cars[i];
        // Prevent cars in the same lane from overlapping
        let nextCar = cars.find(c => c.lane === car.lane && c !== car && ((car.dir === 1 && c.x > car.x) || (car.dir === -1 && c.x < car.x)));
        let minGap = CAR_WIDTH + 20;
        let canMove = true;
        if (nextCar) {
            if (car.dir === 1 && car.x + car.width + car.speed > nextCar.x) canMove = false;
            if (car.dir === -1 && car.x - car.speed < nextCar.x + nextCar.width) canMove = false;
        }
        if (canMove) {
            car.x += car.speed * car.dir;
        }
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
    // Simple frog: green circle body, two white eyes, and small legs
    const centerX = frog.x + frog.width / 2;
    const centerY = frog.y + frog.height / 2;
    // Legs (small lines)
    ctx.strokeStyle = '#267c2b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Back legs
    ctx.moveTo(centerX - 7, centerY + 6); ctx.lineTo(centerX - 11, centerY + 12);
    ctx.moveTo(centerX + 7, centerY + 6); ctx.lineTo(centerX + 11, centerY + 12);
    // Front legs
    ctx.moveTo(centerX - 7, centerY - 2); ctx.lineTo(centerX - 13, centerY - 6);
    ctx.moveTo(centerX + 7, centerY - 2); ctx.lineTo(centerX + 13, centerY - 6);
    ctx.stroke();
    // Body
    ctx.fillStyle = '#39c13f'; // Brighter green for frog
    ctx.beginPath();
    ctx.arc(centerX, centerY, frog.width / 2, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX - 4, centerY - 6, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 4, centerY - 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(centerX - 4, centerY - 6, 1, 0, Math.PI * 2);
    ctx.arc(centerX + 4, centerY - 6, 1, 0, Math.PI * 2);
    ctx.fill();
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
    // Grass (darker)
    ctx.fillStyle = '#1e7a2e';
    ctx.fillRect(0, 0, canvas.width, CELL_SIZE * 2);
    ctx.fillRect(0, (ROWS - 2) * CELL_SIZE, canvas.width, CELL_SIZE * 2);
    // Road (wider)
    ctx.fillStyle = '#444';
    ctx.fillRect(0, CELL_SIZE * 2, canvas.width, CELL_SIZE * 8);
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
    // Draw heart icons for lives
    for (let i = 0; i < lives; i++) {
        const x = 18 + i * 28;
        const y = canvas.height - 28;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + 7, y + 7);
        ctx.bezierCurveTo(x + 7, y, x, y, x, y + 7);
        ctx.bezierCurveTo(x, y + 12, x + 7, y + 15, x + 7, y + 20);
        ctx.bezierCurveTo(x + 7, y + 15, x + 14, y + 12, x + 14, y + 7);
        ctx.bezierCurveTo(x + 14, y, x + 7, y, x + 7, y + 7);
        ctx.closePath();
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.restore();
    }
}

// LEVELS
let level = 1;
const maxLevel = 10;
function drawLevel() {
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Level: ' + level, canvas.width - 120, canvas.height - 10);
}

let gameOver = false;
function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
    // Draw restart button
    ctx.fillStyle = '#222';
    ctx.fillRect(canvas.width / 2 - 80, canvas.height / 2 + 40, 160, 50);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(canvas.width / 2 - 80, canvas.height / 2 + 40, 160, 50);
    ctx.fillStyle = 'white';
    ctx.font = '28px Arial';
    ctx.fillText('Restart', canvas.width / 2 - 45, canvas.height / 2 + 75);
}

function drawWin() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'yellow';
    ctx.font = '48px Arial';
    if (level < maxLevel) {
        ctx.fillText('Level ' + level + ' Complete!', canvas.width / 2 - 170, canvas.height / 2);
        ctx.font = '28px Arial';
        ctx.fillText('Click to continue', canvas.width / 2 - 90, canvas.height / 2 + 50);
    } else {
        ctx.fillText('You Win!', canvas.width / 2 - 100, canvas.height / 2);
    }
}

function resetGame(fullReset = false) {
    frog.x = Math.floor(COLS / 2) * CELL_SIZE + 15;
    frog.y = (ROWS - 1) * CELL_SIZE + 15;
    if (fullReset) {
        lives = 3;
        level = 1;
    }
    spawnCars();
    gameOver = false;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawGoal();
    drawCars();
    drawFrog();
    drawLives();
    drawLevel();
    if (!gameOver) {
        moveFrog();
        updateCars();
        for (let car of cars) {
            if (checkCollision(frog, car)) {
                lives--;
                if (lives > 0) {
                    frog.x = Math.floor(COLS / 2) * CELL_SIZE + 15;
                    frog.y = (ROWS - 1) * CELL_SIZE + 15;
                } else {
                    gameOver = true;
                }
                break;
            }
        }
        if (frog.y < CELL_SIZE) {
            if (level < maxLevel) {
                level++;
                frog.x = Math.floor(COLS / 2) * CELL_SIZE + 15;
                frog.y = (ROWS - 1) * CELL_SIZE + 15;
                spawnCars();
                setTimeout(gameLoop, 500);
                drawWin();
                return;
            } else {
                drawWin();
                setTimeout(() => resetGame(true), 2500);
                return;
            }
        }
    } else {
        drawGameOver();
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

canvas.addEventListener('click', function(e) {
    if (gameOver) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        if (
            mx >= canvas.width / 2 - 80 && mx <= canvas.width / 2 + 80 &&
            my >= canvas.height / 2 + 40 && my <= canvas.height / 2 + 90
        ) {
            resetGame(true);
            gameLoop();
        }
    } else if (frog.y < CELL_SIZE && level < maxLevel) {
        // Advance to next level on click after win
        frog.x = Math.floor(COLS / 2) * CELL_SIZE + 15;
        frog.y = (ROWS - 1) * CELL_SIZE + 15;
        spawnCars();
        setTimeout(gameLoop, 200);
    }
});

spawnCars();
gameLoop();
