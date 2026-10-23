// logic.js - Thuật toán tạo Đơn Khách & Tính Thưởng Coin

// Thay thế đoạn khai báo GameConfig và GlassTypes cũ bằng đoạn này:
const GameConfig = {
  BASE_REWARD: 8,
  START_HOUR: 15,
  END_HOUR: 24,
  TIME_SCALE_MS: 1500,
  KEG_VOLUME_ML: 19000,
  KEG_PRICE: 200, // Cập nhật giá bom bia = 200 Coin
  KEG_EXPRESS_FEE: 20,
  GLASS_PACK_QTY: 5,
  GLASS_PACK_PRICES: { small: 15, medium: 20, large: 30 }
};

const GlassTypes = {
  small: { id: 'small', name: 'Ly Nhỏ', capacityMl: 250, price: 15, class: 'glass-small', speedMultiplier: 1.35 },
  medium: { id: 'medium', name: 'Ly Vừa', capacityMl: 300, price: 25, class: 'glass-medium', speedMultiplier: 1.0 },
  large: { id: 'large', name: 'Ly Lớn', capacityMl: 500, price: 35, class: 'glass-large', speedMultiplier: 0.75 }
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
  // Thay thế hàm calculatePourResult trong GameLogic:
  calculatePourResult(level, order) {
    let earned = 0;
    let statusText = "";
    let statusColor = "";
    const basePrice = order.glass.price || 15; // Lấy giá ly bia (15, 25, 35 coin)
    
    if (level >= order.targetMin && level <= order.targetMax) {
      earned = basePrice;
      statusText = `Hoàn hảo! Khách thưởng full ${earned} Coin!`;
      statusColor = "#4caf50";
    }
    else if (level < order.targetMin) {
      let ratio = level / order.targetMin;
      earned = Math.floor(basePrice * ratio * 0.5);
      statusText = `Bia bị thiếu! Khách trả ${earned} Coin...`;
      statusColor = "#ff9800";
    }
    else {
      earned = Math.floor(basePrice * 0.2); // Tràn bia chỉ nhận 20% giá
      statusText = `Tràn bọt bia! Khách càu nhàu (+${earned} Coin)`;
      statusColor = "#f44336";
    }
    
    return { earned, statusText, statusColor };
  },
  
  formatCurrency(amount) {
    return `${amount} Coin`;
  },
  
  // Bổ sung vào bên trong đối tượng GameLogic:
  calculatePouredVolumeMl(glassTypeKey, pourPercent) {
    const glass = GlassTypes[glassTypeKey];
    if (!glass) return 0;
    return Math.round((glass.capacityMl * pourPercent) / 100);
  },
  // Bổ sung vào cuối GameLogic:
  StaffRoles: {
    waiter: { id: 'waiter', name: 'Phục Vụ', wagePerHour: 12, wagePerDay: 108, icon: '🏃' },
    bartender: { id: 'bartender', name: 'Bartender', wagePerHour: 16, wagePerDay: 144, icon: '🍺' },
    cleaner: { id: 'cleaner', name: 'Tạp Vụ', wagePerHour: 10, wagePerDay: 90, icon: '🧽' }
  },
  
  generateRandomCandidate() {
    const namesMale = ["Minh", "Tùng", "Cường", "Huy", "Thành", "Đạt", "Nam", "Phúc"];
    const namesFemale = ["Hoa", "Linh", "Trang", "Nhi", "Vy", "Mai", "Thảo", "Hà"];
    const isMale = Math.random() > 0.5;
    const gender = isMale ? "Nam" : "Nữ";
    const nameList = isMale ? namesMale : namesFemale;
    const randomName = nameList[Math.floor(Math.random() * nameList.length)];
    const age = Math.floor(Math.random() * 11) + 18; // 18 - 28 tuổi
    
    const roles = Object.keys(this.StaffRoles);
    const roleKey = roles[Math.floor(Math.random() * roles.length)];
    const roleInfo = this.StaffRoles[roleKey];
    
    return {
      id: 'emp_' + Math.random().toString(36).substring(2, 9),
      name: `${randomName}`,
      age: age,
      gender: gender,
      role: roleKey,
      roleName: roleInfo.name,
      wagePerHour: roleInfo.wagePerHour,
      wagePerDay: roleInfo.wagePerDay,
      stamina: 100, // Giá trị hiện tại (cố định 100)
      maxStamina: 100, // Giá trị tối đa
      status: 'working' // Chuẩn bị sẵn quy tắc trạng thái sau này
    };
  }
  
};