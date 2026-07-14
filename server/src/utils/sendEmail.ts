import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Resend sends over HTTPS, which — unlike raw SMTP — isn't blocked by most
// PaaS hosts (Railway, Render, etc. commonly block outbound SMTP ports).
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Resend's shared sandbox sender. Works out of the box without verifying a
// custom domain, but can only deliver to the address used to sign up for
// Resend until a domain is verified.
const FROM_ADDRESS = process.env.EMAIL_FROM || 'NexusChat <onboarding@resend.dev>';

/**
 * Sends an email via the Resend API. If no API key is configured, the email
 * is logged to the console instead (useful for local development).
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!resend) {
    console.log('📧 [Email disabled] Would have sent email:');
    console.log(`   To: ${options.to}`);
    console.log(`   Subject: ${options.subject}`);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('📧 Failed to send email:', error.message);
    }
  } catch (err) {
    // Never let an email delivery failure break the caller's request flow
    // (e.g. password reset should still respond even if email fails).
    console.error('📧 Failed to send email:', (err as Error).message);
  }
}

/**
 * Builds a branded HTML password reset email.
 */
export function buildPasswordResetEmail(name: string, resetLink: string): string {
  return `
  <div style="font-family: Inter, Arial, sans-serif; background:#030307; color:#f1f5f9; padding:40px; border-radius:12px;">
    <h1 style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4); -webkit-background-clip:text; color:#6366f1;">NexusChat</h1>
    <h2>Reset your password</h2>
    <p style="color:#94a3b8;">Hi ${name}, we received a request to reset your NexusChat password. This link expires in 30 minutes.</p>
    <a href="${resetLink}" style="display:inline-block; margin-top:16px; padding:12px 24px; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; text-decoration:none; border-radius:8px; font-weight:600;">Reset Password</a>
    <p style="color:#64748b; margin-top:24px; font-size:13px;">If you didn't request this, you can safely ignore this email — your password will remain unchanged.</p>
    <p style="color:#64748b; margin-top:32px; font-size:12px;">NexusChat by Virendra Singh — IIIT Allahabad</p>
  </div>`;
}

/**
 * Builds a branded HTML invitation email for a workspace.
 */
export function buildInviteEmail(workspaceName: string, inviteLink: string): string {
  return `
  <div style="font-family: Inter, Arial, sans-serif; background:#030307; color:#f1f5f9; padding:40px; border-radius:12px;">
    <h1 style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4); -webkit-background-clip:text; color:#6366f1;">NexusChat</h1>
    <h2>You've been invited to join <strong>${workspaceName}</strong></h2>
    <p style="color:#94a3b8;">Join your team on NexusChat and start collaborating in real time.</p>
    <a href="${inviteLink}" style="display:inline-block; margin-top:16px; padding:12px 24px; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; text-decoration:none; border-radius:8px; font-weight:600;">Accept Invitation</a>
    <p style="color:#64748b; margin-top:32px; font-size:12px;">NexusChat by Virendra Singh — IIIT Allahabad</p>
  </div>`;
}
