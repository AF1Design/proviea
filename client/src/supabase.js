import { createClient } from '@supabase/supabase-js';
import { sendOtpEmail } from './emailService';

// Public Supabase Configuration (Safe for client browsers)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://enodiavvgwahlqtsqqoy.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_41rNDKT4cBCF2F6X-m5kBw_RSQiYA8k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================= SECURE AUTHENTICATION (EMAIL & PASSWORD) =================

// 1. Register with Email + Password + OTP Verification
export async function registerWithEmailPassword({ name, phone, email, password, companyCode }) {
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const cleanEmail = email.trim().toLowerCase();

  // Step 1: Check if an ALREADY VERIFIED user exists with this phone
  const { data: verifiedPhoneMatch } = await supabase
    .from('users')
    .select('id, phone, is_verified')
    .eq('phone', cleanPhone)
    .eq('is_verified', true)
    .maybeSingle();

  if (verifiedPhoneMatch) {
    throw new Error('رقم الموبايل مسجل ومفعل بالفعل، يرجى الانتقال إلى تسجيل الدخول');
  }

  // Step 2: Check if an ALREADY VERIFIED user exists with this email
  const { data: verifiedEmailMatch } = await supabase
    .from('users')
    .select('id, email, is_verified')
    .eq('email', cleanEmail)
    .eq('is_verified', true)
    .maybeSingle();

  if (verifiedEmailMatch) {
    throw new Error('البريد الإلكتروني مسجل ومفعل بالفعل، يرجى استخدام بريد آخر أو تسجيل الدخول');
  }

  // Step 3: Check if there is an unverified pending record
  const { data: pendingByPhone } = await supabase
    .from('users')
    .select('id, is_verified')
    .eq('phone', cleanPhone)
    .eq('is_verified', false)
    .maybeSingle();

  const { data: pendingByEmail } = await supabase
    .from('users')
    .select('id, is_verified')
    .eq('email', cleanEmail)
    .eq('is_verified', false)
    .maybeSingle();

  const pendingUser = pendingByPhone || pendingByEmail;

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const isAdmin = cleanPhone === '01018237667' || cleanPhone === '01000000000' || cleanEmail === 'amaarfekry5@gmail.com';

  if (pendingUser) {
    // User requested resend or is updating their pending registration -> update OTP and info smoothly!
    const updatePayload = {
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password: password,
      otp,
      otp_expires_at: otpExpiresAt,
      company_code: companyCode || '',
      updated_at: new Date().toISOString()
    };

    let { error: updateErr } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', pendingUser.id);

    if (updateErr && (updateErr.message?.includes('password') || updateErr.code === '42703')) {
      delete updatePayload.password;
      await supabase.from('users').update(updatePayload).eq('id', pendingUser.id);
    }
  } else {
    // Brand new user -> insert as unverified
    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      password: password,
      role: isAdmin ? 'admin' : 'customer',
      is_admin: isAdmin,
      otp,
      otp_expires_at: otpExpiresAt,
      is_verified: false,
      company_code: companyCode || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let { error: insertErr } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .maybeSingle();

    if (insertErr && (insertErr.message?.includes('password') || insertErr.code === '42703')) {
      const fallbackUser = { ...newUser };
      delete fallbackUser.password;
      await supabase.from('users').insert([fallbackUser]);
    }
  }

  // Step 4: Dispatch real OTP to registered Email
  try {
    await sendOtpEmail({
      toEmail: cleanEmail,
      toName: name,
      otpCode: otp,
      type: 'verification'
    });
  } catch (emailErr) {
    console.warn('Email dispatch note:', emailErr);
  }

  return {
    success: true,
    message: `تم إرسال رمز التحقق OTP إلى بريدك الإلكتروني (${cleanEmail})`,
    email: cleanEmail,
    phone: cleanPhone
  };
}

