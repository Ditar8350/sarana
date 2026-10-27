<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HeroSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class HeroSectionController extends Controller
{
    public function index()
    {
        $hero = HeroSection::first();

        return Inertia::render('Admin/HeroSection', [
            'hero' => $hero ? [
                'id' => $hero->id,
                'title' => $hero->title,
                'subtitle' => $hero->subtitle,
                'image' => $hero->image,
            ] : [
                'id' => null,
                'title' => 'Biro Sarana & Prasarana Universitas Nurul Huda',
                'subtitle' => 'Mewujudkan pengelolaan fasilitas dan sarana prasarana kampus yang transparan, akuntabel, dan profesional guna mendukung tercapainya visi dan misi perguruan tinggi.',
                'image' => '/images/Hero.png',
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['required', 'string', 'max:2000'],
            'image' => [
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'mimetypes:image/jpeg,image/png,image/webp',
                'max:5120',
            ],
        ]);

        $hero = HeroSection::first() ?? new HeroSection();
        $hero->title = trim(strip_tags($validated['title']));
        $hero->subtitle = trim(strip_tags($validated['subtitle']));

        if ($request->hasFile('image')) {
            if ($hero->image && str_starts_with($hero->image, '/storage/')) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $hero->image));
            }
            $path = $request->file('image')->store('uploads/hero', 'public');
            $hero->image = '/storage/' . $path;
        } elseif (!$hero->exists && !$hero->image) {
            $hero->image = '/images/Hero.png';
        }

        $hero->save();

        return redirect()->back()->with('success', 'Data Hero Section berhasil disimpan.');
    }
}
