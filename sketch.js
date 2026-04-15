// Font & Text
let font; 
let msg, fontSize;
let alphabets = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
let textOffsetX, textOffsetY;
let pg; // 글자 내부 판별을 위한 오프스크린 그래픽스

// Ingredients & Points
let activeIngredients = [];
let availablePoints = [];
let spawnTimer = 0;

// UI Elements
let sizeSlider, cookSlider;

// Burger Constants & Names
const BUN_TOP = 0, PATTY = 1, CHEESE = 2, LETTUCE = 3, TOMATO = 4, BUN_BOT = 5;
const TYPES = [BUN_TOP, PATTY, CHEESE, LETTUCE, TOMATO, BUN_BOT];
const TYPE_NAMES = ["Bun Top", "Patty", "Cheese", "Lettuce", "Tomato", "Bun Bot"];

function preload() {
  font = loadFont("jgs5.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pg = createGraphics(windowWidth, windowHeight); // 가상 캔버스 생성
  angleMode(DEGREES);
  
  // 알파벳 선택 드롭다운
  msg = createSelect();
  msg.position(20, 20);
  msg.style('font-size', '16px');
  for (let i = 0; i < alphabets.length; i++) {
    msg.option(alphabets[i]);
  }
  msg.changed(resetLetter);

  // 오른쪽 슬라이더 생성
  sizeSlider = createSlider(10, 50, 25);
  sizeSlider.position(windowWidth - 140, 100);
  sizeSlider.style('width', '100px');

  cookSlider = createSlider(0, 150, 0); // 0(정상) ~ 150(검게 탄 느낌)
  cookSlider.position(windowWidth - 140, 160);
  cookSlider.style('width', '100px');
  
  resetLetter();
}

function draw() {
  background("#FF0000"); 

  // 상단 타이틀
  drawTitle();

  // 중앙 글자 가이드라인 (연하게)
  drawTextGuide();

  // 쌓인 재료들 업데이트 및 출력
  for (let ing of activeIngredients) {
    ing.update();
    ing.display();
  }

  // 왼쪽 아이콘 패널 및 오른쪽 슬라이더 라벨
  drawLeftPanel();
  drawRightLabels();
}

function drawTitle() {
  push();
  fill(255);
  noStroke();
  rectMode(CENTER);
  rect(windowWidth / 2, 40, 320, 60);
  textFont(font); 
  textSize(36);
  textAlign(CENTER, CENTER);
  fill(0);
  text("type to cook", windowWidth / 2, 35);
  pop();
}

function drawTextGuide() {
  push();
  noFill();
  stroke(255, 255, 255, 40);
  strokeWeight(1);
  textFont(font);
  textSize(fontSize);
  textAlign(LEFT, BASELINE);
  text(msg.selected(), textOffsetX, textOffsetY);
  pop();
}

// 글자 내부 공간의 좌표들을 추출하는 핵심 로직
function resetLetter() {
  activeIngredients = [];
  let m = msg.selected();
  fontSize = min(windowWidth, windowHeight) * 0.7;
  let bounds = font.textBounds(m, 0, 0, fontSize);
  textOffsetX = (windowWidth - bounds.w) / 2 - bounds.x;
  textOffsetY = (windowHeight / 2) + (bounds.h / 2);

  // 오프스크린에 글자 그리기
  pg.clear();
  pg.fill(255);
  pg.textFont(font);
  pg.textSize(fontSize);
  pg.textAlign(LEFT, BASELINE);
  pg.text(m, textOffsetX, textOffsetY);
  pg.loadPixels();

  availablePoints = [];
  // 픽셀을 촘촘히 검사하여 글자 내부(흰색 부분) 좌표 추출
  let step = 12; // 이 값을 줄이면 더 촘촘하게 채워집니다.
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      let index = (x + y * width) * 4;
      if (pg.pixels[index] > 128) { // 알파값 혹은 밝기가 일정 수준 이상이면 내부로 판단
        availablePoints.push({x: x, y: y});
      }
    }
  }

  // Bottom-up: 아래쪽 좌표부터 채워지도록 정렬
  availablePoints.sort((a, b) => b.y - a.y);
}

function drawLeftPanel() {
  let boxSize = 60;
  let startY = 100;
  let panelX = 50;

  for (let i = 0; i < 6; i++) {
    let by = startY + i * (boxSize + 15);
    let bx = panelX;

    let isHover = mouseX > bx - boxSize/2 && mouseX < bx + boxSize/2 &&
                  mouseY > by - boxSize/2 && mouseY < by + boxSize/2;
    let isPressed = mouseIsPressed && isHover;

    // 아이콘 박스 (테두리 없는 직사각형)
    push();
    rectMode(CENTER);
    noStroke();
    fill(isPressed ? 200 : 255);
    rect(bx, by, boxSize, boxSize);

    // 아이콘 그리기 (슬라이더 영향 안 받음)
    translate(bx, by);
    drawIngredientShape(TYPES[i], boxSize * 0.6, 0); // 굽기(tint) 0
    pop();

    // 이름 표시
    fill(255);
    textSize(11);
    textAlign(CENTER, TOP);
    text(TYPE_NAMES[i], bx, by + boxSize / 2 + 5);

    if (isPressed && millis() - spawnTimer > 50) {
      spawnIngredient(TYPES[i], bx, by);
      spawnTimer = millis();
    }
  }
}

function drawRightLabels() {
  push();
  fill(255);
  textFont(font);
  textSize(14);
  textAlign(RIGHT);
  text("SIZE", windowWidth - 150, 115);
  text("COOK", windowWidth - 150, 175);
  
  textSize(10);
  text("Small", windowWidth - 140, 135);
  textAlign(LEFT);
  text("Large", windowWidth - 40, 135);
  
  textAlign(RIGHT);
  text("Rare", windowWidth - 140, 195);
  textAlign(LEFT);
  text("Burnt", windowWidth - 40, 195);
  pop();
}

function spawnIngredient(type, startX, startY) {
  if (availablePoints.length > 0) {
    let pt = availablePoints.pop();
    // 현재 슬라이더 값을 적용하여 재료 생성
    activeIngredients.push(new Ingredient(startX, startY, pt.x, pt.y, type, sizeSlider.value(), cookSlider.value()));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pg = createGraphics(windowWidth, windowHeight);
  resetLetter();
}

class Ingredient {
  constructor(startX, startY, targetX, targetY, type, size, tint) {
    this.x = startX;
    this.y = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.type = type;
    this.size = size;
    this.tint = tint; // 굽기 정도
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
  
  // 색상 계산 (기본 색상에서 tint만큼 어둡게)
  let getCol = (hex) => {
    let c = color(hex);
    return color(red(c) - tint, green(c) - tint, blue(c) - tint);
  };

  if (type === BUN_TOP) {
    fill(getCol('#E89F4C')); 
    arc(0, 0, s, s, 180, 0, CHORD);
  } else if (type === PATTY) {
    fill(getCol('#5C3A21')); 
    rect(0, 0, s, s*0.4);
  } else if (type === CHEESE) {
    fill(getCol('#FACC2E')); 
    push(); rotate(45); rect(0, 0, s*0.7, s*0.7); pop();
  } else if (type === LETTUCE) {
    fill(getCol('#64FE2E')); 
    ellipse(0, 0, s, s*0.4);
  } else if (type === TOMATO) {
    fill(getCol('#ff6666')); 
    ellipse(0, 0, s*0.8, s*0.3);
  } else if (type === BUN_BOT) {
    fill(getCol('#E89F4C')); 
    arc(0, 0, s, s, 0, 180, CHORD);
  }
}