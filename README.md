# DermaConnect

A telemedicine platform connecting dermatology patients with verified specialists. Patients submit skin condition photos and symptoms, book consultation slots, and consult with dermatologists. Doctors review cases, issue prescriptions, and manage their availability.

## Status

Early development. Core consultation loop is functional. Video consultations, in-app chat, and payment flows are planned.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Mantine, Tailwind CSS
- **Backend**: Self-hosted Supabase (PostgreSQL, GoTrue auth, Storage, Realtime)
- **Database**: PostgreSQL with Row Level Security on all tables
- **Auth**: Cookie-based sessions via `@supabase/ssr`

## Features

### Patients
- Submit skin condition with symptoms and images
- Browse verified dermatologists by specialization, rating, and fee
- Book consultation slots
- View prescriptions and consultation history
- Maintain medical history (allergies, medications, conditions)
- Rate and review consultations

### Doctors
- Dashboard with assigned cases
- Review patient symptoms, images, and medical history
- Issue e-prescriptions
- Manage availability with a slot system
- View patient ratings

## Architecture

```
src/
├── app/
│   ├── (patient)/          # Patient-only routes (protected)
│   ├── (doctor)/           # Doctor-only routes (protected)
│   ├── login/              # Public login
│   └── api/                # Route handlers
├── components/
│   ├── auth/               # Login, sign-out
│   ├── patient/            # Patient-facing components
│   └── doctor/             # Doctor-facing components
├── lib/
│   ├── supabase/           # Browser + server Supabase clients
│   └── auth.ts             # Session helpers
└── middleware.ts           # Route protection and session refresh
```

## Local Development

### Prerequisites

- Node.js 22+
- Docker Desktop
- Git

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/derma-connect.git
   cd derma-connect
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start self-hosted Supabase. Follow the instructions at [supabase.com/docs/guides/self-hosting/docker](https://supabase.com/docs/guides/self-hosting/docker). Then, in the `docker` folder:

   ```bash
   sh utils/generate-keys.sh
   sh utils/add-new-auth-keys.sh --update-env
   docker compose up -d
   ```

4. Configure environment variables. Create `.env.local` at the project root with:

   ```
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

5. Apply the database schema. Run the schema SQL in Supabase Studio at [http://localhost:8000](http://localhost:8000).

6. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Database Schema

Nine tables with Row Level Security:

- `profiles` — Patient and doctor profiles, shared table with role-based fields
- `medical_history` — Patient allergies, medications, conditions, surgeries
- `doctor_slots` — Doctor availability slots
- `consultations` — Consultation records and status
- `consultation_images` — References to skin images in Storage
- `prescriptions` — Issued prescriptions with structured medication data
- `ratings` — Patient ratings and reviews of doctors
- `consent_log` — DPDP Act consent records
- `audit_log` — Access audit trail

## Compliance Notes

This project is being built toward compliance with India's **Digital Personal Data Protection Act (DPDP Act, 2023)** and the **Telemedicine Practice Guidelines (2020)**.

Key considerations:

- Patient data must remain in India (data residency)
- Consent capture and audit logging are structurally built in
- Medical records must be preserved for at least 3 years
- Prescriptions must include doctor registration numbers

## Roadmap

- [x] Patient intake with image upload
- [x] Doctor catalogue and slot booking
- [x] Prescription issuance
- [x] Ratings and reviews
- [x] Medical history
- [ ] Video consultations
- [ ] In-app chat
- [ ] Email notifications
- [ ] Doctor verification workflow
- [ ] Admin panel
- [ ] Payment integration
- [ ] Mobile responsive UI

## License

<<<<<<< Updated upstream
Not yet licensed. All rights reserved.
=======
Not yet licensed. All rights reserved.
>>>>>>> Stashed changes
