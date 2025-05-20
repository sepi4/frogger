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
        // Make level 1 very easy: slow cars, few cars, wide spacing
        let baseSpeed = 1.2; // much slower base speed
        let speedIncrease = 0.35 * (level - 1); // gradual increase
        let laneSpeed = baseSpeed + speedIncrease + Math.random() * 0.5;
        let baseSpacing = 260; // much wider spacing at level 1
        let spacingDecrease = 18 * (level - 1); // decrease spacing per level
        let carSpacing = baseSpacing - spacingDecrease + Math.random() * 30;
        carSpacing = Math.max(carSpacing, 80); // minimum spacing
        let carCount = Math.floor(canvas.width / carSpacing);
        for (let i = 0; i < carCount; i++) {
            let x = dir === 1 ? -i * carSpacing : canvas.width + i * carSpacing;
            cars.push({
                x: x,
                y: lane * CELL_SIZE + 5,
                width: CAR_WIDTH,
                height: CAR_HEIGHT,
                speed: laneSpeed, // all cars in this lane have the same speed
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

document.getElementById('btn-up').addEventListener('touchstart', e => { keys['ArrowUp'] = true; moveFrog(); });
document.getElementById('btn-down').addEventListener('touchstart', e => { keys['ArrowDown'] = true; moveFrog(); });
document.getElementById('btn-left').addEventListener('touchstart', e => { keys['ArrowLeft'] = true; moveFrog(); });
document.getElementById('btn-right').addEventListener('touchstart', e => { keys['ArrowRight'] = true; moveFrog(); });
// Prevent continuous move on hold
['btn-up','btn-down','btn-left','btn-right'].forEach(id => {
  document.getElementById(id).addEventListener('touchend', e => { keys = {}; });
});

function moveFrog() {
    if (keys['ArrowUp'] && frog.y > 0) frog.y -= CELL_SIZE;
    if (keys['ArrowDown'] && frog.y < (ROWS - 1) * CELL_SIZE) frog.y += CELL_SIZE;
    if (keys['ArrowLeft'] && frog.x > 0) frog.x -= CELL_SIZE;
    if (keys['ArrowRight'] && frog.x < canvas.width - frog.width) frog.x += CELL_SIZE;
    // Clamp frog.x to stay within the board (allow exactly 0 and rightmost pixel)
    if (frog.x < 0) frog.x = 0;
    if (frog.x > canvas.width - frog.width) frog.x = canvas.width - frog.width;
    // Clamp frog.y to stay within the board
    if (frog.y < 0) frog.y = 0;
    if (frog.y > (ROWS - 1) * CELL_SIZE) frog.y = (ROWS - 1) * CELL_SIZE;
    // Align frog vertically with cars if in a car lane
    const laneIdx = lanes.findIndex(lane => frog.y >= lane * CELL_SIZE && frog.y < (lane + 1) * CELL_SIZE);
    if (laneIdx !== -1) {
        // Center frog in the lane vertically, matching car vertical alignment
        frog.y = lanes[laneIdx] * CELL_SIZE + 5 + (CAR_HEIGHT - frog.height) / 2;
    }
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

let hitBlink = false;
let hitBlinkTime = 0;
let bloodFrog = false;
let bloodSplatPositions = [];

function drawFrog() {
    const centerX = frog.x + frog.width / 2;
    const centerY = frog.y + frog.height / 2;
    if (bloodFrog) {
        // Draw a red splat for blood frog (drawn in gameLoop under cars)
        return;
    }
    // Legs (same color as body)
    ctx.strokeStyle = '#39c13f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 7, centerY + 6); ctx.lineTo(centerX - 11, centerY + 12);
    ctx.moveTo(centerX + 7, centerY + 6); ctx.lineTo(centerX + 11, centerY + 12);
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

function drawBloodSplat() {
    // Draw all blood splats for every hit, with a more splashy/irregular look
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#b30000';
    for (const pos of bloodSplatPositions) {
        ctx.beginPath();
        // Main splat (irregular ellipse)
        ctx.ellipse(pos.x, pos.y, 13, 8, Math.PI/8, 0, Math.PI*2);
        // Droplets and irregularities
        ctx.ellipse(pos.x + 10, pos.y - 4, 4, 2, Math.PI/6, 0, Math.PI*2);
        ctx.ellipse(pos.x - 10, pos.y + 3, 3, 2, -Math.PI/7, 0, Math.PI*2);
        ctx.ellipse(pos.x + 6, pos.y + 8, 2.5, 2, Math.PI/3, 0, Math.PI*2);
        ctx.ellipse(pos.x - 7, pos.y - 7, 2.5, 2, -Math.PI/3, 0, Math.PI*2);
        ctx.ellipse(pos.x + 2, pos.y - 11, 2, 1.5, Math.PI/2, 0, Math.PI*2);
        ctx.ellipse(pos.x - 2, pos.y + 12, 2, 1.5, -Math.PI/2, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();
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
    // Draw a river background for the goal area
    ctx.fillStyle = '#3ac6f7'; // River blue
    ctx.fillRect(0, 0, canvas.width, CELL_SIZE);
    // Add some wavy lines for water effect
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        let y = 10 + i * 8;
        for (let x = 0; x < canvas.width; x += 20) {
            ctx.lineTo(x + 10, y + Math.sin((x + i * 30) / 18) * 3);
        }
        ctx.stroke();
    }
    // Draw the GOAL text
    ctx.fillStyle = 'navy';
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
    ctx.fillText('Level: ' + level + ' / ' + maxLevel, canvas.width - 170, canvas.height - 10);
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
        bloodSplatPositions = [];
    }
    spawnCars();
    gameOver = false;
}

let frogHeaven = false;
let flies = [];

function startFrogHeaven() {
    frogHeaven = true;
    flies = [];
    // Place frog on a lilypad in the river (goal area)
    frog.x = canvas.width / 2 - frog.width / 2;
    frog.y = CELL_SIZE / 2 - frog.height / 2 + 8;
    // Spawn flies
    for (let i = 0; i < 18; i++) {
        flies.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (CELL_SIZE - 20) + 10,
            angle: Math.random() * Math.PI * 2,
            speed: 1.2 + Math.random() * 0.8,
            radius: 60 + Math.random() * 60,
            avoid: false
        });
    }
}

function updateFlies() {
    for (let fly of flies) {
        // Vector from fly to frog
        let dx = fly.x - (frog.x + frog.width / 2);
        let dy = fly.y - (frog.y + frog.height / 2);
        let dist = Math.sqrt(dx * dx + dy * dy);
        // If too close to frog, steer away
        if (dist < 50) {
            fly.angle += (Math.atan2(dy, dx) + Math.PI - fly.angle) * 0.2;
            fly.avoid = true;
        } else {
            fly.angle += (Math.random() - 0.5) * 0.2;
            fly.avoid = false;
        }
        fly.x += Math.cos(fly.angle) * fly.speed;
        fly.y += Math.sin(fly.angle) * fly.speed;
        // Stay in river area
        if (fly.x < 10) fly.x = 10;
        if (fly.x > canvas.width - 10) fly.x = canvas.width - 10;
        if (fly.y < 10) fly.y = 10;
        if (fly.y > CELL_SIZE - 10) fly.y = CELL_SIZE - 10;
    }
}

function drawFrogHeaven() {
    // Draw river background
    ctx.fillStyle = '#3ac6f7';
    ctx.fillRect(0, 0, canvas.width, CELL_SIZE);
    // Wavy water lines
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        let y = 10 + i * 8;
        for (let x = 0; x < canvas.width; x += 20) {
            ctx.lineTo(x + 10, y + Math.sin((x + i * 30) / 18) * 3);
        }
        ctx.stroke();
    }
    // Draw lilypad
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, CELL_SIZE / 2 + 8, 38, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#6adf6a';
    ctx.shadowColor = '#2e7a2e';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
    // Draw frog on lilypad
    drawFrog();
    // Draw flies
    for (let fly of flies) {
        ctx.save();
        ctx.translate(fly.x, fly.y);
        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#222';
        ctx.fill();
        // Wings
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(-2, -2, 3, 1.5, -0.5, 0, Math.PI * 2);
        ctx.ellipse(2, -2, 3, 1.5, 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }
    // Heaven text
    ctx.fillStyle = 'gold';
    ctx.font = '38px Arial';
    ctx.fillText('Frog Heaven', canvas.width / 2 - 110, CELL_SIZE - 10);
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('So many flies!', canvas.width / 2 - 60, CELL_SIZE + 18);
}

function gameLoop() {
    if (frogHeaven) {
        updateFlies();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawFrogHeaven();
        requestAnimationFrame(gameLoop);
        return;
    }
    if (hitBlink) {
        updateCars();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawGoal();
        drawBloodSplat();
        drawCars();
        drawLives();
        drawLevel();
        if (Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = 'white';
            ctx.globalAlpha = 0.5;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1.0;
        }
        if (Date.now() - hitBlinkTime > 1200) {
            hitBlink = false;
            bloodFrog = false;
            if (lives > 0) {
                frog.x = Math.floor(COLS / 2) * CELL_SIZE + 15;
                frog.y = (ROWS - 1) * CELL_SIZE + 15;
            }
        }
        requestAnimationFrame(gameLoop);
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    drawGoal();
    drawBloodSplat();
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
                bloodFrog = true;
                hitBlink = true;
                hitBlinkTime = Date.now();
                bloodSplatPositions.push({ x: frog.x + frog.width / 2, y: frog.y + frog.height / 2 });
                if (lives <= 0) {
                    setTimeout(() => { gameOver = true; }, 1200);
                }
                requestAnimationFrame(gameLoop);
                return;
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
                // Instead of drawWin and reset, go to frog heaven
                setTimeout(startFrogHeaven, 800);
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
