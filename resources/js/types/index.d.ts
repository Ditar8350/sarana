export type UserRole = 'admin' | 'kepala_bagian' | 'staf' | 'staf_ruangan' | 'mahasiswa' | 'umum';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    nomor_induk?: string | null;
    no_hp?: string | null;
    ruangan_id?: number | null;
    unit_ruangan?: string | null;
    fakultas?: string | null;
    prodi?: string | null;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
