// main.js - Luồng Điều Khiển Game & Đồng Bộ Đám Mây

const GameState = {
  coins: 100,
  day: 1,
  hour: 15,
  minute: 0,
  isOpen: false,
  rescueCount: 0,
  inventory: {
    kegs: 1,
    glasses: {
      small: { clean: 10, dirty: 0 },
      medium: { clean: 10, dirty: 0 },
      large: { clean: 10, dirty: 0 }
    }
  },
  attachedKegMl: 19000,
  basePourSpeed: 1.0,
  customerQueue: [],
  currentOrder: null,
  selectedGlassType: null,
  currentLevel: 0,
  isPouring: false,
  isWashing: false,
  isChangingKeg: false,
  pourTimer: null,
  clockTimer: null,
  patienceTimer: null
};


// Khởi tạo game & Tải Coin từ Firebase
async function initGame() {
  UI.init();
  if (typeof initPhaserCustomerView === 'function') {
    initPhaserCustomerView();
  }

  // Tải dữ liệu Firebase
  if (typeof FirebaseService !== 'undefined') {
    FirebaseService.init();
    const savedData = await FirebaseService.loadProgress();
    if (savedData && typeof savedData.coins === 'number') {
      GameState.coins = savedData.coins;
      GameState.day = savedData.day || 1;
    }
  }

  bindEvents(); // Gán sự kiện click cho các nút
  UI.renderHomeData(GameState);
  UI.switchView('home'); // Mặc định hiển thị Trang chủ trước
}

function bindEvents() {
  // Bắt sự kiện Bắt đầu ngày mới
  const startDayBtn = document.getElementById('start-day-btn');
  if (startDayBtn) {
    startDayBtn.addEventListener('click', startNewDayShift);
  }

  // Bắt sự kiện quay về trang chủ khi hết giờ
  UI.bindNextDayEvent(() => {
    GameState.day += 1;
    UI.toggleNightOverlay(false);
    UI.renderHomeData(GameState);
    UI.switchView('home');
  });

  // Chuyển Tab trong Gameplay
  const tabGlass = document.getElementById('tab-btn-glass');
  const tabPour = document.getElementById('tab-btn-pour');
  const tabSink = document.getElementById('tab-btn-sink');
  if (tabGlass) tabGlass.addEventListener('click', () => UI.switchTab('glass'));
  if (tabPour) tabPour.addEventListener('click', () => UI.switchTab('pour'));
  if (tabSink) tabSink.addEventListener('click', () => UI.switchTab('sink'));

  // Sự kiện chọn ly
  const btnSmall = document.getElementById('select-small-btn');
  const btnMedium = document.getElementById('select-medium-btn');
  const btnLarge = document.getElementById('select-large-btn');
  if (btnSmall) btnSmall.addEventListener('click', () => handleSelectGlass('small'));
  if (btnMedium) btnMedium.addEventListener('click', () => handleSelectGlass('medium'));
  if (btnLarge) btnLarge.addEventListener('click', () => handleSelectGlass('large'));

  // Nút Ra bia / Đổ bỏ / Rửa ly
  const serveBtn = document.getElementById('serve-btn');
  const discardBtn = document.getElementById('discard-btn');
  const washBtn = document.getElementById('wash-btn');
  if (serveBtn) serveBtn.addEventListener('click', handleServeBeer);
  if (discardBtn) discardBtn.addEventListener('click', handleDiscardBeer);
  if (washBtn) washBtn.addEventListener('click', handleWashGlasses);

    // Trong function bindEvents()
  UI.bindPourEvents(startPouring, stopPouring);
  window.addEventListener('pointercancel', stopPouring);
  window.addEventListener('pointerup', stopPouring);

}

function startNewDayShift() {
  GameState.hour = GameConfig.START_HOUR;
  GameState.minute = 0;
  GameState.isOpen = true;
  GameState.currentOrder = null;
  GameState.selectedGlassType = null;

  UI.switchView('game');
  UI.switchTab('glass');
  UI.renderMoney(GameLogic.formatCurrency(GameState.coins));
  UI.renderClock(GameState.day, GameState.hour, GameState.minute);
  UI.renderInventory(GameState.inventory, GameState.attachedKegMl);
  UI.renderStatus(`Ngày ${GameState.day} bắt đầu!`, "#4caf50");

  startClock();
  handleCustomerSpawning();
}


function nextCustomerOrder() {
  GameState.currentOrder = GameLogic.generateOrder();
  UI.renderOrder(GameState.currentOrder);
}

// 1. SỬA HÀM startPouring (Bắt lỗi chưa chọn ly)
function startPouring(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (GameState.isPouring || !GameState.currentOrder) return;

  // LỖI 1: Nếu chưa chọn ly -> Báo lỗi ngay
  if (!GameState.selectedGlassType) {
    UI.renderStatus("⚠️ Bạn chưa chọn ly! Vui lòng sang tab 'Chọn Ly' trước.", "#f44336");
    return;
  }

  if (GameState.attachedKegMl <= 0) {
    UI.renderStatus("⚠️ Hết bia trong máy! Hãy thay bom bia ngay.", "#f44336");
    return;
  }

  GameState.isPouring = true;
  GameState.currentLevel = 0;
  
  UI.setPouringState(true);
  UI.renderBeerLevel(0);
  UI.renderStatus("Đang rót bia...", "#aaa");

  const glass = GlassTypes[GameState.selectedGlassType];
  const actualSpeed = (GameState.basePourSpeed || 1.0) * glass.speedMultiplier;

  if (GameState.pourTimer) clearInterval(GameState.pourTimer);

  // LỖI 3: Dùng setInterval mượt mà, dừng tức thì khi nhả tay
  GameState.pourTimer = setInterval(() => {
    if (!GameState.isPouring) {
      clearInterval(GameState.pourTimer);
      return;
    }
    
    GameState.currentLevel += actualSpeed;
    if (GameState.currentLevel >= 100) {
      GameState.currentLevel = 100;
      UI.renderBeerLevel(100);
      stopPouring();
      return;
    }
    UI.renderBeerLevel(GameState.currentLevel);
  }, 30);
}

