let bg;

function setup() {
  createCanvas(windowWidth, windowHeight);
  bg = color(255, 0,0);
}

function draw() {
  //background(225, 0,0 );
  background(bg);
  //ellipse(mouseX, mouseY, 50, 50);
  line(0, height/2, width, 0);
  ellipse(width/2, height/2, 100, 100);
  //myTriangle(100, mouseX, mouseY);
  myTriangle(0.05, width/3.55, height/4.26);
  console.log('mouseX' + mouseX+'mouseY:'+ mouseY);
  print("hey");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  bg = color(random(255), random(255), random(255));
}

function myTriangle(amountOfWindow, x, y){
  push();
  //const size = width * 0.15;
  //triangleMode(CENTER);
  const size = width * amountOfWindow;
  translate(x, y);
  triangle(0,0,size, size*2, -size, size*2);
  pop();
}