function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(225, 0,0 );
  ellipse(mouseX, mouseY, 50, 50);
  line(0, height/2, width/2, 0);
}
