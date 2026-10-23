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
      nextDayBtn: document.getElementById('next-day-btn')
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
  
  setPouringState(isPouring) {
    if (!this.elements.stageSection) return;
    if (isPouring) {
      this.elements.stageSection.classList.add('pouring');
    } else {
      this.elements.stageSection.classList.remove('pouring');
    }
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
  }
};
