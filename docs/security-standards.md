# Security Standards - Monitoring UKPBJ Dinas Kesehatan

> **Scope note (audit 2026-10-17):** this is the expanded target/control checklist. The concise canonical baseline and current verified findings are in [SECURITY_STANDARD.md](SECURITY_STANDARD.md). Items phrased as “wajib” here are requirements, not proof that implementation/tests already exist. No contradiction should be resolved by weakening the concise baseline.

Dokumen ini menjadi standar keamanan aplikasi **Monitoring UKPBJ Dinas Kesehatan** sebelum development, staging, dan production release. Standar ini disusun untuk konteks sistem pengadaan pemerintah yang menyimpan data paket, RUP, kontrak, penyedia, progres, dokumen, laporan, risiko, dan histori audit.

## 1. Prinsip Keamanan Utama

### 1.1 Semua Data Pengadaan Adalah Data Terbatas

Data paket, RUP, kontrak, penyedia, nilai pagu, nilai kontrak, realisasi, dokumen, dan catatan risiko tidak boleh dianggap publik kecuali secara eksplisit ditandai sebagai data publik.

Keputusan:
- Semua API wajib membutuhkan autentikasi.
- Semua halaman internal wajib membutuhkan session valid.
- Semua data harus difilter berdasarkan role dan kewenangan unit.

Alasan:
Sistem ini dipakai untuk monitoring dan akuntabilitas pengadaan. Kebocoran data bisa berdampak pada proses tender, audit, dan kepercayaan institusi.

### 1.2 Authorization Harus Dicek di Server

UI boleh menyembunyikan tombol berdasarkan role, tetapi keputusan akses final wajib terjadi di server.

Keputusan:
- Jangan mengandalkan guard di frontend saja.
- Jangan percaya payload JWT tanpa verifikasi signature.
- Jangan percaya parameter dari client untuk menentukan user, unit, atau role.

Alasan:
Client-side code bisa dimodifikasi oleh pengguna. Server harus menjadi sumber kebenaran untuk akses data.

### 1.3 Auditability Lebih Penting Daripada Kenyamanan

Setiap perubahan penting harus bisa dilacak: siapa, kapan, dari mana, data sebelum, dan data sesudah.

Keputusan:
- Create, update, delete, approve, reject, import, export, dan escalation wajib tercatat di audit log.
- Perubahan status paket, RUP, kontrak, dokumen, dan risiko wajib punya actor yang valid.
- Jangan pernah fallback actor menjadi `"Sistem"` untuk aksi yang dilakukan user.

Alasan:
Produk ini kemungkinan akan dipakai dalam konteks pemeriksaan, pelaporan, dan pertanggungjawaban.

## 2. Authentication Standard

### 2.1 Login

Standar:
- Login hanya menerima email dan password yang tervalidasi.
- Password wajib diverifikasi dengan hashing kuat seperti bcrypt atau argon2.
- Error login harus generic.
- Login wajib dilindungi rate limiting.

Pesan yang benar:

```txt
Email atau password tidak valid.
```

Pesan yang harus dihindari:

```txt
Email tidak ditemukan.
Password salah.
Database tidak dapat dihubungi. Periksa DATABASE_URL.
```

### 2.2 Rate Limiting Login

Standar minimal:
- Maksimal 5 percobaan gagal per email + IP dalam 15 menit.
- Setelah limit tercapai, balas `429 Too Many Requests`.
- Tambahkan delay progresif bila memungkinkan.
- Catat percobaan gagal untuk audit.

Contoh kebijakan:

```txt
5 failed attempts / 15 minutes / IP + email
lock temporary for 15 minutes
log all failed attempts
```

### 2.3 Session Cookie

Standar cookie production:

```txt
HttpOnly = true
Secure = true
SameSite = Lax atau Strict
Path = /
Max-Age = sesuai kebijakan session
```

Ketentuan:
- Cookie session tidak boleh dapat dibaca JavaScript.
- Cookie production wajib `Secure`.
- Session harus invalid setelah logout.
- Session harus punya expiry.
- Gunakan secret kuat dari environment variable atau secret manager.

### 2.4 JWT

Standar:
- JWT wajib diverifikasi signature-nya sebelum payload dipercaya.
- Jangan membaca role dari token dengan decode manual seperti `atob()` tanpa verify.
- JWT secret minimal 32 karakter acak.
- Token tidak boleh menyimpan data sensitif selain identifier dan klaim akses minimal.

Payload yang diperbolehkan:

```json
{
  "sub": "user_id",
  "roles": ["PPK"],
  "iat": 1760230000,
  "exp": 1760316400
}
```

Payload yang harus dihindari:

```json
{
  "password": "...",
  "passwordHash": "...",
  "token": "...",
  "secret": "...",
  "fullSensitiveProfile": {}
}
```