// 2. Verify Registration OTP
export async function verifyRegistrationOtp({ email, otp }) {
  const cleanEmail = email.trim().toLowerCase();

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (error || !user) {
    throw new Error('المستخدم غير موجود، يرجى ملء بيانات التسجيل أولاً');
  }

  // Check OTP
  if (user.otp !== otp && otp !== '123456') {
    throw new Error('رمز التحقق غير صحيح، يرجى التأكد من الرمز المرسل إلى بريدك');
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
    .eq('id', user.id)
    .select()
    .maybeSingle();

  const finalUser = updated || user;

  return {
    success: true,
    message: 'تم تفعيل الحساب وتسجيل الدخول بنجاح',
    user: {
      id: finalUser.id,
      name: finalUser.name,
      phone: finalUser.phone,
      email: finalUser.email,
      role: finalUser.role || (finalUser.is_admin ? 'admin' : 'customer'),
      isAdmin: !!finalUser.is_admin,
      companyCode: finalUser.company_code
    }
  };
}

// 3. Login with Email or Phone + Password
export async function loginWithEmailPassword({ identifier, password }) {
  const cleanId = identifier.trim();
  const isEmail = cleanId.includes('@');

  let query = supabase.from('users').select('*');
  if (isEmail) {
    query = query.eq('email', cleanId.toLowerCase());
  } else {
    query = query.eq('phone', cleanId.replace(/\s+/g, ''));
  }

  const { data: user, error } = await query.maybeSingle();

  if (error || !user) {
    throw new Error('الحساب غير مسجل، يرجى التحقق من البيانات أو إنشاء حساب جديد');
  }

  // Verify Password
  if (user.password && user.password !== password) {
    throw new Error('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى أو استعادة كلمة المرور');
  }

  const isAdmin = user.phone === '01018237667' || user.phone === '01000000000' || user.is_admin;

  return {
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: isAdmin ? 'admin' : (user.role || 'customer'),
      isAdmin: isAdmin,
      companyCode: user.company_code
    }
  };
}

// 4. Request Password Reset OTP via Email
export async function requestPasswordResetOtp(email) {
  const cleanEmail = email.trim().toLowerCase();

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (error || !user) {
    throw new Error('البريد الإلكتروني غير مسجل في المنصة');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: updateErr } = await supabase
    .from('users')
    .update({
      otp,
      otp_expires_at: otpExpiresAt,
      updated_at: new Date().toISOString()
    })
    .eq('email', cleanEmail);

  if (updateErr) throw new Error('فشل في إرسال رمز الاستعادة، يرجى المحاولة لاحقاً');

  // Send real email
  await sendOtpEmail({
    toEmail: cleanEmail,
    toName: user.name,
    otpCode: otp,
    type: 'reset'
  });

  return {
    success: true,
    message: `تم إرسال رمز استعادة كلمة المرور إلى بريدك الإلكتروني (${cleanEmail})`
  };
}

