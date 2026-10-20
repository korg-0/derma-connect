'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SignOutButton from '@/components/auth/SignOutButton';

export default function Sidebar({ role }: { role: 'patient' | 'doctor' }) {
  const pathname = usePathname();

  const patientLinks = [
    { name: 'Home', href: '/dashboard' },
    { name: 'Messages', href: '/messages' },
    { name: 'My Consultations', href: '/consult/history' },
    { name: 'Find Doctors', href: '/doctors' },
    { name: 'Medical History', href: '/profile/history' },
  ];

  const doctorLinks = [
    { name: 'Dashboard', href: '/doctor/dashboard' },
    { name: 'My Profile', href: '/doctor/profile' },
    { name: 'My Cases', href: '/doctor/dashboard/cases'},
    { name: 'Messages', href: '/messages' },
    { name: 'Availability', href: '/doctor/availability' },
  ];

  const links = role === 'patient' ? patientLinks : doctorLinks;

  return (
    <aside style={{
      width: 260,
      borderRight: '1px solid #e5e7eb',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #e5e7eb' }}>
        <h2 style={{ margin: 0, fontSize: 20, color: '#0070f3' }}>DermaConnect</h2>
      </div>

      <nav style={{ flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.name}
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                borderRadius: 8,
                textDecoration: 'none',
                color: isActive ? '#0070f3' : '#4b5563',
                background: isActive ? '#eff6ff' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <span style={{ fontSize: 18 }}>{link.icon}</span>
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: 20, borderTop: '1px solid #e5e7eb' }}>
        <SignOutButton />
      </div>
    </aside>
  );
}