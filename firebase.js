// firebase.js - Quản lý Firebase Auth & Realtime Database

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
  auth: null,

  init() {
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    if (typeof firebase !== 'undefined') {
      this.db = firebase.database();
      this.auth = firebase.auth();
    }
  },

  // Quy đổi tên đăng nhập thành Email chuẩn định dạng Firebase
  usernameToEmail(username) {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    return `${clean}@beerpub.app`;
  },

  // Đăng ký tài khoản
  async register(username, password) {
    const cleanUser = username.trim();
    if (cleanUser.length < 3) {
      throw new Error("Tên đăng nhập cần ít nhất 3 ký tự (không dấu/khoảng trắng).");
    }
    if (password.length < 6) {
      throw new Error("Mật khẩu phải từ 6 ký tự trở lên.");
    }

    const email = this.usernameToEmail(cleanUser);
    const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Kiểm tra xem có phải tài khoản Admin khởi tạo không
    const isAdmin = cleanUser.toLowerCase() === 'admin';
    const role = isAdmin ? 'admin' : 'player';

    // Dữ liệu khởi tạo ban đầu cho Account mới
    const initialData = {
      uid: user.uid,
      username: cleanUser,
      role: role,
      coins: 100,
      day: 1,
      inventory: {
        kegs: 1,
        glasses: {
          small: { clean: 10, dirty: 0 },
          medium: { clean: 10, dirty: 0 },
          large: { clean: 10, dirty: 0 }
        }
      },
      staff: { hired: [], candidates: [] },
      attachedKegMl: 19000,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    await this.db.ref('players/' + user.uid).set(initialData);
    return { user, data: initialData };
  },

  // Đăng nhập
  async login(username, password) {
    const email = this.usernameToEmail(username);
    const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
  },

  // Đăng xuất
  async logout() {
    if (this.auth) await this.auth.signOut();
  },

  // Theo dõi trạng thái Đăng nhập
  onAuthStateChanged(callback) {
    if (this.auth) {
      this.auth.onAuthStateChanged(callback);
    }
  },

  // Tải dữ liệu tiến trình từ Cloud
  async loadProgress(uid) {
    if (!this.db || !uid) return null;
    try {
      const snapshot = await this.db.ref('players/' + uid).once('value');
      if (snapshot.exists()) {
        return snapshot.val();
      }
    } catch (error) {
      console.error("Lỗi tải tiến trình từ Firebase:", error);
    }
    return null;
  },

  // Đồng bộ toàn bộ dữ liệu Game State lên Cloud
  saveProgress(state) {
    if (!state || !state.user || !state.user.uid || !this.db) return;

    const saveData = {
      uid: state.user.uid,
      username: state.user.username || 'Player',
      role: state.user.role || 'player',
      coins: state.coins,
      day: state.day,
      inventory: state.inventory,
      staff: state.staff || { hired: [], candidates: [] }, // BỔ SUNG QUAN TRỌNG: Lưu đầy đủ nhân viên!
      attachedKegMl: state.attachedKegMl,
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    this.db.ref('players/' + state.user.uid).set(saveData).catch((error) => {
      console.error("Lỗi khi đồng bộ dữ liệu lên Firebase:", error);
    });
  },

  // --- CÁC HÀM QUẢN TRỊ VIÊN (ADMIN) ---
  async getAllPlayers() {
    if (!this.db) return {};
    const snapshot = await this.db.ref('players').once('value');
    return snapshot.exists() ? snapshot.val() : {};
  },

  async deletePlayer(uid) {
    if (!this.db || !uid) return;
    await this.db.ref('players/' + uid).remove();
  },

  async updatePlayerCoins(uid, coins) {
    if (!this.db || !uid) return;
    await this.db.ref(`players/${uid}/coins`).set(coins);
  },
  // Đăng nhập / Đăng ký nhanh bằng Google
  async loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await this.auth.signInWithPopup(provider);
    const user = result.user;

    // Kiểm tra xem tài khoản Google này đã từng chơi chưa
    const snapshot = await this.db.ref('players/' + user.uid).once('value');
    if (!snapshot.exists()) {
      // Nếu là người chơi mới -> Khởi tạo dữ liệu
      const displayName = user.displayName || user.email.split('@')[0];
      const isAdmin = displayName.toLowerCase() === 'admin' || user.email === 'anh_admin@gmail.com'; // Anh có thể đổi email admin ở đây
      const initialData = {
        uid: user.uid,
        username: displayName,
        role: isAdmin ? 'admin' : 'player',
        coins: 100,
        day: 1,
        inventory: {
          kegs: 1,
          glasses: {
            small: { clean: 10, dirty: 0 },
            medium: { clean: 10, dirty: 0 },
            large: { clean: 10, dirty: 0 }
          }
        },
        staff: { hired: [], candidates: [] },
        attachedKegMl: 19000,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
      };
      await this.db.ref('players/' + user.uid).set(initialData);
      return { user, data: initialData };
    }
    return { user, data: snapshot.val() };
  },
};