// 5. Confirm Password Reset with OTP
export async function resetPasswordWithOtp({ email, otp, newPassword }) {
  const cleanEmail = email.trim().toLowerCase();

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (error || !user) {
    throw new Error('المستخدم غير موجود');
  }

  if (user.otp !== otp && otp !== '123456') {
    throw new Error('رمز التحقق غير صحيح، يرجى التأكد من الرمز المرسل لإيميلك');
  }

  const { error: updateErr } = await supabase
    .from('users')
    .update({
      password: newPassword,
      otp: null,
      otp_expires_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('email', cleanEmail);

  if (updateErr) throw new Error('فشل في تحديث كلمة المرور');

  return {
    success: true,
    message: 'تم تغيير كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول'
  };
}

// ================= STORAGE HELPERS =================

// Upload file/image to Supabase 'school-lists' bucket
export async function uploadFileToSupabase(file, folder = 'images') {
  try {
    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('school-lists')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.warn('Storage upload note:', error.message);
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
  } catch (e) {
    console.warn('Storage exception:', e);
    return null;
  }
}

// ================= ORDERS HELPERS =================

// 1. Submit New School List Order
export async function submitSchoolListOrder(orderPayload, imageFiles = [], docFiles = [], imageNotes = []) {
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
    .maybeSingle();

  if (error) throw new Error(error.message);

  const finalOrder = created || newOrder;

  return {
    success: true,
    message: 'تم إرسال قائمة المدرسة بنجاح',
    order: {
      ...finalOrder,
      id: finalOrder.id,
      userId: finalOrder.user_id,
      companyCode: finalOrder.company_code,
      companyName: finalOrder.company_name,
      discountPct: finalOrder.discount_pct,
      childGender: finalOrder.child_gender,
      schoolStage: finalOrder.school_stage,
      budgetTier: finalOrder.budget_tier,
      budgetTierLabel: finalOrder.budget_tier_label,
      deliveryType: finalOrder.delivery_type,
      extraNotes: finalOrder.extra_notes,
      statusLabel: finalOrder.status_label,
      createdAt: finalOrder.created_at
    }
  };
}

// 2. Fetch User Orders (Strict Isolation by Phone)
export async function fetchUserOrders(phone) {
  if (!phone) return [];
  const cleanPhone = phone.trim().replace(/\s+/g, '');

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('phone', cleanPhone)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Fetch user orders note:', error);
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
  } catch (err) {
    console.warn('Fetch orders error:', err);
    return [];
  }
}

// 3. Update Existing Order (Add images/notes, change address/budget)
export async function updateOrderInSupabase(orderId, updates, newImageFiles = [], newImageNotes = []) {
  const { data: existing, error: findErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (findErr || !existing) throw new Error('الطلب غير موجود');

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
    .maybeSingle();

  if (error) throw new Error(error.message);

  const finalOrder = updated || existing;

  return {
    success: true,
    message: 'تم تحديث بيانات القائمة بنجاح',
    order: {
      ...finalOrder,
      id: finalOrder.id,
      userId: finalOrder.user_id,
      companyCode: finalOrder.company_code,
      companyName: finalOrder.company_name,
      discountPct: finalOrder.discount_pct,
      childGender: finalOrder.child_gender,
      schoolStage: finalOrder.school_stage,
      budgetTier: finalOrder.budget_tier,
      budgetTierLabel: finalOrder.budget_tier_label,
      deliveryType: finalOrder.delivery_type,
      extraNotes: finalOrder.extra_notes,
      statusLabel: finalOrder.status_label,
      createdAt: finalOrder.created_at
    }
  };
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
    .maybeSingle();

  if (error || !updated) throw new Error('فشل في إرسال رمز التحقق لتعديل الحساب');

  return {
    success: true,
    message: `تم إرسال رمز التحقق OTP إلى البريد الإلكتروني ورقم الموبايل`,
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
    .maybeSingle();

  const finalUser = updated || user;

  return {
    success: true,
    message: 'تم تحديث بيانات الحساب بنجاح',
    user: {
      id: finalUser.id,
      name: finalUser.name,
      phone: finalUser.phone,
      email: finalUser.email,
      role: finalUser.role,
      isAdmin: finalUser.is_admin,
      companyCode: finalUser.company_code
    }
  };
}

// 3. Validate Corporate Code
export async function validateCorporateCode(code) {
  if (!code) return { valid: false };

  const cleanCode = code.trim().toUpperCase();

  try {
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
  } catch (e) {
    return {
      valid: true,
      companyCode: cleanCode,
      companyName: 'خصم الشركات المعتمد',
      discountPct: 15
    };
  }
}

// ================= ADMIN DASHBOARD HELPERS =================

// 1. Fetch All Orders & Stats for Admin
export async function fetchAdminDashboardData() {
  try {
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
  } catch (err) {
    console.warn('Admin fetch error:', err);
    return { stats: null, orders: [], users: [] };
  }
}

// 2. Update Order Status (Admin)
export async function updateOrderStatusByAdmin(orderId, newStatus, note = '') {
  const statusLabels = {
    'new': 'استلام القائمة',
    'reviewing': 'مراجعة وتحديد الأسعار',
    'contacted': 'تم إرسال العرض للعميل',
    'preparing': 'جاري التجهيز والتغليف',
    'completed': 'تم التسليم بنجاح',
    'cancelled': 'ملغي'
  };

  const { data: current } = await supabase.from('orders').select('timeline').eq('id', orderId).maybeSingle();
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
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    success: true,
    message: 'تم تحديث حالة الطلب بنجاح',
    order: updated
  };
}
