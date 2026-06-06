import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 8000,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

export const sendRegistrationOtp = async (email: string, otpCode: string, expiresInMinutes: number) => {
  await transporter.sendMail({
    from: `${env.SMTP_FROM} <${env.FROM_EMAIL}>`,
    to: email,
    subject: 'Unio registration OTP',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Your OTP for registration</h2>
        <p>Use this OTP to complete your registration:</p>
        <p style="font-size: 26px; font-weight: 800; letter-spacing: 4px;">${otpCode}</p>
        <p>This OTP will expire in ${expiresInMinutes} minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `
  });
};
