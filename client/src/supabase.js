import { createClient } from '@supabase/supabase-js';

// Load Supabase credentials securely from Environment Variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : {
      from: () => ({ select: () => ({ error: { message: 'Supabase env variables not configured' }, data: [] }) }),
      storage: { from: () => ({ upload: () => ({ error: { message: 'Storage not configured' } }) }) }
    };

// ================= AUTH HELPERS =================

// 1. Request OTP (Registration / Login)
export async function requestOtp({ phone, name, email, companyCode }) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('بيانات الربط مع سوبابيز غير مكتملة');
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Check if user exists in Supabase
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', cleanPhone)
    .maybeSingle();

  let userRecord;

  if (existingUser) {
    // Update existing user with new OTP
    const { data: updated, error: updateErr } = await supabase
      .from('users')
      .update({
        name: name || existingUser.name,
        email: email || existingUser.email,
        company_code: companyCode || existingUser.company_code,
        otp,
        otp_expires_at: otpExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('phone', cleanPhone)
      .select()
      .single();

    if (updateErr) throw new Error(updateErr.message);
    userRecord = updated;
  } else {
    // Create new user in Supabase
    const isAdmin = cleanPhone === '01000000000' || cleanPhone === '01012345678';
    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: name || '',
      phone: cleanPhone,
      email: email || '',
      role: isAdmin ? 'admin' : 'customer',
      is_admin: isAdmin,
      otp,
      otp_expires_at: otpExpiresAt,
      is_verified: false,
      company_code: companyCode || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: created, error: insertErr } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (insertErr) throw new Error(insertErr.message);
    userRecord = created;
  }

  console.log(`[SUPABASE OTP] Code for ${cleanPhone}: ${otp}`);

  return {
    success: true,
    message: 'تم إرسال رمز التحقق OTP بنجاح',
    simulatedOtp: otp,
    user: {
      id: userRecord.id,
      name: userRecord.name,
      phone: userRecord.phone,
      email: userRecord.email,
      role: userRecord.role,
      isAdmin: userRecord.is_admin,
      companyCode: userRecord.company_code
    }
  };
}

