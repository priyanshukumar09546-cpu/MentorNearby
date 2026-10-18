// ============================================================
// services/emailService.js
// Production-Grade Email Notification Service for MentorNearby
// Strictly enforces Resend HTTPS API (Port 443) in Production
// Zero SMTP in Production (Render Container Egress Firewall Blocks Ports 25/465/587)
// ============================================================

const nodemailer = require('nodemailer');

// Detect production hosting environment (Render container or production NODE_ENV)
const isProductionRuntime = () => {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    Boolean(process.env.RENDER_SERVICE_ID) ||
    Boolean(process.env.IS_RENDER)
  );
};

// Cached configuration to avoid DB roundtrips on every call
let cachedResendApiKey = (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) ? process.env.RESEND_API_KEY.trim() : null;
let cachedEmailFrom = (process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes('@gmail.com')) ? process.env.EMAIL_FROM.trim() : 'MentorNearby Team <notifications@mentornearby.com>';

/**
 * Dynamically resolve RESEND_API_KEY from environment or MongoDB AdminConfig
 */
const getResendApiKey = async () => {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) {
    cachedResendApiKey = process.env.RESEND_API_KEY.trim();
    return cachedResendApiKey;
  }
  try {
    const AdminConfig = require('../models/AdminConfig');
    const doc = await AdminConfig.findOne({ key: 'RESEND_API_KEY' });
    if (doc && doc.value && typeof doc.value === 'string' && doc.value.startsWith('re_')) {
      cachedResendApiKey = doc.value.trim();
      return cachedResendApiKey;
    }
  } catch (_) {}
  return cachedResendApiKey;
};

/**
 * Dynamically resolve sender identity
 */
const getEmailSender = async () => {
  try {
    const AdminConfig = require('../models/AdminConfig');
    const doc = await AdminConfig.findOne({ key: 'EMAIL_FROM' });
    if (doc && doc.value && typeof doc.value === 'string' && doc.value.trim()) {
      const val = doc.value.trim();
      // Resend does not allow sending from @gmail.com
      if (!val.toLowerCase().includes('@gmail.com')) {
        cachedEmailFrom = val;
        return cachedEmailFrom;
      }
    }
  } catch (_) {}

  const envFrom = process.env.EMAIL_FROM || process.env.RESEND_FROM;
  if (envFrom && envFrom.trim()) {
    const cleanFrom = envFrom.trim();
    if (!cleanFrom.toLowerCase().includes('@gmail.com')) {
      cachedEmailFrom = cleanFrom;
      return cachedEmailFrom;
    }
  }

  // Default verified sender identity for MentorNearby
  return cachedEmailFrom || 'MentorNearby Team <notifications@mentornearby.com>';
};

/**
 * Refresh email configuration cache from MongoDB
 */
const refreshEmailConfig = async () => {
  await Promise.all([getResendApiKey(), getEmailSender()]);
  return {
    isConfigured: isConfigured(),
    activeProvider: getActiveProvider(),
    hasResendApiKey: Boolean(cachedResendApiKey),
    emailFrom: cachedEmailFrom,
  };
};

// Local Development SMTP Transporter (Only initialized outside production)
let devTransporter = null;
const SMTP_HOST = process.env.SMTP_HOST || process.env.EMAIL_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT, 10) || 587;
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
const IS_DEV_SMTP_CONFIGURED = !isProductionRuntime() && Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

if (IS_DEV_SMTP_CONFIGURED) {
  devTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    family: 4,
    tls: { ciphers: 'SSLv3', rejectUnauthorized: false },
    connectionTimeout: 4000,
  });
}

/**
 * Primary sendEmail dispatcher
 * @param {Object} options - { to, subject, html, text, from, replyTo }
 * @returns {Promise<{ success: boolean, messageId?: string, provider?: string, stub?: boolean, error?: string }>}
 */
