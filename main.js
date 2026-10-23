// main.js - Luồng Điều Khiển Game & Đồng Bộ Đám Mây

const GameState = {
  coins: 0,
  day: 1,
  hour: 15,
  minute: 0,
  isOpen: true,
  customerQueue: [],
  currentOrder: null,
  currentLevel: 0,
  isPouring: false,
  pourTimer: null,
  basePourSpeed: 1.0,
  clockTimer: null,
  patienceTimer: null
};


// Khởi tạo game & Tải Coin từ Firebase
async function initGame() {
  UI.init();
  if (typeof initPhaserCustomerView === 'function') {
    initPhaserCustomerView(); // Khởi tạo Phaser Scene
  }
  
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
  UI.bindNextDayEvent(startNextDay);
  startClock();
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

  // An toàn: Nếu đã 24h đóng cửa và currentOrder bị xóa thì dừng ngay
  if (!GameState.currentOrder) return;

  const result = GameLogic.calculatePourResult(GameState.currentLevel, GameState.currentOrder);
  GameState.coins += result.earned;

  if (typeof FirebaseService !== 'undefined') {
    FirebaseService.saveProgress(GameState.coins, GameState.day);
  }

  UI.renderMoney(GameLogic.formatCurrency(GameState.coins));
  UI.renderStatus(result.statusText, result.statusColor);

  setTimeout(() => {
    if (GameState.isOpen) {
      serveNextCustomer();
    }
  }, 1200);
}

document.addEventListener('DOMContentLoaded', initGame);
// Bắt đầu đồng hồ
function startClock() {
  if (GameState.clockTimer) clearInterval(GameState.clockTimer);

  GameState.clockTimer = setInterval(() => {
    if (!GameState.isOpen) return;

    GameState.minute += 10;
    if (GameState.minute >= 60) {
      GameState.minute = 0;
      GameState.hour += 1;
    }

    UI.renderClock(GameState.day, GameState.hour, GameState.minute);

    if (GameState.hour >= GameConfig.END_HOUR) {
      closePubForNight();
    } else {
      handleCustomerSpawning();
    }
  }, GameConfig.TIME_SCALE_MS);

  if (GameState.patienceTimer) clearInterval(GameState.patienceTimer);
  GameState.patienceTimer = setInterval(handlePatienceTick, 200);
}

// Logic sinh khách theo khung giờ & cao điểm (18h-21h)
function handleCustomerSpawning() {
  if (!GameState.isOpen || GameState.hour >= GameConfig.END_HOUR) return;

  const isPeak = GameLogic.isPeakHour(GameState.hour);
  const maxQueue = isPeak ? 4 : 2;
  const spawnChance = isPeak ? 0.6 : 0.25;

  // Tính tổng số khách = (Khách đang đứng ở vòi) + (Số khách trong hàng chờ)
  const totalCustomers = (GameState.currentOrder ? 1 : 0) + GameState.customerQueue.length;

  // Chỉ tạo thêm khi TỔNG KHÁCH chưa đạt giới hạn
  if (totalCustomers < maxQueue && Math.random() < spawnChance) {
    GameState.customerQueue.push(GameLogic.generateOrder());
  }

  if (!GameState.currentOrder && GameState.customerQueue.length > 0) {
    serveNextCustomer();
  }

  UI.renderQueue(GameState.customerQueue.length);
}

function serveNextCustomer() {
  if (GameState.customerQueue.length > 0) {
    GameState.currentOrder = GameState.customerQueue.shift();
    UI.renderOrder(GameState.currentOrder);
  } else {
    GameState.currentOrder = null;
    UI.renderOrder(null);
  }
  UI.renderQueue(GameState.customerQueue.length);
}

// Giảm thời gian kiên nhẫn
function handlePatienceTick() {
  if (!GameState.currentOrder || GameState.isPouring || !GameState.isOpen) return;
  
  GameState.currentOrder.patienceCurrent -= 0.2;
  const percent = (GameState.currentOrder.patienceCurrent / GameState.currentOrder.patienceMax) * 100;
  
  UI.renderPatience(percent);
  
  if (GameState.currentOrder.patienceCurrent <= 0) {
    UI.renderStatus(`Khách giận dỗi bỏ về vì chờ quá lâu! 😡`, "#f44336");
    serveNextCustomer();
  }
}

function closePubForNight() {
  GameState.isOpen = false;
  GameState.isPouring = false;
  clearInterval(GameState.pourTimer);

  GameState.currentOrder = null;
  GameState.customerQueue = [];

  UI.setPouringState(false);
  UI.renderOrder(null);
  UI.renderQueue(0);
  UI.renderStatus("Đã 24:00 - Quán ngưng nhận khách!", "#ffca28");
  UI.toggleNightOverlay(true);
}

function startNextDay() {
  GameState.day += 1;
  GameState.hour = GameConfig.START_HOUR;
  GameState.minute = 0;
  GameState.isOpen = true;

  UI.toggleNightOverlay(false);
  UI.renderClock(GameState.day, GameState.hour, GameState.minute);
  UI.renderStatus(`Ngày ${GameState.day} bắt đầu! Mở cửa đón khách.`, "#4caf50");

  if (typeof FirebaseService !== 'undefined') {
    FirebaseService.saveProgress(GameState.coins, GameState.day);
  }

  handleCustomerSpawning();
}