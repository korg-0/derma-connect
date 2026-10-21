'use client';

import { useState } from 'react';
import RescheduleModal from './RescheduleModal';

export default function RescheduleButton({ 
  consultationId, 
  oldSlotId, 
  doctorId 
}: { 
  consultationId: string, 
  oldSlotId: string, 
  doctorId: string 
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{ 
          padding: '8px 16px', 
          background: 'white', 
          border: '1px solid #d1d5db', 
          borderRadius: 6, 
          color: '#374151', 
          cursor: 'pointer', 
          fontSize: 14, 
          marginLeft: 12 
        }}
      >
        Reschedule Appointment
      </button>
      
      {isOpen && (
        <RescheduleModal
          consultationId={consultationId}
          oldSlotId={oldSlotId}
          doctorId={doctorId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}