const sendEmail = async (options) => {
  const { to, subject, html, text, replyTo } = options;

  if (!to) {
    return { success: false, error: 'Recipient email address (to) is required' };
  }

  // Handle suppression for test domains
  if (to.endsWith('@example.com') || to.endsWith('@test.com')) {
    console.log(`\n📧 [TEST MODE] Suppressed email to test domain: ${to}`);
    return { success: true, messageId: `test_${Date.now()}`, stub: true, provider: 'TEST' };
  }

  const resendApiKey = await getResendApiKey();
  const defaultFrom = await getEmailSender();
  const senderFrom = options.from || defaultFrom;

  // ── 1. PRIMARY PRODUCTION ENGINE: RESEND HTTPS REST API (Port 443) ──
  if (resendApiKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: senderFrom,
          to: [to],
          subject,
          html,
          text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
          reply_to: replyTo,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const resData = await response.json();

      if (!response.ok) {
        const errorMsg = resData?.message || resData?.error || `Resend API returned status ${response.status}`;
        console.error('❌ [RESEND API REJECTED]:', errorMsg);
        return {
          success: false,
          error: `Resend API error: ${errorMsg}`,
          provider: 'RESEND',
          failed: true,
        };
      }

      console.log(`✅ [RESEND EMAIL SENT] Message ID: ${resData.id} to ${to}`);
      return {
        success: true,
        messageId: resData.id,
        provider: 'RESEND',
      };
    } catch (resendErr) {
      clearTimeout(timeoutId);
      const isTimeout = resendErr.name === 'AbortError' || resendErr.message.includes('aborted');
      const errorMsg = isTimeout ? 'Resend HTTPS API request timed out after 9 seconds' : resendErr.message;
      console.error('❌ [RESEND DISPATCH FAILED]:', errorMsg);
      return {
        success: false,
        error: errorMsg,
        provider: 'RESEND',
        failed: true,
      };
    }
  }

  // ── 2. PRODUCTION HARD STOP: NEVER ATTEMPT SMTP IN PRODUCTION ──
  if (isProductionRuntime()) {
    console.warn('⚠️ [EMAIL BLOCKED] RESEND_API_KEY is not configured in production.');
    return {
      success: false,
      error: 'Production email delivery requires RESEND_API_KEY. Cloud hosting (Render) blocks SMTP ports (25/465/587). Please configure RESEND_API_KEY in Render environment variables or Admin Settings to enable email dispatch over HTTPS port 443.',
      provider: 'RESEND',
      failed: true,
    };
  }

  // ── 3. LOCAL DEVELOPMENT ONLY: OPTIONAL DEV SMTP ──
  if (devTransporter) {
    try {
      const mailOptions = {
        from: senderFrom,
        to,
        subject,
        html,
        text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
        replyTo,
      };
      const info = await devTransporter.sendMail(mailOptions);
      console.log(`✅ [DEV SMTP EMAIL SENT] Message ID: ${info.messageId} to ${to}`);
      return {
        success: true,
        messageId: info.messageId,
        provider: 'SMTP',
      };
    } catch (smtpErr) {
      console.warn('⚠️ [DEV SMTP FAILED]:', smtpErr.message);
      return {
        success: false,
        error: `Dev SMTP failed: ${smtpErr.message}`,
        provider: 'SMTP',
        failed: true,
      };
    }
  }

  // ── 4. DEVELOPMENT STUB MODE ──
  console.log('\n📧 [EMAIL DEV STUB] (No credentials configured):');
  console.log(`  To: ${to}`);
  console.log(`  From: ${senderFrom}`);
  console.log(`  Subject: ${subject}`);
  return {
    success: true,
    messageId: `stub_${Date.now()}`,
    stub: true,
    provider: 'STUB',
  };
};

// ============================================================
// Email Templates & Themes
// ============================================================

