// Font & Text
let font; 
let inputField;
let pg; // 가상 캔버스

// Ingredients & Points
let rightPoints = []; // 글자의 내부 좌표들 (재료가 쌓일 공간)
let activeIngredients = []; // 생성된 재료들
let prevUserTxt = "";
let spawnTimer = 0;
let liveFontSize;

// UI Elements
let sizeSlider, cookSlider, exportBtn;

// Burger Constants
const BUN_TOP = 0, PATTY = 1, CHEESE = 2, LETTUCE = 3, TOMATO = 4, BUN_BOT = 5;
const TYPES = [BUN_TOP, PATTY, CHEESE, LETTUCE, TOMATO, BUN_BOT];
const TYPE_NAMES = ["Bun Top", "Patty", "Cheese", "Lettuce", "Tomato", "Bun Bot"];

function preload() {
  font = loadFont("jgs5.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pg = createGraphics(windowWidth, windowHeight);
  pg.pixelDensity(1); 
  angleMode(DEGREES);
  
  // 1. 텍스트 박스 (화면 중앙 하단)
  inputField = createInput('');
  inputField.attribute('placeholder', 'Type here to cook...');
  inputField.position(windowWidth / 2 - 125, windowHeight - 90);
  inputField.style('width', '250px');
  inputField.style('padding', '10px');
  inputField.style('font-family', 'jgs5, monospace');
  inputField.style('text-align', 'center');
  inputField.style('font-size', '16px');
  inputField.style('border-radius', '0px'); 
  inputField.style('border', 'none');
  
  inputField.input(onTextInput);

  // 2. Export 버튼 (우측 상단)
  exportBtn = createButton('Export');
  exportBtn.position(windowWidth - 100, 20); 
  exportBtn.style('background', 'none');
  exportBtn.style('border', 'none');
  exportBtn.style('color', 'white');
  exportBtn.style('font-family', 'jgs5, monospace');
  exportBtn.style('font-size', '16px');
  exportBtn.style('cursor', 'pointer');
  exportBtn.style('text-align', 'right');
  exportBtn.mousePressed(() => saveCanvas('type-to-cook', 'jpg'));

  // 3. 슬라이더 (우측 하단)
  // 두 슬라이더의 y좌표를 동일하게 맞춤 (windowHeight - 40)
  sizeSlider = createSlider(10, 50, 25);
  sizeSlider.position(windowWidth - 240, windowHeight - 40); 
  sizeSlider.style('width', '90px');
  
  cookSlider = createSlider(0, 150, 0); 
  cookSlider.position(windowWidth - 120, windowHeight - 40);
  cookSlider.style('width', '90px');
}

function draw() {
  background("#FF0000"); 

  drawTitle();
  drawLiveText(); 
  drawBottomLeftPanel();
  drawBottomRightLabels();
}

function drawTitle() {
  push();
  textFont(font); 
  textSize(36);
  textAlign(CENTER, CENTER);
  fill(255); 
  text("Type to Cook", windowWidth / 2, 40); 
  pop();
}

function onTextInput() {
  let currentTxt = inputField.value();
  if (currentTxt !== prevUserTxt) {
    prevUserTxt = currentTxt;
    activeIngredients = []; 
    updateTextPoints(currentTxt);
  }
}

function updateTextPoints(txt) {
  rightPoints = [];
  if (txt === "") return;

  liveFontSize = min(windowWidth / max(txt.length, 1) * 1.5, windowHeight * 0.4); 
  
  let bounds = font.textBounds(txt, 0, 0, liveFontSize);
  let rx = windowWidth / 2 - bounds.w / 2;
  let ry = windowHeight / 2 + bounds.h / 2 - 40; 

  pg.clear();
  pg.background(0);
  pg.fill(255);
  pg.noStroke();
  pg.textFont(font);
  pg.textSize(liveFontSize);
  pg.textAlign(LEFT, BASELINE);
  pg.text(txt, rx, ry);
  pg.loadPixels();

  let step = 12; 
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      let index = (x + y * width) * 4;
      if (pg.pixels[index] > 128) {
        rightPoints.push({ x: x, y: y });
      }
    }
  }
  rightPoints.sort((a, b) => a.y - b.y); 
}

