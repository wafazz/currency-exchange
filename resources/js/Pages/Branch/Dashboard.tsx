import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import type { NavItem } from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';

const branchNav = (active: string): NavItem[] => [
    { label: 'Dashboard', href: '/branch/dashboard', icon: 'bi-speedometer2', active: active === 'dashboard' },
    { label: 'Rates', href: '#', icon: 'bi-cash-stack', active: active === 'rates' },
    { label: 'Transactions', href: '#', icon: 'bi-receipt', active: active === 'transactions' },
    { label: 'Reports', href: '#', icon: 'bi-graph-up', active: active === 'reports' },
];

export default function BranchDashboard() {
    const { auth } = usePage().props as unknown as PageProps;
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    return (
        <AppLayout title={`Good ${greet(now)}, ${auth.user?.name?.split(' ')[0] ?? ''}`} nav={branchNav('dashboard')}>
            <Head title="Branch Dashboard" />

            <div className="row g-3 mb-4">
                <StatTile icon="bi-receipt" value="—" label="Today's Transactions" accent="primary" />
                <StatTile icon="bi-cash" value="RM —" label="Today's Turnover" accent="success" />
                <StatTile icon="bi-wallet2" value="—" label="Cash Drawer" accent="info" />
                <StatTile icon="bi-exclamation-triangle" value="—" label="Alerts" accent="warning" />
            </div>

            <div className="row g-3">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="fw-bold mb-3">Branch Operations</div>
                            <div className="row g-2">
                                <div className="col-6 col-md-4">
                                    <Link href="#" className="text-decoration-none text-reset">
                                        <div className="p-3 rounded-3 bg-body-tertiary text-center mex-display-card">
                                            <i className="bi bi-calculator fs-2 text-primary d-block mb-1"></i>
                                            <div className="small fw-semibold">Open POS</div>
                                            <div className="small text-secondary">Phase 2</div>
                                        </div>
                                    </Link>
                                </div>
                                <div className="col-6 col-md-4">
                                    <Link href="#" className="text-decoration-none text-reset">
                                        <div className="p-3 rounded-3 bg-body-tertiary text-center mex-display-card">
                                            <i className="bi bi-pencil-square fs-2 text-primary d-block mb-1"></i>
                                            <div className="small fw-semibold">Adjust Rates</div>
                                            <div className="small text-secondary">Phase 2</div>
                                        </div>
                                    </Link>
                                </div>
                                <div className="col-6 col-md-4">
                                    <Link href="#" className="text-decoration-none text-reset">
                                        <div className="p-3 rounded-3 bg-body-tertiary text-center mex-display-card">
                                            <i className="bi bi-wallet2 fs-2 text-primary d-block mb-1"></i>
                                            <div className="small fw-semibold">Close Drawer</div>
                                            <div className="small text-secondary">Phase 2</div>
                                        </div>
                                    </Link>
                                </div>
                                <div className="col-6 col-md-4">
                                    <a href="/display" target="_blank" rel="noreferrer" className="text-decoration-none text-reset">
                                        <div className="p-3 rounded-3 bg-body-tertiary text-center mex-display-card">
                                            <i className="bi bi-display fs-2 text-primary d-block mb-1"></i>
                                            <div className="small fw-semibold">Open Display</div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex flex-column justify-content-center text-center">
                            <div
                                className="d-inline-flex align-items-center justify-content-center rounded-3 text-primary mx-auto mb-3"
                                style={{ width: 64, height: 64, background: 'rgba(13,110,253,0.1)', fontSize: 30 }}
                            >
                                <i className="bi bi-clock"></i>
                            </div>
                            <div className="h3 font-monospace fw-semibold mb-1">
                                {now.toLocaleTimeString('en-GB')}
                            </div>
                            <div className="small text-secondary">
                                {now.toLocaleDateString('en-GB', {
                                    weekday: 'long',
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="alert alert-info d-flex align-items-center mt-4 mb-0" role="alert">
                <i className="bi bi-info-circle fs-5 me-2"></i>
                <div>
                    POS, Transactions, and Cash Drawer modules are delivered in <strong>Phase 2</strong>.
                </div>
            </div>
        </AppLayout>
    );
}

function greet(d: Date) {
    const h = d.getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
}

function StatTile({
    icon,
    value,
    label,
    accent,
}: {
    icon: string;
    value: number | string;
    label: string;
    accent: 'primary' | 'info' | 'success' | 'warning';
}) {
    return (
        <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center gap-3">
                    <div
                        className={`d-inline-flex align-items-center justify-content-center rounded-3 text-${accent}`}
                        style={{ width: 48, height: 48, background: `var(--bs-${accent}-bg-subtle)`, fontSize: 24 }}
                    >
                        <i className={`bi ${icon}`}></i>
                    </div>
                    <div>
                        <div className="h3 fw-bold mb-0">{value}</div>
                        <div className="small text-secondary">{label}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