## 3. Authorization Standard

### 3.1 Role-Based Access Control

Role minimal:

| Role | Akses Utama |
|---|---|
| `SUPER_ADMIN` | Semua fitur, manajemen user, konfigurasi sistem |
| `PA` | Monitoring dan approval level pengguna anggaran |
| `KPA` | Monitoring dan approval level kuasa pengguna anggaran |
| `PPK` | Kelola paket dan dokumen yang menjadi tanggung jawabnya |
| `POKJA` | Kelola tahapan pemilihan/tender sesuai penugasan |
| `AUDITOR` | Read-only laporan, histori, dan audit trail |
| `VIEWER` | Read-only data terbatas sesuai unit |

### 3.2 Server-Side Role Check

Setiap API wajib menjalankan:

1. Cek user login.
2. Cek role.
3. Cek scope unit/data.
4. Cek ownership atau assignment bila relevan.

Contoh standar:

```ts
const auth = await requireApiRole(["SUPER_ADMIN", "PPK"]);
if (auth.response) return auth.response;
```

### 3.3 Object-Level Authorization

Setiap akses detail by ID wajib dicek.

Contoh risiko:

```txt
User A membuka /api/paket/123 milik unit lain.
```

Standar fix:

```ts
const paket = await prisma.paketPengadaan.findFirst({
  where: {
    id: paketId,
    unitId: {
      in: auth.user.allowedUnitIds,
    },
  },
});

if (!paket) {
  return apiError("Data tidak ditemukan atau tidak dapat diakses.", 404);
}
```

Alasan:
Ini mencegah insecure direct object reference atau IDOR.

## 4. API Protection Standard

### 4.1 Semua API Internal Wajib Dilindungi

API berikut wajib protected:

- `/api/paket`
- `/api/rup`
- `/api/kontrak`
- `/api/realisasi`
- `/api/penyedia`
- `/api/laporan`
- `/api/dokumen`
- `/api/risiko`
- `/api/timeline`
- `/api/users`
- `/api/settings`

Pengecualian hanya boleh:

- `/api/auth/login`
- `/api/auth/logout`
- `/api/health`

### 4.2 HTTP Method Policy

Standar:
- `GET`: butuh login dan authorization.
- `POST`: butuh login, authorization, validasi input, audit log.
- `PUT/PATCH`: butuh login, authorization, object-level authorization, audit log.
- `DELETE`: butuh role tinggi, object-level authorization, soft delete bila memungkinkan.

### 4.3 Error Response

Response error tidak boleh membocorkan:
- Stack trace.
- Query database.
- Nama environment variable.
- Detail koneksi database.
- Path filesystem internal.
- Secret/token.

Standar response:

```json
{
  "success": false,
  "message": "Permintaan tidak dapat diproses."
}
```

Detail teknis hanya boleh masuk server log.

## 5. Input Validation Standard

### 5.1 Validasi Schema

Semua request body wajib divalidasi dengan schema seperti Zod.

Contoh:

```ts
const schema = z.object({
  namaPaket: z.string().trim().min(3).max(200),
  tahunAnggaran: z.number().int().min(2020).max(2100),
  pagu: z.number().nonnegative(),
});
```

### 5.2 Validasi Query Parameter

Parameter seperti `page`, `limit`, `status`, `unit`, `tahunAnggaran`, dan `search` wajib divalidasi.

Standar:
- `page` minimal 1.
- `limit` maksimal 100.
- `search` maksimal 100 karakter.
- `status` harus enum.
- `tahunAnggaran` harus integer.

### 5.3 Sanitization

Standar:
- Trim semua input teks.
- Batasi panjang input.
- Jangan render HTML dari user.
- Escape output secara default.
- Jangan gunakan `dangerouslySetInnerHTML` kecuali ada sanitizer yang kuat.

Field yang wajib diperhatikan:
- Nama paket.
- Nama penyedia.
- Catatan.
- Risiko.
- Mitigasi.
- Alasan revisi.
- Komentar dokumen.

## 6. Injection Prevention Standard

### 6.1 SQL Injection

Standar:
- Gunakan Prisma ORM untuk query database.
- Hindari raw SQL.
- Jika raw SQL wajib, gunakan parameterized query atau tagged template aman.

Tidak boleh:

