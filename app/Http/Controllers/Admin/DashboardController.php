<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\News;
use App\Models\View;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $recentNews = News::latest('date')
            ->take(5)
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'date' => Carbon::parse($item->date)->translatedFormat('d M Y'),
                'status' => $item->status ?? 'Aktif',
            ]);

        $recentDocuments = Document::latest()
            ->take(5)
            ->get()
            ->map(fn ($doc) => [
                'id' => $doc->id,
                'title' => $doc->title,
                'type' => $doc->type,
                'category' => $doc->category,
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_berita' => News::count(),
                'total_dokumen' => Document::count(),
                'total_pengunjung' => View::first()?->count ?? 2000,
            ],
            'recentNews' => $recentNews,
            'recentDocuments' => $recentDocuments,
        ]);
    }
}
