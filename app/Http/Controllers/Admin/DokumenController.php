<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DokumenController extends Controller
{
    public function index()
    {
        $documents = Document::latest('date')
            ->latest('id')
            ->get()
            ->map(fn ($doc) => [
                'id' => $doc->id,
                'title' => $doc->title,
                'category' => $doc->category,
                'size' => $doc->size ?: '-',
                'type' => $doc->type ?: 'pdf',
                'date' => $doc->date ? Carbon::parse($doc->date)->format('Y-m-d') : $doc->created_at->format('Y-m-d'),
                'formatted_date' => $doc->date ? Carbon::parse($doc->date)->translatedFormat('d M Y') : $doc->created_at->translatedFormat('d M Y'),
                'fileUrl' => route('dokumen.unduh', $doc->id),
            ]);

        return Inertia::render('Admin/Dokumen', [
            'documents' => $documents,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'file' => [
                'required',
                'file',
                'mimes:pdf,doc,docx,xls,xlsx,csv',
                'mimetypes:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain',
                'max:2048',
            ],
        ]);

        $file = $request->file('file');
        $bytes = $file->getSize();
        $sizeFormatted = $this->formatBytes($bytes);
        $ext = strtolower($file->getClientOriginalExtension());
        $type = $this->detectFileType($ext);

        $path = $file->store('uploads/dokumen', 'public');

        Document::create([
            'title' => trim(strip_tags($validated['title'])),
            'category' => trim(strip_tags($validated['category'])),
            'file_path' => '/storage/' . $path,
            'size' => $sizeFormatted,
            'type' => $type,
            'date' => now()->toDateString(),
        ]);

        return redirect()->back()->with('success', 'Dokumen berhasil diunggah.');
    }

    public function update(Request $request, Document $dokumen)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'file' => [
                'nullable',
                'file',
                'mimes:pdf,doc,docx,xls,xlsx,csv',
                'mimetypes:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain',
                'max:2048',
            ],
        ]);

        $dokumen->title = trim(strip_tags($validated['title']));
        $dokumen->category = trim(strip_tags($validated['category']));

        if ($request->hasFile('file')) {
            if ($dokumen->file_path && str_starts_with($dokumen->file_path, '/storage/')) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $dokumen->file_path));
            }
            $file = $request->file('file');
            $bytes = $file->getSize();
            $ext = strtolower($file->getClientOriginalExtension());
            $path = $file->store('uploads/dokumen', 'public');

            $dokumen->file_path = '/storage/' . $path;
            $dokumen->size = $this->formatBytes($bytes);
            $dokumen->type = $this->detectFileType($ext);
        }

        $dokumen->save();

        return redirect()->back()->with('success', 'Dokumen berhasil diperbarui.');
    }

    public function destroy(Document $dokumen)
    {
        if ($dokumen->file_path && str_starts_with($dokumen->file_path, '/storage/')) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $dokumen->file_path));
        }

        $dokumen->delete();

        return redirect()->back()->with('success', 'Dokumen berhasil dihapus.');
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 1) . ' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 0) . ' KB';
        }
        return $bytes . ' B';
    }

    private function detectFileType(string $ext): string
    {
        return match ($ext) {
            'xls', 'xlsx', 'csv' => 'excel',
            'doc', 'docx' => 'word',
            default => 'pdf',
        };
    }
}