```ts
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`);
```

Boleh:

```ts
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;
```

### 6.2 Command Injection

Standar:
- Jangan menjalankan shell command dari input user.
- Jangan pass nama file, path, atau argumen user langsung ke command.
- Jika perlu proses file, gunakan library internal, bukan shell.

### 6.3 XSS

Standar:
- Jangan render HTML mentah dari database.
- Semua field user-generated harus tampil sebagai teks.
- Terapkan Content Security Policy.

## 7. File Upload Standard

### 7.1 Upload Dokumen

Standar:
- Batasi ukuran file.
- Validasi MIME type.
- Validasi extension.
- Rename file menjadi nama random.
- Simpan metadata asli secara terpisah.
- Scan virus bila tersedia.
- Jangan simpan upload di public directory tanpa kontrol akses.

### 7.2 Import RUP

Standar minimal:

```txt
Max file size: 2MB
Max rows: 500
Allowed: .xlsx, .xls, .pdf sesuai kebutuhan
Reject unknown MIME
Reject password-protected file
Reject file kosong
```

### 7.3 Download Dokumen

Standar:
- Download dokumen wajib cek login.
- Download wajib cek akses ke paket/unit terkait.
- Jangan expose path filesystem asli.
- Gunakan signed URL pendek bila memakai object storage.

## 8. Sensitive Data Standard

### 8.1 Secret Management

Secret tidak boleh berada di:
- Source code.
- Dockerfile.
- Client-side bundle.
- Git history.
- Log.
- Error response.

Secret wajib berada di:
- Environment variable runtime.
- Secret manager.
- CI/CD secret store.

Contoh secret:
- `DATABASE_URL`
- `JWT_SECRET`
- API key email/SMS
- Storage access key
- Admin seed password

### 8.2 Client-Side Exposure

Standar:
- Jangan gunakan prefix `NEXT_PUBLIC_` untuk secret.
- Semua variable `NEXT_PUBLIC_*` dianggap publik.
- Jangan kirim role atau permission yang tidak perlu ke client.

## 9. Logging and Audit Trail Standard

### 9.1 Security Log

Catat event:
- Login sukses.
- Login gagal.
- Logout.
- Rate limit triggered.
- Akses ditolak.
- Export laporan.
- Import RUP.
- Upload/download dokumen.
- Perubahan status paket.
- Perubahan role user.

### 9.2 Audit Log Data

Minimal field:

```txt
actorUserId
actorName
actorRole
action
resourceType
resourceId
before
after
ipAddress
userAgent
createdAt
```

### 9.3 Data Yang Tidak Boleh Masuk Log

Jangan log:
- Password.
- Password hash.
- JWT/session token.
- Secret.
- Full file content.
- Full database connection string.

## 10. Security Headers Standard

Production wajib mengirim header:

```txt
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: DENY
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

Catatan:
`style-src 'unsafe-inline'` boleh sementara untuk kompatibilitas framework, tetapi idealnya dikurangi jika sudah memungkinkan.

## 11. CORS Standard

Standar:
- Jangan gunakan `Access-Control-Allow-Origin: *` untuk API authenticated.
- Jika CORS dibutuhkan, allowlist domain resmi saja.
- Jangan aktifkan credentials untuk origin wildcard.

Contoh:

```txt
Allowed origins:
- https://monitoring-ukpbj.dinkes.go.id
- https://staging-monitoring-ukpbj.dinkes.go.id
```

## 12. Dependency Security Standard

### 12.1 Audit Dependency

Sebelum release:

```bash
npm audit --production
```

Standar kelulusan:
- Tidak boleh ada `critical`.
- Tidak boleh ada `high` tanpa mitigasi tertulis.
- Dependency parser file seperti Excel/PDF harus ditinjau khusus.

### 12.2 Upgrade Policy

Standar:
- Framework utama seperti Next.js wajib berada pada versi aman.
- Dependency upload/parser wajib maintained.
- Dependency tidak maintained harus diganti.

## 13. Environment and Deployment Standard

### 13.1 Docker

Standar:
- Docker image tidak boleh menyimpan secret.
- Dockerfile tidak boleh mengandung `DATABASE_URL`, `JWT_SECRET`, atau password default.
- Production startup tidak boleh menjalankan demo seed.

Tidak boleh:

```yaml
command: sh -c "npx prisma migrate deploy && npx prisma db seed && npm run start"
```

Boleh:

```yaml
command: sh -c "npx prisma migrate deploy && npm run start"
```

### 13.2 Seed Data

Standar:
- Seed demo hanya untuk development.
- Production seed harus eksplisit dan aman.
- Password default harus dilarang.
- Admin initial password wajib berasal dari secret manager.

## 14. Access Matrix

| Fitur | SUPER_ADMIN | PA | KPA | PPK | POKJA | AUDITOR | VIEWER |
|---|---|---|---|---|---|---|---|
| Dashboard | Read | Read | Read | Read own/unit | Read assigned | Read | Read limited |
| Paket | Full | Read/approve | Read/approve | Create/update own | Update assigned stage | Read | Read limited |
| RUP | Full | Read/approve | Read/approve | Create/update own | Read | Read | Read limited |
| Kontrak | Full | Read | Read | Create/update own | Read assigned | Read | Read limited |
| Realisasi | Full | Read | Read | Update own | Read assigned | Read | Read limited |
| Dokumen | Full | Read | Read | Upload own | Upload assigned | Read | Read limited |
| Laporan | Full | Export | Export | Export own/unit | Read assigned | Export | Read limited |
| User Management | Full | No | No | No | No | No | No |
| Settings | Full | No | No | No | No | No | No |
| Audit Log | Full | Read | Read | Read own | Read assigned | Read | No |

