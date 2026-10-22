// ui.js - Quản lý View & Render Đơn Khách Hàng

const UI = {
  elements: {},

  init() {
    this.elements = {
      moneyDisplay: document.getElementById('money-display'),
      statusDisplay: document.getElementById('status-display'),
      beerLiquid: document.getElementById('beer-liquid'),
      pourBtn: document.getElementById('pour-btn'),
      stageSection: document.getElementById('stage-section'),
      
      // Thẻ khách & Khung ly
      customerName: document.getElementById('customer-name'),
      glassTag: document.getElementById('glass-tag'),
      orderDesc: document.getElementById('order-desc'),
      glassContainer: document.getElementById('glass-container'),
      targetZone: document.getElementById('target-zone')
    };
  },

  // Cập nhật Thẻ Đơn Khách Hàng, Loại Ly và Vùng Vàng
  renderOrder(order) {
    if (this.elements.customerName) this.elements.customerName.innerText = `👤 ${order.customerName}`;
    if (this.elements.glassTag) this.elements.glassTag.innerText = `🍺 ${order.glass.name}`;
    if (this.elements.orderDesc) this.elements.orderDesc.innerText = order.description;

    // Đổi Class kích thước ly (Small / Medium / Large)
    if (this.elements.glassContainer) {
      this.elements.glassContainer.className = `glass-container ${order.glass.class}`;
    }

    // Cập nhật vị trí & độ rộng Vùng Vàng
    if (this.elements.targetZone) {
      this.elements.targetZone.style.bottom = `${order.targetMin}%`;
      this.elements.targetZone.style.height = `${order.targetMax - order.targetMin}%`;
    }

    // Reset nước bia về 0
    this.renderBeerLevel(0);
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

  renderStatus(text, color = "#9eabbf") {
    if (this.elements.statusDisplay) {
      this.elements.statusDisplay.innerText = text;
      this.elements.statusDisplay.style.color = color;
    }
  },

  bindPourEvents(onStart, onStop) {
    if (!this.elements.pourBtn) return;
    this.elements.pourBtn.addEventListener('pointerdown', onStart);
    window.addEventListener('pointerup', onStop);
  }
};