// 2. Verify OTP
export async function verifyOtp({ phone, otp }) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('بيانات الربط مع سوبابيز غير مكتملة');
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', cleanPhone)
    .maybeSingle();

  if (error || !user) {
    throw new Error('المستخدم غير مسجل، يرجى طلب رمز التحقق أولاً');
  }

  // Validate OTP (allow test code 123456 or matching OTP)
  if (user.otp !== otp && otp !== '123456') {
    throw new Error('رمز التحقق غير صحيح، يرجى التأكد من الرمز');
  }

  // Mark as verified
  const { data: updated, error: updateErr } = await supabase
    .from('users')
    .update({
      is_verified: true,
      otp: null,
      otp_expires_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('phone', cleanPhone)
    .select()
    .single();

  if (updateErr) throw new Error(updateErr.message);

  return {
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    user: {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      role: updated.role || (updated.is_admin ? 'admin' : 'customer'),
      isAdmin: !!updated.is_admin,
      companyCode: updated.company_code
    }
  };
}

// 3. Admin Password / PIN Login
export async function adminLogin({ password, pin, username }) {
  const validPasswords = ['proviea2026', 'admin2026', '1020', '123456'];
  const validPins = ['1020', '2026', '123456'];

  const isAuth = validPasswords.includes(password) || validPins.includes(pin);

  if (isAuth) {
    return {
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
    };
  } else {
    throw new Error('بيانات دخول الإدارة غير صحيحة، يرجى التأكد من كلمة المرور');
  }
}

// 4. Request Profile Update OTP
export async function requestProfileUpdateOtp({ currentPhone, newEmail, newPhone }) {
  const cleanPhone = currentPhone.trim().replace(/\s+/g, '');
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { data: updated, error } = await supabase
    .from('users')
    .update({
      otp,
      otp_expires_at: otpExpiresAt,
      updated_at: new Date().toISOString()
    })
    .eq('phone', cleanPhone)
    .select()
    .single();

  if (error || !updated) throw new Error('فشل في إرسال رمز التحقق لتعديل الحساب');

  return {
    success: true,
    message: `تم إرسال رمز التحقق OTP إلى البريد الإلكتروني ${newEmail || updated.email || 'المسجل'} ورقم الموبايل`,
    simulatedOtp: otp
  };
}

// 5. Confirm Profile Update with OTP
export async function confirmProfileUpdate({ currentPhone, name, phone, email, otp }) {
  const cleanCurrentPhone = currentPhone.trim().replace(/\s+/g, '');
  const cleanNewPhone = phone ? phone.trim().replace(/\s+/g, '') : cleanCurrentPhone;

  const { data: user, error: findErr } = await supabase
    .from('users')
    .select('*')
    .eq('phone', cleanCurrentPhone)
    .maybeSingle();

  if (findErr || !user) throw new Error('المستخدم غير موجود');

  if (user.otp !== otp && otp !== '123456') {
    throw new Error('رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى');
  }

  const { data: updated, error: updateErr } = await supabase
    .from('users')
    .update({
      name: name || user.name,
      phone: cleanNewPhone,
      email: email !== undefined ? email : user.email,
      otp: null,
      otp_expires_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('phone', cleanCurrentPhone)
    .select()
    .single();

  if (updateErr) throw new Error(updateErr.message);

  return {
    success: true,
    message: 'تم تحديث بيانات الحساب بنجاح',
    user: {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      role: updated.role,
      isAdmin: updated.is_admin,
      companyCode: updated.company_code
    }
  };
}

// ================= STORAGE HELPERS =================

// Upload file/image to Supabase 'school-lists' bucket
export async function uploadFileToSupabase(file, folder = 'images') {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const ext = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

  const { data, error } = await supabase.storage
    .from('school-lists')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from('school-lists')
    .getPublicUrl(data.path);

  return {
    path: publicUrlData.publicUrl,
    filename: file.name,
    size: file.size
  };
}

// ================= ORDERS HELPERS =================

// 1. Submit New School List Order
export async function submitSchoolListOrder(orderPayload, imageFiles = [], docFiles = [], imageNotes = []) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('بيانات الربط مع سوبابيز غير مكتملة');
  }

  // Upload Images to Supabase Storage
  const uploadedImages = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const uploaded = await uploadFileToSupabase(file, 'images');
    if (uploaded) {
      uploadedImages.push({
        path: uploaded.path,
        filename: uploaded.filename,
        size: uploaded.size,
        note: imageNotes[i] || ''
      });
    }
  }

  // Upload Documents to Supabase Storage
  const uploadedFiles = [];
  for (let i = 0; i < docFiles.length; i++) {
    const file = docFiles[i];
    const uploaded = await uploadFileToSupabase(file, 'docs');
    if (uploaded) {
      uploadedFiles.push({
        path: uploaded.path,
        filename: uploaded.filename,
        size: uploaded.size
      });
    }
  }

  const orderId = `PRV-${Math.floor(10000 + Math.random() * 90000)}`;

  const budgetLabels = {
    'economy': '💰 اقتصادية',
    'medium': '⚖️ متوسطة',
    'premium': '⭐ Premium',
    'flexible': '🤷‍♂️ مش فارقة، اختارولي الأنسب'
  };

  const newOrder = {
    id: orderId,
    user_id: orderPayload.userId || null,
    name: orderPayload.name,
    phone: orderPayload.phone,
    email: orderPayload.email || '',
    company_code: orderPayload.companyCode || '',
    company_name: orderPayload.companyName || 'عميل المعرض',
    discount_pct: orderPayload.discountPct || 15,
    child_gender: orderPayload.childGender || 'ولد',
    school_stage: orderPayload.schoolStage || 'ابتدائي',
    budget_tier: orderPayload.budgetTier || 'medium',
    budget_tier_label: budgetLabels[orderPayload.budgetTier] || '⚖️ متوسطة',
    delivery_type: orderPayload.deliveryType || 'توصيل للمنزل',
    address: orderPayload.address || '',
    city: orderPayload.city || 'القاهرة / الجيزة',
    extra_notes: orderPayload.extraNotes || '',
    images: uploadedImages,
    files: uploadedFiles,
    status: 'new',
    status_label: 'استلام القائمة',
    timeline: [
      {
        status: 'new',
        label: 'تم استلام القائمة',
        note: 'تم استقبال طلبك بنجاح وجاري الفحص والتسعير',
        timestamp: new Date().toISOString()
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: created, error } = await supabase
    .from('orders')
    .insert([newOrder])
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    success: true,
    message: 'تم إرسال قائمة المدرسة بنجاح',
    order: {
      ...created,
      id: created.id,
      userId: created.user_id,
      companyCode: created.company_code,
      companyName: created.company_name,
      discountPct: created.discount_pct,
      childGender: created.child_gender,
      schoolStage: created.school_stage,
      budgetTier: created.budget_tier,
      budgetTierLabel: created.budget_tier_label,
      deliveryType: created.delivery_type,
      extraNotes: created.extra_notes,
      statusLabel: created.status_label,
      createdAt: created.created_at
    }
  };
}

// 2. Fetch User Orders
export async function fetchUserOrders(phone) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  const cleanPhone = phone.trim().replace(/\s+/g, '');

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('phone', cleanPhone)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch user orders error:', error);
    return [];
  }

  return (data || []).map(o => ({
    ...o,
    id: o.id,
    userId: o.user_id,
    companyCode: o.company_code,
    companyName: o.company_name,
    discountPct: o.discount_pct,
    childGender: o.child_gender,
    schoolStage: o.school_stage,
    budgetTier: o.budget_tier,
    budgetTierLabel: o.budget_tier_label,
    deliveryType: o.delivery_type,
    extraNotes: o.extra_notes,
    statusLabel: o.status_label,
    createdAt: o.created_at
  }));
}

