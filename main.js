// main.js - Luồng Điều Khiển Game & Đồng Bộ Đám Mây

// Thay thế khai báo GameState ở đầu file main.js:
const GameState = {
  coins: 100,
  day: 1,
  hour: 15,
  minute: 0,
  isOpen: false,
  inventory: {
    kegs: 1,
    glasses: {
      small: { clean: 10, dirty: 0 },
      medium: { clean: 10, dirty: 0 },
      large: { clean: 10, dirty: 0 }
    }
  },
  staff: {
    hired: [], // Danh sách nhân viên đã thuê
    candidates: [] // Ứng viên khả dụng
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


// Khởi tạo game & Tải dữ liệu lưu trữ
async function initGame() {
  UI.init();
  if (typeof initPhaserCustomerView === 'function') {
    initPhaserCustomerView();
  }
  
  // Tải dữ liệu từ Firebase / LocalStorage
  if (typeof FirebaseService !== 'undefined') {
    FirebaseService.init();
    const savedData = await FirebaseService.loadProgress();
    if (savedData) {
      if (typeof savedData.coins === 'number') GameState.coins = savedData.coins;
      if (typeof savedData.day === 'number') GameState.day = savedData.day;
      if (savedData.inventory) GameState.inventory = savedData.inventory;
      if (typeof savedData.attachedKegMl === 'number') GameState.attachedKegMl = savedData.attachedKegMl;
    }
  }
  
  bindEvents();
  UI.renderHomeData(GameState);
  UI.switchView('home');
}

function saveGameState() {
  if (typeof FirebaseService !== 'undefined') {
    FirebaseService.saveProgress(GameState);
  }
}

function bindEvents() {
  // Bắt sự kiện Bắt đầu ngày mới
  const startDayBtn = document.getElementById('start-day-btn');
  if (startDayBtn) {
    startDayBtn.addEventListener('click', startNewDayShift);
  }
  
  // --- SỰ KIỆN MỞ / ĐÓNG MODAL CỬA HÀNG & KHO ---
  const openShopBtn = document.getElementById('open-shop-btn');
  const openInvBtn = document.getElementById('open-inventory-btn');
  const closeShopBtn = document.getElementById('close-shop-btn');
  const closeInvBtn = document.getElementById('close-inv-btn');
  // Bổ sung vào hàm bindEvents():
  const openStaffBtn = document.getElementById('open-staff-btn');
  const closeStaffBtn = document.getElementById('close-staff-btn');
  if (openStaffBtn) openStaffBtn.addEventListener('click', () => {
    refreshCandidatesIfNeeded();
    UI.renderStaffLists(GameState.staff);
    UI.elements.staffModal.classList.remove('hidden');
  });
  if (closeStaffBtn) closeStaffBtn.addEventListener('click', () => UI.elements.staffModal.classList.add('hidden'));
  
  bindModalTabs('staff', ['hire', 'working']);
  
  if (openShopBtn) openShopBtn.addEventListener('click', () => UI.elements.shopModal.classList.remove('hidden'));
  if (openInvBtn) openInvBtn.addEventListener('click', () => UI.elements.invModal.classList.remove('hidden'));
  if (closeShopBtn) closeShopBtn.addEventListener('click', () => UI.elements.shopModal.classList.add('hidden'));
  if (closeInvBtn) closeInvBtn.addEventListener('click', () => UI.elements.invModal.classList.add('hidden'));
  
  // --- CHUYỂN TAB TRONG MODAL CỬA HÀNG ---
  bindModalTabs('shop', ['glass', 'beer', 'incoming']);
  
  // --- CHUYỂN TAB TRONG MODAL KHO ---
  bindModalTabs('inv', ['glass', 'beer']);
  
  // Bắt sự kiện mua sắm Cửa Hàng (Shop)
  const buyKegBtn = document.getElementById('buy-keg-btn');
  const buySmallBtn = document.getElementById('buy-small-glass-btn');
  const buyMediumBtn = document.getElementById('buy-medium-glass-btn');
  const buyLargeBtn = document.getElementById('buy-large-glass-btn');
  
  if (buyKegBtn) buyKegBtn.addEventListener('click', handleBuyKeg);
  if (buySmallBtn) buySmallBtn.addEventListener('click', () => handleBuyGlass('small'));
  if (buyMediumBtn) buyMediumBtn.addEventListener('click', () => handleBuyGlass('medium'));
  if (buyLargeBtn) buyLargeBtn.addEventListener('click', () => handleBuyGlass('large'));
  
  // Nút Thay Bom Bia trong game
  const changeKegBtn = document.getElementById('change-keg-btn');
  if (changeKegBtn) changeKegBtn.addEventListener('click', handleChangeKeg);
  
  // Bắt sự kiện quay về trang chủ khi hết giờ & Lưu tiến trình qua ngày
  UI.bindNextDayEvent(() => {
    GameState.day += 1;
    saveGameState();
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
  
  UI.bindPourEvents(startPouring, stopPouring);
  window.addEventListener('pointercancel', stopPouring);
  window.addEventListener('pointerup', stopPouring);
}

// HÀM BỔ SUNG ĐỂ CHUYỂN TAB TRONG MODALS (Thêm vào bên dưới hàm bindEvents)
function bindModalTabs(prefix, tabs) {
  tabs.forEach(tab => {
    const btn = document.getElementById(`${prefix}-tab-btn-${tab}`);
    if (btn) {
      btn.addEventListener('click', () => {
        tabs.forEach(t => {
          const tBtn = document.getElementById(`${prefix}-tab-btn-${t}`);
          const tContent = document.getElementById(`${prefix}-tab-${t}`);
          if (t === tab) {
            if (tBtn) tBtn.classList.add('active');
            if (tContent) tContent.classList.remove('hidden');
          } else {
            if (tBtn) tBtn.classList.remove('active');
            if (tContent) tContent.classList.add('hidden');
          }
        });
      });
    }
  });
}


// XỬ LÝ MUA BẮT ĐẦU
function handleBuyKeg() {
  const price = GameConfig.KEG_PRICE;
  if (GameState.coins < price) {
    alert("⚠️ Bạn không đủ Coin để mua Bom Bia!");
    return;
  }
  GameState.coins -= price;
  GameState.inventory.kegs += 1;
  saveGameState();
  UI.renderHomeData(GameState);
}

function handleBuyGlass(type) {
  const price = GameConfig.GLASS_PACK_PRICES[type];
  const packQty = GameConfig.GLASS_PACK_QTY;
  if (!price) return;
  
  if (GameState.coins < price) {
    alert("⚠️ Bạn không đủ Coin để mua gói ly này!");
    return;
  }
  
  GameState.coins -= price;
  GameState.inventory.glasses[type].clean += packQty;
  saveGameState();
  UI.renderHomeData(GameState);
}

function handleChangeKeg() {
  if (GameState.inventory.kegs <= 0) {
    UI.renderStatus("⚠️ Hết bom bia trong kho! Hãy về Trang chủ để mua thêm.", "#f44336");
    return;
  }
  if (GameState.isChangingKeg) return;
  
  GameState.isChangingKeg = true;
  UI.renderStatus("⏳ Đang thay bom bia mới (3s)...", "#2196f3");
  
  setTimeout(() => {
    GameState.inventory.kegs -= 1;
    GameState.attachedKegMl = GameConfig.KEG_VOLUME_ML;
    GameState.isChangingKeg = false;
    
    saveGameState();
    UI.renderInventory(GameState.inventory, GameState.attachedKegMl);
    UI.renderHomeData(GameState);
    UI.renderStatus("✅ Đã thay bom bia mới thành công!", "#4caf50");
  }, 3000);
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

function startPouring(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (GameState.isPouring || !GameState.currentOrder) return;
  
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

function stopPouring(e) {
  if (e) e.preventDefault();
  if (!GameState.isPouring) return;
  
  GameState.isPouring = false;
  if (GameState.pourTimer) {
    clearInterval(GameState.pourTimer);
    GameState.pourTimer = null;
  }
  
  UI.setPouringState(false);
  UI.togglePourActionButtons('poured');
  UI.renderStatus("Đã hãm vòi! Bấm 'Ra Bia' hoặc 'Đổ Bỏ'.", "#ffca28");
}

document.addEventListener('DOMContentLoaded', initGame);

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
    runStaffAutomation()
    if (GameState.hour >= GameConfig.END_HOUR) {
      closePubForNight();
    } else {
      handleCustomerSpawning();
    }
  }, GameConfig.TIME_SCALE_MS);
  
  if (GameState.patienceTimer) clearInterval(GameState.patienceTimer);
  GameState.patienceTimer = setInterval(handlePatienceTick, 200);
  
}

function handleCustomerSpawning() {
  if (!GameState.isOpen || GameState.hour >= GameConfig.END_HOUR) return;
  
  const isPeak = GameLogic.isPeakHour(GameState.hour);
  const maxQueue = isPeak ? 4 : 2;
  const spawnChance = isPeak ? 0.6 : 0.25;
  
  const totalCustomers = (GameState.currentOrder ? 1 : 0) + GameState.customerQueue.length;
  
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
  // Thêm đoạn này vào cuối hàm closePubForNight() trong main.js:
  let totalWages = 0;
  GameState.staff.hired.forEach(e => totalWages += e.wagePerDay);
  
  if (totalWages > 0) {
    GameState.coins -= totalWages;
    saveGameState();
    UI.renderMoney(GameLogic.formatCurrency(GameState.coins));
    UI.renderStatus(`🌙 Đã trừ ${totalWages} Coin tiền lương nhân viên hôm nay!`, "#ff9800");
  }
  
}

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
  UI.toggleGlassWrapper(true);
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
  
  saveGameState(); // Lưu dữ liệu sau mỗi đơn bia thành công
  
  UI.renderMoney(GameLogic.formatCurrency(GameState.coins));
  UI.renderInventory(GameState.inventory, GameState.attachedKegMl);
  UI.renderStatus(result.statusText, result.statusColor);
  
  resetPourState();
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
  
  saveGameState();
  
  UI.renderInventory(GameState.inventory, GameState.attachedKegMl);
  UI.renderStatus("Đã đổ bỏ ly bia hỏng!", "#f44336");
  
  resetPourState();
  UI.switchTab('glass');
}

function resetPourState() {
  GameState.selectedGlassType = null;
  GameState.currentLevel = 0;
  UI.renderBeerLevel(0);
  UI.setPouringState(false);
  UI.togglePourActionButtons('ready');
  UI.toggleGlassWrapper(false);
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
      
      saveGameState();
      UI.renderInventory(GameState.inventory, GameState.attachedKegMl);
      UI.renderStatus("Đã rửa sạch toàn bộ ly!", "#4caf50");
    }
  }, 1000);
}

