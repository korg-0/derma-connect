export default function RefundPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 40, lineHeight: 1.6 }}>
      <h1>Refund & Cancellation Policy</h1>
      
      <h2>1. Cancellation by Patient</h2>
      <ul>
        <li><strong>Before Doctor Approval:</strong> If you cancel your slot request before the doctor approves, no payment is taken, and the slot is freed.</li>
        <li><strong>After Doctor Approval but Before Payment:</strong> The slot will be held for 6 hours. If payment is not made, the request is automatically cancelled, and the slot is freed.</li>
        <li><strong>After Payment:</strong> If you cancel after paying, a refund will be processed <strong>only if</strong> the cancellation is made at least 2 hours before the scheduled slot time.</li>
      </ul>

      <h2>2. Cancellation by Doctor</h2>
      <p>If the doctor cancels the appointment, you will receive a <strong>100% refund</strong> of the consultation fee, and the slot will be freed.</p>

      <h2>3. No-Show</h2>
      <p>If you do not join the video consultation within 15 minutes of the scheduled time, it will be marked as a "No-Show" and no refund will be provided.</p>

      <h2>4. Refund Timeline</h2>
      <p>Approved refunds will be credited to the original payment method within 5-7 business days.</p>
    </div>
  );
}