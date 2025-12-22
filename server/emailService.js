import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Email service configuration
// For Railway/production: use EMAIL_SERVICE=resend (HTTP-based, not blocked)
// For local dev: use EMAIL_SERVICE=ethereal or leave empty
let resend = null;
let transporter = null;
let emailEnabled = true;
let useResend = false;

async function initializeEmailService() {
    const service = process.env.EMAIL_SERVICE;
    
    // Disabled
    if (service === 'disabled' || service === 'none') {
        console.log('📧 Email service DISABLED');
        emailEnabled = false;
        return;
    }
    
    // Resend (recommended for Railway - uses HTTP API)
    if (service === 'resend') {
        if (!process.env.RESEND_API_KEY) {
            console.error('❌ RESEND_API_KEY not set!');
            emailEnabled = false;
            return;
        }
        resend = new Resend(process.env.RESEND_API_KEY);
        useResend = true;
        console.log('✅ Email service: Resend (HTTP API)');
        return;
    }
    
    // Gmail SMTP (usually blocked on Railway)
    if (service === 'gmail') {
        console.log('Attempting Gmail SMTP...');
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        
        try {
            await transporter.verify();
            console.log('✅ Gmail SMTP connected!');
        } catch (error) {
            console.error('⚠️ Gmail SMTP failed:', error.message);
            console.error('   Railway blocks SMTP. Use EMAIL_SERVICE=resend instead.');
            transporter = null;
            emailEnabled = false;
        }
        return;
    }
    
    // Development: Ethereal (fake SMTP)
    try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        console.log('📧 Using Ethereal Email for testing');
        console.log('Test account:', testAccount.user);
    } catch (error) {
        console.error('⚠️ Ethereal setup failed:', error.message);
        emailEnabled = false;
    }
}

await initializeEmailService();

export { emailEnabled };

// Email templates
function getVerificationEmailHtml(username, verificationUrl) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎰 Aurora Casino</h1>
                    <p>Welcome to the Game!</p>
                </div>
                <div class="content">
                    <h2>Hi ${username}!</h2>
                    <p>Thanks for signing up at Aurora Casino. We're excited to have you join us!</p>
                    <p>To get started, please verify your email address by clicking the button below:</p>
                    
                    <div style="text-align: center;">
                        <a href="${verificationUrl}" class="button">Verify Email Address</a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                        ${verificationUrl}
                    </p>
                    
                    <div class="warning">
                        <strong>⏰ Important:</strong> This verification link will expire in 24 hours.
                    </div>
                    
                    <p>Once verified, you'll be able to access all our games and features.</p>
                    <p>If you didn't create an account with us, you can safely ignore this email.</p>
                    <p>Happy gaming!<br>The Aurora Casino Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message, please do not reply to this email.</p>
                    <p>&copy; 2024 Aurora Casino. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function getPasswordResetEmailHtml(username, resetUrl) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎰 Aurora Casino</h1>
                    <p>Password Reset Request</p>
                </div>
                <div class="content">
                    <h2>Hi ${username}!</h2>
                    <p>We received a request to reset your password.</p>
                    <p>Click the button below to reset your password:</p>
                    
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="button">Reset Password</a>
                    </div>
                    
                    <div class="warning">
                        <strong>⏰ Important:</strong> This link will expire in 1 hour.
                    </div>
                    
                    <p>If you didn't request a password reset, you can safely ignore this email.</p>
                    <p>Best regards,<br>The Aurora Casino Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message, please do not reply to this email.</p>
                    <p>&copy; 2024 Aurora Casino. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

export async function sendVerificationEmail(email, username, token) {
    if (!emailEnabled) {
        console.log('📧 Email disabled - skipping verification email for:', email);
        return { success: false, error: 'Email service disabled' };
    }
    
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    const fromEmail = process.env.EMAIL_FROM || 'Aurora Casino <onboarding@resend.dev>';
    
    // Use Resend (HTTP API)
    if (useResend && resend) {
        try {
            const { data, error } = await resend.emails.send({
                from: fromEmail,
                to: email,
                subject: 'Verify Your Email - Aurora Casino',
                html: getVerificationEmailHtml(username, verificationUrl),
            });
            
            if (error) {
                console.error('❌ Resend error:', error);
                return { success: false, error: error.message };
            }
            
            console.log('✅ Verification email sent via Resend:', data.id);
            return { success: true, messageId: data.id };
        } catch (error) {
            console.error('❌ Resend error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Use Nodemailer (SMTP)
    if (transporter) {
        try {
            const info = await transporter.sendMail({
                from: fromEmail,
                to: email,
                subject: 'Verify Your Email - Aurora Casino',
                html: getVerificationEmailHtml(username, verificationUrl),
                text: `Hi ${username}! Verify your email: ${verificationUrl}`
            });
            
            console.log('✅ Verification email sent:', info.messageId);
            
            if (process.env.EMAIL_SERVICE !== 'gmail') {
                console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
            }
            
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Email error:', error);
            return { success: false, error: error.message };
        }
    }
    
    return { success: false, error: 'No email transport available' };
}

export async function sendPasswordResetEmail(email, username, token) {
    if (!emailEnabled) {
        console.log('📧 Email disabled - skipping password reset email for:', email);
        return { success: false, error: 'Email service disabled' };
    }
    
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const fromEmail = process.env.EMAIL_FROM || 'Aurora Casino <onboarding@resend.dev>';
    
    // Use Resend (HTTP API)
    if (useResend && resend) {
        try {
            const { data, error } = await resend.emails.send({
                from: fromEmail,
                to: email,
                subject: 'Password Reset - Aurora Casino',
                html: getPasswordResetEmailHtml(username, resetUrl),
            });
            
            if (error) {
                console.error('❌ Resend error:', error);
                return { success: false, error: error.message };
            }
            
            console.log('✅ Password reset email sent via Resend:', data.id);
            return { success: true, messageId: data.id };
        } catch (error) {
            console.error('❌ Resend error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Use Nodemailer (SMTP)
    if (transporter) {
        try {
            const info = await transporter.sendMail({
                from: fromEmail,
                to: email,
                subject: 'Password Reset - Aurora Casino',
                html: getPasswordResetEmailHtml(username, resetUrl),
                text: `Hi ${username}! Reset your password: ${resetUrl}`
            });
            
            console.log('✅ Password reset email sent:', info.messageId);
            
            if (process.env.EMAIL_SERVICE !== 'gmail') {
                console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
            }
            
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Email error:', error);
            return { success: false, error: error.message };
        }
    }
    
    return { success: false, error: 'No email transport available' };
}