function refreshCandidatesIfNeeded() {
  if (!GameState.staff.candidates || GameState.staff.candidates.length === 0) {
    GameState.staff.candidates = [
      GameLogic.generateRandomCandidate(),
      GameLogic.generateRandomCandidate(),
      GameLogic.generateRandomCandidate()
    ];
  }
}

window.handleHireStaff = function(index) {
  const candidate = GameState.staff.candidates[index];
  if (!candidate) return;
  
  GameState.staff.hired.push(candidate);
  GameState.staff.candidates.splice(index, 1);
  
  saveGameState();
  UI.renderStaffLists(GameState.staff);
  UI.renderStatus(`Đã tuyển ${candidate.name} làm ${candidate.roleName}!`, "#4caf50");
};

window.handleFireStaff = function(index) {
  const emp = GameState.staff.hired[index];
  if (!emp) return;
  
  GameState.staff.hired.splice(index, 1);
  saveGameState();
  UI.renderStaffLists(GameState.staff);
  UI.renderStatus(`Đã sa thải ${emp.name}.`, "#f44336");
};

function runStaffAutomation() {
  if (!GameState.isOpen) return;
  
  const hasWaiter = GameState.staff.hired.some(e => e.role === 'waiter');
  const hasBartender = GameState.staff.hired.some(e => e.role === 'bartender');
  const hasCleaner = GameState.staff.hired.some(e => e.role === 'cleaner');
  
  // 1. TẠP VỤ: Auto rửa ly khi ly dơ trong bồn > 8 ly
  const totalDirty = GameState.inventory.glasses.small.dirty +
    GameState.inventory.glasses.medium.dirty +
    GameState.inventory.glasses.large.dirty;
  
  if (hasCleaner && totalDirty > 8 && !GameState.isWashing) {
    handleWashGlassesInstant();
  }
  
  // 2. PHỤC VỤ: Auto lấy ly sạch đúng theo đơn order của khách
  if (hasWaiter && GameState.currentOrder && !GameState.selectedGlassType) {
    const requiredGlassKey = GameState.currentOrder.glass.id;
    if (GameState.inventory.glasses[requiredGlassKey].clean > 0) {
      handleSelectGlass(requiredGlassKey);
    }
  }
  
  // 3. BARTENDER: Auto rót chuẩn & ra bia ngay sau khi đã có ly
  if (hasBartender && GameState.currentOrder && GameState.selectedGlassType && !GameState.isPouring) {
    if (GameState.attachedKegMl >= GameState.currentOrder.glass.capacityMl) {
      // Rót bia đạt độ chuẩn 90% (nằm đúng Vùng Vàng)
      GameState.currentLevel = (GameState.currentOrder.targetMin + GameState.currentOrder.targetMax) / 2;
      handleServeBeer();
    }
  }
}

// Hàm hỗ trợ rửa ly tức thì cho Tạp Vụ:
function handleWashGlassesInstant() {
  Object.keys(GameState.inventory.glasses).forEach(k => {
    GameState.inventory.glasses[k].clean += GameState.inventory.glasses[k].dirty;
    GameState.inventory.glasses[k].dirty = 0;
  });
  saveGameState();
  UI.renderInventory(GameState.inventory, GameState.attachedKegMl);
  UI.renderStatus("⚡ Tạp vụ đã tự động rửa sạch toàn bộ ly!", "#2196f3");
}