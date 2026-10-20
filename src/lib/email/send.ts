import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Use onboarding@resend.dev until you verify your own domain
const FROM_EMAIL = 'DermaConnect <notifications@dermaconnect.me>';

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set. Skipping email to', to);
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Resend error:', error);
      return { error };
    }
    return { data };
  } catch (err) {
    console.error('Failed to send email:', err);
    return { error: err };
  }
}