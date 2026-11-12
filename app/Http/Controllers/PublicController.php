<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\HeroSection;
use App\Models\News;
use App\Models\Sambutan;
use App\Models\StrukturOrganisasi;
use App\Models\View;
use App\Models\VisiMisi;
use Carbon\Carbon;
use Illuminate\Foundation\Application;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PublicController extends Controller
{
    /**
     * Menampilkan halaman utama / landing page.
     */
    public function index(): Response
    {
        $view = View::firstOrCreate([], ['count' => 2000]);
        if (! session()->has('visited_landing')) {
            $view->increment('count');
            session()->put('visited_landing', true);
        }

        $hero = HeroSection::first();
        $sambutan = Sambutan::first();
        $visiMisi = VisiMisi::first();
        $news = News::where('status', 'Aktif')
            ->latest('date')
            ->latest('id')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'slug' => $item->slug,
                'excerpt' => Str::limit(strip_tags($item->description), 160),
                'image' => $item->image ?: '/images/Hero.png',
                'date' => Carbon::parse($item->date)->translatedFormat('d M Y'),
                'author' => $item->author,
            ]);

        return Inertia::render('Landing', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'laravelVersion' => Application::VERSION,
            'phpVersion' => PHP_VERSION,
            'visitorCount' => $view->count,
            'hero' => $hero ? [
                'title' => $hero->title,
                'subtitle' => $hero->subtitle,
                'image' => $hero->image ?: '/images/Hero.png',
            ] : null,
            'sambutan' => $sambutan ? [
                'photo' => $sambutan->photo ?: '/images/Kepala-sarpras.jpeg',
                'judul_kepala_biro' => $sambutan->judul_kepala_biro,
                'name' => $sambutan->name,
                'title' => $sambutan->title,
                'message' => $sambutan->message,
            ] : null,
            'news' => $news,
            'visiMisi' => $visiMisi ? [
                'visi' => $visiMisi->visi,
                'misi' => $visiMisi->misi,
            ] : null,
        ]);
    }

    /**
     * Menampilkan halaman detail berita berdasarkan slug.
     */
    public function berita(string $slug): Response
    {
        $query = News::where('slug', $slug);

        $user = auth()->user();
        $role = $user ? (is_string($user->role) ? $user->role : $user->role->value) : null;

        if (! in_array($role, ['admin', 'staf'], true)) {
            $query->where('status', 'Aktif');
        }

        $berita = $query->first();

        return Inertia::render('DetailBerita', [
            'news' => $berita ? [
                'id' => $berita->id,
                'title' => $berita->title,
                'slug' => $berita->slug,
                'content' => nl2br(e($berita->description)),
                'image' => $berita->image ?: '/images/Hero.png',
                'date' => Carbon::parse($berita->date)->translatedFormat('d M Y'),
                'author' => $berita->author ?: 'Humas Biro Sarpras',
                'status' => $berita->status ?? 'Aktif',
            ] : null,
        ]);
    }

    /**
     * Menampilkan halaman dokumen publik.
     */
    public function dokumen(): Response
    {
        $documents = Document::latest('date')
            ->latest('id')
            ->get()
            ->map(fn ($doc) => [
                'id' => $doc->id,
                'title' => $doc->title,
                'category' => $doc->category,
                'size' => $doc->size ?: '-',
                'date' => $doc->date ? Carbon::parse($doc->date)->translatedFormat('d M Y') : $doc->created_at->translatedFormat('d M Y'),
                'fileUrl' => route('dokumen.unduh', $doc->id),
                'type' => $doc->type ?: 'pdf',
            ]);

        return Inertia::render('Dokumen', [
            'documents' => $documents,
        ]);
    }

    public function unduhDokumen(Document $dokumen): BinaryFileResponse|RedirectResponse
    {

        $path = str_replace('/storage/', '', $dokumen->file_path);

        // Ambil path absolut fisik file di server
        $fullPath = Storage::disk('public')->path($path);
        if (! file_exists($fullPath)) {
            return redirect()->back()->with('error', 'Berkas dokumen fisik tidak ditemukan di server.');
        }
        $extension = pathinfo($dokumen->file_path, PATHINFO_EXTENSION) ?: 'pdf';
        $namaUnduhan = Str::slug($dokumen->title).'.'.$extension;

        return response()->download($fullPath, $namaUnduhan);
    }

    /**
     * Menampilkan halaman bagan struktur organisasi.
     */
    public function struktur(): Response
    {
        $struktur = StrukturOrganisasi::first();

        return Inertia::render('Struktur', [
            'struktur' => $struktur ? [
                'id' => $struktur->id,
                'image' => $struktur->image,
            ] : null,
        ]);
    }
}
