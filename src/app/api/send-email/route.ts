import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { bookingConfirmationEmail, prescriptionIssuedEmail } from '@/lib/email/templates';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, to, doctorName, patientName, consultationUrl } = body;

    if (!to) {
      return NextResponse.json({ error: 'Missing recipient email' }, { status: 400 });
    }

    let subject = '';
    let html = '';

    if (type === 'booking') {
      subject = `New Consultation Booked by ${patientName}`;
      html = bookingConfirmationEmail(doctorName, patientName);
    } else if (type === 'prescription') {
      subject = 'Your Prescription is Ready';
      html = prescriptionIssuedEmail(doctorName, patientName, consultationUrl);
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    const result = await sendEmail(to, subject, html);

    if (!result) {
      return NextResponse.json({ error: 'Email sending is not configured' }, { status: 503 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
