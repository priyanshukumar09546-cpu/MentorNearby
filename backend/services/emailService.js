// ============================================================
// services/emailService.js
// Email notifications via Nodemailer
// Supports: Gmail SMTP (dev), any SMTP provider (prod)
// Falls back to stub/console mode when credentials not set
// ============================================================

const nodemailer = require('nodemailer');

const EMAIL_CONFIGURED =
  process.env.EMAIL_HOST &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASSWORD;

let transporter = null;

if (EMAIL_CONFIGURED) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });

  // Verify connection on startup (non-blocking)
  transporter.verify().then(() => {
    console.log('✅ Email service ready');
  }).catch((err) => {
    console.warn('⚠️  Email service connection failed:', err.message);
  });
} else {
  console.warn('⚠️  [DEV STUB] Email credentials not configured. Emails will be logged to console only.');
}

/**
 * Send an email
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async (options) => {
  const { to, subject, html, text } = options;

  if (!EMAIL_CONFIGURED || !transporter) {
    // Stub mode — log to console
    console.log('\n📧 [EMAIL STUB] Would send email:');
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body (text): ${text || '(html only)'}`);
    console.log('  (Configure EMAIL_* env vars to send real emails)\n');
    return { messageId: `stub_${Date.now()}`, stub: true };
  }

  if (to.endsWith('@example.com') || to.endsWith('@test.com')) {
    console.log(`\n📧 [TEST MODE] Suppressed email to test domain: ${to}`);
    return { messageId: `test_${Date.now()}`, stub: true };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `MentorNearby <${process.env.EMAIL_USER || 'noreply@mentornearby.com'}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Fallback text
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

// ============================================================
// Email Templates
// ============================================================

const emailTemplates = {
  base: (content) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MentorNearby</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; color: #1e293b; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: #1e3a5f; padding: 32px 40px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { color: #94a3b8; margin: 4px 0 0; font-size: 14px; }
        .body { padding: 40px; }
        .body h2 { font-size: 20px; color: #1e293b; margin: 0 0 16px; }
        .body p { font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 16px; }
        .btn { display: inline-block; background: #1e3a5f; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
        .btn-accent { background: #f59e0b; }
        .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
        .footer { background: #f8fafc; padding: 24px 40px; text-align: center; }
        .footer p { font-size: 12px; color: #94a3b8; margin: 4px 0; }
        .code { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 24px; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: #1e3a5f; text-align: center; margin: 16px 0; }
        .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MentorNearby</h1>
          <p>Find Trusted Tutors Near You</p>
        </div>
        <div class="body">${content}</div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} MentorNearby. All rights reserved.</p>
          <p>This email was sent to you because you have an account on MentorNearby.</p>
          <p>If you didn't request this, please ignore this email or <a href="${process.env.FRONTEND_URL}/contact" style="color: #1e3a5f;">contact support</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

// Individual email senders

const sendWelcomeEmail = async (user) => {
  const content = `
    <h2>Welcome to MentorNearby, ${user.name}! 🎉</h2>
    <p>We're excited to have you on board. MentorNearby connects students and parents with verified, trusted tutors in your area.</p>
    <p>Here's what you can do next:</p>
    <ul style="color: #475569; line-height: 2;">
      <li>Complete your profile</li>
      <li>Search for tutors near you</li>
      <li>Compare tutors by subject, location, and fees</li>
      <li>Unlock tutor contact information</li>
    </ul>
    <a href="${process.env.FRONTEND_URL}/search" class="btn">Find a Tutor</a>
    <hr class="divider" />
    <p style="font-size: 13px; color: #94a3b8;">If you have any questions, visit our <a href="${process.env.FRONTEND_URL}/contact" style="color: #1e3a5f;">support page</a>.</p>
  `;
  return sendEmail({ to: user.email, subject: 'Welcome to MentorNearby!', html: emailTemplates.base(content) });
};

const sendEmailVerification = async (user, verificationUrl) => {
  const content = `
    <h2>Verify your email address</h2>
    <p>Hi ${user.name}, please verify your email address to activate your MentorNearby account.</p>
    <a href="${verificationUrl}" class="btn">Verify Email Address</a>
    <p style="font-size: 13px; color: #94a3b8;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
    <hr class="divider" />
    <p style="font-size: 13px; color: #94a3b8;">Or copy this link: <br/><a href="${verificationUrl}" style="color: #1e3a5f; word-break: break-all;">${verificationUrl}</a></p>
  `;
  return sendEmail({ to: user.email, subject: 'Verify your MentorNearby email address', html: emailTemplates.base(content) });
};

const sendPasswordResetEmail = async (user, resetUrl) => {
  const content = `
    <h2>Reset your password</h2>
    <p>Hi ${user.name}, we received a request to reset your MentorNearby password.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p style="font-size: 13px; color: #94a3b8;">This link expires in 10 minutes. If you didn't request a password reset, please ignore this email — your password will not be changed.</p>
    <hr class="divider" />
    <p style="font-size: 13px; color: #94a3b8;">Or copy this link: <br/><a href="${resetUrl}" style="color: #1e3a5f; word-break: break-all;">${resetUrl}</a></p>
  `;
  return sendEmail({ to: user.email, subject: 'Reset your MentorNearby password', html: emailTemplates.base(content) });
};

const sendKycSubmittedEmail = async (user) => {
  const content = `
    <h2>KYC Submitted Successfully</h2>
    <p>Hi ${user.name}, your KYC documents have been submitted for review.</p>
    <p>Our team will review your documents within <strong>2-3 business days</strong>. You'll receive an email once the review is complete.</p>
    <span class="badge badge-warning">⏳ Under Review</span>
    <hr class="divider" />
    <p>You can check your verification status anytime from your dashboard.</p>
    <a href="${process.env.FRONTEND_URL}/tutor/dashboard" class="btn">View Dashboard</a>
  `;
  return sendEmail({ to: user.email, subject: 'KYC Documents Submitted — MentorNearby', html: emailTemplates.base(content) });
};

const sendKycApprovedEmail = async (user) => {
  const content = `
    <h2>🎉 KYC Verification Approved!</h2>
    <p>Hi ${user.name}, great news! Your identity verification has been approved.</p>
    <span class="badge">✅ Verified</span>
    <p style="margin-top: 16px;">Your tutor profile now shows a verification badge, helping students and parents trust your profile.</p>
    <a href="${process.env.FRONTEND_URL}/tutor/dashboard" class="btn">View Your Profile</a>
  `;
  return sendEmail({ to: user.email, subject: 'KYC Approved — You are now verified on MentorNearby!', html: emailTemplates.base(content) });
};

const sendKycRejectedEmail = async (user, reason) => {
  const content = `
    <h2>KYC Verification — Action Required</h2>
    <p>Hi ${user.name}, unfortunately we were unable to verify your identity documents.</p>
    <span class="badge badge-danger">❌ Rejected</span>
    ${reason ? `<p style="margin-top: 16px;"><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>You can resubmit your documents from your dashboard. Please ensure:</p>
    <ul style="color: #475569; line-height: 2;">
      <li>Documents are clear and readable</li>
      <li>Documents are not expired</li>
      <li>All required fields are visible</li>
    </ul>
    <a href="${process.env.FRONTEND_URL}/tutor/kyc" class="btn">Resubmit Documents</a>
  `;
  return sendEmail({ to: user.email, subject: 'KYC Verification — Action Required — MentorNearby', html: emailTemplates.base(content) });
};

const sendContactUnlockedEmail = async (student, tutor) => {
  const content = `
    <h2>Contact Unlocked!</h2>
    <p>Hi ${student.name}, you have successfully unlocked contact information for:</p>
    <p><strong>${tutor.name}</strong></p>
    <p>You can now view and use the tutor's contact details from your contact history.</p>
    <a href="${process.env.FRONTEND_URL}/dashboard/contacts" class="btn">View Contact Details</a>
    <hr class="divider" />
    <p style="font-size: 13px; color: #94a3b8;">Remember: Please only contact tutors for genuine educational purposes. Misuse may result in account suspension.</p>
  `;
  return sendEmail({ to: student.email, subject: `Contact Unlocked — ${tutor.name} — MentorNearby`, html: emailTemplates.base(content) });
};

const sendPaymentConfirmationEmail = async (user, paymentDetails) => {
  const content = `
    <h2>Payment Confirmed ✅</h2>
    <p>Hi ${user.name}, your payment has been processed successfully.</p>
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 16px 0;">
      <p style="margin: 4px 0; font-size: 14px;"><strong>Amount:</strong> ₹${paymentDetails.amount}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Purpose:</strong> ${paymentDetails.purpose}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Transaction ID:</strong> ${paymentDetails.paymentId}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
    <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Go to Dashboard</a>
  `;
  return sendEmail({ to: user.email, subject: 'Payment Confirmed — MentorNearby', html: emailTemplates.base(content) });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendKycSubmittedEmail,
  sendKycApprovedEmail,
  sendKycRejectedEmail,
  sendContactUnlockedEmail,
  sendPaymentConfirmationEmail,
};
