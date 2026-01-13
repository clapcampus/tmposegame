/**
 * gameEngine.js
 * Fruit Catcher 게임 로직 담당
 */

class GameEngine {
  constructor() {
    this.score = 0;
    this.level = 1;
    this.isGameActive = false;

    // 게임 상태
    this.basketPosition = "Center"; // Left, Center, Right
    this.items = []; // 떨어지는 아이템 배열 { x, y, type, speed }
    this.lastSpawnTime = 0;
    this.spawnInterval = 2000; // 아이템 생성 간격 (ms)

    this.onScoreChange = null;
    this.onGameEnd = null;
  }

  /**
   * 게임 시작
   */
  start() {
    this.isGameActive = true;
    this.score = 0;
    this.level = 1;
    this.items = [];
    this.basketPosition = "Center";
    this.lastSpawnTime = performance.now();

    console.log("Fruit Catcher 게임 시작!");
  }

  /**
   * 게임 중지
   */
  stop() {
    this.isGameActive = false;
    if (this.onGameEnd) {
      this.onGameEnd(this.score, this.level);
    }
  }

  /**
   * 게임 상태 업데이트 (프레임마다 호출)
   */
  update(deltaTime) {
    if (!this.isGameActive) return;

    const now = performance.now();

    // 1. 아이템 생성
    if (now - this.lastSpawnTime > this.spawnInterval) {
      this.spawnItem();
      this.lastSpawnTime = now;
    }

    // 2. 아이템 이동
    this.items.forEach(item => {
      item.y += item.speed;
    });

    // 3. 충돌 검사 & 화면 밖 제거
    this.items = this.items.filter(item => {
      // 화면 밖으로 나갔는지 확인 (캔버스 높이 400 기준)
      if (item.y > 400) {
        return false; // 제거
      }

      // TODO: 바구니와 충돌 검사 로직 추가 예정

      return true; // 유지
    });
  }

  /**
   * 화면 그리기
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!this.isGameActive) return;

    // 바구니 그리기
    this.drawBasket(ctx);

    // 아이템 그리기
    this.items.forEach(item => {
      this.drawItem(ctx, item);
    });
  }

  drawBasket(ctx) {
    let x = 200; // Center (400/2)
    if (this.basketPosition === "Left") x = 80;
    if (this.basketPosition === "Right") x = 320;

    // 간단한 네모 바구니
    ctx.fillStyle = "blue";
    ctx.fillRect(x - 30, 350, 60, 20); // 크기 및 위치 조정
  }

  drawItem(ctx, item) {
    ctx.fillStyle = item.type === "apple" ? "red" : "black";
    ctx.beginPath();
    ctx.arc(item.x, item.y, 15, 0, Math.PI * 2); // 크기보정
    ctx.fill();
  }

  spawnItem() {
    // 랜덤 위치 (Left: 80, Center: 200, Right: 320)
    const positions = [80, 200, 320];
    const x = positions[Math.floor(Math.random() * positions.length)];

    // TODO: 폭탄/과일 랜덤 생성 로직 고도화
    const type = Math.random() > 0.8 ? "bomb" : "apple";

    this.items.push({
      x: x,
      y: 0,
      type: type,
      speed: 2 + (this.level * 0.5) // 속도 조정
    });
  }

  /**
   * 포즈 인식 결과 처리
   * @param {string} detectedPose - 인식된 포즈 이름
   */
  onPoseDetected(detectedPose) {
    if (!this.isGameActive) return;

    // 인식된 포즈를 바구니 위치로 반영
    // "Left", "Center", "Right" 라벨이 정확히 들어온다고 가정
    if (["Left", "Center", "Right"].includes(detectedPose)) {
      this.basketPosition = detectedPose;
    }
  }

  setScoreChangeCallback(callback) {
    this.onScoreChange = callback;
  }

  setGameEndCallback(callback) {
    this.onGameEnd = callback;
  }
}

// 전역으로 내보내기
window.GameEngine = GameEngine;
