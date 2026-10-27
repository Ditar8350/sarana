<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VisiMisi;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VisiMisiController extends Controller
{
    public function index()
    {
        $visiMisi = VisiMisi::first();

        return Inertia::render('Admin/VisiMisi', [
            'visiMisi' => $visiMisi ? [
                'id' => $visiMisi->id,
                'visi' => $visiMisi->visi,
                'misi' => $visiMisi->misi ?? [],
            ] : [
                'id' => null,
                'visi' => 'Menjadi pusat layanan sarana dan prasarana yang unggul, modern, dan berkelanjutan dalam menyediakan infrastruktur kampus yang aman dan nyaman guna mendukung mutu Tridharma Perguruan Tinggi.',
                'misi' => [
                    'Menyelenggarakan sistem pengelolaan, pemeliharaan, dan inventarisasi sarana prasarana yang tertib, transparan, dan akuntabel sesuai dengan peraturan yang berlaku.',
                    'Memberikan layanan penyediaan dan pemeliharaan fasilitas kampus yang prima, cepat, dan responsif untuk mendukung kenyamanan seluruh civitas akademika.',
                    'Mengembangkan sistem informasi tata kelola sarana prasarana yang terintegrasi dan berbasis teknologi modern guna meningkatkan efektivitas pengawasan aset.',
                    'Meningkatkan kualitas, keamanan, dan keandalan infrastruktur fisik serta fasilitas penunjang kegiatan akademik maupun non-akademik secara berkelanjutan.',
                ],
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'visi' => ['required', 'string', 'max:2000'],
            'misi' => ['required', 'array', 'min:1', 'max:20'],
            'misi.*' => ['required', 'string', 'max:1000'],
        ]);

        $visiMisi = VisiMisi::first() ?? new VisiMisi();
        $visiMisi->visi = trim(strip_tags($validated['visi']));
        $visiMisi->misi = array_values(array_filter(
            array_map(fn ($item) => trim(strip_tags($item)), $validated['misi']),
            fn ($item) => $item !== ''
        ));
        $visiMisi->save();

        return redirect()->back()->with('success', 'Visi & Misi berhasil disimpan.');
    }
}
