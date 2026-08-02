# Struktur Proyek ChickenShii

Dokumen ini mencatat struktur yang relevan dengan aplikasi empat role. Folder dependency, cache, build, dan file instruksi tooling tidak ditampilkan.

```text
chikenshii/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── routes.py
│   │   │   └── workflow_routes.py
│   │   ├── core/config.py
│   │   ├── models/
│   │   │   ├── schemas.py
│   │   │   └── workflow_schemas.py
│   │   ├── services/
│   │   │   ├── ml_service.py
│   │   │   ├── supabase_service.py
│   │   │   └── workflow_service.py
│   │   └── utils/knowledge_base.py
│   ├── model/
│   └── tests/
├── mobile/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── result.tsx
│   │   ├── login.tsx
│   │   ├── admin/
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   └── (tabs)/
│   │   │       ├── _layout.tsx
│   │   │       ├── index.tsx
│   │   │       ├── history.tsx
│   │   │       └── workers.tsx
│   │   ├── doctor/
│   │   │   ├── _layout.tsx
│   │   │   └── (tabs)/
│   │   │       ├── _layout.tsx
│   │   │       ├── index.tsx
│   │   │       └── history.tsx
│   │   └── head-worker/
│   │       ├── _layout.tsx
│   │       └── (tabs)/
│   │           ├── _layout.tsx
│   │           ├── index.tsx
│   │           └── follow-ups.tsx
│   ├── components/
│   │   ├── RoleGuard.tsx
│   │   └── workflow/
│   │       ├── FollowUpActionPanel.tsx
│   │       ├── StaffScreenHeader.tsx
│   │       ├── ValidationModal.tsx
│   │       ├── WorkflowCaseCard.tsx
│   │       ├── WorkflowCaseDetails.tsx
│   │       ├── WorkflowDetailModal.tsx
│   │       ├── WorkflowStateView.tsx
│   │       └── WorkflowStatusBadge.tsx
│   ├── providers/AuthProvider.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── staffApi.ts
│   │   ├── supabase.ts
│   │   └── workflow.ts
│   ├── types/workflow.ts
│   ├── utils/
│   │   ├── apiSecurity.ts
│   │   ├── auth.ts
│   │   ├── staffAccount.ts
│   │   └── workflow.ts
│   └── tests/
├── supabase/
│   └── migrations/
│       └── 20260802090000_add_staff_workflow.sql
├── diagram/
├── panduan/
└── result/
```

## Backend

- `routes.py`: health, inference, penyimpanan prediksi, statistik Admin, dan pembuatan akun staf.
- `workflow_routes.py`: empat endpoint Dokter dan lima endpoint Kepala Pekerja.
- `workflow_schemas.py`: tipe verdict, status, filter, dan response workflow.
- `workflow_service.py`: query antrean/riwayat/dashboard, label efektif, rekomendasi, pagination, dan transisi.
- `supabase_service.py`: validasi Auth/role serta provisioning akun Auth + `staff_profiles`.

## Mobile

- `app/login.tsx` adalah form login bersama. `app/admin/login.tsx` dipertahankan sebagai redirect kompatibilitas.
- `AuthProvider`, `RoleGuard`, dan `utils/auth.ts` menyediakan session serta pemetaan role ke route.
- `services/api.ts` adalah client anonim untuk deteksi/penyimpanan pekerja dan dapat diarahkan ke URL khusus tanpa pernah membaca sesi staf.
- `services/staffApi.ts` selalu memakai `API_URL` bawaan dan hanya memasang Bearer token bila origin tujuan sama persis; `utils/apiSecurity.ts` menolak tujuan asing dan URL tidak valid.
- Tab Admin `workers.tsx` sekarang berlabel `Pengguna` dan memuat dua segmen: pekerja kandang serta akun staf.
- Route `/doctor` sudah memuat tepat dua tab fisik, `Validasi` (`index.tsx`) dan `Riwayat` (`history.tsx`).
- Route `/head-worker` sudah memuat tepat dua tab fisik, `Dashboard` (`index.tsx`) dan `Tindak Lanjut` (`follow-ups.tsx`).
- `components/workflow/` menyediakan kartu/detail kasus, status, state loading/empty/error, modal validasi, dan panel aksi tindak lanjut yang digunakan bersama. Detail/form tetap berupa modal, bukan route atau tab tambahan.
- `services/workflow.ts`, `types/workflow.ts`, dan `utils/workflow.ts` menyediakan endpoint melalui `staffApi`, kontrak tipe, pemetaan error, format data, dan aturan ketersediaan aksi.

## Database

Migration workflow membuat `staff_profiles`, `prediction_validations`, dan `prediction_followups`, trigger pembuatan follow-up penyakit, constraint transisi, policy Admin khusus, privilege service role, dan bootstrap existing Auth users menjadi Admin.

## Diagram

Folder `diagram/` memakai satu file Markdown bernama `penjelasan diagram <nama>.md` per diagram sebagai petunjuk menggambar di Visual Paradigm Online. File Mermaid dan aset `.drawio` lama sudah dihapus; panduan Markdown tersebut menjadi satu-satunya sumber diagram.

## Catatan status struktur

Dokumen PRD/SRS/SDD menjelaskan kontrak akhir fitur. Struktur di atas mengikuti file aktual setelah layar Dokter dan Kepala Pekerja diimplementasikan. Status pengujian aktual tetap dicatat terpisah pada `HASIL_PENGUJIAN.md`.
