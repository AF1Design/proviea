import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max per file
    files: 12 // max 12 files total (up to 5 images + 5 docs)
  }
});

// ==================== AUTH & OTP ROUTES ====================

// Register / Create Account
app.post('/api/auth/register', (req, res) => {
  const { name, phone, email, companyCode } = req.body;
  if (!phone || !name) {
    return res.status(400).json({ error: 'الاسم ورقم الهاتف مطلوبان' });
  }

  // Clean phone number
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  let user = db.findUserByPhone(cleanPhone);
  if (user) {
    user = db.updateUser(user.id, {
      name,
      email: email || user.email,
      otp,
      otpExpiresAt,
      companyCode: companyCode || user.companyCode
    });
  } else {
    user = db.createUser({
      name,
      phone: cleanPhone,
      email,
      otp,
      otpExpiresAt,
      isVerified: false,
      companyCode: companyCode || ''
    });
  }

  console.log(`[OTP GENERATED] Phone: ${cleanPhone}, Code: ${otp}`);

  // In production, integrate SMS / WhatsApp gateway here.
  // In development, we return the OTP for immediate testing convenience!
  return res.json({
    success: true,
    message: 'تم إرسال رمز التحقق بنجاح',
    phone: cleanPhone,
    simulatedOtp: otp // Returned for easy instant testing
  });
});

// Request Login OTP
app.post('/api/auth/login', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'رقم الهاتف مطلوب' });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  let user = db.findUserByPhone(cleanPhone);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  if (!user) {
    user = db.createUser({
      name: 'عميل Proviea',
      phone: cleanPhone,
      email: '',
      otp,
      otpExpiresAt,
      isVerified: false
    });
  } else {
    user = db.updateUser(user.id, { otp, otpExpiresAt });
  }

  console.log(`[LOGIN OTP] Phone: ${cleanPhone}, Code: ${otp}`);

  return res.json({
    success: true,
    message: 'تم إرسال رمز التحقق',
    phone: cleanPhone,
    simulatedOtp: otp
  });
});

// Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'رقم الهاتف ورمز التحقق مطلوبان' });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const user = db.findUserByPhone(cleanPhone);

  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير مسجل' });
  }

  // Verify OTP match (or master test code 123456)
  if (user.otp !== otp && otp !== '123456') {
    return res.status(400).json({ error: 'رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى' });
  }

  const updatedUser = db.updateUser(user.id, {
    isVerified: true,
    otp: null,
    otpExpiresAt: null
  });

  return res.json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      role: updatedUser.role || (updatedUser.isAdmin ? 'admin' : 'customer'),
      isAdmin: !!updatedUser.isAdmin,
      companyCode: updatedUser.companyCode
    }
  });
});

// Admin Password / PIN Login
app.post('/api/admin/login', (req, res) => {
  const { username, password, pin } = req.body;
  
  // Default Admin Credentials
  const validUsernames = ['admin', 'proviea', 'owner'];
  const validPasswords = ['proviea2026', 'admin2026', '1020', '123456'];
  const validPins = ['1020', '2026', '123456'];

  const isAuth = 
    (validUsernames.includes((username || '').toLowerCase().trim()) && validPasswords.includes(password)) ||
    validPins.includes(pin) ||
    validPasswords.includes(password);

  if (isAuth) {
    return res.json({
      success: true,
      message: 'تم تسجيل دخول الإدارة بنجاح',
      user: {
        id: 'admin_master',
        name: 'مدير منصة Proviea',
        phone: '01000000000',
        email: 'admin@proviea.com',
        role: 'admin',
        isAdmin: true,
        companyCode: 'PROVIEA15'
      }
    });
  } else {
    return res.status(401).json({
      error: 'بيانات دخول الإدارة غير صحيحة، يرجى التأكد من كلمة المرور'
    });
  }
});

// Request Profile Update OTP (Sent to Email/Phone)
app.post('/api/auth/request-update-otp', (req, res) => {
  const { currentPhone, newEmail, newPhone } = req.body;
  if (!currentPhone) {
    return res.status(400).json({ error: 'رقم الهاتف الحالي مطلوب للتحقق' });
  }

  const cleanPhone = currentPhone.trim().replace(/\s+/g, '');
  const user = db.findUserByPhone(cleanPhone);

  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير مسجل' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  db.updateUser(user.id, { otp, otpExpiresAt });

  console.log(`[PROFILE UPDATE OTP] Sent for user ${cleanPhone}: Code ${otp}`);

  return res.json({
    success: true,
    message: `تم إرسال رمز التحقق OTP إلى البريد الإلكتروني ${newEmail || user.email || 'المسجل'} ورقم الموبايل`,
    simulatedOtp: otp
  });
});

