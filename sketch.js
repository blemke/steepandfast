/**
 * I made a draft of an image, 
 * saved it as a svg vector file, 
 * then converted the svg file into code, 
 * then made some stylistic changes to code to create a final image.
 * 
 * p5.js: Fully responsive "STEEP & FAST" angular mark
 * - ALWAYS fully visible at any window size/aspect ratio (auto-fit to computed bbox)
 * - Draws in DESIGN SPACE (units are stable)
 * - Computes true AABB of rotated+skewed plaques (+ safe margins for motifs/shadows)
 * - Text is rotated WITH the plaque and also SHEARED (skewed) for extra slant
 *
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

  // ---------------- THEME ----------------
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

  // ---------------- DESIGN SPACE ----------------
  // Everything below is drawn in these "design units"
  const slant = -0.14; // radians
  const skewK = 0.45;  // parallelogram skew = h * skewK

  // Plaque rectangles in design units
  const steep = { x: 120, y: 120, w: 900, h: 220 };
  const fast  = { x: 260, y: 330, w: 920, h: 220 };

  // Visual styling in design units
  const borderW = 10;
  const shadowOff = { x: 16, y: 16 };

  // Motifs extents: how far stuff extends beyond plaques (design units)
  // (speed lines extend left; mountain extends up; shadows extend down/right)
  const motifPad = {
    left: 220,
    right: 120,
    top: 170,
    bottom: 140,
  };

  // ---------------- AUTO-FIT (guarantee visibility) ----------------
  // Compute true bounding box of rotated+skewed plaques, then inflate for motifs + padding.
  const pts = [
    ...plaqueCorners(steep, slant, skewK),
    ...plaqueCorners(fast,  slant, skewK),

    // Include shadow corners too (offset same shape)
    ...plaqueCorners(offsetRect(steep, shadowOff.x, shadowOff.y), slant, skewK),
    ...plaqueCorners(offsetRect(fast,  shadowOff.x, shadowOff.y), slant, skewK),
  ];

  let bb = aabbFromPoints(pts);

  // Inflate bbox for motifs that extend beyond plaques
  bb.minX -= motifPad.left;
  bb.maxX += motifPad.right;
  bb.minY -= motifPad.top;
  bb.maxY += motifPad.bottom;

  bb.w = bb.maxX - bb.minX;
  bb.h = bb.maxY - bb.minY;

  // Pixel safe padding (keeps it away from window edges)
  const padPx = 18;

  // Fit scale to window
  const s = Math.min((width - 2 * padPx) / bb.w, (height - 2 * padPx) / bb.h);

  // Center the bbox in the window
  const ox = (width  - bb.w * s) / 2 - bb.minX * s;
  const oy = (height - bb.h * s) / 2 - bb.minY * s;

  // ---------------- DRAW ----------------
  push();
  translate(ox, oy);
  scale(s);

  // Motifs behind
  drawMountainHint(steep, slant, theme);
  drawSpeedLines(fast, slant, theme);

  // Plaques
  drawPlaque(steep, slant, theme, {
    borderColor: theme.cool,
    borderWeight: borderW,
    shadowOff,
    stripes: [{ c: theme.stripeCool, y: 0.52, h: 0.18 }],
    skewK,
  });

  drawPlaque(fast, slant, theme, {
    borderColor: theme.warm,
    borderWeight: borderW,
    shadowOff,
    stripes: [{ c: theme.stripeWarm, y: 0.55, h: 0.18 }],
    skewK,
  });

  // Ampersand badge (fixed + clean)
  drawAmpBadgeBetween(steep, fast, slant, theme, {
    shadowOff,
    borderWeight: borderW * 0.85,
    skewK,
  });

  // Text (tilted + skewed)
  drawWordInPlaque("STEEP", steep, slant, theme, {
    size: 170,
    tracking: 8,
    underline: true,
    // Text shear: small, to keep letters readable
    textShearX: -0.25,
  });

  drawWordInPlaque("FAST", fast, slant, theme, {
    size: 170,
    tracking: 10,
    underline: false,
    textShearX: -0.20,
  });

  pop();
}

/* ====================== AUTO-FIT HELPERS ====================== */

function offsetRect(r, dx, dy) {
  return { x: r.x + dx, y: r.y + dy, w: r.w, h: r.h };
}

function plaqueCorners(box, ang, skewK) {
  const skew = box.h * skewK;

  // Parallelogram corners (unrotated), in world coords
  const pts = [
    { x: box.x + skew,         y: box.y },          // top-left
    { x: box.x + box.w + skew, y: box.y },          // top-right
    { x: box.x + box.w - skew, y: box.y + box.h },  // bottom-right
    { x: box.x - skew,         y: box.y + box.h },  // bottom-left
  ];

  // rotate around center of the RECT (same as draw routine)
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;

  const c = Math.cos(ang), s = Math.sin(ang);

  return pts.map(p => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    return {
      x: cx + dx * c - dy * s,
      y: cy + dx * s + dy * c
    };
  });
}

function aabbFromPoints(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/* ====================== DRAWING ====================== */

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

  // Stripes
  if (stripes) {
    for (const st of stripes) {
      fill(st.c);
      const sy = box.h * st.y;
      const sh = box.h * st.h;
      drawParallelogram(0, sy - sh / 2, box.w, sh, skew);
    }
  }

  // Border accent
  noFill();
  stroke(borderColor);
  strokeWeight(borderWeight);
  strokeJoin(MITER);
  strokeCap(SQUARE);
  drawParallelogramOutline(0, 0, box.w, box.h, skew);

  pop();
}

