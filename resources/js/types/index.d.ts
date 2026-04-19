export type Role = 'admin' | 'manager' | 'staff';

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    branch_id: number | null;
    active: boolean;
}

export interface Branch {
    id: number;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    logo: string | null;
    theme: 'light' | 'dark';
    active: boolean;
}

export interface Flash {
    success?: string;
    error?: string;
    info?: string;
}

export interface PageProps {
    auth: { user: User | null };
    flash: Flash;
    ziggy: { location: string; url: string };
    [key: string]: unknown;
}