// Confirm Profile Update with OTP
app.post('/api/auth/update-profile', (req, res) => {
  const { currentPhone, name, phone, email, otp } = req.body;
  if (!currentPhone || !otp) {
    return res.status(400).json({ error: 'رقم الموبايل الحالي ورمز التحقق مطلوبان' });
  }

  const cleanCurrentPhone = currentPhone.trim().replace(/\s+/g, '');
  const user = db.findUserByPhone(cleanCurrentPhone);

  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير مسجل' });
  }

  // Validate OTP
  if (user.otp !== otp && otp !== '123456') {
    return res.status(400).json({ error: 'رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى' });
  }

  const cleanNewPhone = phone ? phone.trim().replace(/\s+/g, '') : user.phone;

  const updatedUser = db.updateUser(user.id, {
    name: name || user.name,
    phone: cleanNewPhone,
    email: email !== undefined ? email : user.email,
    otp: null,
    otpExpiresAt: null
  });

  return res.json({
    success: true,
    message: 'تم تحديث بيانات الحساب بنجاح',
    user: {
      id: updatedUser.id,
      name: updatedUser.name,
      phone: updatedUser.phone,
      email: updatedUser.email,
      companyCode: updatedUser.companyCode
    }
  });
});

// ==================== CORPORATE CODE ROUTES ====================

app.get('/api/corporate/validate/:code', (req, res) => {
  const { code } = req.params;
  const match = db.validateCode(code);
  if (match) {
    return res.json({
      valid: true,
      code: match.code,
      companyName: match.name,
      discount: match.discount,
      message: `تم تطبيق خصم ${match.discount}% الخاص بـ ${match.name}`
    });
  } else {
    return res.status(404).json({
      valid: false,
      message: 'كود الشركة غير صحيح أو منتهي الصلاحية'
    });
  }
});

app.get('/api/corporate/codes', (req, res) => {
  return res.json(db.getAllCodes());
});

// ==================== SCHOOL LIST & ORDERS ROUTES ====================

// Submit School List Request
app.post('/api/orders/school-list', upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'files', maxCount: 5 }
]), (req, res) => {
  try {
    const {
      userId,
      name,
      phone,
      email,
      companyCode,
      childGender,
      schoolStage,
      budgetTier,
      deliveryType,
      address,
      city,
      extraNotes,
      imageNotes // JSON string of notes array corresponding to images
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'الاسم ورقم الموبايل مطلوبان لإرسال الطلب' });
    }

    // Process Image Notes
    let parsedNotes = [];
    if (imageNotes) {
      try {
        parsedNotes = typeof imageNotes === 'string' ? JSON.parse(imageNotes) : imageNotes;
      } catch (e) {
        parsedNotes = [];
      }
    }

    // Process Uploaded Images
    const uploadedImages = (req.files && req.files['images']) || [];
    const imagesData = uploadedImages.map((file, idx) => ({
      path: `/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      note: parsedNotes[idx] || ''
    }));

    // Process Uploaded Files / Documents
    const uploadedFiles = (req.files && req.files['files']) || [];
    const filesData = uploadedFiles.map((file) => ({
      path: `/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size
    }));

    // Verify Company Code & Discount
    let corporateInfo = db.validateCode(companyCode);
    let finalCompanyCode = companyCode || 'PROVIEA15';
    let companyName = corporateInfo ? corporateInfo.name : 'عرض خاص';
    let discountPct = corporateInfo ? corporateInfo.discount : 15;

    // Budget Tier Labels
    const budgetLabels = {
      'economy': '💰 اقتصادية',
      'medium': '⚖️ متوسطة',
      'premium': '⭐ Premium',
      'flexible': '🤷‍♂️ مش فارقة، اختارولي الأنسب'
    };

    const budgetTierLabel = budgetLabels[budgetTier] || budgetTier || '⚖️ متوسطة';

    // Create Order in DB
    const newOrder = db.createOrder({
      userId,
      name,
      phone: phone.trim().replace(/\s+/g, ''),
      email,
      companyCode: finalCompanyCode,
      companyName,
      discountPct,
      childGender,
      schoolStage,
      budgetTier,
      budgetTierLabel,
      deliveryType: deliveryType || 'توصيل للمنزل',
      address,
      city: city || 'القاهرة / الجيزة',
      extraNotes,
      images: imagesData,
      files: filesData
    });

    console.log(`[NEW SCHOOL LIST ORDER] ${newOrder.id} by ${newOrder.name} (${newOrder.phone}) - Company: ${companyName}`);

    return res.status(201).json({
      success: true,
      message: 'استلمنا قائمة احتياجاتك بنجاح',
      order: newOrder
    });
  } catch (error) {
    console.error('Error creating school list order:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء حفظ الطلب، يرجى المحاولة مرة أخرى' });
  }
});

