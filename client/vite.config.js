import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'local-email-dispatcher',
        configureServer(server) {
          server.middlewares.use('/api/send-otp', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              return res.end(JSON.stringify({ error: 'Method not allowed' }));
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });

            req.on('end', () => {
              try {
                const { toEmail, toName, otpCode, type = 'verification' } = JSON.parse(body);

                if (!toEmail || !otpCode) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ error: 'toEmail and otpCode are required' }));
                }

                const resendApiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
                const senderEmail = env.RESEND_SENDER_EMAIL || process.env.RESEND_SENDER_EMAIL || 'Proviea <onboarding@resend.dev>';

                if (!resendApiKey) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ error: 'RESEND_API_KEY is not defined' }));
                }

                const isReset = type === 'reset';
                const subject = isReset 
                  ? `🔐 رمز استعادة كلمة المرور لمنصة Proviea: ${otpCode}`
                  : `🎒 رمز التحقق وتفعيل حسابك في Proviea: ${otpCode}`;

                const title = isReset ? 'استعادة كلمة المرور' : 'تفعيل حسابك في Proviea';
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
                        ⏰ صلاحية هذا الرمز 10 دقائق فقط.
                      </p>
                    </div>
                  </div>
                `;

                const postData = JSON.stringify({
                  from: senderEmail,
                  to: [toEmail.trim()],
                  subject: subject,
                  html: htmlContent
                });

                const reqNode = https.request({
                  hostname: 'api.resend.com',
                  port: 443,
                  path: '/emails',
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${resendApiKey.trim()}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                  },
                  rejectUnauthorized: false
                }, (response) => {
                  let resBody = '';
                  response.on('data', (d) => resBody += d);
                  response.on('end', () => {
                    res.statusCode = response.statusCode;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(resBody);
                  });
                });

                reqNode.on('error', (err) => {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                });

                reqNode.write(postData);
                reqNode.end();
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: err.message }));
              }
            });
          });
        }
      }
    ],
    server: {
      port: 5173
    }
  };
});
