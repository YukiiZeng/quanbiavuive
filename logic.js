// logic.js - Thuật toán tạo Đơn Khách & Tính Thưởng Coin

const GameConfig = {
  BASE_REWARD: 5,
  START_HOUR: 15, // Mở cửa 15h
  END_HOUR: 24, // Đóng cửa 24h
  TIME_SCALE_MS: 1500 // 1.5 giây thực = 10 phút trong game
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
  
  const targetMin = Math.floor(Math.random() * 3) * 10 + 60;
  const targetMax = targetMin + 10;
  
  const randomName = CustomerTitles[Math.floor(Math.random() * CustomerTitles.length)];
  const patienceMax = Math.floor(Math.random() * 4) + 10;

  // Gán ngẫu nhiên 1 trong 13 NPC ảnh cho đơn hàng này
  const npcId = Math.floor(Math.random() * 13) + 1;

  return {
    npcId: npcId, // ID ảnh NPC cố định cho đơn hàng
    customerName: randomName,
    glass: selectedGlass,
    targetMin: targetMin,
    targetMax: targetMax,
    patienceMax: patienceMax,
    patienceCurrent: patienceMax,
    description: `Muốn ${selectedGlass.name} - Rót chuẩn ${targetMin}% - ${targetMax}%`
  };
},

  // Thêm vào trong đối tượng GameLogic:
  isPeakHour(hour) {
    return hour >= 18 && hour < 21; // Cao điểm từ 18h - 21h
  },
  
  formatTime(hour, minute) {
    const hStr = hour < 10 ? `0${hour}` : `${hour}`;
    const mStr = minute < 10 ? `0${minute}` : `${minute}`;
    return `${hStr}:${mStr}`;
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