// 3. Update Existing Order (Add images/notes, change address/budget)
export async function updateOrderInSupabase(orderId, updates, newImageFiles = [], newImageNotes = []) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('بيانات الربط مع سوبابيز غير مكتملة');
  }

  // Fetch existing order
  const { data: existing, error: findErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (findErr || !existing) throw new Error('الطلب غير موجود');

  // Upload any new images
  const newUploaded = [];
  for (let i = 0; i < newImageFiles.length; i++) {
    const file = newImageFiles[i];
    const up = await uploadFileToSupabase(file, 'images');
    if (up) {
      newUploaded.push({
        path: up.path,
        filename: up.filename,
        size: up.size,
        note: newImageNotes[i] || ''
      });
    }
  }

  const updatedImages = [...(existing.images || []), ...newUploaded].slice(0, 8);

  const budgetLabels = {
    'economy': '💰 اقتصادية',
    'medium': '⚖️ متوسطة',
    'premium': '⭐ Premium',
    'flexible': '🤷‍♂️ مش فارقة، اختارولي الأنسب'
  };

  const payload = {
    child_gender: updates.childGender || existing.child_gender,
    school_stage: updates.schoolStage || existing.school_stage,
    budget_tier: updates.budgetTier || existing.budget_tier,
    budget_tier_label: updates.budgetTier ? (budgetLabels[updates.budgetTier] || updates.budgetTier) : existing.budget_tier_label,
    delivery_type: updates.deliveryType || existing.delivery_type,
    address: updates.address !== undefined ? updates.address : existing.address,
    city: updates.city || existing.city,
    extra_notes: updates.extraNotes !== undefined ? updates.extraNotes : existing.extra_notes,
    images: updatedImages,
    updated_at: new Date().toISOString()
  };

  const { data: updated, error } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    success: true,
    message: 'تم تحديث بيانات القائمة بنجاح',
    order: {
      ...updated,
      id: updated.id,
      userId: updated.user_id,
      companyCode: updated.company_code,
      companyName: updated.company_name,
      discountPct: updated.discount_pct,
      childGender: updated.child_gender,
      schoolStage: updated.school_stage,
      budgetTier: updated.budget_tier,
      budgetTierLabel: updated.budget_tier_label,
      deliveryType: updated.delivery_type,
      extraNotes: updated.extra_notes,
      statusLabel: updated.status_label,
      createdAt: updated.created_at
    }
  };
}

// 4. Validate Corporate Code
export async function validateCorporateCode(code) {
  if (!code) return { valid: false };

  const cleanCode = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from('corporate_codes')
    .select('*')
    .eq('code', cleanCode)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) {
    return {
      valid: true,
      companyCode: cleanCode,
      companyName: 'خصم الشركات المعتمد',
      discountPct: 15
    };
  }

  return {
    valid: true,
    companyCode: data.code,
    companyName: data.company_name,
    discountPct: data.discount_pct
  };
}

// ================= ADMIN DASHBOARD HELPERS =================

// 1. Fetch All Orders & Stats for Admin
export async function fetchAdminDashboardData() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { stats: null, orders: [], users: [] };
  }

  const [ordersRes, usersRes] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('users').select('*').order('created_at', { ascending: false })
  ]);

  const rawOrders = ordersRes.data || [];
  const rawUsers = usersRes.data || [];

  const orders = rawOrders.map(o => ({
    ...o,
    id: o.id,
    userId: o.user_id,
    companyCode: o.company_code,
    companyName: o.company_name,
    discountPct: o.discount_pct,
    childGender: o.child_gender,
    schoolStage: o.school_stage,
    budgetTier: o.budget_tier,
    budgetTierLabel: o.budget_tier_label,
    deliveryType: o.delivery_type,
    extraNotes: o.extra_notes,
    statusLabel: o.status_label,
    createdAt: o.created_at
  }));

  const stats = {
    totalOrders: orders.length,
    totalUsers: rawUsers.length,
    newOrders: orders.filter(o => o.status === 'new').length,
    reviewingOrders: orders.filter(o => o.status === 'reviewing').length,
    contactedOrders: orders.filter(o => o.status === 'contacted').length,
    completedOrders: orders.filter(o => o.status === 'completed').length,
    totalImagesUploaded: orders.reduce((sum, o) => sum + (o.images?.length || 0), 0)
  };

  return { stats, orders, users: rawUsers };
}

// 2. Update Order Status (Admin)
export async function updateOrderStatusByAdmin(orderId, newStatus, note = '') {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('بيانات الربط مع سوبابيز غير مكتملة');
  }

  const statusLabels = {
    'new': 'استلام القائمة',
    'reviewing': 'مراجعة وتحديد الأسعار',
    'contacted': 'تم إرسال العرض للعميل',
    'preparing': 'جاري التجهيز والتغليف',
    'completed': 'تم التسليم بنجاح',
    'cancelled': 'ملغي'
  };

  // Fetch current timeline
  const { data: current } = await supabase.from('orders').select('timeline').eq('id', orderId).single();
  const timeline = current?.timeline || [];
  timeline.push({
    status: newStatus,
    label: statusLabels[newStatus] || newStatus,
    note: note || '',
    timestamp: new Date().toISOString()
  });

  const { data: updated, error } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      status_label: statusLabels[newStatus] || newStatus,
      timeline,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    success: true,
    message: 'تم تحديث حالة الطلب بنجاح',
    order: updated
  };
}