// Update Existing Order (Add images, edit notes, change budget/stage/address)
app.post('/api/orders/:orderId/update', upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'files', maxCount: 5 }
]), (req, res) => {
  try {
    const { orderId } = req.params;
    const existingOrder = db.getOrderById(orderId);
    if (!existingOrder) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    const {
      childGender,
      schoolStage,
      budgetTier,
      deliveryType,
      address,
      city,
      extraNotes,
      imageNotes
    } = req.body;

    // Process New Image Notes
    let parsedNotes = [];
    if (imageNotes) {
      try {
        parsedNotes = typeof imageNotes === 'string' ? JSON.parse(imageNotes) : imageNotes;
      } catch (e) {
        parsedNotes = [];
      }
    }

    // Process Newly Uploaded Images
    const uploadedImages = (req.files && req.files['images']) || [];
    const newImagesData = uploadedImages.map((file, idx) => ({
      path: `/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      note: parsedNotes[idx] || ''
    }));

    // Process Newly Uploaded Files
    const uploadedFiles = (req.files && req.files['files']) || [];
    const newFilesData = uploadedFiles.map((file) => ({
      path: `/uploads/${file.filename}`,
      filename: file.filename,
      originalname: file.originalname,
      size: file.size
    }));

    const updatedImages = [...(existingOrder.images || []), ...newImagesData].slice(0, 8);
    const updatedFiles = [...(existingOrder.files || []), ...newFilesData].slice(0, 8);

    const budgetLabels = {
      'economy': '💰 اقتصادية',
      'medium': '⚖️ متوسطة',
      'premium': '⭐ Premium',
      'flexible': '🤷‍♂️ مش فارقة، اختارولي الأنسب'
    };

    const updates = {
      childGender: childGender || existingOrder.childGender,
      schoolStage: schoolStage || existingOrder.schoolStage,
      budgetTier: budgetTier || existingOrder.budgetTier,
      budgetTierLabel: budgetTier ? (budgetLabels[budgetTier] || budgetTier) : existingOrder.budgetTierLabel,
      deliveryType: deliveryType || existingOrder.deliveryType,
      address: address !== undefined ? address : existingOrder.address,
      city: city || existingOrder.city,
      extraNotes: extraNotes !== undefined ? extraNotes : existingOrder.extraNotes,
      images: updatedImages,
      files: updatedFiles,
    };

    const updated = db.updateOrder(orderId, updates);
    db.updateOrderStatus(orderId, existingOrder.status, 'تم تعديل بيانات القائمة بواسطة العميل');

    return res.json({
      success: true,
      message: 'تم تحديث بيانات القائمة بنجاح',
      order: updated
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return res.status(500).json({ error: 'فشل في تحديث بيانات الطلب' });
  }
});

// Get Order Details by ID
app.get('/api/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }
  return res.json(order);
});

// Get User Orders by Phone
app.get('/api/orders/user/:phone', (req, res) => {
  const { phone } = req.params;
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const orders = db.getOrdersByUserPhone(cleanPhone);
  return res.json(orders);
});

// ==================== ADMIN DASHBOARD ROUTES ====================

// Admin Stats & Overview
app.get('/api/admin/stats', (req, res) => {
  const users = db.getAllUsers();
  const orders = db.getAllOrders();

  const totalLeads = users.length;
  const totalOrders = orders.length;
  const totalImagesUploaded = orders.reduce((sum, o) => sum + (o.images ? o.images.length : 0), 0);

  // Group by corporate company
  const companyCounts = {};
  orders.forEach(o => {
    const comp = o.companyName || 'أخرى';
    companyCounts[comp] = (companyCounts[comp] || 0) + 1;
  });

  // Group by status
  const statusCounts = {
    new: 0,
    reviewing: 0,
    contacted: 0,
    preparing: 0,
    completed: 0
  };
  orders.forEach(o => {
    if (statusCounts[o.status] !== undefined) {
      statusCounts[o.status]++;
    }
  });

  return res.json({
    totalLeads,
    totalOrders,
    totalImagesUploaded,
    companyCounts,
    statusCounts,
    recentOrders: orders.slice(0, 10),
    recentUsers: users.slice(-10).reverse()
  });
});

// Admin All Orders
app.get('/api/admin/orders', (req, res) => {
  const orders = db.getAllOrders();
  return res.json(orders);
});

// Admin Update Order Status
app.patch('/api/admin/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { status, note } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'الحالة الجديدة مطلوبة' });
  }

  const updated = db.updateOrderStatus(orderId, status, note);
  if (!updated) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  return res.json({
    success: true,
    message: 'تم تحديث حالة الطلب بنجاح',
    order: updated
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  PROVIEA BACKEND RUNNING ON PORT ${PORT} `);
  console.log(`  Uploads directory: ${uploadsDir}        `);
  console.log(`=========================================`);
});
