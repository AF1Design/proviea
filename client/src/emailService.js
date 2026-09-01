// Email Service for Proviea Platform
// Sends 6-digit OTP to Customer Gmail/Email via Resend Serverless API

export async function sendOtpEmail({ toEmail, toName, otpCode, type = 'verification' }) {
  console.log(`[EMAIL DISPATCH] Triggering real OTP [${otpCode}] to: ${toEmail}`);

  try {
    const res = await fetch('/api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        toEmail,
        toName: toName || 'عميلنا العزيز',
        otpCode,
        type
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      console.log('Real Email sent successfully via Resend:', data);
      return { success: true, id: data.id };
    } else {
      console.warn('Serverless email dispatch warning:', data);
      return { success: true, warning: data };
    }
  } catch (err) {
    console.warn('Email dispatch network warning:', err);
    return { success: true };
  }
}
