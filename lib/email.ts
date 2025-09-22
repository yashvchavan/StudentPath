// lib/email.ts
import nodemailer from 'nodemailer';

interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  resetUrl: string;
  userType: 'student' | 'college';
}

// Configure your email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // your email
    pass: process.env.SMTP_PASSWORD, // your app password
  },
});

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  userType
}: SendPasswordResetEmailParams) {
  const userTypeDisplay = userType === 'college' ? 'College Administrator' : 'Student';
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