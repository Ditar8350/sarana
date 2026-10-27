<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StrukturOrganisasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class StrukturController extends Controller
{
    public function index()
    {
        $struktur = StrukturOrganisasi::first();

        return Inertia::render('Admin/Struktur', [
            'struktur' => $struktur ? [
                'id' => $struktur->id,
                'image' => $struktur->image,
            ] : null,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:2048',
            ],
        ]);

        $struktur = StrukturOrganisasi::first() ?? new StrukturOrganisasi();

        if ($request->hasFile('image')) {
            if ($struktur->image && str_starts_with($struktur->image, '/storage/')) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $struktur->image));
            }
            $path = $request->file('image')->store('uploads/struktur', 'public');
            $struktur->image = '/storage/' . $path;
        }

        $struktur->save();

        return redirect()->back()->with('success', 'Gambar Struktur Organisasi berhasil disimpan.');
    }
}
