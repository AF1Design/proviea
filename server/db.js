import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

// Default initial state
const defaultData = {
  users: [],
  orders: [],
  corporateCodes: [
    { code: 'PROVIEA', name: 'عرض المعرض العام - Proviea', discount: 15, active: true },
    { code: 'PROVIEA15', name: 'عرض المعرض العام - Proviea', discount: 15, active: true },
    { code: 'CORP15', name: 'خصم الشركات والمؤسسات', discount: 15, active: true },
    { code: 'STAFF15', name: 'خصم موظفي الشركات', discount: 15, active: true },
    { code: 'PARTNER15', name: 'عرض الشركاء المعتمدين', discount: 15, active: true },
    { code: 'VIP15', name: 'كود العملاء المميزين VIP', discount: 15, active: true },
    { code: 'GASCO', name: 'شركة جاسكو', discount: 15, active: true },
    { code: 'GASCO15', name: 'شركة جاسكو', discount: 15, active: true },
    { code: 'ENPPI', name: 'شركة إنبي', discount: 15, active: true },
    { code: 'ENPPI15', name: 'شركة إنبي', discount: 15, active: true },
    { code: 'PETROBEL', name: 'شركة بتروبل', discount: 15, active: true },
    { code: 'PETROBEL15', name: 'شركة بتروبل', discount: 15, active: true },
    { code: 'BAPETCO', name: 'شركة بدر الدين', discount: 15, active: true },
    { code: 'BAPETCO15', name: 'شركة بدر الدين', discount: 15, active: true },
  ],
  nextOrderNumber: 10482
};

// Initialize file if not exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
}

export function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading data file, using default data:', err);
    return defaultData;
  }
}

export function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data:', err);
  }
}

export const db = {
  // Users / Leads
  findUserByPhone(phone) {
    const data = loadData();
    return data.users.find(u => u.phone === phone);
  },
  findUserById(id) {
    const data = loadData();
    return data.users.find(u => u.id === id);
  },
  createUser(userData) {
    const data = loadData();
    const isAdmin = userData.isAdmin || userData.role === 'admin' || userData.phone === '01000000000' || userData.phone === '01012345678';
    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: userData.name || '',
      phone: userData.phone,
      email: userData.email || '',
      role: isAdmin ? 'admin' : 'customer',
      isAdmin: isAdmin,
      otp: userData.otp || null,
      otpExpiresAt: userData.otpExpiresAt || null,
      isVerified: userData.isVerified || false,
      companyCode: userData.companyCode || '',
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    saveData(data);
    return newUser;
  },
  updateUser(id, updates) {
    const data = loadData();
    const idx = data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      data.users[idx] = { ...data.users[idx], ...updates, updatedAt: new Date().toISOString() };
      saveData(data);
      return data.users[idx];
    }
    return null;
  },
  getAllUsers() {
    const data = loadData();
    return data.users;
  },

  // Corporate Codes
  validateCode(rawCode) {
    if (!rawCode) return null;
    const clean = rawCode.trim().toUpperCase();
    const data = loadData();
    const found = data.corporateCodes.find(c => c.code.toUpperCase() === clean && c.active);
    return found || { code: clean, name: `كود ${clean}`, discount: 15, active: true };
  },
  getAllCodes() {
    const data = loadData();
    return data.corporateCodes;
  },

  // Orders
  createOrder(orderData) {
    const data = loadData();
    const orderNum = data.nextOrderNumber || 10482;
    data.nextOrderNumber = orderNum + 1;

    const orderId = `PRV-${orderNum}`;
    const newOrder = {
      id: orderId,
      orderNumber: orderNum,
      userId: orderData.userId || null,
      name: orderData.name,
      phone: orderData.phone,
      email: orderData.email || '',
      companyCode: orderData.companyCode || 'PROVIEA15',
      companyName: orderData.companyName || 'عرض خاص',
      discountPct: orderData.discountPct || 15,
      childGender: orderData.childGender || 'غير محدد',
      schoolStage: orderData.schoolStage || 'غير محدد',
      budgetTier: orderData.budgetTier || 'متوسطة',
      budgetTierLabel: orderData.budgetTierLabel || '⚖️ متوسطة',
      deliveryType: orderData.deliveryType || 'توصيل للمنزل',
      address: orderData.address || '',
      city: orderData.city || 'القاهرة / الجيزة',
      extraNotes: orderData.extraNotes || '',
      images: orderData.images || [], // [{ path, originalname, note }]
      files: orderData.files || [],   // [{ path, originalname }]
      status: 'new', // new, reviewing, contacted, preparing, completed, cancelled
      statusLabel: 'تم استلام الطلب',
      statusHistory: [
        { status: 'new', label: 'تم استلام الطلب وجاري المراجعة', timestamp: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.orders.unshift(newOrder); // newest first
    saveData(data);
    return newOrder;
  },
  getOrderById(id) {
    const data = loadData();
    return data.orders.find(o => o.id === id || o.id === `PRV-${id}`);
  },
  getOrdersByUserPhone(phone) {
    const data = loadData();
    return data.orders.filter(o => o.phone === phone);
  },
  getAllOrders() {
    const data = loadData();
    return data.orders;
  },
  updateOrder(orderId, updates) {
    const data = loadData();
    const idx = data.orders.findIndex(o => o.id === orderId || o.id === `PRV-${orderId}`);
    if (idx !== -1) {
      data.orders[idx] = {
        ...data.orders[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveData(data);
      return data.orders[idx];
    }
    return null;
  },
  updateOrderStatus(orderId, newStatus, note = '') {
    const data = loadData();
    const idx = data.orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      const statusLabels = {
        'new': 'تم استلام الطلب',
        'reviewing': 'قيد مراجعة الأسعار والتوافر',
        'contacted': 'تم التواصل مع العميل عبر الواتساب',
        'preparing': 'جاري تجهيز وتغليف الطلب',
        'delivering': 'الطلب مع مندوب التوصيل',
        'completed': 'تم التوصيل بنجاح',
        'cancelled': 'تم الإلغاء'
      };
      
      const label = statusLabels[newStatus] || newStatus;
      data.orders[idx].status = newStatus;
      data.orders[idx].statusLabel = label;
      data.orders[idx].updatedAt = new Date().toISOString();
      data.orders[idx].statusHistory.push({
        status: newStatus,
        label: note || label,
        timestamp: new Date().toISOString()
      });
      saveData(data);
      return data.orders[idx];
    }
    return null;
  }
};