function drawWordInPlaque(word, box, ang, theme, opt) {
  const { size, tracking, underline, textShearX } = opt;

  push();
  translate(box.x, box.y);
  rotateAroundCenter(box.w, box.h, ang);

  // Apply text shear AFTER we rotate into plaque space
  // (so it feels like letterforms are slanted within the plaque)
  shearX(textShearX);

  const cx = box.w * 0.52;
  const cy = box.h * 0.58;

  textSize(size);

  // Shadow
  noStroke();
  fill(0, 0, 0, 90);
  drawTrackedText(word, cx + 6, cy + 6, tracking);

  // Main
  fill(theme.white);
  drawTrackedText(word, cx, cy, tracking);

  // Underline (for STEEP)
  if (underline) {
    stroke(theme.white);
    strokeWeight(10);
    strokeCap(SQUARE);
    const uw = box.w * 0.30;
    const uy = cy + size * 0.44;
    line(cx - uw / 2, uy, cx + uw / 2, uy);
  }

  pop();
}

function drawAmpBadgeBetween(steepBox, fastBox, ang, theme, opt) {
  const { shadowOff, borderWeight, skewK } = opt;

  // Stable badge position between plaques
  const midX = lerp(steepBox.x + steepBox.w * 0.26, fastBox.x + fastBox.w * 0.36, 0.5);
  const midY = lerp(steepBox.y + steepBox.h * 0.290, fastBox.y + fastBox.h * 0.16, 0.5);

  const w = 170;
  const h = 140;
  const skew = h * skewK;

  // Shadow
  push();
  translate(midX + shadowOff.x * 0.7, midY + shadowOff.y * 0.7);
  rotateAroundCenter(w, h, ang);
  noStroke();
  fill(theme.shadow);
  drawParallelogram(0, 0, w, h, skew);
  pop();

  // Badge
  push();
  translate(midX, midY);
  rotateAroundCenter(w, h, ang);

  // Plate
  noStroke();
  fill(theme.ink);
  drawParallelogram(0, 0, w, h, skew);

  // Outline
  noFill();
  stroke(theme.white);
  strokeWeight(borderWeight);
  strokeJoin(MITER);
  strokeCap(SQUARE);
  drawParallelogramOutline(0, 0, w, h, skew);

  // Ampersand: centered, sized, and readable
  noStroke();
  fill(theme.white);
  textAlign(CENTER, CENTER);
  textSize(108);
  shearX(-.5);
  text("&", w * 0.52, h * 0.56);

  // Angular notch (connector accent)
  fill(theme.white);
  noStroke();
  beginShape();
  vertex(w * 0.62, h * 0.16);
  vertex(w * 0.78, h * 0.25);
  vertex(w * 0.64, h * 0.40);
  endShape(CLOSE);

  pop();
}

/* ====================== MOTIFS ====================== */

function drawMountainHint(steepBox, ang, theme) {
  // Minimal mountain above/behind STEEP
  const mx = steepBox.x + steepBox.w * 0.28;
  const my = steepBox.y - 55;
  const mw = 260;
  const mh = 170;

  push();
  translate(mx, my);
  rotate(ang);

  noStroke();
  fill(theme.cool);
  beginShape();
  vertex(0, mh);
  vertex(mw * 0.52, 0);
  vertex(mw, mh);
  endShape(CLOSE);

  fill(255);
  beginShape();
  vertex(mw * 0.18, mh);
  vertex(mw * 0.52, mh * 0.25);
  vertex(mw * 0.84, mh);
  endShape(CLOSE);

  fill(theme.white);
  beginShape();
  vertex(mw * 0.44, mh * 0.33);
  vertex(mw * 0.52, 0);
  vertex(mw * 0.60, mh * 0.33);
  vertex(mw * 0.52, mh * 0.22);
  endShape(CLOSE);

  pop();
}

function drawSpeedLines(fastBox, ang, theme) {
  // Speed lines left of FAST
  const baseX = fastBox.x - 220;
  const baseY = fastBox.y + fastBox.h * 0.58;

  push();
  translate(baseX, baseY);
  rotate(ang);

  const lines = [
    { y: -70, w: 650, sw: 16, c: theme.warm },
    { y: -20, w: 780, sw: 14, c: theme.warm2 },
    { y:  30, w: 700, sw: 14, c: theme.warm },
  ];

  for (const ln of lines) {
    stroke(ln.c);
    strokeWeight(ln.sw);
    strokeCap(SQUARE);
    line(0, ln.y, ln.w, ln.y);

    // Minimal break
    stroke(255);
    strokeWeight(ln.sw + 6);
    line(ln.w * 0.46, ln.y, ln.w * 0.64, ln.y);
  }

  pop();
}

/* ====================== GEOMETRY + TEXT ====================== */

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

  // width with tracking
  let total = 0;
  for (let i = 0; i < str.length; i++) {
    total += textWidth(str[i]);
    if (i < str.length - 1) total += tracking;
  }

  let x = cx - total / 2;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    shearX(-.1);
    text(ch, x, cy);
    x += textWidth(ch) + tracking;
  }
}
