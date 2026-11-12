<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Tandai semua notifikasi milik pengguna yang sedang login sebagai telah dibaca.
     */
    public function markAllAsRead(Request $request): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->unreadNotifications()->update(['read_at' => now()]);
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        if ($request->boolean('silent')) {
            return back();
        }

        return back()->with('success', 'Semua notifikasi telah ditandai sebagai dibaca.');
    }

    /**
     * Tandai notifikasi spesifik sebagai telah dibaca dan arahkan ke tautan tujuan (Action URL).
     */
    public function markAsRead(Request $request, string $id): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        $notification = $user?->notifications()->where('id', $id)->first();

        if ($notification) {
            if (is_null($notification->read_at)) {
                $notification->markAsRead();
            }

            $targetUrl = $notification->data['url'] ?? null;
            if (! $request->boolean('stay') && ! $request->boolean('silent') && $targetUrl && $targetUrl !== '#' && ! $request->wantsJson()) {
                return redirect($targetUrl);
            }
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back();
    }
}
