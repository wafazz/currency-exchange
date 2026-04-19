import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import type { NavItem } from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';

const posNav = (active: string): NavItem[] => [
    { label: 'POS', href: '/pos', icon: 'bi-calculator', active: active === 'pos' },
    { label: 'Cash Drawer', href: '#', icon: 'bi-wallet2', active: active === 'drawer' },
    { label: 'My Transactions', href: '#', icon: 'bi-receipt', active: active === 'txns' },
];

export default function PosIndex() {
    const { auth } = usePage().props as unknown as PageProps;
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    return (
        <AppLayout title="Counter POS" nav={posNav('pos')}>
            <Head title="POS" />
            <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                    <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle text-primary mb-3"
                        style={{ width: 80, height: 80, background: 'rgba(13,110,253,0.1)', fontSize: 40 }}
                    >
                        <i className="bi bi-calculator"></i>
                    </div>
                    <h2 className="fw-bold mb-2">Hi, {auth.user?.name?.split(' ')[0]}</h2>
                    <p className="text-secondary mb-4">
                        Counter POS launches in Phase 2: log exchanges, print receipts, close the drawer.
                    </p>
                    <div className="font-monospace h4 fw-semibold mb-1">{now.toLocaleTimeString('en-GB')}</div>
                    <div className="small text-secondary">
                        {now.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
