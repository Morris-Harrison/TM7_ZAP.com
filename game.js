// Bullet Hell Game Main Logic

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Player setup
const player = {
  x: canvas.width / 2 - 45, // 3x bigger, so center accordingly
  y: canvas.height - 120,
  width: 90, // 30 * 3
  height: 90, // 30 * 3
  speed: 6,
  color: "lime",
  vx: 0,
  vy: 0, // Add velocity to the player object
};

// Load player image
const playerImg = new Image();
playerImg.src = "zap.png"; // Make sure zap.png is in the same folder as bh.html and game.js

let bullets = [];
let gameOver = false;
let hp = 100;
let score = 0;
let highScore = 0;
let scoreFontSize = 24;
let startTime = null;

let lastScore = null;
let lastHighScore = null;
let lastHP = null;

// Remove key controls and add mouse movement
let mouseX = player.x + player.width / 2;
let mouseY = player.y + player.height / 2;

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

canvas.addEventListener("click", () => {
  if (gameOver) {
    // Reset game state
    gameOver = false;
    hp = 100;
    score = 0;
    bullets = [];
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 120;
    player.vx = 0;
    player.vy = 0;
    startTime = null;
    updateScoreboard();
    requestAnimationFrame(gameLoop);
  }
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

  // Set up spawn position for angle calculation
  if (edge === "right") {
    x = canvas.width + 20;
    y = Math.random() * canvas.height;
  } else {
    x = -20;
    y = Math.random() * canvas.height;
  }

  // Calculate target and angle BEFORE any bullet is created
  const targetX = player.x + player.width / 2 + (Math.random() - 0.5) * 100;
  const targetY = player.y + player.height / 2 + (Math.random() - 0.5) * 100;
  const angle = Math.atan2(targetY - y, targetX - x);

  // 15% chance for a black cannonball, else normal blue/pink/fizzle
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
    // 10% chance for a "fizzle" projectile
    const isFizzle = Math.random() < 0.1;
    if (isFizzle) {
      // Green fizzle: slow, circular motion, fades out, medium size, high damage
      width = 32;
      height = 32;
      color = "lime";
      shadow = "rgba(100,255,100,0.7)";
      damage = 6; // was 2, now does 6 hp
      speed = 1.5 + Math.random(); // slow

      // Fizzle projectile object: disappears after 2 seconds, moves in a circle
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
        isPink: false,
        isCannon: false,
        isFizzle: true,
        alpha: 1,
        born: performance.now(),
        theta: Math.random() * Math.PI * 2, // random starting angle for circle
        radius: 18 + Math.random() * 10, // random circle radius
      });
      return; // Only spawn one bullet per call
    }

    const isHoming = Math.random() < 0.08; // 8% chance for a homing projectile
    if (isHoming) {
      width = 28;
      height = 28;
      color = "navy"; // navy color
      shadow = "rgba(0,180,255,0.85)"; // blue glow
      damage = 13; // was 6, now does 13 hp
      speed = 2.2 + Math.random(); // slow-moderate

      // Homing projectile object: homes for 1.2s, then locks direction
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
        isPink: false,
        isCannon: false,
        isFizzle: false,
        isHoming: true,
        born: performance.now(),
        homingTime: 1200, // ms to home
        locked: false,
        speed,
        trail: [], // for trail effect
      });
      return; // Only spawn one bullet per call
    }

    width = 36;
    height = 8;
    // Decide bullet type: 50% blue (slow, 3 dmg), 50% pink (fast, 1 dmg)
    isPink = Math.random() < 0.5;
    color = isPink ? "hotpink" : "cyan";
    shadow = isPink ? "rgba(255,0,180,0.8)" : "rgba(0,180,255,0.8)";
    damage = isPink ? 1 : 3;
    speed = isPink ? 7 + Math.random() * 2 : 3 + Math.random() * 2;
  }

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

    // Fizzle projectile logic: fade out and remove after 3 seconds, move in a circle
    if (b.isFizzle) {
      const age = (performance.now() - b.born) / 3000; // 0 to 1 over 3 seconds (was 2000)
      b.alpha = 1 - age;
      // Move forward
      b.x += b.vx;
      b.y += b.vy;
      // Circular motion
      b.theta += 0.25; // speed of rotation
      b.x += Math.cos(b.theta) * 2;
      b.y += Math.sin(b.theta) * 2;
      if (age >= 1) {
        bullets.splice(i, 1);
        continue;
      }
    }
    // Homing logic
    else if (b.isHoming) {
      // Add current position to trail
      b.trail = b.trail || [];
      b.trail.push({
        x: b.x + b.width / 2,
        y: b.y + b.height / 2,
        t: performance.now(),
      });
      // Keep only last 36 trail points (was 12)
      if (b.trail.length > 36) b.trail.shift();

      const age = performance.now() - b.born;
      if (age < b.homingTime) {
        // Home in on player
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const dx = px - (b.x + b.width / 2);
        const dy = py - (b.y + b.height / 2);
        const angleToPlayer = Math.atan2(dy, dx);
        // Stronger homing for much better tracking
        const homingStrength = 0.5;
        const targetVx = Math.cos(angleToPlayer) * b.speed;
        const targetVy = Math.sin(angleToPlayer) * b.speed;
        b.vx += (targetVx - b.vx) * homingStrength;
        b.vy += (targetVy - b.vy) * homingStrength;
      }
      // After homing time, lock direction
      b.x += b.vx;
      b.y += b.vy;
    }
    // Normal/cannon bullets
    else {
      b.x += b.vx;
      b.y += b.vy;
    }

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
      updateScoreboard();
      if (hp <= 0) {
        gameOver = true;
      }
    }
  }
}

