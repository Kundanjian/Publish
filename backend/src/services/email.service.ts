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

<<<<<<< HEAD
// ─── OTP ──────────────────────────────────────────────────────────────────────

=======
>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
export const sendRegistrationOtp = async (email: string, otpCode: string, expiresInMinutes: number) => {
  await transporter.sendMail({
    from: `${env.SMTP_FROM} <${env.FROM_EMAIL}>`,
    to: email,
<<<<<<< HEAD
    subject: 'Unio — Your registration OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; line-height: 1.6; color: #1c2229;">
        <div style="padding: 28px 32px; background: #f0f7ff; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; color: #1d4ed8; font-size: 24px;">Unio Rentals</h1>
        </div>
        <div style="padding: 32px; background: #ffffff; border: 1px solid #e0e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
          <h2 style="margin: 0 0 12px;">Your registration OTP</h2>
          <p>Use this code to complete your Unio registration. It expires in <strong>${expiresInMinutes} minutes</strong>.</p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="display: inline-block; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #1d4ed8; background: #f0f7ff; padding: 14px 24px; border-radius: 10px;">${otpCode}</span>
          </div>
          <p style="font-size: 13px; color: #6b7280;">If you did not request this, please ignore this email. Do not share this OTP with anyone.</p>
        </div>
      </div>
    `
  });
};

// ─── Enquiry: Admin notification ───────────────────────────────────────────────

type EnquiryAdminPayload = {
  enquiryId: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  listerEmail: string;
  listerName: string;
  enquiryType: string;
  message: string;
  preferredContact: string;
  moveInDate?: string;
  duration?: string;
  budget?: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
};

export const sendEnquiryNotificationToAdmin = async (payload: EnquiryAdminPayload) => {
  const {
    enquiryId, propertyId, propertyTitle, propertyLocation,
    listerEmail, listerName, enquiryType, message, preferredContact,
    moveInDate, duration, budget, userName, userEmail, userPhone
  } = payload;

  const adminEmail = env.ADMIN_SEED_EMAIL;

  const approveUrl = `${env.FRONTEND_URL}/admin/enquiries/${enquiryId}/approve`;
  const rejectUrl  = `${env.FRONTEND_URL}/admin/enquiries/${enquiryId}/reject`;

  await transporter.sendMail({
    from: `Unio System <${env.FROM_EMAIL}>`,
    to: adminEmail,
    subject: `[Unio] New Enquiry #${enquiryId} — ${propertyTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1c2229; line-height: 1.6;">
        <div style="padding: 24px 28px; background: #1d4ed8; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; color: #fff; font-size: 20px;">New Enquiry Received</h1>
          <p style="margin: 6px 0 0; color: #bfd7ff; font-size: 14px;">Enquiry ID: <strong>${enquiryId}</strong></p>
        </div>

        <div style="padding: 28px; background: #fff; border: 1px solid #e0e8f0; border-top: 0;">
          <h2 style="margin: 0 0 6px; font-size: 17px;">Property Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 6px 0; color: #6b7280; width: 130px;">Property</td><td><strong>${propertyTitle}</strong></td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Location</td><td>${propertyLocation}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Property ID</td><td>${propertyId}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Lister</td><td>${listerName} &lt;${listerEmail}&gt;</td></tr>
          </table>

          <h2 style="margin: 0 0 6px; font-size: 17px;">Enquiry Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 6px 0; color: #6b7280; width: 130px;">Type</td><td>${enquiryType}</td></tr>
            ${moveInDate ? `<tr><td style="padding: 6px 0; color: #6b7280;">Move-in</td><td>${moveInDate}</td></tr>` : ''}
            ${duration   ? `<tr><td style="padding: 6px 0; color: #6b7280;">Duration</td><td>${duration}</td></tr>`   : ''}
            ${budget     ? `<tr><td style="padding: 6px 0; color: #6b7280;">Budget</td><td>${budget}</td></tr>`       : ''}
            <tr><td style="padding: 6px 0; color: #6b7280;">Contact pref.</td><td>${preferredContact}</td></tr>
          </table>

          <div style="background: #f8fafc; border-left: 4px solid #1d4ed8; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
            <p style="margin: 0; font-style: italic;">"${message}"</p>
          </div>

          <h2 style="margin: 0 0 6px; font-size: 17px;">User Information</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr><td style="padding: 6px 0; color: #6b7280; width: 130px;">Name</td><td>${userName}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Email</td><td>${userEmail}</td></tr>
            ${userPhone ? `<tr><td style="padding: 6px 0; color: #6b7280;">Phone</td><td>${userPhone}</td></tr>` : ''}
          </table>

          <p style="font-size: 13px; color: #6b7280; margin-bottom: 16px;">
            Review this lead and take action. If approved, the lister will receive a <strong>lead notification only</strong> — user contact details will not be shared.
          </p>

          <div style="display: flex; gap: 12px;">
            <a href="${approveUrl}" style="display: inline-block; padding: 12px 24px; background: #16a34a; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700;">✓ Approve & Notify Lister</a>
            <a href="${rejectUrl}"  style="display: inline-block; padding: 12px 24px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 700;">✗ Reject</a>
          </div>
        </div>

        <div style="padding: 16px 28px; background: #f8fafc; border: 1px solid #e0e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">Unio Rentals • Internal system notification • Do not forward</p>
        </div>
      </div>
    `
  });
};

// ─── Enquiry: Lister notification (no user contact details) ───────────────────

type EnquiryListerPayload = {
  enquiryId: string;
  propertyId: string;
  listerEmail: string;
  enquiryType: string;
  moveInDate?: string;
  duration?: string;
  budget?: string;
};

export const sendEnquiryApprovedToLister = async (payload: EnquiryListerPayload) => {
  const { enquiryId, listerEmail, enquiryType, moveInDate, duration, budget } = payload;

  await transporter.sendMail({
    from: `Unio Team <${env.FROM_EMAIL}>`,
    to: listerEmail,
    subject: `[Unio] You have a new potential lead! — Enquiry #${enquiryId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #1c2229; line-height: 1.6;">
        <div style="padding: 24px 28px; background: #f0fdf4; border-radius: 12px 12px 0 0; border-bottom: 3px solid #16a34a;">
          <h1 style="margin: 0; color: #15803d; font-size: 20px;">🎉 New Potential Lead</h1>
          <p style="margin: 6px 0 0; color: #4b5563; font-size: 14px;">Someone is interested in your listing on Unio!</p>
        </div>

        <div style="padding: 28px; background: #fff; border: 1px solid #e0e8f0; border-top: 0;">
          <p>Hi,</p>
          <p>Great news — our team has reviewed a new enquiry for your property and found it to be a genuine lead. Here are the details:</p>

          <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 8px; margin: 20px 0; overflow: hidden;">
            <tr style="background: #e8f5e9;">
              <td style="padding: 10px 16px; color: #374151; font-weight: 700; width: 140px;">Enquiry type</td>
              <td style="padding: 10px 16px; font-weight: 600; text-transform: capitalize;">${enquiryType}</td>
            </tr>
            ${moveInDate ? `<tr><td style="padding: 10px 16px; color: #374151; font-weight: 700; border-top: 1px solid #e5e7eb;">Move-in date</td><td style="padding: 10px 16px; border-top: 1px solid #e5e7eb;">${moveInDate}</td></tr>` : ''}
            ${duration   ? `<tr><td style="padding: 10px 16px; color: #374151; font-weight: 700; border-top: 1px solid #e5e7eb;">Duration</td><td style="padding: 10px 16px; border-top: 1px solid #e5e7eb;">${duration}</td></tr>` : ''}
            ${budget     ? `<tr><td style="padding: 10px 16px; color: #374151; font-weight: 700; border-top: 1px solid #e5e7eb;">Budget</td><td style="padding: 10px 16px; border-top: 1px solid #e5e7eb;">${budget}</td></tr>` : ''}
          </table>

          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
            <strong style="color: #92400e;">🔒 Privacy note:</strong>
            <p style="margin: 6px 0 0; color: #78350f; font-size: 14px;">
              The Unio team is acting as the intermediary for this lead. Tenant contact information is kept private at this stage. Our team will facilitate the introduction and help convert this lead.
            </p>
          </div>

          <p>If you'd like to discuss this lead further, please reply to this email or contact the Unio team.</p>

          <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">
            Reference: Enquiry #${enquiryId}
          </p>
        </div>

        <div style="padding: 16px 28px; background: #f8fafc; border: 1px solid #e0e8f0; border-top: 0; border-radius: 0 0 12px 12px;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">Unio Rentals • Direct landlord platform • <a href="https://unio.app" style="color: #1d4ed8;">unio.app</a></p>
        </div>
=======
    subject: 'Unio registration OTP',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Your OTP for registration</h2>
        <p>Use this OTP to complete your registration:</p>
        <p style="font-size: 26px; font-weight: 800; letter-spacing: 4px;">${otpCode}</p>
        <p>This OTP will expire in ${expiresInMinutes} minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
>>>>>>> 0fff56d389b464a5f54398abde9b0033e0e323a0
      </div>
    `
  });
};
