// firebase.js - Quản lý kết nối Firebase Realtime Database

const firebaseConfig = {
  apiKey: "AIzaSyA91SSj3uTi8_xFLuZIgG9n0HUj6of0Bkg",
  authDomain: "beerpub-b1ed5.firebaseapp.com",
  databaseURL: "https://beerpub-b1ed5-default-rtdb.asia-southeast1.firebasedatabase.app", // Thêm dòng này
  projectId: "beerpub-b1ed5",
  storageBucket: "beerpub-b1ed5.firebasestorage.app",
  messagingSenderId: "899418614749",
  appId: "1:899418614749:web:30eba8e9fecfc648a76434",
  measurementId: "G-CXY5CSMZSM"
};


const FirebaseService = {
  db: null,
  playerId: null,

  init() {
    // Khởi tạo ứng dụng Firebase nếu chưa khởi tạo
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    this.db = firebase.database();
    this.playerId = this.getOrCreatePlayerId();
  },

  // Tạo ID định danh duy nhất cho từng trình duyệt/thiết bị
  getOrCreatePlayerId() {
    let id = localStorage.getItem('beerpub_player_id');
    if (!id) {
      id = 'player_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('beerpub_player_id', id);
    }
    return id;
  },

  // Tải tiến trình lưu từ đám mây
  async loadProgress() {
    if (!this.db || !this.playerId) return null;
    try {
      const snapshot = await this.db.ref('players/' + this.playerId).once('value');
      if (snapshot.exists()) {
        return snapshot.val();
      }
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu từ Firebase:", error);
    }
    return null;
  },

  // Lưu điểm Coin lên đám mây
  saveProgress(coins) {
    if (!this.db || !this.playerId) return;
    this.db.ref('players/' + this.playerId).set({
      coins: coins,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    }).catch((error) => {
      console.error("Lỗi khi lưu dữ liệu lên Firebase:", error);
    });
  }
};
