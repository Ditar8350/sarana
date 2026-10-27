# Portal Informasi Resmi Biro Sarana & Prasarana - Universitas Nurul Huda

Aplikasi web portal informasi resmi dan manajemen konten dinamis untuk **Biro Sarana & Prasarana Universitas Nurul Huda (UNUHA)**. Aplikasi ini dibangun menggunakan **Laravel**, **Inertia.js**, **React (TypeScript)**, dan **Tailwind CSS** untuk menyajikan informasi administrasi Sarpras, pengumuman/berita, visi & misi, struktur organisasi, serta pusat unduhan dokumen resmi secara transparan dan akuntabel.

---

## 🛠️ Teknologi yang Digunakan

- **Backend**: PHP 8.3+ / 8.4, Laravel 13
- **Frontend**: React 18, TypeScript, Inertia.js v2
- **Styling & Animasi**: Tailwind CSS, Framer Motion, Lucide React Icons
- **Autentikasi**: Laravel Breeze
- **Build Tool**: Vite
- **Database**: MySQL (`biro_sarpras`)

---

## ⚙️ Prasyarat Instalasi (Prerequisites)

Pastikan perangkat Anda telah terinstal:
- **PHP** >= 8.3 
- **Composer** >= 2.x
- **Node.js** >= 20.x & **NPM**
- **MySQL**

---

## 🚀 Panduan Instalasi & Setup Lokal

Ikuti langkah-langkah berikut untuk menjalankan proyek di komputer lokal:

### 1. Clone Repository & Masuk ke Direktori Proyek
```bash
git clone <url-repository>
cd Biro_Sarpras
```

### 2. Instal Dependensi PHP & Node.js
```bash
composer install
npm install
```

### 3. Konfigurasi File Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi database pada file `.env`:
```env
APP_NAME="Biro Sarana & Prasarana"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=biro_sarpras
DB_USERNAME=root
DB_PASSWORD=
```
> **Catatan:** Pastikan Anda telah membuat database kosong bernama `biro_sarpras` di MySQL/phpMyAdmin sebelum melanjutkan ke tahap migrasi.

### 4. Generate Application Key
```bash
php artisan key:generate
```

### 5. Jalankan Migrasi Database & Storage Link
Perintah ini akan membuat seluruh tabel (termasuk menginisialisasi tabel `views` dengan nilai awal `2000`) dan menghubungkan folder penyimpanan publik (`storage/app/public` ke `public/storage`) agar gambar serta dokumen yang diunggah dapat diakses:
```bash
php artisan migrate
php artisan storage:link
```

### 6. Menjalankan Aplikasi (Mode Development)
Jalankan server backend Laravel dan bundler Vite secara bersamaan:

**Terminal 1 (Server Laravel):**
```bash
php artisan serve
```

**Terminal 2 (Vite Dev Server):**
```bash
npm run dev
```

Atau gunakan satu perintah sekaligus:
```bash
composer run dev
```

Akses aplikasi melalui browser di: **`http://localhost:8000`**

### 7. Build untuk Produksi (Production)
Untuk mengompilasi aset frontend dan memeriksa tipe TypeScript:
```bash
npm run build
```

---

## 🔗 Daftar Route Utama

### 1. Route Publik (Ditangani oleh `PublicController`)
| Method | URI | Nama Route | Keterangan |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | `home` | Halaman Beranda (Hero, Sambutan, Berita, Visi & Misi, & Counter Pengunjung) |
| `GET` | `/berita/{slug}` | `berita.detail` | Halaman Detail Berita (Sanitasi XSS dengan isomorphic-dompurify) |
| `GET` | `/dokumen` | `dokumen` | Halaman Dokumen Resmi & Unduhan |
| `GET` | `/dokumen/unduh/{dokumen}` | `dokumen.unduh` | Endpoint Unduh Berkas Dokumen (Stream download via Laravel & penamaan file otomatis) |
| `GET` | `/struktur` | `struktur` | Halaman Bagan Struktur Organisasi |
| `GET` | `/login` | `login` | Halaman Form Login Administrator |
| `POST` | `/login` | - | Proses Autentikasi Admin (Rate limited: `throttle:5,1`) |
| `POST` | `/logout` | `logout` | Keluar dari Sistem / Menghapus Sesi |

