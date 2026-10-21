'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SignOutButton from '@/components/auth/SignOutButton';

export default function AdminSidebar() {
  const pathname = usePathname();

  const links: { name: string; href: string; icon?: string }[] = [
    { name: 'Verification Queue', href: '/admin/dashboard',  },
    { name: 'Doctors', href: '/admin/dashboard/doctors',  },
    { name: 'Patients', href: '/admin/dashboard/patients',  },
    { name: 'Prescriptions', href: '/admin/dashboard/prescriptions',  },
    { name: 'Consent & Audits', href: '/admin/dashboard/logs',  },
  ];

  return (
    <aside style={{
      width: 260, borderRight: '1px solid #e5e7eb', height: '100vh', position: 'fixed', left: 0, top: 0,
      background: '#111827', color: 'white', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #374151' }}>
        <h2 style={{ margin: 0, fontSize: 20, color: '#60a5fa' }}>DermaConnect</h2>
        <span style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Admin Console</span>
      </div>

      <nav style={{ flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 8, textDecoration: 'none',
                color: isActive ? 'white' : '#9ca3af',
                background: isActive ? '#1f2937' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <span style={{ fontSize: 18 }}>{link.icon}</span>
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: 20, borderTop: '1px solid #374151' }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/" style={{ color: '#9ca3af', fontSize: 14, textDecoration: 'none' }}>
            ← Back to Main App
          </Link>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
