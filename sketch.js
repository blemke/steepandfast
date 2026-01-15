/**
 * p5.js: Responsive "STEEP & FAST" angular logo (fully scales with window)
 * - Everything is drawn in normalized (0..1) space, so it scales perfectly.
 * - Consistent slant + aligned shadow/borders
 */

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(2);
  textFont("system-ui");
  textStyle(BOLD);
  noLoop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}

function draw() {
  background(255);

  // ---------- Theme ----------
  const theme = {
    ink: color(12, 16, 20),
    white: color(255),
    cool: color(0, 175, 170),
    warm: color(255, 85, 40),
    warm2: color(255, 180, 0),
    shadow: color(0, 0, 0, 35),
    stripeCool: color(0, 175, 170, 45),
    stripeWarm: color(255, 130, 80, 35),
  };

  // ---------- Responsive scale helpers ----------
  const U = Math.min(width, height); // master unit tied to window
  const px = (n) => n * U;           // convert normalized units -> pixels

  // Layout in normalized units (relative to U)
  const slant = -0.24;

  const steep = { x: 0.12, y: 0.18, w: 1.05, h: 0.28 }; // note: can exceed 1 for dramatic crop
  const fast  = { x: 0.25, y: 0.46, w: 1.08, h: 0.28 };

  // Keep mark centered regardless of window ratio
  // We compute a "design bounds" in pixels, then center it.
  const bounds = {
    x: px(0.08),
    y: px(0.10),
    w: px(1.20),
    h: px(0.78),
  };
  const ox = (width - bounds.w) / 2 - bounds.x;
  const oy = (height - bounds.h) / 2 - bounds.y;

  // Global stroke scaling
  const borderW = px(0.015);
  const shadowOff = createVector(px(0.018), px(0.018));
  const skewK = 0.45; // skew = h * skewK

  push();
  translate(ox, oy);

  // Motifs
  drawMountainHint(rectPx(steep, px), slant, theme, px);
  drawSpeedLines(rectPx(fast, px), slant, theme, px);

  // Plaques
  drawPlaque(rectPx(steep, px), slant, theme, {
    borderColor: theme.cool,
    borderWeight: borderW,
    shadowOff,
    stripes: [{ c: theme.stripeCool, y: 0.52, h: 0.18 }],
    skewK,
  });

  drawPlaque(rectPx(fast, px), slant, theme, {
    borderColor: theme.warm,
    borderWeight: borderW,
    shadowOff,
    stripes: [{ c: theme.stripeWarm, y: 0.55, h: 0.18 }],
    skewK,
  });

  // Fixed ampersand: clean badge, centered, not distorted
  drawAmpBadgeBetween(rectPx(steep, px), rectPx(fast, px), slant, theme, {
    shadowOff,
    borderWeight: borderW * 0.85,
    skewK,
    px,
  });

  // Text (sizes scale with U)
  drawWordInPlaque("STEEP", rectPx(steep, px), slant, theme, {
    size: px(0.22),
    tracking: px(0.010),
    underline: true,
    px,
  });

  drawWordInPlaque("FAST", rectPx(fast, px), slant, theme, {
    size: px(0.22),
    tracking: px(0.012),
    underline: false,
    px,
  });

  pop();
}

/* -------------------- Core drawing -------------------- */

function rectPx(r, px) {
  return { x: px(r.x), y: px(r.y), w: px(r.w), h: px(r.h) };
}

function drawPlaque(box, ang, theme, opt) {
  const { borderColor, borderWeight, shadowOff, stripes, skewK } = opt;
  const skew = box.h * skewK;

  // Shadow
  push();
  translate(box.x + shadowOff.x, box.y + shadowOff.y);
  rotateAroundCenter(box.w, box.h, ang);
  noStroke();
  fill(theme.shadow);
  drawParallelogram(0, 0, box.w, box.h, skew);
  pop();

  // Main
  push();
  translate(box.x, box.y);
  rotateAroundCenter(box.w, box.h, ang);

  noStroke();
  fill(theme.ink);
  drawParallelogram(0, 0, box.w, box.h, skew);

  // Stripe(s)
  if (stripes) {
    for (const st of stripes) {
      fill(st.c);
      const sy = box.h * st.y;
      const sh = box.h * st.h;
      drawParallelogram(0, sy - sh / 2, box.w, sh, skew);
    }
  }

  // Accent border
  noFill();
  stroke(borderColor);
  strokeWeight(borderWeight);
  strokeJoin(MITER);
  strokeCap(SQUARE);
  drawParallelogramOutline(0, 0, box.w, box.h, skew);

  pop();
}

function drawWordInPlaque(word, box, ang, theme, opt) {
  const { size, tracking, underline, px } = opt;
  const skew = box.h * 0.45;

  push();
  translate(box.x, box.y);
  rotateAroundCenter(box.w, box.h, ang);

  const cx = box.w * 0.52;
  const cy = box.h * 0.58;

  textSize(size);

  // Shadow
  noStroke();
  fill(0, 0, 0, 90);
  drawTrackedText(word, cx + px(0.006), cy + px(0.006), tracking);

  // Main
  fill(theme.white);
  drawTrackedText(word, cx, cy, tracking);

  // Underline (tight + centered)
  if (underline) {
    stroke(theme.white);
    strokeWeight(px(0.012));
    strokeCap(SQUARE);
    const uw = box.w * 0.30;
    const uy = cy + size * 0.44;
    line(cx - uw / 2, uy, cx + uw / 2, uy);
  }

  pop();
}

