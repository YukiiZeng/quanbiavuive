// main.js - Luồng Điều Khiển Game & Đồng Bộ Đám Mây

const GameState = {
  coins: 0,
  currentOrder: null,
  currentLevel: 0,
  isPouring: false,
  pourTimer: null,
  basePourSpeed: 1.8
};

// Khởi tạo game & Tải Coin từ Firebase
async function initGame() {
  UI.init();
  UI.bindPourEvents(startPouring, stopPouring);
  
  // Khởi tạo kết nối Firebase
  if (typeof FirebaseService !== 'undefined') {
    FirebaseService.init();

    // Tải dữ liệu lưu trước đó từ đám mây
    const savedData = await FirebaseService.loadProgress();
    if (savedData && typeof savedData.coins === 'number') {
      GameState.coins = savedData.coins;
      UI.renderMoney(GameLogic.formatCurrency(GameState.coins));
      UI.renderStatus("Đã tải dữ liệu từ Đám mây!", "#4caf50");
    } else {
      UI.renderStatus("Tạo tài khoản mới thành công!", "#ffca28");
    }
  }

  // Bắt đầu đơn hàng đầu tiên
  nextCustomerOrder();
}

function nextCustomerOrder() {
  GameState.currentOrder = GameLogic.generateOrder();
  UI.renderOrder(GameState.currentOrder);
}

function startPouring(e) {
  if (e) e.preventDefault();
  if (GameState.isPouring || !GameState.currentOrder) return;

  GameState.isPouring = true;
  GameState.currentLevel = 0;

  UI.setPouringState(true);
  UI.renderBeerLevel(0);
  UI.renderStatus("Đang rót bia cho khách...", "#aaa");

  const actualSpeed = GameState.basePourSpeed * GameState.currentOrder.glass.speedMultiplier;

  GameState.pourTimer = setInterval(() => {
    GameState.currentLevel += actualSpeed;

    if (GameState.currentLevel > 100) {
      GameState.currentLevel = 100;
      stopPouring(); 
    }

    UI.renderBeerLevel(GameState.currentLevel);
  }, 30);
}

function stopPouring(e) {
  if (e) e.preventDefault();
  if (!GameState.isPouring) return;

  GameState.isPouring = false;
  clearInterval(GameState.pourTimer);

  UI.setPouringState(false);

  // Tính kết quả
  const result = GameLogic.calculatePourResult(GameState.currentLevel, GameState.currentOrder);
  GameState.coins += result.earned;

  // Lưu lên Firebase nếu đối tượng FirebaseService đã sẵn sàng
  if (typeof FirebaseService !== 'undefined') {
    FirebaseService.saveProgress(GameState.coins);
  }

  // Cập nhật UI
  UI.renderMoney(GameLogic.formatCurrency(GameState.coins));
  UI.renderStatus(result.statusText, result.statusColor);

  setTimeout(() => {
    nextCustomerOrder();
  }, 1500);
}

document.addEventListener('DOMContentLoaded', initGame);
