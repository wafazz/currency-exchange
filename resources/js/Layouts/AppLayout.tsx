import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, useEffect, useState } from 'react';
import type { PageProps, Flash } from '@/types';

export interface NavItem {
    label: string;
    href: string;
    icon?: string;
    active?: boolean;
}

interface Props {
    title?: string;
    nav?: NavItem[];
}

const DEFAULT_ICON: Record<string, string> = {
    Dashboard: 'bi-speedometer2',
    Rates: 'bi-cash-stack',
    History: 'bi-clock-history',
    'Live Display': 'bi-display',
    Currencies: 'bi-globe2',
    Branches: 'bi-shop',
    Users: 'bi-people',
    Settings: 'bi-gear',
    Transactions: 'bi-receipt',
    Reports: 'bi-graph-up',
    POS: 'bi-calculator',
    'Cash Drawer': 'bi-wallet2',
};

export default function AppLayout({ children, title, nav = [] }: PropsWithChildren<Props>) {
    const { auth, flash } = usePage().props as unknown as PageProps;
    const [toast, setToast] = useState<{ type: keyof Flash; msg: string } | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const first = (['success', 'error', 'info'] as const).find((k) => flash[k]);
        if (first) {
            setToast({ type: first, msg: flash[first]! });
            const ms = first === 'success' ? 4000 : 5000;
            const t = setTimeout(() => setToast(null), ms);
            return () => clearTimeout(t);
        }
    }, [flash]);

    const sidebar = (
        <>
            <div className="d-flex align-items-center gap-2 px-3 py-3 border-bottom border-secondary-subtle">
                <div
                    className="d-inline-flex align-items-center justify-content-center rounded-3 text-white"
                    style={{ width: 40, height: 40, background: '#0d6efd', fontSize: 20 }}
                >
                    <i className="bi bi-currency-exchange"></i>
                </div>
                <div>
                    <div className="fw-bold">Money Exchange</div>
                    <div className="small text-secondary text-capitalize">{auth.user?.role}</div>
                </div>
            </div>

            <ul className="nav nav-pills flex-column p-2 gap-1 flex-grow-1" style={{ overflowY: 'auto' }}>
                {nav.map((item) => {
                    const icon = item.icon ?? DEFAULT_ICON[item.label] ?? 'bi-dot';
                    return (
                        <li key={item.href} className="nav-item">
                            <Link
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`nav-link d-flex align-items-center gap-2 ${
                                    item.active ? 'active' : 'text-body'
                                }`}
                            >
                                <i className={`bi ${icon} fs-5`}></i>
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>

            <div className="border-top border-secondary-subtle p-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                    <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle bg-body-secondary"
                        style={{ width: 36, height: 36 }}
                    >
                        <i className="bi bi-person-fill text-secondary"></i>
                    </div>
                    <div className="flex-grow-1 min-w-0">
                        <div className="small fw-semibold text-truncate">{auth.user?.name}</div>
                        <div className="small text-secondary text-truncate">{auth.user?.email}</div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => router.post('/logout')}
                    className="btn btn-sm btn-outline-danger w-100"
                >
                    <i className="bi bi-box-arrow-right me-1"></i>Logout
                </button>
            </div>
        </>
    );

    return (
        <div className="d-flex min-vh-100 bg-body-tertiary">
            <aside
                className="mex-sidebar bg-body border-end d-none d-lg-flex flex-column"
                style={{ width: 240, position: 'sticky', top: 0, height: '100vh' }}
            >
                {sidebar}
            </aside>

            <div
                className={`mex-sidebar-mobile bg-body border-end d-lg-none flex-column ${
                    sidebarOpen ? 'd-flex' : 'd-none'
                }`}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: 260,
                    height: '100vh',
                    zIndex: 1045,
                    boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                }}
            >
                {sidebar}
            </div>
            {sidebarOpen && (
                <div
                    className="d-lg-none"
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        zIndex: 1040,
                    }}
                />
            )}

            <div className="flex-grow-1 d-flex flex-column min-vw-0">
                <header className="bg-body border-bottom shadow-sm d-lg-none px-3 py-2 d-flex align-items-center justify-content-between">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="btn btn-sm btn-outline-secondary"
                    >
                        <i className="bi bi-list fs-5"></i>
                    </button>
                    <Link href="/" className="fw-bold text-decoration-none text-body">
                        <i className="bi bi-currency-exchange text-primary me-1"></i>Money Exchange
                    </Link>
                    <div style={{ width: 36 }}></div>
                </header>

                <main className="flex-grow-1 p-4">
                    {title && <h1 className="h3 fw-bold mb-4">{title}</h1>}
                    {children}
                </main>
            </div>

            {toast && (
                <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
                    <div
                        className={`toast show text-bg-${
                            toast.type === 'success' ? 'success' : toast.type === 'error' ? 'danger' : 'info'
                        }`}
                        role="alert"
                    >
                        <div className="toast-body">{toast.msg}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
