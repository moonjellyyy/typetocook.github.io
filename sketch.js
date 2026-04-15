// Font & Text
let font; 
let msg, fontSize;
let alphabets = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
let textOffsetX, textOffsetY;

// Ingredients & Points
let activeIngredients = [];
let availablePoints = [];
let spawnTimer = 0;

// Burger Constants & Names
const BUN_TOP = 0, PATTY = 1, CHEESE = 2, LETTUCE = 3, TOMATO = 4, BUN_BOT = 5;
const TYPES = [BUN_TOP, PATTY, CHEESE, LETTUCE, TOMATO, BUN_BOT];
const TYPE_NAMES = ["Bun Top", "Patty", "Cheese", "Lettuce", "Tomato", "Bun Bot"];

function preload() {
  font = loadFont("jgs5.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  rectMode(CENTER);
  
  // 알파벳 선택 
  msg = createSelect();
  msg.position(windowWidth - 70, 15);
  msg.style('font-size', '16px');
  for (let i = 0; i < alphabets.length; i++) {
    msg.option(alphabets[i]);
  }
  msg.changed(resetLetter); 
  
  resetLetter(); 
}

function draw() {
  background("#FF0000"); 

 
  push();
  noFill();
  rectMode(CENTER);
  noStroke(); 
  rect(windowWidth / 2, 40, 320, 80); 
  
  textFont(font); 
  textSize(40); 
  textAlign(CENTER, TOP);
  fill(255);
  text("type to cook", windowWidth / 2, 20);
  pop();


  push();
  noFill();
  stroke(255, 255, 255, 60); // 반투명 흰색 윤곽선
  strokeWeight(2);
  textFont(font);
  textSize(fontSize);
  textAlign(LEFT, BASELINE);
  text(msg.selected(), textOffsetX, textOffsetY);
  pop();

  // 화면에 배치된 재료들 
  for (let ing of activeIngredients) {
    ing.update();
    ing.display();
  }

  // 하단 UI 패널 그리기 및 인터랙션 처리
  drawUIPanel();
}


function resetLetter() {
  activeIngredients = [];
  let m = msg.selected();
  

  fontSize = min(windowWidth, windowHeight) * 0.6;
  let bounds = font.textBounds(m, 0, 0, fontSize);
  
  textOffsetX = (windowWidth - bounds.w) / 2 - bounds.x;
  textOffsetY = ((windowHeight - bounds.h) / 2 - bounds.y) - 60; // UI 패널 위로 살짝 올림
  
 
  let pts = font.textToPoints(m, textOffsetX, textOffsetY, fontSize, { sampleFactor: 0.15 });
  

  pts.sort((a, b) => b.y - a.y);
  
  availablePoints = pts;
}

// 하단 재료
function drawUIPanel() {

  let boxSize = min(50, windowWidth / 8); 
  let spacing = 10;
  let totalWidth = (boxSize * 6) + (spacing * 5);
  let startX = (windowWidth - totalWidth) / 2 + boxSize / 2;
  let panelY = windowHeight - boxSize - 35; 
  push();
  // 패널 배경
  noFill();
  noStroke();
  rectMode(CENTER);
  rect(windowWidth / 2, panelY, windowWidth, boxSize + 40);

  for (let i = 0; i < 6; i++) {
    let bx = startX + i * (boxSize + spacing);
    let by = panelY;
    
    
    let isHover = dist(mouseX, mouseY, bx, by) < boxSize / 2;
    let isPressed = mouseIsPressed && isHover;

    // 박스 
    fill(isPressed ? 200 : 255); 
    noStroke(); 
    rect(bx, by, boxSize, boxSize); 

    // 박스 안의 재료 아이콘 그리기 (outline이 아닌 full fill)
    push();
    translate(bx, by);
    if (isPressed) scale(0.9); // 클릭 시 아이콘 줌인 효과
    drawIngredientShape(TYPES[i], boxSize * 0.6);
    pop();

    // 재료 이름
    fill(255);
    textSize(10);
    textAlign(CENTER, TOP);
      textFont(font);
    text(TYPE_NAMES[i], bx, by + boxSize / 2 + 5);

   
    if (isPressed) {
      if (millis() - spawnTimer > 40) { 
        spawnIngredient(TYPES[i], bx, by);
        spawnTimer = millis();
      }
    }
  }
  pop();
}

// 재료 생성 
function spawnIngredient(type, startX, startY) {
  if (availablePoints.length > 0) {
    let pt = availablePoints.pop(); 
    activeIngredients.push(new Ingredient(startX, startY, pt.x, pt.y, type));
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  msg.position(windowWidth - 70, 15);
  resetLetter(); 
}

// 개별 재료 
class Ingredient {
  constructor(startX, startY, targetX, targetY, type) {
    this.x = startX;
    this.y = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.type = type;
    this.size = 20; 
  }
  
  update() {
   
    this.x = lerp(this.x, this.targetX, 0.1);
    this.y = lerp(this.y, this.targetY, 0.1);
  }
  
  display() {
    push();
    translate(this.x, this.y);
    drawIngredientShape(this.type, this.size);
    pop();
  }
}

// 재료 형태 
function drawIngredientShape(type, s) {
  noStroke(); 
  rectMode(CENTER);
  
  if (type === BUN_TOP) {
    fill('#E89F4C'); 
    arc(0, 0, s, s, 180, 0, CHORD);
  } else if (type === PATTY) {
    fill('#5C3A21'); 
    rect(0, 0, s, s*0.4); 
  } else if (type === CHEESE) {
    fill('#FACC2E'); 
    push();
    rotate(45);
    rect(0, 0, s*0.7, s*0.7); 
    pop();
  } else if (type === LETTUCE) {
    fill('#64FE2E'); 
    ellipse(0, 0, s, s*0.4);
  } else if (type === TOMATO) {
    fill('#ff6666'); 
    ellipse(0, 0, s*0.8, s*0.3);
  } else if (type === BUN_BOT) {
    fill('#E89F4C'); 
    arc(0, 0, s, s, 0, 180, CHORD);
  }
}