// 2. SỬA HÀM stopPouring (Tắt tia bia tức thì khi nhả tay)
function stopPouring(e) {
  if (e) e.preventDefault();
  if (!GameState.isPouring) return;

  GameState.isPouring = false;
  if (GameState.pourTimer) {
    clearInterval(GameState.pourTimer);
    GameState.pourTimer = null;
  }

  // LỖI 2: Tắt tia bia ngay khi thả tay
  UI.setPouringState(false);
  UI.togglePourActionButtons('poured');
  UI.renderStatus("Đã hãm vòi! Bấm 'Ra Bia' hoặc 'Đổ Bỏ'.", "#ffca28");
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

// 3. SỬA HÀM handleSelectGlass (Hiện ly khi chọn)
function handleSelectGlass(glassTypeKey) {
  if (!GameState.currentOrder) return;

  const stock = GameState.inventory.glasses[glassTypeKey];
  if (stock.clean <= 0) {
    UI.renderStatus("Hết ly sạch! Hãy sang tab Bồn Ly để rửa.", "#f44336");
    UI.switchTab('sink');
    return;
  }

  stock.clean -= 1;
  GameState.selectedGlassType = glassTypeKey;
  UI.renderInventory(GameState.inventory, GameState.attachedKegMl);

  UI.setupPourGlassView(glassTypeKey, GameState.currentOrder);
  UI.toggleGlassWrapper(true); // Hiện ly bia lên stage
  UI.togglePourActionButtons('ready');
  UI.switchTab('pour');
}

function handleServeBeer() {
  if (!GameState.currentOrder || !GameState.selectedGlassType) return;

  const pouredMl = GameLogic.calculatePouredVolumeMl(GameState.selectedGlassType, GameState.currentLevel);
  GameState.attachedKegMl = Math.max(0, GameState.attachedKegMl - pouredMl);
  GameState.inventory.glasses[GameState.selectedGlassType].dirty += 1;

  const result = GameLogic.calculatePourResult(GameState.currentLevel, GameState.currentOrder, GameState.selectedGlassType);
  GameState.coins += result.earned;

  UI.renderMoney(GameLogic.formatCurrency(GameState.coins));
  UI.renderInventory(GameState.inventory, GameState.attachedKegMl);
  UI.renderStatus(result.statusText, result.statusColor);

  resetPourState();
  
  // LỖI 1: Chuyển ngay về Tab Chọn Ly sau khi giao bia thành công
  UI.switchTab('glass');

  setTimeout(() => { 
    if (GameState.isOpen) serveNextCustomer(); 
  }, 1200);
}

function handleDiscardBeer() {
  if (!GameState.selectedGlassType) return;

  const pouredMl = GameLogic.calculatePouredVolumeMl(GameState.selectedGlassType, GameState.currentLevel);
  GameState.attachedKegMl = Math.max(0, GameState.attachedKegMl - pouredMl);
  GameState.inventory.glasses[GameState.selectedGlassType].dirty += 1;

  UI.renderInventory(GameState.inventory, GameState.attachedKegMl);
  UI.renderStatus("Đã đổ bỏ ly bia hỏng!", "#f44336");

  resetPourState();
  UI.switchTab('glass'); // Trở lại tab chọn ly khác
}

function resetPourState() {
  GameState.selectedGlassType = null;
  GameState.currentLevel = 0;
  UI.renderBeerLevel(0);
  UI.setPouringState(false);
  UI.togglePourActionButtons('ready');
  UI.toggleGlassWrapper(false); // Ẩn ly bia khi chưa chọn
}

function handleWashGlasses() {
  if (GameState.isWashing) return;
  const totalDirty = GameState.inventory.glasses.small.dirty + GameState.inventory.glasses.medium.dirty + GameState.inventory.glasses.large.dirty;
  if (totalDirty <= 0) return;

  GameState.isWashing = true;
  UI.elements.washBtn.disabled = true;
  UI.elements.washProgressBar.classList.remove('hidden');

  let progress = 0;
  const interval = setInterval(() => {
    progress += 20;
    UI.elements.washProgressFill.style.width = `${progress}%`;

    if (progress >= 100) {
      clearInterval(interval);
      Object.keys(GameState.inventory.glasses).forEach(k => {
        GameState.inventory.glasses[k].clean += GameState.inventory.glasses[k].dirty;
        GameState.inventory.glasses[k].dirty = 0;
      });
      GameState.isWashing = false;
      UI.elements.washBtn.disabled = false;
      UI.elements.washProgressBar.classList.add('hidden');
      UI.renderInventory(GameState.inventory, GameState.attachedKegMl);
      UI.renderStatus("Đã rửa sạch toàn bộ ly!", "#4caf50");
    }
  }, 1000);
}
