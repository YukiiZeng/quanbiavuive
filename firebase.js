// firebase.js - Quản lý kết nối Firebase Realtime Database & LocalStorage Backup

const firebaseConfig = {
  apiKey: "AIzaSyA91SSj3uTi8_xFLuZIgG9n0HUj6of0Bkg",
  authDomain: "beerpub-b1ed5.firebaseapp.com",
  databaseURL: "https://beerpub-b1ed5-default-rtdb.asia-southeast1.firebasedatabase.app",
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
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      this.db = firebase.database();
    }
    this.playerId = this.getOrCreatePlayerId();
  },

  getOrCreatePlayerId() {
    let id = localStorage.getItem('beerpub_player_id');
    if (!id) {
      id = 'player_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('beerpub_player_id', id);
    }
    return id;
  },

  async loadProgress() {
    let localData = null;
    try {
      const raw = localStorage.getItem('beerpub_save_data');
      if (raw) localData = JSON.parse(raw);
    } catch (e) {
      console.error("Lỗi đọc LocalStorage:", e);
    }

    if (!this.db || !this.playerId) return localData;

    try {
      const snapshot = await this.db.ref('players/' + this.playerId).once('value');
      if (snapshot.exists()) {
        const cloudData = snapshot.val();
        localStorage.setItem('beerpub_save_data', JSON.stringify(cloudData));
        return cloudData;
      }
    } catch (error) {
      console.error("Lỗi tải từ Firebase, chuyển sang dùng LocalStorage:", error);
    }
    return localData;
  },

  saveProgress(state) {
    if (!state) return;

    const saveData = {
      coins: state.coins,
      day: state.day,
      inventory: state.inventory,
      attachedKegMl: state.attachedKegMl,
      updatedAt: Date.now()
    };

    // 1. Lưu dự phòng tức thì vào LocalStorage
    try {
      localStorage.setItem('beerpub_save_data', JSON.stringify(saveData));
    } catch (e) {
      console.error("Lỗi lưu LocalStorage:", e);
    }

    // 2. Đồng bộ lên Firebase Realtime Database
    if (this.db && this.playerId) {
      this.db.ref('players/' + this.playerId).set({
        ...saveData,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      }).catch((error) => {
        console.error("Lỗi khi lưu dữ liệu lên Firebase:", error);
      });
    }
  }
};
