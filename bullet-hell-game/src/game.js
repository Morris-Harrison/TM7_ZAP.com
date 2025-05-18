// Bullet Hell Game Main Logic

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Player setup
const player = {
  x: canvas.width / 2 - 15,
  y: canvas.height - 40,
  width: 30,
  height: 30,
  speed: 6,
  color: "lime",
  vx: 0,
  vy: 0, // Add velocity to the player object
};

// Load player image
const playerImg = new Image();
playerImg.src = "zap.png"; // Adjust path if needed

let bullets = [];
let gameOver = false;
let hp = 100;
let score = 0;
let highScore = 0;
let scoreFontSize = 24;
let startTime = null;

// Remove key controls and add mouse movement
let mouseX = player.x + player.width / 2;
let mouseY = player.y + player.height / 2;

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

function movePlayer() {
  // Target is the center of the player to the mouse
  const targetX = mouseX - player.width / 2;
  const targetY = mouseY - player.height / 2;

  // Calculate acceleration towards the cursor
  const ax = (targetX - player.x) * 0.04; // acceleration factor
  const ay = (targetY - player.y) * 0.04;

  // Apply acceleration to velocity
  player.vx += ax;
  player.vy += ay;

  // Apply friction to velocity for more natural movement
  player.vx *= 0.92;
  player.vy *= 0.92;

  // Update position
  player.x += player.vx;
  player.y += player.vy;

  // Clamp to canvas bounds
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

function spawnBullet() {
  // Only spawn from left or right edges, moving inward at a random angle
  const edge = Math.random() < 0.5 ? "left" : "right";
  let x,
    y,
    width,
    height,
    color,
    shadow,
    damage,
    speed,
    isPink = false,
    isCannon = false;

  // 15% chance for a black cannonball, else normal blue/pink
  const isCannonBall = Math.random() < 0.15;
  if (isCannonBall) {
    // Black cannonball: big, slow, high damage
    if (edge === "right") {
      x = canvas.width + 40;
      y = Math.random() * canvas.height;
    } else {
      x = -40;
      y = Math.random() * canvas.height;
    }
    width = 48;
    height = 48;
    color = "black";
    shadow = "rgba(0,0,0,0.7)";
    damage = 14;
    speed = 2 + Math.random(); // slow
    isCannon = true;
  } else {
    if (edge === "right") {
      x = canvas.width + 20;
      y = Math.random() * canvas.height;
    } else {
      x = -20;
      y = Math.random() * canvas.height;
    }
    width = 36;
    height = 8;
    // Decide bullet type: 70% blue (slow, 3 dmg), 30% pink (fast, 1 dmg)
    isPink = Math.random() < 0.3;
    color = isPink ? "hotpink" : "cyan";
    shadow = isPink ? "rgba(255,0,180,0.8)" : "rgba(0,180,255,0.8)";
    damage = isPink ? 1 : 3;
    speed = isPink ? 7 + Math.random() * 2 : 3 + Math.random() * 2;
  }

  const targetX = player.x + player.width / 2 + (Math.random() - 0.5) * 100;
  const targetY = player.y + player.height / 2 + (Math.random() - 0.5) * 100;
  const angle = Math.atan2(targetY - y, targetX - x);

  bullets.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    width,
    height,
    color,
    shadow,
    damage,
    isPink,
    isCannon,
  });
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    // Remove if out of bounds
    if (
      b.x < -50 ||
      b.x > canvas.width + 50 ||
      b.y < -50 ||
      b.y > canvas.height + 50
    ) {
      bullets.splice(i, 1);
    }
  }
}

function checkCollision() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (
      b.x < player.x + player.width &&
      b.x + b.width > player.x &&
      b.y < player.y + player.height &&
      b.y + b.height > player.y
    ) {
      bullets.splice(i, 1); // Remove bullet on hit
      hp -= b.damage;
      updateHPDisplay();
      if (hp <= 0) {
        gameOver = true;
      }
    }
  }
}

function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Player as image
  if (playerImg.complete && playerImg.naturalWidth !== 0) {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  } else {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  // Bullets as glowing thin ovals (blue/pink) or big black cannonballs
  for (const b of bullets) {
    ctx.save();
    ctx.beginPath();
    if (b.isCannon) {
      // Draw big black circle with shadow
      ctx.arc(
        b.x + b.width / 2,
        b.y + b.height / 2,
        b.width / 2,
        0,
        Math.PI * 2
      );
      ctx.shadowColor = b.shadow;
      ctx.shadowBlur = 24;
      ctx.fillStyle = b.color;
      ctx.fill();
    } else {
      // Normal oval bullets
      ctx.ellipse(
        b.x + b.width / 2,
        b.y + b.height / 2,
        b.width / 2,
        b.height / 4,
        Math.atan2(b.vy, b.vx),
        0,
        Math.PI * 2
      );
      ctx.shadowColor = b.shadow;
      ctx.shadowBlur = 16;
      ctx.fillStyle = b.color;
      ctx.fill();
    }
    ctx.restore();
  }

  // High Score Display (top right, grows with score)
  scoreFontSize = 24 + Math.floor(score / 200);
  ctx.save();
  ctx.font = `${scoreFontSize}px sans-serif`;
  ctx.fillStyle = "#ff0";
  ctx.textAlign = "right";
  ctx.fillText(`High Score: ${highScore}`, canvas.width - 20, 40);
  ctx.restore();

  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2);
  }
}

// Display HP below the game
function updateHPDisplay() {
  let hpDiv = document.getElementById("hpDisplay");
  if (!hpDiv) {
    hpDiv = document.createElement("div");
    hpDiv.id = "hpDisplay";
    hpDiv.style.textAlign = "center";
    hpDiv.style.fontSize = "2em";
    hpDiv.style.color = "#0ff";
    canvas.parentNode.insertBefore(hpDiv, canvas.nextSibling);
  }
  hpDiv.textContent = "HP: " + Math.max(hp, 0);
}

let lastBullet = 0;
function gameLoop(ts) {
  if (!startTime) startTime = ts;
  if (gameOver) return;
  movePlayer();
  updateBullets();
  checkCollision();

  // Score increases with time survived
  score = Math.floor((ts - startTime) / 10);
  if (score > highScore) highScore = score;

  draw();
  if (ts - lastBullet > 400) {
    spawnBullet();
    lastBullet = ts;
  }
  updateHPDisplay();
  requestAnimationFrame(gameLoop);
}

draw();
updateHPDisplay();
requestAnimationFrame(gameLoop);
