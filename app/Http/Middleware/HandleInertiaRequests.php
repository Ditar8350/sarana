<?php

namespace App\Http\Middleware;

use App\Models\Contact;
use App\Models\News;
use App\Models\Peminjaman;
use App\Models\PengecekanRuangan;
use App\Models\Pengembalian;
use App\Notifications\AktivitasBaruNotification;
use App\Notifications\BeritaBaruNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'contact' => function () {
                return Cache::rememberForever('global_contact', function () {
                    $contact = Contact::first();

                    return $contact ? [
                        'address' => $contact->address,
                        'email' => $contact->email,
                        'phone' => $contact->phone,
                    ] : null;
                });
            },
            'notifications' => function () use ($user) {
                if (! $user) {
                    return [
                        'unread_count' => 0,
                        'list' => [],
                    ];
                }

                // Jika pengguna baru atau belum ada data notifikasi di database, backfill awal agar data riil langsung tersedia
                if ($user->notifications()->count() === 0) {
                    self::backfillInitialNotifications($user);
                }

                $dbNotifications = $user->notifications()
                    ->latest()
                    ->take(20)
                    ->get();

                $unreadCount = $user->unreadNotifications()->count();

                $list = $dbNotifications->map(function ($n) {
                    $data = $n->data;

                    return [
                        'id' => $n->id,
                        'title' => $data['title'] ?? 'Notifikasi',
                        'message' => $data['message'] ?? '',
                        'time' => $n->created_at->diffForHumans(),
                        'url' => $data['url'] ?? '#',
                        'type' => $data['type'] ?? 'aktivitas',
                        'icon' => $data['icon'] ?? 'alert',
                        'unread' => is_null($n->read_at),
                    ];
                })->values()->all();

                return [
                    'unread_count' => $unreadCount,
                    'list' => $list,
                ];
            },
        ];
    }

    /**
     * Backfill awal notifikasi dari database jika belum ada baris notifikasi untuk user.
     */
    protected static function backfillInitialNotifications($user): void
    {
        $role = $user->role?->value ?? 'mahasiswa';

        if (in_array($role, ['admin', 'staf', 'staff', 'staff_sarpras'])) {
            // 1. Pending Peminjaman
            $peminjamans = Peminjaman::where('status', 'menunggu_validasi')->latest()->take(3)->get();
            foreach ($peminjamans as $p) {
                $user->notify(new AktivitasBaruNotification(
                    title: "{$p->nama_peminjam} - Mengajukan Peminjaman",
                    message: "Pengajuan {$p->kode_transaksi} ({$p->instansi_prodi}) untuk keperluan: {$p->keperluan}",
                    actionUrl: '/admin/peminjaman',
                    type: 'peminjaman',
                    icon: 'document',
                ));
            }

            // 2. Pending Pengembalian
            $pengembalians = Pengembalian::where('status_verifikasi', 'menunggu_inspeksi')->latest()->take(3)->get();
            foreach ($pengembalians as $k) {
                $peminjamNama = $k->peminjaman?->nama_peminjam ?? 'Peminjam';
                $user->notify(new AktivitasBaruNotification(
                    title: "{$peminjamNama} - Konfirmasi Pengembalian Barang",
                    message: "Pengembalian {$k->kode_pengembalian} menunggu inspeksi fisik di pos sarpras.",
                    actionUrl: '/admin/pengembalian',
                    type: 'pengembalian',
                    icon: 'alert',
                ));
            }

            // 3. Pending Pengecekan Ruangan
            $pengecekans = PengecekanRuangan::where('status_tinjauan', 'menunggu_tinjauan')->latest()->take(3)->get();
            foreach ($pengecekans as $c) {
                $user->notify(new AktivitasBaruNotification(
                    title: "{$c->nama_ruangan} - Laporan Pengecekan Ruangan",
                    message: "Inspeksi {$c->kode_pengecekan}: {$c->catatan_pemeriksaan}",
                    actionUrl: '/admin/pengecekan-ruangan',
                    type: 'pengecekan',
                    icon: 'document',
                ));
            }
        } else {
            // Mahasiswa, Kepala Bagian, Umum: Berita aktif terbaru
            $latestNews = News::where('status', 'Aktif')->latest('date')->take(3)->get();
            foreach ($latestNews as $n) {
                $user->notify(new BeritaBaruNotification($n));
            }

            // Status peminjaman milik user jika ada
            $userPeminjamans = Peminjaman::where('user_id', $user->id)->latest()->take(2)->get();
            foreach ($userPeminjamans as $p) {
                $user->notify(new AktivitasBaruNotification(
                    title: "Status Peminjaman {$p->kode_transaksi}",
                    message: 'Pengajuan peminjaman Anda saat ini berstatus: '.strtoupper(str_replace('_', ' ', $p->status)),
                    actionUrl: '/layanan/peminjaman',
                    type: 'peminjaman',
                    icon: 'document',
                ));
            }
        }
    }
}
