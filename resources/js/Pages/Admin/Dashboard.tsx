import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { adminNav } from '@/Layouts/adminNav';

interface Props {
    stats: {
        currencies: number;
        branches: number;
        users: number;
        rate_changes_today: number;
    };
    lastRateUpdate: { at: string; diff: string } | null;
    activity: {
        id: number;
        code: string;
        flag: string | null;
        old_buy: string | null;
        new_buy: string;
        old_sell: string | null;
        new_sell: string;
        by: string | null;
        source: string;
        at: string;
    }[];
    snapshot: {
        code: string;
        name: string;
        flag: string | null;
        unit: number;
        buy: number;
        sell: number;
    }[];
}

const FLAG: Record<string, string> = {
    us: '🇺🇸', sg: '🇸🇬', eu: '🇪🇺', gb: '🇬🇧', au: '🇦🇺', jp: '🇯🇵',
    cn: '🇨🇳', hk: '🇭🇰', th: '🇹🇭', id: '🇮🇩', sa: '🇸🇦', my: '🇲🇾',
};
const flagOf = (c: string | null) => (c ? FLAG[c.toLowerCase()] ?? '🌐' : '🌐');

export default function AdminDashboard({ stats, lastRateUpdate, activity, snapshot }: Props) {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    return (
        <AppLayout title="Dashboard" nav={adminNav('dashboard')}>
            <Head title="Dashboard" />

            <div className="row g-3 mb-4">
                <StatTile icon="bi-globe2" value={stats.currencies} label="Currencies" href="/admin/currencies" accent="primary" />
                <StatTile icon="bi-shop" value={stats.branches} label="Branches" href="/admin/branches" accent="info" />
                <StatTile icon="bi-people" value={stats.users} label="Users" href="/admin/users" accent="success" />
                <StatTile icon="bi-graph-up" value={stats.rate_changes_today} label="Changes Today" href="/admin/rate-history" accent="warning" />
            </div>

            <div className="row g-3">
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <div className="fw-bold">Current Rates</div>
                                    <div className="small text-secondary">
                                        {lastRateUpdate
                                            ? `Last updated ${lastRateUpdate.diff}`
                                            : 'No rates yet'}
                                    </div>
                                </div>
                                <Link href="/admin/rates" className="btn btn-sm btn-outline-primary">
                                    Manage <i className="bi bi-arrow-right ms-1"></i>
                                </Link>
                            </div>
                            <div className="row g-2">
                                {snapshot.map((s) => (
                                    <div key={s.code} className="col-6 col-md-4">
                                        <div className="p-2 rounded-3 bg-body-tertiary h-100">
                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                <span style={{ fontSize: 20 }}>{flagOf(s.flag)}</span>
                                                <span className="fw-semibold small">
                                                    {s.unit > 1 ? `${s.unit} ` : ''}
                                                    {s.code}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between small">
                                                <span className="text-success font-monospace">
                                                    B {s.buy.toFixed(4)}
                                                </span>
                                                <span className="text-danger font-monospace">
                                                    S {s.sell.toFixed(4)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="fw-bold">Quick Actions</div>
                            </div>
                            <div className="row g-2 mb-3">
                                <QuickAction href="/admin/rates" icon="bi-pencil-square" label="Update Rates" />
                                <QuickAction href="/admin/rates" icon="bi-lightning-fill" label="Bulk Update" />
                                <QuickAction href="/display" icon="bi-display" label="Live Display" newTab />
                                <QuickAction href="/admin/settings" icon="bi-gear" label="Settings" />
                            </div>

                            <div className="mt-auto p-3 rounded-3 bg-body-tertiary">
                                <div className="d-flex align-items-center gap-3">
                                    <div
                                        className="d-inline-flex align-items-center justify-content-center rounded-3 text-primary"
                                        style={{ width: 44, height: 44, background: 'rgba(13,110,253,0.1)', fontSize: 22 }}
                                    >
                                        <i className="bi bi-clock"></i>
                                    </div>
                                    <div>
                                        <div className="font-monospace fw-semibold">
                                            {now.toLocaleTimeString('en-GB')}
                                        </div>
                                        <div className="small text-secondary">
                                            {now.toLocaleDateString('en-GB', {
                                                weekday: 'long',
                                                day: '2-digit',
                                                month: 'short',
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="fw-bold">Recent Rate Activity</div>
                                <Link href="/admin/rate-history" className="small">
                                    View all <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>
                            {activity.length === 0 ? (
                                <div className="text-secondary small text-center py-4">
                                    <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                                    No rate changes yet — edit rates to start the log.
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover mb-0 align-middle">
                                        <thead>
                                            <tr className="small text-secondary">
                                                <th>When</th>
                                                <th>Currency</th>
                                                <th className="text-end">Buy</th>
                                                <th className="text-end">Sell</th>
                                                <th>By</th>
                                                <th>Source</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activity.map((a) => {
                                                const bDir = dirOf(a.old_buy, a.new_buy);
                                                const sDir = dirOf(a.old_sell, a.new_sell);
                                                return (
                                                    <tr key={a.id}>
                                                        <td className="small text-secondary">{a.at}</td>
                                                        <td>
                                                            <span style={{ fontSize: 18 }}>{flagOf(a.flag)}</span>
                                                            <span className="fw-semibold ms-2">{a.code}</span>
                                                        </td>
                                                        <td className={`text-end font-monospace ${bDir === 'up' ? 'text-success' : bDir === 'down' ? 'text-danger' : ''}`}>
                                                            {a.new_buy} {bDir === 'up' ? '▲' : bDir === 'down' ? '▼' : ''}
                                                        </td>
                                                        <td className={`text-end font-monospace ${sDir === 'up' ? 'text-success' : sDir === 'down' ? 'text-danger' : ''}`}>
                                                            {a.new_sell} {sDir === 'up' ? '▲' : sDir === 'down' ? '▼' : ''}
                                                        </td>
                                                        <td className="small">{a.by ?? '—'}</td>
                                                        <td>
                                                            <span className={`badge ${
                                                                a.source === 'bulk' ? 'text-bg-primary' :
                                                                a.source === 'api' ? 'text-bg-info' :
                                                                'text-bg-secondary'
                                                            }`}>
                                                                {a.source}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function dirOf(oldVal: string | null, newVal: string): 'up' | 'down' | 'same' {
    if (!oldVal) return 'same';
    const o = parseFloat(oldVal);
    const n = parseFloat(newVal);
    if (n > o) return 'up';
    if (n < o) return 'down';
    return 'same';
}

function StatTile({
    icon,
    value,
    label,
    href,
    accent,
}: {
    icon: string;
    value: number;
    label: string;
    href: string;
    accent: 'primary' | 'info' | 'success' | 'warning';
}) {
    return (
        <div className="col-6 col-md-3">
            <Link
                href={href}
                className="card border-0 shadow-sm text-decoration-none text-reset h-100 mex-display-card"
            >
                <div className="card-body d-flex align-items-center gap-3">
                    <div
                        className={`d-inline-flex align-items-center justify-content-center rounded-3 text-${accent}`}
                        style={{
                            width: 48,
                            height: 48,
                            background: `var(--bs-${accent}-bg-subtle)`,
                            fontSize: 24,
                        }}
                    >
                        <i className={`bi ${icon}`}></i>
                    </div>
                    <div>
                        <div className="h3 fw-bold mb-0">{value}</div>
                        <div className="small text-secondary">{label}</div>
                    </div>
                </div>
            </Link>
        </div>
    );
}

function QuickAction({
    href,
    icon,
    label,
    newTab = false,
}: {
    href: string;
    icon: string;
    label: string;
    newTab?: boolean;
}) {
    const inner = (
        <div className="p-3 rounded-3 bg-body-tertiary text-center h-100 mex-display-card">
            <i className={`bi ${icon} fs-3 text-primary d-block mb-1`}></i>
            <div className="small fw-semibold">{label}</div>
        </div>
    );
    return (
        <div className="col-6">
            {newTab ? (
                <a href={href} target="_blank" rel="noreferrer" className="text-decoration-none text-reset">
                    {inner}
                </a>
            ) : (
                <Link href={href} className="text-decoration-none text-reset">
                    {inner}
                </Link>
            )}
        </div>
    );
}
