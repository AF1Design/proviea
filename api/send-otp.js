export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { toEmail, toName, otpCode, type = 'verification' } = req.body;

    if (!toEmail || !otpCode) {
      return res.status(400).json({ error: 'toEmail and otpCode are required' });
    }

    const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;

    if (!resendApiKey) {
      console.error('[API SEND-OTP] RESEND_API_KEY is not defined in environment variables');
      return res.status(500).json({ 
        error: 'RESEND_API_KEY is not configured in Vercel Environment Variables. Please add RESEND_API_KEY in Vercel Project Settings.',
        code: 'MISSING_API_KEY'
      });
    }

    const isReset = type === 'reset';
    const subject = isReset 
      ? `🔐 رمز استعادة كلمة المرور لمنصة Proviea: ${otpCode}`
      : `🎒 رمز التحقق وتفعيل حسابك في Proviea: ${otpCode}`;

    const title = isReset 
      ? 'استعادة كلمة المرور' 
      : 'تفعيل حسابك في Proviea';

    const desc = isReset
      ? 'لقد طلبت إعادة تعيين كلمة المرور لحسابك. استخدم الرمز التالي لإتمام العملية:'
      : 'أهلاً بك في منصة Proviea! استخدم رمز التحقق التالي لتفعيل حسابك الجديد:';

    const htmlContent = `
      <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #0A192F; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 2px;">Proviea</h1>
          <p style="color: #E6A100; margin: 6px 0 0 0; font-size: 13px; font-weight: bold;">تجهيز قوائم المدارس والمكتبات</p>
        </div>
        
        <div style="padding: 28px 24px; text-align: center; color: #1e293b;">
          <h2 style="color: #0A192F; margin-top: 0; font-size: 18px; font-weight: 800;">${title}</h2>
          <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
            مرحباً <strong>${toName || 'عميلنا العزيز'}</strong>،<br/>
            ${desc}
          </p>
          
          <div style="background-color: #F8F9FA; border: 2px dashed #E6A100; border-radius: 12px; padding: 18px; margin: 24px 0; display: inline-block;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 900; color: #0A192F; letter-spacing: 8px; display: block;">
              ${otpCode}
            </span>
          </div>
          
          <p style="color: #94a3b8; font-size: 11px; margin-top: 15px;">
            ⏰ صلاحية هذا الرمز 10 دقائق فقط.<br/>
            إذا لم تكن أنت صاحب هذا الطلب، يرجى تجاهل هذه الرسالة.
          </p>
        </div>
        
        <div style="background-color: #F8F9FA; padding: 16px; text-align: center; border-top: 1px solid #edf2f7; font-size: 11px; color: #94a3b8;">
          منصة Proviea © 2026 - جميع الحقوق محفوظة
        </div>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Proviea <info@kemetmisr.com>',
        to: [toEmail.trim()],
        subject: subject,
        html: htmlContent
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[RESEND API ERROR]', data);
      return res.status(response.status).json({ error: data.message || 'Resend error', details: data });
    }

    console.log('[RESEND SUCCESS] Email queued with ID:', data.id);
    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    console.error('[SEND OTP EXCEPTION]', error);
    return res.status(500).json({ error: error.message });
  }
}
