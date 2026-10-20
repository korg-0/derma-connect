export function bookingConfirmationEmail(doctorName: string, patientName: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0070f3;">New Consultation Booked</h2>
      <p>Hello Dr. ${doctorName},</p>
      <p>A new patient, <strong>${patientName}</strong>, has booked a consultation with you on DermaConnect.</p>
      <p>Please log in to your dashboard to review their skin images and medical history before the consultation.</p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/doctor/dashboard" style="display: inline-block; padding: 10px 20px; background: #0070f3; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">This is an automated message. Please do not reply.</p>
    </div>
  `;
}

export function prescriptionIssuedEmail(doctorName: string, patientName: string, consultationUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Your Prescription is Ready</h2>
      <p>Hello ${patientName},</p>
      <p>Dr. ${doctorName} has reviewed your case and issued a prescription.</p>
      <a href="${consultationUrl}" style="display: inline-block; padding: 10px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px;">View Prescription</a>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">This is an automated message. Please do not reply.</p>
    </div>
  `;
}