// logic.js - Thuật toán tạo Đơn Khách & Tính Thưởng Coin

const GameConfig = {
  BASE_REWARD: 5 // Thưởng 5 Coin cho ly bia hoàn hảo
};

// Khai báo 3 loại ly
const GlassTypes = {
  small: { id: 'small', name: 'Ly Nhỏ', class: 'glass-small', speedMultiplier: 1.35 },
  medium: { id: 'medium', name: 'Ly Vừa', class: 'glass-medium', speedMultiplier: 1.0 },
  large: { id: 'large', name: 'Ly Lớn', class: 'glass-large', speedMultiplier: 0.75 }
};

// Danh sách loại khách hàng ngẫu nhiên
const CustomerTitles = [
  "Khách Vội Vã", "Thánh Nhậu Đêm", "Khách Sành Bia", 
  "Dân Chơi Phố Bùi Viện", "Khách Khó Tính", "Chú Bảy Xóm Trên"
];

const GameLogic = {
  // Tạo ngẫu nhiên 1 Đơn Hàng từ khách
  generateOrder() {
    const keys = Object.keys(GlassTypes);
    const randomGlassKey = keys[Math.floor(Math.random() * keys.length)];
    const selectedGlass = GlassTypes[randomGlassKey];

    // Tạo Vùng Vàng ngẫu nhiên (ví dụ 65-75%, 75-85%, 80-90%)
    const targetMin = Math.floor(Math.random() * 3) * 10 + 60; // 60, 70, hoặc 80
    const targetMax = targetMin + 10;

    const randomName = CustomerTitles[Math.floor(Math.random() * CustomerTitles.length)];

    return {
      customerName: randomName,
      glass: selectedGlass,
      targetMin: targetMin,
      targetMax: targetMax,
      description: `Muốn ${selectedGlass.name} - Rót chuẩn ${targetMin}% - ${targetMax}%`
    };
  },

  // Tính số Coin nhận được dựa theo kết quả rót và Đơn của khách
  calculatePourResult(level, order) {
    let earned = 0;
    let statusText = "";
    let statusColor = "";

    if (level >= order.targetMin && level <= order.targetMax) {
      earned = GameConfig.BASE_REWARD;
      statusText = `Hoàn hảo! Khách thưởng full ${earned} Coin!`;
      statusColor = "#4caf50";
    } 
    else if (level < order.targetMin) {
      let ratio = level / order.targetMin;
      earned = Math.floor(GameConfig.BASE_REWARD * ratio * 0.4);
      statusText = `Bia bị thiếu! Khách trả ${earned} Coin...`;
      statusColor = "#ff9800";
    } 
    else {
      earned = 1; // Tràn bia phạt chỉ cho 1 Coin
      statusText = `Tràn bọt bia! Khách càu nhàu (+1 Coin)`;
      statusColor = "#f44336";
    }

    return { earned, statusText, statusColor };
  },

  formatCurrency(amount) {
    return `${amount} Coin`;
  }
};
