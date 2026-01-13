/**
 * main.js
 * 포즈 인식과 게임 로직을 초기화하고 서로 연결하는 진입점
 *
 * PoseEngine, GameEngine, Stabilizer를 조합하여 애플리케이션을 구동
 */

// 전역 변수
let poseEngine;
let gameEngine;
let stabilizer;
let ctx;
let labelContainer;

/**
 * 애플리케이션 초기화
 */
async function init() {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  startBtn.disabled = true;

  try {
    // 1. PoseEngine 초기화
    poseEngine = new PoseEngine("./my_model/");
    // 캔버스 크기를 400으로 증가
    const size = 400;
    const { maxPredictions, webcam } = await poseEngine.init({
      size: size,
      flip: true
    });

    // 2. Stabilizer 초기화
    stabilizer = new PredictionStabilizer({
      threshold: 0.7,
      smoothingFrames: 3
    });

    // 3. GameEngine 초기화 (선택적)
    gameEngine = new GameEngine();

    // 4. 캔버스 설정
    const canvas = document.getElementById("game-canvas"); // Game Canvas
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");

    // Webcam Canvas를 DOM에 추가
    if (webcam && webcam.canvas) {
      document.getElementById("webcam-container").appendChild(webcam.canvas);
    }

    // 5. Label Container 설정
    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = ""; // 초기화
    for (let i = 0; i < maxPredictions; i++) {
      labelContainer.appendChild(document.createElement("div"));
    }

    // 6. PoseEngine 콜백 설정
    poseEngine.setPredictionCallback(handlePrediction);
    poseEngine.setDrawCallback(drawPose);

    // 7. PoseEngine 시작
    poseEngine.start();

    // 8. GameEngine 시작
    if (gameEngine) {
      gameEngine.start();
    }

    stopBtn.disabled = false;
  } catch (error) {
    console.error("초기화 중 오류 발생:", error);
    alert("초기화에 실패했습니다. 콘솔을 확인하세요.");
    startBtn.disabled = false;
  }
}

/**
 * 애플리케이션 중지
 */
function stop() {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  if (poseEngine) {
    poseEngine.stop();
  }

  if (gameEngine && gameEngine.isGameActive) {
    gameEngine.stop();
  }

  if (stabilizer) {
    stabilizer.reset();
  }

  startBtn.disabled = false;
  stopBtn.disabled = true;
}

/**
 * 예측 결과 처리 콜백
 * @param {Array} predictions - TM 모델의 예측 결과
 * @param {Object} pose - PoseNet 포즈 데이터
 */
function handlePrediction(predictions, pose) {
  // 1. Stabilizer로 예측 안정화
  const stabilized = stabilizer.stabilize(predictions);

  // 2. Label Container 업데이트
  for (let i = 0; i < predictions.length; i++) {
    const classPrediction =
      predictions[i].className + ": " + predictions[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }

  // 3. 최고 확률 예측 표시
  const maxPredictionDiv = document.getElementById("max-prediction");
  maxPredictionDiv.innerHTML = stabilized.className || "감지 중...";

  // 4. GameEngine에 포즈 전달 (게임 모드일 경우)
  if (gameEngine && gameEngine.isGameActive && stabilized.className) {
    gameEngine.onPoseDetected(stabilized.className);
  }
}

/**
 * 포즈 그리기 콜백
 * @param {Object} pose - PoseNet 포즈 데이터
 */
function drawPose(pose) {
  // 웹캠 캔버스 컨텍스트 가져오기 (스켈레톤을 웹캠 위에 그리기 위함)
  if (poseEngine.webcam && poseEngine.webcam.canvas) {
    const webcamCtx = poseEngine.webcam.canvas.getContext("2d");

    // 웹캠 프레임은 이미 webcam.canvas에 업데이트됨 (poseEngine.loop에서)
    // 따라서 별도로 drawImage할 필요 없이, 그 위에 스켈레톤만 그리면 됨
    // 매 프레임마다 웹캠 캔버스는 초기화되거나 덮어쓰여질 수 있으니 확인 필요
    // tmPose.Webcam은 내부적으로 video 요소를 캔버스에 그림.

    // 키포인트와 스켈레톤 그리기 (웹캠 위에)
    if (pose) {
      const minPartConfidence = 0.5;
      tmPose.drawKeypoints(pose.keypoints, minPartConfidence, webcamCtx);
      tmPose.drawSkeleton(pose.keypoints, minPartConfidence, webcamCtx);
    }
  }

  // 게임 화면 그리기 (게임 캔버스)
  // 게임 화면 지우기 (투명 배경)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 배경색 채우기 (선택 사항, 예: 흰색 배경)
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 게임 엔진 업데이트 및 그리기
  if (gameEngine && gameEngine.isGameActive) {
    gameEngine.update();
    gameEngine.draw(ctx);
  }
}

// 게임 모드 시작 함수 (선택적 - 향후 확장용)
function startGameMode(config) {
  if (!gameEngine) {
    console.warn("GameEngine이 초기화되지 않았습니다.");
    return;
  }

  gameEngine.setScoreChangeCallback((score, level) => {
    console.log(`점수: ${score}, 레벨: ${level}`);
    const scoreBoard = document.getElementById("score-board");
    if (scoreBoard) {
      scoreBoard.innerText = `Score: ${score} | Level: ${level}`;
    }
  });

  gameEngine.setGameEndCallback((finalScore, finalLevel) => {
    console.log(`게임 종료! 최종 점수: ${finalScore}, 최종 레벨: ${finalLevel}`);
    alert(`게임 종료!\n최종 점수: ${finalScore}\n최종 레벨: ${finalLevel}`);
  });

  gameEngine.start();
}
