<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sambutan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SambutanController extends Controller
{
    public function index()
    {
        $sambutan = Sambutan::first();

        return Inertia::render('Admin/Sambutan', [
            'sambutan' => $sambutan ? [
                'id' => $sambutan->id,
                'photo' => $sambutan->photo,
                'judul_kepala_biro' => $sambutan->judul_kepala_biro,
                'name' => $sambutan->name,
                'title' => $sambutan->title,
                'message' => $sambutan->message,
            ] : [
                'id' => null,
                'photo' => '/images/Kepala-sarpras.jpeg',
                'judul_kepala_biro' => 'Kepala Biro Sarana & Prasarana',
                'name' => 'Bpk Agus Darmawan, S.Pd.',
                'title' => 'Kepala Biro Sarana & Prasarana',
                'message' => 'Selamat datang di portal resmi Biro Sarana dan Prasarana Universitas Nurul Huda. Kami hadir untuk menyediakan infrastruktur dan layanan fasilitas yang berkualitas, transparan, dan profesional demi mendukung kenyamanan seluruh civitas akademika dalam mewujudkan visi dan misi perguruan tinggi. Melalui sistem informasi ini, kami berharap pengelolaan sarana prasarana menjadi lebih terpadu, efektif, dan efisien.',
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'judul_kepala_biro' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:5000'],
            'photo' => [
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:5120',
            ],
        ]);

        $sambutan = Sambutan::first() ?? new Sambutan();
        $sambutan->judul_kepala_biro = trim(strip_tags($validated['judul_kepala_biro']));
        $sambutan->name = trim(strip_tags($validated['name']));
        $sambutan->title = trim(strip_tags($validated['title']));
        $sambutan->message = trim(strip_tags($validated['message'] ?? ''));

        if ($request->hasFile('photo')) {
            if ($sambutan->photo && str_starts_with($sambutan->photo, '/storage/')) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $sambutan->photo));
            }
            $path = $request->file('photo')->store('uploads/sambutan', 'public');
            $sambutan->photo = '/storage/' . $path;
        } elseif (!$sambutan->exists && !$sambutan->photo) {
            $sambutan->photo = '/images/Kepala-sarpras.jpeg';
        }

        $sambutan->save();

        return redirect()->back()->with('success', 'Data Sambutan Kepala Biro berhasil disimpan.');
    }
}
