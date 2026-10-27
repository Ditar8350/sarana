import Modal from "@/Components/Modal";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteConfirmModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    itemName?: string;
    processing?: boolean;
}

export default function DeleteConfirmModal({
    show,
    onClose,
    onConfirm,
    title = "Konfirmasi Hapus Data",
    message = "Apakah Anda yakin ingin menghapus data ini? ",
    itemName,
    processing = false,
}: DeleteConfirmModalProps) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            {/* Top Themed Accent Bar (Merah & Aksen Kuning Emas UNUHA) */}
            <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-accent to-red-600" />

            <div className="p-6 sm:p-7 font-sans">
                {/* Header Icon, Badge, & Close Button */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200/70 text-red-600 flex items-center justify-center shrink-0 shadow-sm">
                            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <div>
                            
                            <h3 className="text-lg sm:text-xl font-bold text-ink font-serif mt-0.5">
                                {title}
                            </h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="text-muted/60 hover:text-ink hover:bg-surface-low rounded-xl p-1.5 transition-colors disabled:opacity-50"
                        title="Tutup"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Message Body */}
                <div className="mt-4">
                    <p className="text-sm text-muted leading-relaxed">
                        {message}
                    </p>

                    {/* Target Item Name Box with Gold Accent Left Border */}
                    {itemName && (
                        <div className="mt-4 p-3.5 rounded-2xl bg-surface border-l-4 border-l-accent border-y border-r border-surface-container">
                            <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-0.5">
                                Data yang dipilih:
                            </p>
                            <p className="text-xs sm:text-sm font-bold text-ink line-clamp-2">
                                {itemName}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons with Themed Styles */}
                <div className="mt-7 flex items-center justify-end gap-3 pt-3 border-t border-surface-container">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-muted hover:bg-surface-low hover:text-ink transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-bold shadow-md shadow-red-600/25 transition-all disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        {processing ? "Menghapus..." : "Ya, Hapus Data"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
