import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { adminNav } from '@/Layouts/adminNav';

interface HistoryRow {
    id: number;
    currency: { id: number; code: string; name: string; flag_icon: string | null };
    old_buy: string | null;
    old_sell: string | null;
    new_buy: string;
    new_sell: string;
    changed_by: { id: number; name: string } | null;
    source: 'manual' | 'bulk' | 'api';
    note: string | null;
    created_at: string;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number | null;
    to: number | null;
    total: number;
}

interface Props {
    history: Paginated<HistoryRow>;
    currencies: { id: number; code: string; name: string }[];
    filters: { currency_id?: string; from?: string; to?: string };
}

function arrow(oldVal: string | null, newVal: string): '↑' | '↓' | '=' {
    if (!oldVal) return '=';
    const o = parseFloat(oldVal);
    const n = parseFloat(newVal);
    if (n > o) return '↑';
    if (n < o) return '↓';
    return '=';
}

export default function RateHistoryIndex({ history, currencies, filters }: Props) {
    const [form, setForm] = useState({
        currency_id: filters.currency_id ?? '',
        from: filters.from ?? '',
        to: filters.to ?? '',
    });

    const applyFilters = () => {
        router.get('/admin/rate-history', form, { preserveScroll: true, preserveState: true });
    };

    const reset = () => {
        setForm({ currency_id: '', from: '', to: '' });
        router.get('/admin/rate-history');
    };

    return (
        <AppLayout title="Rate History" nav={adminNav('history')}>
            <Head title="Rate History" />

            <div className="card shadow-sm border-0 mb-3">
                <div className="card-body">
                    <div className="row g-2">
                        <div className="col-md-3">
                            <label className="form-label small text-secondary">Currency</label>
                            <select
                                value={form.currency_id}
                                onChange={(e) => setForm({ ...form, currency_id: e.target.value })}
                                className="form-select form-select-sm"
                            >
                                <option value="">All</option>
                                {currencies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.code} — {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small text-secondary">From</label>
                            <input
                                type="date"
                                value={form.from}
                                onChange={(e) => setForm({ ...form, from: e.target.value })}
                                className="form-control form-control-sm"
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small text-secondary">To</label>
                            <input
                                type="date"
                                value={form.to}
                                onChange={(e) => setForm({ ...form, to: e.target.value })}
                                className="form-control form-control-sm"
                            />
                        </div>
                        <div className="col-md-3 d-flex align-items-end gap-2">
                            <button type="button" onClick={applyFilters} className="btn btn-sm btn-primary">
                                <i className="bi bi-funnel me-1"></i>Filter
                            </button>
                            <button type="button" onClick={reset} className="btn btn-sm btn-outline-secondary">
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                        <thead className="table-light">
                            <tr>
                                <th>When</th>
                                <th>Currency</th>
                                <th className="text-end">Old Buy</th>
                                <th className="text-end">New Buy</th>
                                <th className="text-end">Old Sell</th>
                                <th className="text-end">New Sell</th>
                                <th>By</th>
                                <th>Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center text-secondary py-4">
                                        No rate history yet.
                                    </td>
                                </tr>
                            )}
                            {history.data.map((h) => {
                                const bArrow = arrow(h.old_buy, h.new_buy);
                                const sArrow = arrow(h.old_sell, h.new_sell);
                                const bClass = bArrow === '↑' ? 'text-success' : bArrow === '↓' ? 'text-danger' : '';
                                const sClass = sArrow === '↑' ? 'text-success' : sArrow === '↓' ? 'text-danger' : '';
                                return (
                                    <tr key={h.id}>
                                        <td className="text-nowrap">{new Date(h.created_at).toLocaleString()}</td>
                                        <td>
                                            <span className="fw-semibold">{h.currency.code}</span>
                                            <span className="small text-secondary ms-2">{h.currency.name}</span>
                                        </td>
                                        <td className="text-end font-monospace text-secondary">{h.old_buy ?? '—'}</td>
                                        <td className={`text-end font-monospace ${bClass}`}>
                                            {h.new_buy} {bArrow !== '=' && <small>{bArrow}</small>}
                                        </td>
                                        <td className="text-end font-monospace text-secondary">{h.old_sell ?? '—'}</td>
                                        <td className={`text-end font-monospace ${sClass}`}>
                                            {h.new_sell} {sArrow !== '=' && <small>{sArrow}</small>}
                                        </td>
                                        <td>{h.changed_by?.name ?? '—'}</td>
                                        <td>
                                            <span
                                                className={`badge ${
                                                    h.source === 'bulk'
                                                        ? 'text-bg-primary'
                                                        : h.source === 'api'
                                                        ? 'text-bg-info'
                                                        : 'text-bg-secondary'
                                                }`}
                                            >
                                                {h.source}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {history.total > 0 && (
                <div className="d-flex align-items-center justify-content-between mt-3 small text-secondary">
                    <div>
                        {history.from}–{history.to} of {history.total}
                    </div>
                    <ul className="pagination pagination-sm mb-0">
                        {history.links.map((l, i) => (
                            <li key={i} className={`page-item ${l.active ? 'active' : ''} ${!l.url ? 'disabled' : ''}`}>
                                <Link
                                    href={l.url ?? '#'}
                                    className="page-link"
                                    dangerouslySetInnerHTML={{ __html: l.label }}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </AppLayout>
    );
}
