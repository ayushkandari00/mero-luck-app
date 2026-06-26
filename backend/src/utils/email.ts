import nodemailer from 'nodemailer';

// ─── Email transporter ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_NAME = process.env.SMTP_FROM || '"Mero Luck" <noreply@meroluck.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Password Reset Email ──────────────────────────────────────────────────────
export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string,
  firstName?: string
): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
  const displayName = firstName || 'Participant';

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reset Your Mero Luck Password</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0f0c;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0f0c;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#111714;border:1px solid rgba(212,175,55,0.25);border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0b6b3a,#0b0f0c);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.2);">
              <h1 style="margin:0;font-size:22px;font-weight:900;color:#f5d06f;letter-spacing:2px;text-transform:uppercase;">
                🏆 Mero Luck
              </h1>
              <p style="margin:6px 0 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:3px;">
                Premium Lottery Registry
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#ffffff;">
                Password Reset Request
              </h2>
              <p style="margin:0 0 12px;font-size:14px;color:#9ca3af;line-height:1.6;">
                Hello <strong style="color:#f5d06f;">${displayName}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
                We received a request to reset the password for your Mero Luck registry account associated with <strong style="color:#e5e7eb;">${toEmail}</strong>. Click the button below to set a new password.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#d4af37,#f5d06f);color:#1a0f00;font-weight:900;font-size:13px;text-decoration:none;border-radius:8px;text-transform:uppercase;letter-spacing:1px;">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Expiry warning -->
              <div style="background:rgba(245,208,111,0.07);border:1px solid rgba(245,208,111,0.2);border-radius:8px;padding:14px;margin-bottom:24px;">
                <p style="margin:0;font-size:12px;color:#f5d06f;font-weight:700;">⏱ This link expires in 30 minutes.</p>
                <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">If it expires, visit the login page and request a new link.</p>
              </div>
              <!-- Fallback URL -->
              <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin:0;font-size:11px;color:#4ade80;word-break:break-all;">${resetUrl}</p>
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:28px 0;" />
              <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email — your account is still secure. No changes have been made.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#0b0f0c;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:11px;color:#4b5563;">
                © ${new Date().getFullYear()} Mero Luck Collectibles Pvt Ltd · Nepal's Premier Lottery Registry
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: FROM_NAME,
    to: toEmail,
    subject: '🔐 Reset Your Mero Luck Password',
    html: htmlBody,
  });
}