function drawLiveText() {
  let userTxt = prevUserTxt;

  if (userTxt === "") {
    push();
    fill(255, 100);
    noStroke();
    textFont(font);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Type below to start cooking!", windowWidth / 2, windowHeight / 2);
    pop();
    return;
  }

  let bounds = font.textBounds(userTxt, 0, 0, liveFontSize);
  let rx = windowWidth / 2 - bounds.w / 2;
  let ry = windowHeight / 2 + bounds.h / 2 - 40;

  push();
  noFill();
  stroke(255, 25); 
  strokeWeight(1);
  textFont(font);
  textSize(liveFontSize);
  textAlign(LEFT, BASELINE);
  text(userTxt, rx, ry);
  pop();

  for (let ing of activeIngredients) {
    ing.update();
    ing.display();
  }
}

function drawBottomLeftPanel() {
  let boxSize = 45;
  let spacing = 15;
  let startX = 30 + boxSize / 2;
  let by = windowHeight - 40; 

  for (let i = 0; i < 6; i++) {
    let bx = startX + i * (boxSize + spacing);
    let isHover = dist(mouseX, mouseY, bx, by) < boxSize/2;
    let isPressed = mouseIsPressed && isHover;

    push();
    rectMode(CENTER);
    noStroke();
    fill(isHover ? (isPressed ? 180 : 220) : 255);
    rect(bx, by, boxSize, boxSize);
    translate(bx, by);
    drawIngredientShape(TYPES[i], boxSize * 0.6, 0); 
    pop();

    push();
    fill(255);
    textFont(font); 
    textSize(10);
    textAlign(CENTER, BOTTOM);
    text(TYPE_NAMES[i], bx, by - boxSize / 2 - 5);
    pop();

    if (isPressed && millis() - spawnTimer > 30) {
      if (rightPoints.length > 0) {
        let pt = rightPoints.pop();
        activeIngredients.push(new Ingredient(bx, by, pt.x, pt.y, TYPES[i], sizeSlider.value(), cookSlider.value()));
      }
      spawnTimer = millis();
    }
  }
}

function drawBottomRightLabels() {
  push();
  fill(255);
  textFont(font);
  textSize(12);
  textAlign(CENTER, BOTTOM);
  // 두 라벨의 y좌표도 동일하게 맞춤 (windowHeight - 50)
  text("Size", windowWidth - 195, windowHeight - 50);
  text("Cook", windowWidth - 75, windowHeight - 50);
  pop();
}

class Ingredient {
  constructor(startX, startY, targetX, targetY, type, size, tint) {
    this.x = startX;
    this.y = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.type = type;
    this.size = size;
    this.tint = tint; 
  }
  update() {
    this.x = lerp(this.x, this.targetX, 0.1);
    this.y = lerp(this.y, this.targetY, 0.1);
  }
  display() {
    push();
    translate(this.x, this.y);
    drawIngredientShape(this.type, this.size, this.tint);
    pop();
  }
}

function drawIngredientShape(type, s, tint) {
  noStroke();
  rectMode(CENTER);
  let getCol = (hex) => {
    let c = color(hex);
    return color(red(c) - tint, green(c) - tint, blue(c) - tint);
  };
  
  if (type === BUN_TOP) { fill(getCol('#E89F4C')); arc(0, 0, s, s, 180, 0, CHORD); }
  else if (type === PATTY) { fill(getCol('#5C3A21')); rect(0, 0, s, s*0.4); }
  else if (type === CHEESE) { fill(getCol('#FACC2E')); push(); rotate(45); rect(0, 0, s*0.7, s*0.7); pop(); }
  else if (type === LETTUCE) { fill(getCol('#64FE2E')); ellipse(0, 0, s, s*0.4); }
  else if (type === TOMATO) { fill(getCol('#ff6666')); ellipse(0, 0, s*0.8, s*0.3); }
  else if (type === BUN_BOT) { fill(getCol('#E89F4C')); arc(0, 0, s, s, 0, 180, CHORD); }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pg = createGraphics(windowWidth, windowHeight);
  pg.pixelDensity(1);
  
  inputField.position(windowWidth / 2 - 125, windowHeight - 90);
  exportBtn.position(windowWidth - 100, 20); 
  // 리사이즈 시에도 슬라이더 높이를 동일하게 유지
  sizeSlider.position(windowWidth - 240, windowHeight - 40);
  cookSlider.position(windowWidth - 120, windowHeight - 40);
  
  if (prevUserTxt !== "") {
    let temp = prevUserTxt;
    prevUserTxt = ""; 
    activeIngredients = []; 
    inputField.value(temp);
    onTextInput();
  }
}