function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw player as image ONLY if loaded, otherwise do nothing (no green box fallback)
  if (playerImg.complete && playerImg.naturalWidth !== 0) {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  }

  // Bullets as glowing thin ovals (blue/pink), big black cannonballs, or fizzles
  for (const b of bullets) {
    ctx.save();
    ctx.beginPath();
    if (b.isFizzle) {
      ctx.globalAlpha = b.alpha;
      ctx.arc(
        b.x + b.width / 2,
        b.y + b.height / 2,
        b.width / 2,
        0,
        Math.PI * 2
      );
      ctx.shadowColor = b.shadow;
      ctx.shadowBlur = 18;
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (b.isHoming) {
      // Draw trail
      if (b.trail && b.trail.length > 1) {
        for (let t = 1; t < b.trail.length; t++) {
          ctx.save();
          ctx.beginPath();
          ctx.globalAlpha = 0.15 + 0.25 * (t / b.trail.length);
          ctx.strokeStyle = "rgba(0,180,255,0.7)";
          ctx.lineWidth = 10 * (t / b.trail.length);
          ctx.moveTo(b.trail[t - 1].x, b.trail[t - 1].y);
          ctx.lineTo(b.trail[t].x, b.trail[t].y);
          ctx.shadowColor = "rgba(0,180,255,0.7)";
          ctx.shadowBlur = 16;
          ctx.stroke();
          ctx.restore();
        }
      }
      // Draw main projectile
      ctx.beginPath();
      ctx.arc(
        b.x + b.width / 2,
        b.y + b.height / 2,
        b.width / 2,
        0,
        Math.PI * 2
      );
      ctx.shadowColor = b.shadow;
      ctx.shadowBlur = 32;
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 1;
      ctx.fill();
    } else if (b.isCannon) {
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

  if (gameOver) {
    drawGameOver();
  }
}

function drawGameOver() {
  ctx.save();
  ctx.font = "bold 64px 'Orbitron', 'Roboto', sans-serif";
  ctx.fillStyle = "#ff4d4d";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = "bold 32px 'Orbitron', 'Roboto', sans-serif";
  ctx.fillStyle = "#fff";
  ctx.fillText("Click to Restart", canvas.width / 2, canvas.height / 2 + 40);
  ctx.restore();
}

function updateScoreboard() {
  // Only update DOM if value changed
  if (hp !== lastHP) {
    document.getElementById("hpDisplay").textContent = "HP: " + Math.max(hp, 0);
    lastHP = hp;
  }
}

function updateScoreDisplay(score, highScore) {
  // Only update the numbers, not the label
  const scoreNum = document.getElementById("scoreNumber");
  const highScoreNum = document.getElementById("highScoreNumber");
  if (score !== lastScore && scoreNum) {
    scoreNum.textContent = score;
    lastScore = score;
  }
  if (highScore !== lastHighScore && highScoreNum) {
    highScoreNum.textContent = highScore;
    lastHighScore = highScore;
  }
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
  updateScoreDisplay(score, highScore);
  updateScoreboard();
  requestAnimationFrame(gameLoop);
}

// Initial scoreboard update
updateScoreDisplay(score, highScore);
updateScoreboard();
requestAnimationFrame(gameLoop);