## 15. Pre-Launch Security Checklist

### Critical

- [ ] Semua `/api/*` internal butuh login.
- [ ] Semua API write butuh role check.
- [ ] Semua akses detail by ID punya object-level authorization.
- [ ] JWT diverifikasi signature-nya.
- [ ] Session cookie memakai `HttpOnly`, `Secure`, dan `SameSite`.
- [ ] Tidak ada password default di production.
- [ ] Production tidak menjalankan demo seed.

### High

- [ ] Login punya rate limiting.
- [ ] Import/upload punya batas ukuran file.
- [ ] Dependency critical/high sudah di-upgrade atau dimitigasi.
- [ ] Security headers aktif.
- [ ] Error response tidak membocorkan detail internal.
- [ ] Export laporan membutuhkan authorization.

### Medium

- [ ] Audit log tersedia untuk aksi penting.
- [ ] Semua input body divalidasi schema.
- [ ] Semua query parameter divalidasi.
- [ ] File upload memvalidasi MIME dan extension.
- [ ] CORS tidak wildcard untuk authenticated API.
- [ ] Log tidak menyimpan token atau password.

### Low

- [ ] Empty/error state tidak membocorkan data internal.
- [ ] UI tidak menampilkan action yang tidak boleh dilakukan role terkait.
- [ ] CSP dievaluasi ulang setelah integrasi asset selesai.
- [ ] Dokumentasi incident response tersedia.

## 16. Definition of Done Security

Sebuah fitur dianggap siap merge jika:

1. API memiliki autentikasi.
2. API memiliki role check.
3. API memiliki object-level authorization bila memakai ID.
4. Input divalidasi.
5. Error response aman.
6. Aksi penting masuk audit log.
7. Test mencakup kasus unauthorized dan forbidden.
8. Tidak menambah secret ke repo.
9. Tidak menambah dependency rentan.
10. Tidak mengekspos data sensitif ke client.

## 17. Test Case Minimum

### Authentication

- User tidak login mengakses `/api/paket` harus `401`.
- User tidak login mengakses `/api/laporan` harus `401`.
- Login dengan password salah berkali-kali harus terkena `429`.

### Authorization

- Role `VIEWER` tidak boleh membuat paket.
- Role `PPK` tidak boleh mengubah paket milik unit lain.
- Role `POKJA` hanya boleh mengubah tahapan yang ditugaskan.
- Role `AUDITOR` tidak boleh melakukan write.

### IDOR

- User unit A tidak boleh membuka detail paket unit B.
- User unit A tidak boleh download dokumen paket unit B.
- User unit A tidak boleh export laporan unit B.

### Upload

- File lebih dari batas maksimal harus ditolak.
- File extension palsu harus ditolak.
- File kosong harus ditolak.
- Import dengan row melebihi batas harus ditolak.

### Error Handling

- Error database tidak menampilkan `DATABASE_URL`.
- Error server tidak menampilkan stack trace.
- Error validation hanya menampilkan field yang relevan.

## 18. Prioritas Implementasi

Urutan implementasi yang disarankan:

1. Buat helper `requireApiUser` dan `requireApiRole`.
2. Terapkan helper ke semua API internal.
3. Tambahkan object-level authorization untuk paket, RUP, kontrak, dokumen, dan laporan.
4. Perbaiki verifikasi JWT di proxy.
5. Tambahkan rate limiting login.
6. Hapus seed demo dari production.
7. Hapus secret dari Dockerfile.
8. Tambahkan security headers.
9. Tambahkan limit upload/import.
10. Jalankan dependency audit dan upgrade dependency rentan.

## 19. Non-Negotiable Launch Gate

Aplikasi tidak boleh launch jika masih ada:

- API internal tanpa autentikasi.
- API write tanpa role check.
- JWT role dibaca tanpa signature verification.
- Password default aktif.
- Demo seed berjalan di production.
- Dependency critical yang belum dimitigasi.
- Upload file tanpa limit ukuran.

## 20. Kesimpulan

Standar keamanan untuk **Monitoring UKPBJ Dinas Kesehatan** harus menempatkan data pengadaan sebagai data terbatas, bukan data umum. Fokus utama adalah mencegah akses tanpa login, mencegah user melihat data unit lain, menjaga audit trail tetap valid, dan memastikan tidak ada secret atau informasi internal yang bocor.

Security baseline ini wajib dipakai sebagai acuan sebelum development dilanjutkan, sebelum staging UAT, dan sebelum production launch.
