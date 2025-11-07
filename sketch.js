let letters = [];
let draggedLetter = null;
let offsetX, offsetY;
const shakeMagnitude = 10;
let matchedPairsCount = 0;
let arranging = false;
let arranged = false;
let fireworks = [];
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  textSize(120);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);

  // 產生所有字母
  for (let i = 0; i < alphabet.length; i++) {
    const upper = alphabet[i];
    const lower = alphabet[i].toLowerCase();// 對應小寫字母
    const pairColor = color(random(360), random(70, 100), random(80, 100));
    const letterSize = 50;// 字母大小

    let posUpper = getNonOverlappingPosition(letterSize);
    letters.push({
      char: upper,
      x: posUpper.x,
      y: posUpper.y,
      origX: posUpper.x,
      origY: posUpper.y,
      isDragging: false,
      isMatched: false,
      partner: lower,
      size: letterSize,
      color: pairColor,
      shake: 0
    });

    let posLower = getNonOverlappingPosition(letterSize);
    letters.push({
      char: lower,
      x: posLower.x,
      y: posLower.y,
      origX: posLower.x,
      origY: posLower.y,
      isDragging: false,
      isMatched: false,
      partner: upper,
      size: letterSize,
      color: pairColor,
      shake: 0
    });
  }

  colorMode(RGB);
}

function getNonOverlappingPosition(letterSize) {
  const margin = 60;
  let newX, newY, overlapping;
  let attempts = 0;
  const maxAttempts = 500;

  do {
    overlapping = false;
    newX = random(margin, width - margin);
    newY = random(margin * 3, height - margin);
    for (let existing of letters) {
      if (dist(newX, newY, existing.x, existing.y) < letterSize)
        overlapping = true;
    }
    attempts++;
  } while (overlapping && attempts < maxAttempts);

  return { x: newX, y: newY };
}

function draw() {
  background(245, 245, 220);

  if (arranging) {
    arrangeLettersSmoothly();
  }

  if (arranged) {
    updateFireworks();
  }

  for (let letter of letters) {
    let displayX = letter.x;
    let displayY = letter.y;

    if (letter.shake > 0) {
      displayX += random(-shakeMagnitude, shakeMagnitude);
      displayY += random(-shakeMagnitude, shakeMagnitude);
      letter.shake--;
    }

    fill(letter.color);
    text(letter.char, displayX, displayY);
  }
}

// 滑鼠事件
function mousePressed() {
  if (arranging || arranged) return;
  for (let i = letters.length - 1; i >= 0; i--) {
    let l = letters[i];
    if (!l.isMatched && dist(mouseX, mouseY, l.x, l.y) < l.size / 2) {
      draggedLetter = l;
      l.isDragging = true;
      offsetX = l.x - mouseX;
      offsetY = l.y - mouseY;
      letters.splice(i, 1);
      letters.push(draggedLetter);
      break;
    }
  }
}

function mouseDragged() {
  if (draggedLetter) {
    draggedLetter.x = mouseX + offsetX;
    draggedLetter.y = mouseY + offsetY;
  }
}

function mouseReleased() {
  if (draggedLetter) {
    let foundMatch = false;
    for (let letter of letters) {
      if (letter !== draggedLetter && letter.char === draggedLetter.partner) {
        if (dist(draggedLetter.x, draggedLetter.y, letter.x, letter.y) < draggedLetter.size) {
          foundMatch = true;
          draggedLetter.isMatched = true;
          letter.isMatched = true;

          // 排列成上方配對區
          const pairsPerRow = 10;
          const pairGroupWidth = 230;// 每對字母組寬度
          const letterInPairOffset = 95;// 同一對字母間距
          const rowHeight = 110;// 每行高度
          const startX = 70;// 起始X座標
          const startY = 90;

          const currentRow = floor(matchedPairsCount / pairsPerRow);
          const currentColumn = matchedPairsCount % pairsPerRow;

          let upper, lower;
          if (draggedLetter.char === draggedLetter.char.toUpperCase()) {
            upper = draggedLetter;
            lower = letter;
          } else {
            upper = letter;
            lower = draggedLetter;
          }

          upper.x = startX + currentColumn * pairGroupWidth;
          upper.y = startY + currentRow * rowHeight;
          lower.x = upper.x + letterInPairOffset;
          lower.y = upper.y;

          matchedPairsCount++;

          if (matchedPairsCount === 26) {
            setTimeout(() => {
              arranging = true;
            }, 1000);
          }
          break;
        }
      }
    }

    if (!foundMatch) {
      draggedLetter.x = draggedLetter.origX;
      draggedLetter.y = draggedLetter.origY;
      draggedLetter.shake = 15;
    }

    draggedLetter.isDragging = false;
    draggedLetter = null;
  }
}

// 平滑排列動畫
function arrangeLettersSmoothly() {
  const pairsPerRow = 6;
  const pairSpacingX = 230;
  const pairSpacingY = 140;
  const letterOffset = 100;

  const totalRows = ceil(26 / pairsPerRow);
  const gridWidth = (pairsPerRow - 1) * pairSpacingX + letterOffset;
  const startX = (width - gridWidth) / 2;
  const startY = (height - totalRows * pairSpacingY) / 2;

  let done = true;
  for (let i = 0; i < alphabet.length; i++) {
    let upper = letters.find(l => l.char === alphabet[i]);
    let lower = letters.find(l => l.char === alphabet[i].toLowerCase());
    if (upper && lower) {
      const row = floor(i / pairsPerRow);
      const col = i % pairsPerRow;
      const targetX = startX + col * pairSpacingX;
      const targetY = startY + row * pairSpacingY;

      upper.x = lerp(upper.x, targetX, 0.08);
      upper.y = lerp(upper.y, targetY, 0.08);
      lower.x = lerp(lower.x, targetX + letterOffset, 0.08);
      lower.y = lerp(lower.y, targetY, 0.08);

      if (dist(upper.x, upper.y, targetX, targetY) > 1) done = false;
    }
  }

  if (done) {
    arranging = false;
    arranged = true;
    launchFireworks();
  }
}

// --- 煙火系統 ---
class Firework {
  constructor(x, y, color) {
    this.particles = [];
    for (let i = 0; i < 80; i++) {
      const angle = random(TWO_PI);
      const speed = random(2, 6);
      this.particles.push({
        x,
        y,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        life: 255,
        color
      });
    }
  }
  update() {
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.life -= 4;
    }
  }
  draw() {
    noStroke();
    for (let p of this.particles) {
      fill(red(p.color), green(p.color), blue(p.color), p.life);
      circle(p.x, p.y, 6);
    }
  }
}

function launchFireworks() {
  for (let i = 0; i < 5; i++) {
    fireworks.push(new Firework(random(width), random(height / 2), color(random(255), random(255), random(255))));
  }
}

function updateFireworks() {
  for (let fw of fireworks) {
    fw.update();
    fw.draw();
  }
  if (frameCount % 60 === 0) {
    fireworks.push(new Firework(random(width), random(height / 2), color(random(255), random(255), random(255))));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
