import { Resend } from 'resend';

// Use onboarding@resend.dev until you verify your own domain
const FROM_EMAIL = 'DermaConnect <notifications@dermaconnect.me>';

export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set. Skipping email.');
    return;
  }

  try {
    const resend = new Resend(apiKey);
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
