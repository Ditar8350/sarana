<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class KontakController extends Controller
{
    public function index()
    {
        $contact = Contact::first();

        return Inertia::render('Admin/Kontak', [
            'contact' => $contact ? [
                'id' => $contact->id,
                'address' => $contact->address,
                'email' => $contact->email,
                'phone' => $contact->phone,
            ] : [
                'id' => null,
                'address' => 'Gedung Rektorat Lt. 1, Kampus A & B, Jl. Kota Baru Desa Sukaraja, Kec. Buay Madang, Kab. OKU Timur, Sumatera Selatan 32312',
                'email' => 'sarpras@unuha.ac.id',
                'phone' => '0821-8466-0898',
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'address' => ['required', 'string', 'max:1000'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:100'],
        ]);

        $contact = Contact::first() ?? new Contact();
        $contact->address = trim(strip_tags($validated['address']));
        $contact->email = trim(strip_tags($validated['email']));
        $contact->phone = trim(strip_tags($validated['phone']));
        $contact->save();

        Cache::forget('global_contact');

        return redirect()->back()->with('success', 'Data Kontak & Layanan berhasil disimpan.');
    }
}