### 2. Route Admin (Memerlukan Login: `middleware(['auth', 'verified', 'throttle:60,1'])`)
| Method | URI | Nama Route | Keterangan |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard` | `dashboard` | Dashboard Statistik (Total Berita, Dokumen, Pengunjung, & Data Terbaru) |
| `GET` | `/admin/hero` | `admin.hero.index` | Halaman Form Pengaturan Hero Section |
| `POST` | `/admin/hero` | `admin.hero.update` | Simpan Perubahan Gambar Hero, Judul, & Sub Judul |
| `GET` | `/admin/sambutan` | `admin.sambutan.index` | Halaman Form Pengaturan Sambutan Kepala Biro |
| `POST` | `/admin/sambutan` | `admin.sambutan.update` | Simpan Perubahan Foto, Judul, Nama, Jabatan, & Pesan Sambutan |
| `GET` | `/admin/berita` | `admin.berita.index` | Halaman Kelola & Daftar Berita |
| `POST` | `/admin/berita` | `admin.berita.store` | Tambah Berita Baru (Tanggal, Penulis, Gambar, Judul, Deskripsi, Status) |
| `POST` | `/admin/berita/{berita}` | `admin.berita.update` | Perbarui Berita yang Sudah Ada |
| `DELETE` | `/admin/berita/{berita}` | `admin.berita.destroy` | Hapus Berita (Dilengkapi Modal Konfirmasi Kustom) |
| `GET` | `/admin/visi-misi` | `admin.visi-misi.index` | Halaman Form Pengaturan Visi & Misi |
| `POST` | `/admin/visi-misi` | `admin.visi-misi.update` | Simpan Perubahan Teks Visi & Daftar Poin Misi Dinamis |
| `GET` | `/admin/dokumen` | `admin.dokumen.index` | Halaman Kelola & Daftar Dokumen |
| `POST` | `/admin/dokumen` | `admin.dokumen.store` | Unggah Dokumen Baru (Maks. 2MB: PDF, Word, Excel) |
| `POST` | `/admin/dokumen/{dokumen}` | `admin.dokumen.update` | Perbarui Judul, Kategori, atau File Dokumen (Maks. 2MB) |
| `DELETE` | `/admin/dokumen/{dokumen}` | `admin.dokumen.destroy` | Hapus Dokumen & Berkas Fisik |
| `GET` | `/admin/struktur` | `admin.struktur.index` | Halaman Form Pengaturan Gambar Bagan Struktur Organisasi |
| `POST` | `/admin/struktur` | `admin.struktur.update` | Simpan & Unggah Gambar Bagan Struktur Organisasi (Maks. 2MB) |
| `GET` | `/admin/kontak` | `admin.kontak.index` | Halaman Form Pengaturan Kontak & Layanan |
| `POST` | `/admin/kontak` | `admin.kontak.update` | Simpan Perubahan Alamat, Email, & No. HP (Otomatis Reset Cache `global_contact`) |

---

## 📂 Struktur Direktori Penting

```text
Biro_Sarpras/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/            # Controller CRUD Admin (Berita, Dashboard, Dokumen, Hero, Kontak, Sambutan, Struktur, VisiMisi)
│   │   │   ├── Auth/             # Controller Autentikasi (Login, Password, dll.)
│   │   │   └── PublicController.php # Controller utama seluruh halaman & unduhan publik
│   │   └── Middleware/
│   │       ├── HandleInertiaRequests.php # Shared props global Inertia (Flash message, cached contact, auth)
│   │       └── SecurityHeaders.php       # HTTP Security Headers (Anti-XSS, Anti-Clickjacking, Nosniff)
│   └── Models/                   # Model Eloquent (Contact, Document, HeroSection, News, Sambutan, StrukturOrganisasi, User, View, VisiMisi)
├── database/
│   └── migrations/               # Skema tabel database (dynamic contents, views, struktur, contacts)
├── resources/
│   ├── css/                      # Konfigurasi Tailwind & CSS kustom
│   └── js/
│       ├── Components/
│       │   ├── Admin/            # Sidebar, Topbar, & DeleteConfirmModal bertema
│       │   └── Landing/          # Komponen landing page (Hero, Sambutan, Berita, VisiMisi, Dok, Struktur, Footer, Navbar)
│       ├── Layouts/              # AdminLayout, AuthenticatedLayout, GuestLayout
│       ├── Pages/
│       │   ├── Admin/            # Halaman Admin (Berita, Dashboard, Dokumen, HeroSection, Kontak, Sambutan, Struktur, VisiMisi)
│       │   ├── Landing.tsx       # Halaman utama publik
│       │   ├── DetailBerita.tsx  # Halaman detail berita (Sanitasi XSS)
│       │   ├── Dokumen.tsx       # Halaman unduhan dokumen publik
│       │   └── Struktur.tsx      # Halaman struktur organisasi
│       └── utils/
│           └── sanitize.ts       # Utilitas sanitasi HTML & URL menggunakan isomorphic-dompurify
└── routes/
    ├── auth.php                  # Rute autentikasi Breeze
    └── web.php                   # Definisi seluruh rute publik dan panel admin
```
