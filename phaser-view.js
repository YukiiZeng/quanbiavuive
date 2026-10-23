// phaser-view.js - Render Sảnh Khách Hàng (Tối ưu 100% với Geometry Mask ẨN)

class CustomerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CustomerScene' });
    this.currentOrderRef = null;
    this.lastQueueKey = '';
    this.maxChairs = 4;
  }

  preload() {
    this.load.image('lobby_bg', 'assets/bg/lobby.png');
    for (let i = 1; i <= 13; i++) {
      this.load.image(`npc_${i}`, `assets/npc/n${i}.png`);
    }
  }

  create() {
    this.queueGroup = this.add.group();
    this.activeCustomerGroup = this.add.group();

    window.PhaserCustomerView = this;

    // 1. VẼ NỀN (1 lớp duy nhất, không bị lỗi cắt vỡ ảnh)
    this.add.image(0, 0, 'lobby_bg')
      .setOrigin(0, 0)
      .setDisplaySize(720, 720)
      .setDepth(0);

    // 2. TẠO MẶT NẠ TÀNG HÌNH ĐỂ GIẤU CHÂN (Thêm setVisible(false))
    // Mask bàn chờ (Trái): Chốt mặt nạ ở chính xác mép bàn gỗ (Y = 350)
    const queueMaskShape = this.add.graphics().setVisible(false);
    queueMaskShape.fillStyle(0xffffff);
    queueMaskShape.fillRect(0, 0, 420, 345); // Đổi 395 thành 350
    this.queueMask = queueMaskShape.createGeometryMask();

    // Mask quầy bar (Phải): Chốt mặt nạ ở chính xác viền nẹp vàng (Y = 390)
        // Mask quầy bar (Phải): Hạ xuống đúng mép nẹp vàng (Y = 408)
    const orderMaskShape = this.add.graphics().setVisible(false);
    orderMaskShape.fillStyle(0xffffff);
    orderMaskShape.fillRect(420, 0, 300, 424); // Đổi 390 thành 408
    this.orderMask = orderMaskShape.createGeometryMask();



    if (typeof UI !== 'undefined' && UI.triggerPhaserUpdate) {
      UI.triggerPhaserUpdate();
    }
  }

  createNPCSprite(x, y, npcId, targetHeight = 150, isWaiting = false) {
    const key = `npc_${npcId || 1}`;
    const sprite = this.add.sprite(x, y, key);

    sprite.setOrigin(0.5, 1);
    sprite.setDepth(5); 

    if (sprite.height > 0) {
      const scale = targetHeight / sprite.height;
      sprite.setScale(scale);
    }

    if (isWaiting) {
      this.tweens.add({
        targets: sprite,
        y: y - 5,
        duration: 700 + Math.random() * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    return sprite;
  }

  drawSpeechBubble(x, y, order) {
    const bubble = this.add.container(x, y).setDepth(12);
    const g = this.add.graphics();

    const width = 200;
    const height = 70;
    const radius = 10;

    g.fillStyle(0xffffff, 0.95);
    g.lineStyle(3, 0xffb300, 1);
    g.fillRoundedRect(-width / 2, -height, width, height, radius);
    g.strokeRoundedRect(-width / 2, -height, width, height, radius);

    g.beginPath();
    g.moveTo(10, 0);
    g.lineTo(25, 16);
    g.lineTo(35, 0);
    g.closePath();
    g.fillPath();
    g.strokePath();

    const labelText = `🍺 ${order.glass.name}\n🎯 Rót: ${order.targetMin}% - ${order.targetMax}%`;
    const text = this.add.text(0, -height / 2, labelText, {
      fontFamily: 'sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#111827',
      align: 'center'
    }).setOrigin(0.5, 0.5);

    bubble.add([g, text]);

    this.tweens.add({
      targets: bubble,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    return bubble;
  }

  updateRender(currentOrder, customerQueue = []) {
    if (!this.activeCustomerGroup || !this.queueGroup) return;

    if (this.currentOrderRef !== currentOrder) {
      this.currentOrderRef = currentOrder;
      this.activeCustomerGroup.clear(true, true);

      if (currentOrder) {
        const customerX = 560;
         // Nâng vị trí đứng lên Y = 440
        const customerFeetY = 475;

        const activeCustomer = this.createNPCSprite(customerX, customerFeetY, currentOrder.npcId, 260, false);
        activeCustomer.setDepth(7);
        // Nhân vật bị cắt mượt ngay mặt bàn order
        activeCustomer.setMask(this.orderMask);

          // Giảm khoảng cách bóng thoại để không bị bay quá cao
        const bubble = this.drawSpeechBubble(customerX - 30, customerFeetY - 250, currentOrder);

        activeCustomer.x = 720;
        this.tweens.add({
          targets: activeCustomer,
          x: customerX,
          duration: 350,
          ease: 'Power2'
        });

        this.activeCustomerGroup.add(activeCustomer);
        this.activeCustomerGroup.add(bubble);
      }
    }

    const currentQueueKey = customerQueue.map(item => item.npcId).join('-');
    if (this.lastQueueKey !== currentQueueKey) {
      this.lastQueueKey = currentQueueKey;
      this.queueGroup.clear(true, true);

            const startX = 90;
      const spacing = 85;
      // Nâng vị trí ngồi/đứng lên Y = 390
      const chairSeatY = 390; 


      const visibleQueue = Math.min(customerQueue.length, this.maxChairs);

      for (let i = 0; i < visibleQueue; i++) {
        const xPos = startX + i * spacing;
        const orderInQueue = customerQueue[i];

        const queueCustomer = this.createNPCSprite(xPos, chairSeatY, orderInQueue.npcId, 160, true);
        // Khách chờ bị cắt mượt ngay mặt bàn chờ
        queueCustomer.setMask(this.queueMask);
        
        this.queueGroup.add(queueCustomer);
      }
    }
  }
}

const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-customer-container',
  width: 720,
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  resolution: Math.min(window.devicePixelRatio || 1, 2.5),
  transparent: true,
  physics: { default: 'arcade' },
  scene: [CustomerScene]
};

let phaserGame = null;

function initPhaserCustomerView() {
  phaserGame = new Phaser.Game(phaserConfig);
}
