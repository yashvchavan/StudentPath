// lib/email.ts
import nodemailer from 'nodemailer';

interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  resetUrl: string;
  userType: 'student' | 'college' | 'professional';
}

interface SendDeptTpoInviteEmailParams {
  to: string;
  name: string;
  collegeName: string;
  inviteUrl: string;
  expiresAt: Date;
  departmentName?: string | null;
  invitedByName?: string;
}

const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpPassword = (process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');

// Configure your email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for STARTTLS ports like 587
  auth: {
    user: process.env.SMTP_USER, // your email
    pass: smtpPassword, // normalize app password copied with spaces
  },
});

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  userType
}: SendPasswordResetEmailParams) {
  const userTypeDisplay =
    userType === 'college' ? 'College Administrator' :
    userType === 'professional' ? 'Professional' : 'Student';
  const platformName = 'StudentPath';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - ${platformName}</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
            .header p { color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 16px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; color: #374151; margin-bottom: 20px; }
            .message { color: #6b7280; line-height: 1.6; margin-bottom: 30px; font-size: 16px; }
            .button-container { text-align: center; margin: 40px 0; }
            .reset-button { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: transform 0.2s; }
            .reset-button:hover { transform: translateY(-2px); }
            .security-info { background-color: #f3f4f6; border-left: 4px solid #10b981; padding: 16px; margin: 30px 0; border-radius: 0 8px 8px 0; }
            .security-info h3 { margin: 0 0 8px; color: #374151; font-size: 16px; }
            .security-info p { margin: 0; color: #6b7280; font-size: 14px; line-height: 1.4; }
            .footer { background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; }
            .footer p { margin: 0; color: #9ca3af; font-size: 14px; text-align: center; }
            .link-fallback { color: #6b7280; font-size: 14px; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 6px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 ${platformName}</h1>
                <p>Password Reset Request</p>
            </div>
            
            <div class="content">
                <div class="greeting">Hello ${name},</div>
                
                <div class="message">
                    We received a request to reset the password for your ${userTypeDisplay} account. 
                    If you made this request, click the button below to create a new password.
                </div>
                
                <div class="button-container">
                    <a href="${resetUrl}" class="reset-button">Reset My Password</a>
                </div>
                
                <div class="security-info">
                    <h3>🛡️ Security Information</h3>
                    <p>• This link will expire in 15 minutes for your security<br>
                    • If you didn't request this reset, please ignore this email<br>
                    • Your password won't change until you create a new one</p>
                </div>
                
                <p class="message">
                    If the button doesn't work, you can copy and paste this link into your browser:
                </p>
                
                <div class="link-fallback">
                    ${resetUrl}
                </div>
                
                <div class="message" style="margin-top: 30px; font-size: 14px;">
                    If you have any questions or concerns, please contact our support team at 
                    <a href="mailto:support@studentpath.com" style="color: #10b981;">support@studentpath.edu</a>
                </div>
            </div>
            
            <div class="footer">
                <p>&copy; 2025 ${platformName}. All rights reserved.</p>
                <p style="margin-top: 8px;">This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textContent = `
Password Reset Request - ${platformName}

Hello ${name},

We received a request to reset the password for your ${userTypeDisplay} account.

If you made this request, please visit the following link to create a new password:
${resetUrl}

Security Information:
- This link will expire in 15 minutes for your security
- If you didn't request this reset, please ignore this email
- Your password won't change until you create a new one

If you have any questions, please contact our support team at support@studentpath.com

Best regards,
The ${platformName} Team

© 2025 ${platformName}. All rights reserved.
This is an automated message, please do not reply to this email.
  `;

  const mailOptions = {
    from: `"${platformName} Support" <${process.env.SMTP_USER}>`,
    to,
    subject: `🔐 Reset Your ${platformName} Password`,
    text: textContent,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

// Test email configuration
export async function testEmailConfiguration() {
  try {
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}

export async function sendDeptTpoInviteEmail({
  to,
  name,
  collegeName,
  inviteUrl,
  expiresAt,
  departmentName,
  invitedByName,
}: SendDeptTpoInviteEmailParams) {
  const platformName = 'StudentPath';
  const expiryText = expiresAt.toLocaleString();

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Department TPO Invite - ${platformName}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08); }
        .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 8px 0 0; opacity: 0.95; }
        .content { padding: 28px 24px; color: #374151; }
        .meta { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin: 18px 0; }
        .meta p { margin: 6px 0; font-size: 14px; }
        .cta { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 22px; border-radius: 8px; font-weight: 600; }
        .fallback { background: #f3f4f6; border-radius: 8px; padding: 10px; font-size: 12px; color: #4b5563; word-break: break-all; }
        .footer { padding: 18px 24px; border-top: 1px solid #e5e7eb; background: #fafafa; color: #6b7280; font-size: 13px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Department TPO Invitation</h1>
          <p>${collegeName} invited you to StudentPath</p>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>You have been invited to join <strong>${collegeName}</strong> as a Department TPO.</p>
          <div class="meta">
            <p><strong>College:</strong> ${collegeName}</p>
            <p><strong>Department:</strong> ${departmentName || 'Not assigned'}</p>
            <p><strong>Invited by:</strong> ${invitedByName || 'Central TPO'}</p>
            <p><strong>Invite expires:</strong> ${expiryText}</p>
          </div>
          <p>Click below to set your password and activate your account:</p>
          <div class="cta">
            <a class="btn" href="${inviteUrl}">Set Password & Activate Account</a>
          </div>
          <p>If the button does not work, use this link:</p>
          <div class="fallback">${inviteUrl}</div>
        </div>
        <div class="footer">
          This is an automated email from ${platformName}. If you were not expecting this invite, you can ignore this message.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Department TPO Invitation - ${platformName}

Hello ${name},

You have been invited to join ${collegeName} as a Department TPO.

College: ${collegeName}
Department: ${departmentName || 'Not assigned'}
Invited by: ${invitedByName || 'Central TPO'}
Invite expires: ${expiryText}

Use this link to set your password and activate your account:
${inviteUrl}

If you were not expecting this invite, you can ignore this email.
  `;

  const mailOptions = {
    from: `"${platformName} Support" <${process.env.SMTP_USER}>`,
    to,
    subject: `You are invited as Department TPO - ${collegeName}`,
    text: textContent,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Department TPO invite email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Failed to send Department TPO invite email:', error);
    const details = error?.response || error?.message || 'Unknown SMTP error';
    throw new Error(`Failed to send Department TPO invite email: ${details}`);
  }
}