const emailTemplates = {
  base: (content, meta = {}) => {
    const previewText = meta.previewText
      ? `<div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${meta.previewText}</div>`
      : '';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MentorNearby</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background: #0b1329; color: #1e293b; -webkit-font-smoothing: antialiased; }
          .wrapper { width: 100%; background: #0b1329; padding: 36px 12px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 36px rgba(0,0,0,0.25); border: 1px solid rgba(255, 255, 255, 0.1); }
          .header { background: #0f172a; padding: 32px 36px; text-align: center; border-bottom: 2px solid #f59e0b; }
          .header-brand { font-size: 24px; font-weight: 800; color: #ffffff; text-decoration: none; letter-spacing: -0.5px; }
          .header-brand span { color: #f59e0b; }
          .header-tagline { color: #94a3b8; margin: 6px 0 0; font-size: 13px; font-weight: 500; }
          .body { padding: 36px 36px 28px; line-height: 1.65; color: #334155; }
          .body h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px; line-height: 1.3; }
          .body p { font-size: 15px; color: #334155; line-height: 1.65; margin: 0 0 16px; }
          .btn { display: inline-block; background: #0f172a; color: #ffffff !important; padding: 13px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; margin: 12px 0 20px; text-align: center; border: 1px solid #1e293b; }
          .btn-accent { background: #f59e0b; color: #0f172a !important; border: none; }
          .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .alert-card-success { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0; color: #166534; }
          .alert-card-warning { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0; color: #92400e; }
          .alert-card-danger { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 20px 0; color: #991b1b; }
          .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
          .footer { background: #f8fafc; padding: 24px 36px; text-align: center; border-top: 1px solid #e2e8f0; }
          .footer p { font-size: 12px; color: #64748b; margin: 4px 0; line-height: 1.5; }
          .footer a { color: #0284c7; text-decoration: none; }
          .tag-badge { display: inline-block; background: #e2e8f0; color: #334155; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; margin: 2px 4px 2px 0; }
        </style>
      </head>
      <body>
        ${previewText}
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <a href="https://mentornearby.com" class="header-brand">Mentor<span>Nearby</span></a>
              <p class="header-tagline">Find. Learn. Grow. • Home & Online Tuition</p>
            </div>
            <div class="body">${content}</div>
            <div class="footer">
              <p><strong>MentorNearby</strong> — India's trusted platform for finding verified home and online tutors.</p>
              <p>© ${new Date().getFullYear()} MentorNearby. All rights reserved.</p>
              <p>Website: <a href="https://mentornearby.com">https://mentornearby.com</a> | <a href="https://mentornearby.com/contact">Contact Support</a></p>
              <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">You received this transactional email in relation to your MentorNearby account.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  },
};

// ============================================================
// Specialized Transactional Email Senders
// ============================================================

/**
 * TASK 1: Admin Tutor Approval Email
 */
const sendTutorApprovalEmail = async ({
  to,
  teacherName = 'Tutor',
  missingDetailsList = [],
  customMessage = '',
  actionUrl = 'https://mentornearby.com/tutor/dashboard',
}) => {
  const missingSectionHtml =
    missingDetailsList && missingDetailsList.length > 0
      ? `
      <div class="alert-card-warning" style="margin-top: 20px;">
        <h4 style="margin: 0 0 8px; font-size: 14px; color: #92400e;">💡 Profile Completion Recommendations</h4>
        <p style="margin: 0 0 10px; font-size: 13.5px; color: #78350f;">
          To make your profile more useful to prospective students and rank higher in search, please review any incomplete details listed below:
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; color: #78350f; line-height: 1.6;">
          ${missingDetailsList.map((item) => `<li><strong>${item.title || item}</strong>${item.tip ? ` — ${item.tip}` : ''}</li>`).join('')}
        </ul>
        <p style="margin: 10px 0 0; font-size: 13px; color: #78350f;">
          You can update these details anytime from your MentorNearby account.
        </p>
      </div>
    `
      : '';

  const missingSectionText =
    missingDetailsList && missingDetailsList.length > 0
      ? `\nTo make your profile more useful to prospective students, please review any incomplete details listed below:\n` +
        missingDetailsList.map((item) => `- ${item.title || item}${item.tip ? ` (${item.tip})` : ''}`).join('\n') +
        `\nYou can update these details from your MentorNearby account.\n`
      : '';

  const customNotesHtml = customMessage
    ? `
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin: 18px 0; font-size: 14px; color: #1e40af;">
        <strong>Note from MentorNearby Review Team:</strong><br/>
        ${customMessage.replace(/\n/g, '<br/>')}
      </div>
    `
    : '';

  const contentHtml = `
    <h2>Congratulations! 🎉</h2>
    <p>Hi <strong>${teacherName}</strong>,</p>
    <p>Congratulations!</p>
    <p>Your tutor profile has been reviewed and approved by the MentorNearby team.</p>
    <p>You can now be discovered by students looking for tutors in your area.</p>

    <div class="alert-card-success">
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">✅ What happens next?</div>
      <div style="font-size: 13.5px; line-height: 1.5;">
        • Your profile is now visible on the MentorNearby tutor directory and local search.<br/>
        • Students in your city can discover your teaching offerings and contact you.<br/>
        • You can manage your availability schedule and subject rates from your dashboard.
      </div>
    </div>

    ${missingSectionHtml}
    ${customNotesHtml}

    <div style="text-align: center; margin: 28px 0;">
      <a href="${actionUrl}" class="btn btn-accent" style="font-size: 16px; padding: 14px 32px;">Go to Tutor Dashboard →</a>
    </div>

    <p style="margin-top: 24px;">Thank you for joining MentorNearby.</p>
    <p style="margin-bottom: 0;">
      Best wishes,<br/>
      <strong>Team MentorNearby</strong><br/>
      <em>Find. Learn. Grow.</em><br/>
      <a href="https://mentornearby.com" style="color: #f59e0b; text-decoration: none;">https://mentornearby.com</a>
    </p>
  `;

  const textContent = `
Hi ${teacherName},

Congratulations!

Your tutor profile has been reviewed and approved by the MentorNearby team.

You can now be discovered by students looking for tutors in your area.
${missingSectionText}
${customMessage ? `\nNote from Review Team:\n${customMessage}\n` : ''}
Manage your profile and dashboard here: ${actionUrl}

Thank you for joining MentorNearby.

Best wishes,
Team MentorNearby
Find. Learn. Grow.
https://mentornearby.com
  `.trim();

  return sendEmail({
    to,
    subject: 'Congratulations! Your MentorNearby Tutor Profile Has Been Approved 🎉',
    html: emailTemplates.base(contentHtml, {
      previewText: `Congratulations ${teacherName}! Your tutor profile has been approved on MentorNearby.`,
    }),
    text: textContent,
  });
};

/**
 * TASK 1: Admin Tutor Unapproval / Action Required Email
 */
const sendTutorUnapprovalEmail = async ({
  to,
  teacherName = 'Tutor',
  reasonsList = [],
  adminExplanation = '',
  correctionChecklist = [],
  customMessage = '',
  actionUrl = 'https://mentornearby.com/tutor/profile',
}) => {
  const formattedReasons =
    reasonsList && reasonsList.length > 0
      ? reasonsList.map((r) => `<li><strong>${r}</strong></li>`).join('')
      : adminExplanation
      ? `<li><strong>${adminExplanation}</strong></li>`
      : '<li><strong>Profile information requires review and correction</strong></li>';

  const checklistHtml =
    correctionChecklist && correctionChecklist.length > 0
      ? `
      <div style="margin: 16px 0; padding: 14px 18px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 8px;">Requested Updates:</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
          ${correctionChecklist.map((c) => `<li>${c}</li>`).join('')}
        </ul>
      </div>
    `
      : '';

  const contentHtml = `
    <h2>Profile Update Required</h2>
    <p>Hi <strong>${teacherName}</strong>,</p>
    <p>Thank you for registering with MentorNearby.</p>
    <p>During our review, we found that some information needs to be corrected or verified before your profile can be approved.</p>

    <div class="alert-card-danger">
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px;">Required corrections:</div>
      <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; line-height: 1.6;">
        ${formattedReasons}
      </ul>
      ${
        adminExplanation && !reasonsList.includes(adminExplanation)
          ? `<p style="margin: 10px 0 0; font-size: 13.5px;"><em>Details:</em> ${adminExplanation}</p>`
          : ''
      }
      ${checklistHtml}
    </div>

    ${
      customMessage
        ? `<div style="background: #f8fafc; border-left: 4px solid #64748b; padding: 12px 16px; margin: 18px 0; font-size: 13.5px; color: #334155;">${customMessage.replace(/\n/g, '<br/>')}</div>`
        : ''
    }

    <p>Please log in to your MentorNearby account and update the requested information. Once the corrections are complete, follow the available resubmission process, or contact the MentorNearby team if you need assistance.</p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${actionUrl}" class="btn" style="background: #0f172a; font-size: 15px; padding: 14px 28px;">Update Profile & Resubmit →</a>
    </div>

    <p>We appreciate your cooperation.</p>
    <p style="margin-bottom: 0;">
      Best wishes,<br/>
      <strong>Team MentorNearby</strong><br/>
      <em>Find. Learn. Grow.</em><br/>
      <a href="https://mentornearby.com" style="color: #f59e0b; text-decoration: none;">https://mentornearby.com</a>
    </p>
  `;

  const textContent = `
Hi ${teacherName},

Thank you for registering with MentorNearby.

During our review, we found that some information needs to be corrected or verified before your profile can be approved.

Required corrections:
${reasonsList.length > 0 ? reasonsList.map((r) => `- ${r}`).join('\n') : `- ${adminExplanation || 'Profile information requires review'}`}
${adminExplanation && !reasonsList.includes(adminExplanation) ? `\nDetails: ${adminExplanation}\n` : ''}
${correctionChecklist.length > 0 ? `\nItems to update:\n` + correctionChecklist.map((c) => `- ${c}`).join('\n') : ''}

Please log in to your MentorNearby account and update the requested information. Once the corrections are complete, follow the available resubmission process, or contact the MentorNearby team if you need assistance:
${actionUrl}

We appreciate your cooperation.

Best wishes,
Team MentorNearby
Find. Learn. Grow.
https://mentornearby.com
  `.trim();

  return sendEmail({
    to,
    subject: 'Action Required: Please Update Your MentorNearby Tutor Profile',
    html: emailTemplates.base(contentHtml, {
      previewText: `Action Required: Please update your MentorNearby tutor profile.`,
    }),
    text: textContent,
  });
};

/**
 * TASK 2: Password Reset Email
 */
const sendPasswordResetEmail = async ({
  to,
  userName,
  resetUrl,
  expiryMinutes = 10,
}) => {
  const recipientName = userName && userName.trim() ? userName.trim() : 'there';

  const contentHtml = `
    <h2>Reset Your MentorNearby Password</h2>
    <p>Hi <strong>${recipientName}</strong>,</p>
    <p>We received a request to reset your MentorNearby password.</p>
    <p>Use the secure link below to choose a new password:</p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" class="btn btn-accent" style="font-size: 16px; padding: 14px 32px; font-weight: 700;">Reset Password →</a>
    </div>

    <div class="info-card" style="font-size: 13px; color: #475569;">
      <p style="margin: 0 0 6px;">🔒 <strong>Security Notice:</strong></p>
      <p style="margin: 0 0 6px;">• If you did not request this change, you can ignore this email. Your password will not change unless the reset process is completed.</p>
      <p style="margin: 0;">• For your security, this link expires after <strong>${expiryMinutes} minutes</strong> and can only be used once.</p>
    </div>

    <p style="font-size: 13px; color: #64748b; word-break: break-all; margin-top: 24px;">
      If the button above does not work, copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color: #0284c7;">${resetUrl}</a>
    </p>

    <p style="margin-top: 24px; margin-bottom: 0;">
      Best wishes,<br/>
      <strong>Team MentorNearby</strong>
    </p>
  `;

  const textContent = `
Subject: Reset Your MentorNearby Password

Hi ${recipientName},

We received a request to reset your MentorNearby password.

Use the secure link below to choose a new password:

${resetUrl}

If you did not request this change, you can ignore this email. Your password will not change unless the reset process is completed.

For your security, this link expires after ${expiryMinutes} minutes and can only be used once.

Best wishes,
Team MentorNearby
https://mentornearby.com
  `.trim();

  return sendEmail({
    to,
    subject: 'Reset Your MentorNearby Password',
    html: emailTemplates.base(contentHtml, {
      previewText: `MentorNearby password reset request for your account.`,
    }),
    text: textContent,
  });
};

// ============================================================
// Other Existing Transactional Notifications (Preserved)
// ============================================================

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
    <a href="${process.env.FRONTEND_URL || 'https://mentornearby.com'}/search" class="btn">Find a Tutor</a>
    <hr class="divider" />
    <p style="font-size: 13px; color: #94a3b8;">If you have any questions, visit our <a href="${process.env.FRONTEND_URL || 'https://mentornearby.com'}/contact" style="color: #1e3a5f;">support page</a>.</p>
  `;
  return sendEmail({
    to: user.email,
    subject: 'Welcome to MentorNearby!',
    html: emailTemplates.base(content),
  });
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
  return sendEmail({
    to: user.email,
    subject: 'Verify your MentorNearby email address',
    html: emailTemplates.base(content),
  });
};

const sendKycSubmittedEmail = async (user) => {
  const content = `
    <h2>KYC Submitted Successfully</h2>
    <p>Hi ${user.name}, your KYC documents have been submitted for review.</p>
    <p>Our team will review your documents within <strong>2-3 business days</strong>. You'll receive an email once the review is complete.</p>
    <span class="tag-badge" style="background:#fef3c7; color:#92400e;">⏳ Under Review</span>
    <hr class="divider" />
    <p>You can check your verification status anytime from your dashboard.</p>
    <a href="${process.env.FRONTEND_URL || 'https://mentornearby.com'}/tutor/dashboard" class="btn">View Dashboard</a>
  `;
  return sendEmail({
    to: user.email,
    subject: 'KYC Documents Submitted — MentorNearby',
    html: emailTemplates.base(content),
  });
};

const sendKycApprovedEmail = async (user) => {
  const content = `
    <h2>🎉 KYC Verification Approved!</h2>
    <p>Hi ${user.name}, great news! Your identity verification has been approved.</p>
    <span class="tag-badge" style="background:#dcfce7; color:#166534;">✅ Verified</span>
    <p style="margin-top: 16px;">Your tutor profile now shows a verification badge, helping students and parents trust your profile.</p>
    <a href="${process.env.FRONTEND_URL || 'https://mentornearby.com'}/tutor/dashboard" class="btn">View Your Profile</a>
  `;
  return sendEmail({
    to: user.email,
    subject: 'KYC Approved — You are now verified on MentorNearby!',
    html: emailTemplates.base(content),
  });
};

const sendKycRejectedEmail = async (user, reason) => {
  const content = `
    <h2>KYC Verification — Action Required</h2>
    <p>Hi ${user.name}, unfortunately we were unable to verify your identity documents.</p>
    <span class="tag-badge" style="background:#fee2e2; color:#991b1b;">❌ Rejected</span>
    ${reason ? `<p style="margin-top: 16px;"><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>You can resubmit your documents from your dashboard. Please ensure:</p>
    <ul style="color: #475569; line-height: 2;">
      <li>Documents are clear and readable</li>
      <li>Documents are not expired</li>
      <li>All required fields are visible</li>
    </ul>
    <a href="${process.env.FRONTEND_URL || 'https://mentornearby.com'}/tutor/kyc" class="btn">Resubmit Documents</a>
  `;
  return sendEmail({
    to: user.email,
    subject: 'KYC Verification — Action Required — MentorNearby',
    html: emailTemplates.base(content),
  });
};

const sendContactUnlockedEmail = async (student, tutor) => {
  const content = `
    <h2>Contact Unlocked!</h2>
    <p>Hi ${student.name}, you have successfully unlocked contact information for:</p>
    <p><strong>${tutor.name}</strong></p>
    <p>You can now view and use the tutor's contact details from your contact history.</p>
    <a href="${process.env.FRONTEND_URL || 'https://mentornearby.com'}/dashboard/contacts" class="btn">View Contact Details</a>
    <hr class="divider" />
    <p style="font-size: 13px; color: #94a3b8;">Remember: Please only contact tutors for genuine educational purposes. Misuse may result in account suspension.</p>
  `;
  return sendEmail({
    to: student.email,
    subject: `Contact Unlocked — ${tutor.name} — MentorNearby`,
    html: emailTemplates.base(content),
  });
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
    <a href="${process.env.FRONTEND_URL || 'https://mentornearby.com'}/dashboard" class="btn">Go to Dashboard</a>
  `;
  return sendEmail({
    to: user.email,
    subject: 'Payment Confirmed — MentorNearby',
    html: emailTemplates.base(content),
  });
};

const sendSystemTestEmail = async ({ to, recipientName = 'Admin', testMessage = '' }) => {
  const senderFrom = await getEmailSender();
  const content = `
    <h2>Resend Email Delivery Test ✅</h2>
    <p>Hi <strong>${recipientName}</strong>,</p>
    <p>This is a live test email sent directly from the <strong>MentorNearby</strong> backend using the <strong>Resend HTTPS REST API (Port 443)</strong>.</p>
    
    <div class="alert-card-success">
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">Delivery Pipeline Details:</div>
      <div style="font-size: 13.5px; line-height: 1.5;">
        • <strong>Provider:</strong> Resend REST API (HTTPS port 443)<br/>
        • <strong>Recipient:</strong> ${to}<br/>
        • <strong>Sender:</strong> ${senderFrom}<br/>
        • <strong>Timestamp:</strong> ${new Date().toISOString()}<br/>
        ${testMessage ? `• <strong>Custom Note:</strong> ${testMessage}` : ''}
      </div>
    </div>
    
    <p style="font-size: 13px; color: #64748b;">If you received this email, the MentorNearby production email delivery pipeline is verified and fully functional.</p>
  `;
  return sendEmail({
    to,
    subject: `MentorNearby System Test — Resend Delivery (${new Date().toLocaleTimeString('en-IN')})`,
    html: emailTemplates.base(content, { previewText: 'MentorNearby live Resend email delivery test' }),
    text: `MentorNearby Resend Delivery Test sent to ${to} at ${new Date().toISOString()}`,
  });
};

module.exports = {
  sendEmail,
  sendSystemTestEmail,
  sendTutorApprovalEmail,
  sendTutorUnapprovalEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendEmailVerification,
  sendKycSubmittedEmail,
  sendKycApprovedEmail,
  sendKycRejectedEmail,
  sendContactUnlockedEmail,
  sendPaymentConfirmationEmail,
  isConfigured: () => {
    if (isProductionRuntime()) {
      return Boolean(cachedResendApiKey || (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')));
    }
    return Boolean(
      cachedResendApiKey ||
      (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) ||
      devTransporter
    );
  },
  getActiveProvider: () => {
    if (cachedResendApiKey || (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_'))) {
      return 'RESEND';
    }
    if (isProductionRuntime()) {
      return 'RESEND'; // Resend HTTPS API is the only authorized engine in production
    }
    if (devTransporter) {
      return 'SMTP';
    }
    return 'STUB';
  },
  getResendApiKey,
  getEmailSender,
  refreshEmailConfig,
  isProductionRuntime,
};
