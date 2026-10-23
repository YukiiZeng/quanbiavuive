// ui.js - Quản lý View & Đồng Bộ HUD Mới

const UI = {
  elements: {},
  
  init() {
    this.elements = {
      moneyDisplay: document.getElementById('money-display'),
      statusDisplay: document.getElementById('status-display'),
      beerLiquid: document.getElementById('beer-liquid'),
      pourBtn: document.getElementById('pour-btn'),
      stageSection: document.getElementById('stage-section'),
      
      // Đơn & HUD
      customerName: document.getElementById('customer-name'),
      glassTag: document.getElementById('glass-tag'),
      orderDesc: document.getElementById('order-desc'),
      glassContainer: document.getElementById('glass-container'),
      targetZone: document.getElementById('target-zone'),
      dayDisplay: document.getElementById('day-display'),
      timeDisplay: document.getElementById('time-display'),
      queueBadge: document.getElementById('queue-badge'),
      patienceBar: document.getElementById('patience-bar'),
      nightOverlay: document.getElementById('night-overlay'),
      nextDayBtn: document.getElementById('next-day-btn'),
      
      homeView: document.getElementById('home-view'),
      gameView: document.getElementById('game-view'),
      homeCoins: document.getElementById('home-coins'),
      homeDay: document.getElementById('home-day'),
      
      // MODALS & BUTTONS
      shopModal: document.getElementById('shop-modal'),
      invModal: document.getElementById('inventory-modal'),
      
      shopSmallCount: document.getElementById('shop-small-glass-count'),
      shopMediumCount: document.getElementById('shop-medium-glass-count'),
      shopLargeCount: document.getElementById('shop-large-glass-count'),
      shopKegCount: document.getElementById('shop-keg-count'),
      
      invSmallCount: document.getElementById('inv-small-glass-count'),
      invMediumCount: document.getElementById('inv-medium-glass-count'),
      invLargeCount: document.getElementById('inv-large-glass-count'),
      invKegCount: document.getElementById('inv-keg-count'),
      invKegMl: document.getElementById('inv-keg-ml'),
      
      cleanSmallCount: document.getElementById('clean-small-count'),
      cleanMediumCount: document.getElementById('clean-medium-count'),
      cleanLargeCount: document.getElementById('clean-large-count'),
      dirtySmallCount: document.getElementById('dirty-small-count'),
      dirtyMediumCount: document.getElementById('dirty-medium-count'),
      dirtyLargeCount: document.getElementById('dirty-large-count'),
      dirtyTotalBadge: document.getElementById('dirty-total-badge'),
      
      liveKegMl: document.getElementById('live-keg-ml'),
      changeKegBtn: document.getElementById('change-keg-btn'),
      postPourActions: document.getElementById('post-pour-actions'),
      
      washBtn: document.getElementById('wash-btn'),
      washProgressBar: document.getElementById('wash-progress-bar'),
      washProgressFill: document.getElementById('wash-progress-fill'),
      // Thêm vào trong UI.elements trong hàm init():
      staffModal: document.getElementById('staff-modal'),
      openStaffBtn: document.getElementById('open-staff-btn'),
      closeStaffBtn: document.getElementById('close-staff-btn'),
      candidatesList: document.getElementById('candidates-list'),
      hiredStaffList: document.getElementById('hired-staff-list'),
      staffCountBadge: document.getElementById('staff-count-badge'),
      
    };
  },
  
  
  renderOrder(order) {
    if (!order) {
      if (this.elements.customerName) this.elements.customerName.innerText = "👤 Đang chờ...";
      if (this.elements.glassTag) this.elements.glassTag.innerText = "🍺 --";
      if (this.elements.orderDesc) this.elements.orderDesc.innerText = "Chưa có đơn mới";
      if (this.elements.targetZone) {
        this.elements.targetZone.style.bottom = "0%";
        this.elements.targetZone.style.height = "0%";
      }
      this.renderBeerLevel(0);
      return;
    }
    
    if (this.elements.customerName) this.elements.customerName.innerText = `👤 ${order.customerName}`;
    if (this.elements.glassTag) this.elements.glassTag.innerText = `🍺 ${order.glass.name}`;
    if (this.elements.orderDesc) this.elements.orderDesc.innerText = order.description;
    
    if (this.elements.glassContainer) {
      this.elements.glassContainer.className = `glass-container ${order.glass.class}`;
    }
    
    if (this.elements.targetZone) {
      this.elements.targetZone.style.bottom = `${order.targetMin}%`;
      this.elements.targetZone.style.height = `${order.targetMax - order.targetMin}%`;
    }
    
    this.renderBeerLevel(0);
    this.triggerPhaserUpdate();
  },
  
  // SỬA HÀM NÀY TRONG ui.js (Tắt/bật tia bia triệt để)
  setPouringState(isPouring) {
    const stageSection = this.elements.stageSection || document.getElementById('stage-section');
    const tapMachine = document.getElementById('tap-machine');
    
    if (isPouring) {
      if (stageSection) stageSection.classList.add('pouring');
      if (tapMachine) tapMachine.classList.add('pouring');
    } else {
      if (stageSection) stageSection.classList.remove('pouring');
      if (tapMachine) tapMachine.classList.remove('pouring');
    }
  },
  
  // BỔ SUNG HÀM NÀY VÀO ui.js (Ẩn/Hiện ly bia trong vòi)
  toggleGlassWrapper(show) {
    const glassWrapper = document.getElementById('glass-wrapper');
    if (glassWrapper) {
      if (show) {
        glassWrapper.classList.remove('hidden');
      } else {
        glassWrapper.classList.add('hidden');
      }
    }
  },
  
  // BỔ SUNG HÀM NÀY VÀO TRONG ĐỐI TƯỢNG UI Ở FILE ui.js
  setupPourGlassView(glassTypeKey, order) {
    const glass = GlassTypes[glassTypeKey];
    if (this.elements.glassContainer && glass) {
      this.elements.glassContainer.className = `glass-container ${glass.class}`;
    }
    if (this.elements.targetZone && order) {
      this.elements.targetZone.style.bottom = `${order.targetMin}%`;
      this.elements.targetZone.style.height = `${order.targetMax - order.targetMin}%`;
    }
    this.renderBeerLevel(0);
  },
  
  renderMoney(moneyText) {
    if (this.elements.moneyDisplay) {
      this.elements.moneyDisplay.innerText = moneyText;
    }
  },
  
  renderBeerLevel(percent) {
    if (this.elements.beerLiquid) {
      this.elements.beerLiquid.style.height = `${percent}%`;
    }
  },
  
  renderStatus(text, color = "#ffc107") {
    if (this.elements.statusDisplay) {
      this.elements.statusDisplay.innerText = text;
      this.elements.statusDisplay.style.color = color;
    }
  },
  
  bindPourEvents(onStart, onStop) {
    if (!this.elements.pourBtn) return;
    this.elements.pourBtn.addEventListener('pointerdown', onStart);
    window.addEventListener('pointerup', onStop);
  },
  
  renderClock(day, hour, minute) {
    if (this.elements.dayDisplay) this.elements.dayDisplay.innerText = `Ngày ${day}`;
    if (this.elements.timeDisplay) this.elements.timeDisplay.innerText = GameLogic.formatTime(hour, minute);
  },
  
  renderQueue(count) {
    if (this.elements.queueBadge) {
      this.elements.queueBadge.innerText = count;
      this.elements.queueBadge.style.display = count > 0 ? 'inline-block' : 'none';
    }
    this.triggerPhaserUpdate();
  },
  
  renderPatience(percent) {
    if (this.elements.patienceBar) {
      this.elements.patienceBar.style.width = `${percent}%`;
      if (percent > 50) this.elements.patienceBar.style.backgroundColor = '#4caf50';
      else if (percent > 20) this.elements.patienceBar.style.backgroundColor = '#ff9800';
      else this.elements.patienceBar.style.backgroundColor = '#f44336';
    }
  },
  
  toggleNightOverlay(show) {
    if (this.elements.nightOverlay) {
      if (show) this.elements.nightOverlay.classList.remove('hidden');
      else this.elements.nightOverlay.classList.add('hidden');
    }
  },
  
  bindNextDayEvent(onNextDay) {
    if (this.elements.nextDayBtn) {
      this.elements.nextDayBtn.addEventListener('click', onNextDay);
    }
  },
  
  triggerPhaserUpdate() {
    if (window.PhaserCustomerView && typeof GameState !== 'undefined') {
      window.PhaserCustomerView.updateRender(GameState.currentOrder, GameState.customerQueue);
    }
  },
  // Bổ sung vào đối tượng UI:
  switchView(viewName) {
    if (viewName === 'home') {
      this.elements.homeView.classList.remove('hidden');
      this.elements.gameView.classList.add('hidden');
    } else {
      this.elements.homeView.classList.add('hidden');
      this.elements.gameView.classList.remove('hidden');
    }
  },
  
  switchTab(tabName) {
    ['glass', 'pour', 'sink'].forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      const content = document.getElementById(`tab-${t}-content`);
      if (t === tabName) {
        if (btn) btn.classList.add('active');
        if (content) content.classList.remove('hidden');
      } else {
        if (btn) btn.classList.remove('active');
        if (content) content.classList.add('hidden');
      }
    });
  },
  
  renderInventory(inventory, attachedKegMl) {
    if (this.elements.cleanSmallCount) this.elements.cleanSmallCount.innerText = inventory.glasses.small.clean;
    if (this.elements.cleanMediumCount) this.elements.cleanMediumCount.innerText = inventory.glasses.medium.clean;
    if (this.elements.cleanLargeCount) this.elements.cleanLargeCount.innerText = inventory.glasses.large.clean;
    
    if (this.elements.dirtySmallCount) this.elements.dirtySmallCount.innerText = inventory.glasses.small.dirty;
    if (this.elements.dirtyMediumCount) this.elements.dirtyMediumCount.innerText = inventory.glasses.medium.dirty;
    if (this.elements.dirtyLargeCount) this.elements.dirtyLargeCount.innerText = inventory.glasses.large.dirty;
    
    const totalDirty = inventory.glasses.small.dirty + inventory.glasses.medium.dirty + inventory.glasses.large.dirty;
    if (this.elements.dirtyTotalBadge) this.elements.dirtyTotalBadge.innerText = totalDirty;
    if (this.elements.liveKegMl) this.elements.liveKegMl.innerText = attachedKegMl;
  },
  
  togglePourActionButtons(mode) {
    // mode = 'ready' (Nút Rót) / 'poured' (Nút Ra Bia & Đổ Bỏ)
    if (mode === 'poured') {
      this.elements.pourBtn.classList.add('hidden');
      this.elements.postPourActions.classList.remove('hidden');
    } else {
      this.elements.pourBtn.classList.remove('hidden');
      this.elements.postPourActions.classList.add('hidden');
    }
  },
  // BỔ SUNG VÀO CUỐI ĐỐI TƯỢNG UI TRONG ui.js
  renderHomeData(state) {
    if (this.elements.homeCoins) this.elements.homeCoins.innerText = state.coins;
    if (this.elements.homeDay) this.elements.homeDay.innerText = `Ngày ${state.day}`;
    
    // Render Modal Cửa Hàng
    if (this.elements.shopKegCount) this.elements.shopKegCount.innerText = state.inventory.kegs;
    if (this.elements.shopSmallCount) this.elements.shopSmallCount.innerText = state.inventory.glasses.small.clean + state.inventory.glasses.small.dirty;
    if (this.elements.shopMediumCount) this.elements.shopMediumCount.innerText = state.inventory.glasses.medium.clean + state.inventory.glasses.medium.dirty;
    if (this.elements.shopLargeCount) this.elements.shopLargeCount.innerText = state.inventory.glasses.large.clean + state.inventory.glasses.large.dirty;
    
    // Render Modal Kho Hàng
    if (this.elements.invKegCount) this.elements.invKegCount.innerText = state.inventory.kegs;
    if (this.elements.invKegMl) this.elements.invKegMl.innerText = state.attachedKegMl;
    if (this.elements.invSmallCount) this.elements.invSmallCount.innerText = state.inventory.glasses.small.clean + state.inventory.glasses.small.dirty;
    if (this.elements.invMediumCount) this.elements.invMediumCount.innerText = state.inventory.glasses.medium.clean + state.inventory.glasses.medium.dirty;
    if (this.elements.invLargeCount) this.elements.invLargeCount.innerText = state.inventory.glasses.large.clean + state.inventory.glasses.large.dirty;
  },
  
  
  renderOrderInfo(order) {
    this.renderOrder(order);
  },
  // Bổ sung vào cuối đối tượng UI:
  renderStaffLists(staffData, onHire, onFire) {
    if (this.elements.staffCountBadge) {
      this.elements.staffCountBadge.innerText = staffData.hired.length;
    }
    
    // Render danh sách Ứng viên tuyển dụng
    if (this.elements.candidatesList) {
      if (staffData.candidates.length === 0) {
        this.elements.candidatesList.innerHTML = `<div class="incoming-notice">Hiện chưa có ứng viên mới!</div>`;
      } else {
        this.elements.candidatesList.innerHTML = staffData.candidates.map((c, index) => `
          <div class="staff-card">
            <div class="staff-info-header">
              <span class="staff-name">👤 ${c.name} (${c.gender}, ${c.age}t)</span>
              <span class="staff-role-badge">${c.roleName}</span>
            </div>
            <div class="staff-sub-info">
              <span> Lương: <b>${c.wagePerDay} Coin/ngày</b> (${c.wagePerHour}c/h)</span>
            </div>
            <div class="staff-action-row">
              <span style="font-size:0.7rem; color:#757575;">Thể lực: ${c.stamina}/${c.maxStamina}</span>
              <button class="hire-btn" onclick="handleHireStaff(${index})">Tuyển Dụng</button>
            </div>
          </div>
        `).join('');
      }
    }
    
    // Render danh sách Nhân viên đang làm
    if (this.elements.hiredStaffList) {
      if (staffData.hired.length === 0) {
        this.elements.hiredStaffList.innerHTML = `<div class="incoming-notice">Chưa tuyển nhân viên nào.</div>`;
      } else {
        this.elements.hiredStaffList.innerHTML = staffData.hired.map((h, index) => `
          <div class="staff-card">
            <div class="staff-info-header">
              <span class="staff-name">👤 ${h.name} (${h.gender}, ${h.age}t)</span>
              <span class="staff-role-badge">${h.roleName}</span>
            </div>
            <div class="staff-sub-info">
              <span>Lương: <b>${h.wagePerDay} Coin/ngày</b></span>
              <button class="fire-btn" onclick="handleFireStaff(${index})">Sa Thải</button>
            </div>
            <div style="font-size:0.7rem; color:#616161;">Tình trạng thể lực (${h.stamina}%):</div>
            <div class="stamina-bar-container">
              <div class="stamina-bar-fill" style="width: ${h.stamina}%;"></div>
            </div>
          </div>
        `).join('');
      }
    }
  },
};