function drawAmpBadgeBetween(steepBox, fastBox, ang, theme, opt) {
  const { shadowOff, borderWeight, skewK, px } = opt;

  // A stable anchor point between plaques
  const mid = {
    x: lerp(steepBox.x + steepBox.w * 0.63, fastBox.x + fastBox.w * 0.07, 0.5),
    y: lerp(steepBox.y + steepBox.h * 0.88, fastBox.y + fastBox.h * 0.08, 0.5),
  };

  const w = px(0.18);
  const h = px(0.15);
  const skew = h * skewK;

  // Shadow
  push();
  translate(mid.x + shadowOff.x * 0.7, mid.y + shadowOff.y * 0.7);
  rotateAroundCenter(w, h, ang);
  noStroke();
  fill(theme.shadow);
  drawParallelogram(0, 0, w, h, skew);
  pop();

  // Badge
  push();
  translate(mid.x, mid.y);
  rotateAroundCenter(w, h, ang);

  // Plate
  noStroke();
  fill(theme.ink);
  drawParallelogram(0, 0, w, h, skew);

  // Clean outline (white, subtle)
  noFill();
  stroke(theme.white);
  strokeWeight(borderWeight);
  strokeJoin(MITER);
  strokeCap(SQUARE);
  drawParallelogramOutline(0, 0, w, h, skew);


  // Ampersand (not skewed weirdly; centered and sized properly)
  noStroke();
  fill(theme.white);
  textAlign(CENTER, CENTER);
  textSize(px(0.11));
  text("&", w * 0.52, h * 0.55);

  // Small "connector" notch to make it feel integrated
  fill(theme.white);
  noStroke();
  beginShape();
  vertex(w * 0.90, h * 0.18);
  vertex(w * 0.74, h * 0.26);
  vertex(w * 0.62, h * 0.40);
  endShape(CLOSE);

  pop();
}

/* -------------------- Motifs -------------------- */

function drawMountainHint(steepBox, ang, theme, px) {
  const mx = steepBox.x + steepBox.w * 0.30;
  const my = steepBox.y - px(0.03);
  const mw = px(0.28);
  const mh = px(0.18);

  push();
  translate(mx, my);
  rotate(ang);

  // Accent triangle
  noStroke();
  fill(theme.cool);
  beginShape();
  vertex(0, mh);
  vertex(mw * 0.52, 0);
  vertex(mw, mh);
  endShape(CLOSE);

  // Cut-out
  fill(255);
  beginShape();
  vertex(mw * 0.18, mh);
  vertex(mw * 0.52, mh * 0.25);
  vertex(mw * 0.84, mh);
  endShape(CLOSE);

  // Snow cap
  fill(theme.white);
  beginShape();
  vertex(mw * 0.44, mh * 0.33);
  vertex(mw * 0.52, 0);
  vertex(mw * 0.60, mh * 0.33);
  vertex(mw * 0.52, mh * 0.22);
  endShape(CLOSE);

  pop();
}

function drawSpeedLines(fastBox, ang, theme, px) {
  const baseX = fastBox.x - px(0.20);
  const baseY = fastBox.y + fastBox.h * 0.58;

  push();
  translate(baseX, baseY);
  rotate(ang);

  const lines = [
    { y: -px(0.07), w: px(0.66), sw: px(0.016), c: theme.warm },
    { y: -px(0.02), w: px(0.78), sw: px(0.014), c: theme.warm2 },
    { y:  px(0.03), w: px(0.70), sw: px(0.014), c: theme.warm },
  ];

  for (const ln of lines) {
    stroke(ln.c);
    strokeWeight(ln.sw);
    strokeCap(SQUARE);
    line(0, ln.y, ln.w, ln.y);

    // Minimal "break" cut-out
    stroke(255);
    strokeWeight(ln.sw + px(0.006));
    line(ln.w * 0.46, ln.y, ln.w * 0.64, ln.y);
  }

  pop();
}

/* -------------------- Geometry + Text -------------------- */

function rotateAroundCenter(w, h, ang) {
  translate(w / 2, h / 2);
  rotate(ang);
  translate(-w / 2, -h / 2);
}

function drawParallelogram(x, y, w, h, skew) {
  beginShape();
  vertex(x + skew, y);
  vertex(x + w + skew, y);
  vertex(x + w - skew, y + h);
  vertex(x - skew, y + h);
  endShape(CLOSE);
}

function drawParallelogramOutline(x, y, w, h, skew) {
  beginShape();
  vertex(x + skew, y);
  vertex(x + w + skew, y);
  vertex(x + w - skew, y + h);
  vertex(x - skew, y + h);
  endShape(CLOSE);
}

function drawTrackedText(str, cx, cy, tracking) {
  textAlign(LEFT, CENTER);

  let total = 0;
  for (let i = 0; i < str.length; i++) {
    total += textWidth(str[i]);
    if (i < str.length - 1) total += tracking;
  }

  let x = cx - total / 2;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    //shearX(0.-35);
    text(ch, x, cy);
    x += textWidth(ch) + tracking;
  }
}
