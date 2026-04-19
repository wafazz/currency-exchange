import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { adminNav } from '@/Layouts/adminNav';

interface RateRow {
    currency_id: number;
    code: string;
    name: string;
    flag_icon: string | null;
    unit: number;
    decimal_places: number;
    buy_rate: string | null;
    sell_rate: string | null;
    updated_at: string | null;
}

interface Props {
    rates: RateRow[];
    defaultSpread: number;
}

const FLAG: Record<string, string> = {
    us: '🇺🇸', sg: '🇸🇬', eu: '🇪🇺', gb: '🇬🇧', au: '🇦🇺', jp: '🇯🇵',
    cn: '🇨🇳', hk: '🇭🇰', th: '🇹🇭', id: '🇮🇩', sa: '🇸🇦', my: '🇲🇾',
};

function flagOf(code: string | null): string {
    return code ? FLAG[code.toLowerCase()] ?? '🌐' : '🌐';
}

export default function RatesIndex({ rates, defaultSpread }: Props) {
    const [editing, setEditing] = useState<Record<number, { buy: string; sell: string }>>(() =>
        Object.fromEntries(rates.map((r) => [r.currency_id, { buy: r.buy_rate ?? '', sell: r.sell_rate ?? '' }]))
    );
    const [bulkOpen, setBulkOpen] = useState(false);

    const saveRow = (row: RateRow) => {
        const e = editing[row.currency_id];
        router.put(`/admin/rates/${row.currency_id}`, { buy_rate: e.buy, sell_rate: e.sell }, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout title="Rate Management" nav={adminNav('rates')}>
            <Head title="Rates" />

            <div className="d-flex align-items-center justify-content-between mb-3">
                <p className="text-secondary small mb-0">
                    HQ default rates. Edit inline and Save, or use Bulk Update with mid + spread %.
                </p>
                <button
                    type="button"
                    onClick={() => setBulkOpen(true)}
                    className="btn btn-primary"
                >
                    <i className="bi bi-lightning-fill me-1"></i>Bulk Update
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Currency</th>
                                <th className="text-end">Unit</th>
                                <th className="text-end">We Buy</th>
                                <th className="text-end">We Sell</th>
                                <th>Updated</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rates.map((r) => (
                                <tr key={r.currency_id}>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <span style={{ fontSize: 24 }}>{flagOf(r.flag_icon)}</span>
                                            <div>
                                                <div className="fw-semibold">{r.code}</div>
                                                <div className="small text-secondary">{r.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-end text-secondary">{r.unit}</td>
                                    <td className="text-end">
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={editing[r.currency_id]?.buy ?? ''}
                                            onChange={(e) =>
                                                setEditing((s) => ({
                                                    ...s,
                                                    [r.currency_id]: { ...s[r.currency_id], buy: e.target.value },
                                                }))
                                            }
                                            className="form-control form-control-sm text-end font-monospace"
                                            style={{ width: 120, display: 'inline-block' }}
                                        />
                                    </td>
                                    <td className="text-end">
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={editing[r.currency_id]?.sell ?? ''}
                                            onChange={(e) =>
                                                setEditing((s) => ({
                                                    ...s,
                                                    [r.currency_id]: { ...s[r.currency_id], sell: e.target.value },
                                                }))
                                            }
                                            className="form-control form-control-sm text-end font-monospace"
                                            style={{ width: 120, display: 'inline-block' }}
                                        />
                                    </td>
                                    <td className="small text-secondary">{r.updated_at ?? '—'}</td>
                                    <td className="text-end">
                                        <button
                                            type="button"
                                            onClick={() => saveRow(r)}
                                            className="btn btn-sm btn-success"
                                        >
                                            <i className="bi bi-check2 me-1"></i>Save
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {bulkOpen && (
                <BulkUpdateModal rates={rates} defaultSpread={defaultSpread} onClose={() => setBulkOpen(false)} />
            )}
        </AppLayout>
    );
}

function BulkUpdateModal({
    rates,
    defaultSpread,
    onClose,
}: {
    rates: RateRow[];
    defaultSpread: number;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors } = useForm<{
        spread_percent: number;
        entries: { currency_id: number; mid: string }[];
    }>({
        spread_percent: defaultSpread,
        entries: rates.map((r) => ({
            currency_id: r.currency_id,
            mid:
                r.buy_rate && r.sell_rate
                    ? (((parseFloat(r.buy_rate) + parseFloat(r.sell_rate)) / 2).toFixed(4))
                    : '',
        })),
    });

    const setMid = (idx: number, mid: string) => {
        const next = [...data.entries];
        next[idx] = { ...next[idx], mid };
        setData('entries', next);
    };

    const calcBuySell = (mid: string) => {
        const m = parseFloat(mid);
        if (Number.isNaN(m)) return { buy: '', sell: '' };
        const buy = (m * (1 - data.spread_percent / 200)).toFixed(4);
        const sell = (m * (1 + data.spread_percent / 200)).toFixed(4);
        return { buy, sell };
    };

    const submit = () => {
        post('/admin/rates/bulk', { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <>
            <div className="modal d-block" tabIndex={-1}>
                <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div>
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-lightning-fill text-warning me-2"></i>Bulk Rate Update
                                </h5>
                                <div className="small text-secondary">
                                    Set spread %, enter mid rates. Buy/Sell auto-calculated.
                                </div>
                            </div>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>
                        <div className="modal-body">
                            <div className="card bg-body-tertiary border-0 mb-3">
                                <div className="card-body py-3">
                                    <div className="d-flex align-items-center gap-3 flex-wrap">
                                        <label className="fw-semibold mb-0">Spread %</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={data.spread_percent}
                                            onChange={(e) => setData('spread_percent', parseFloat(e.target.value) || 0)}
                                            className="form-control font-monospace"
                                            style={{ width: 110 }}
                                        />
                                        <span className="small text-secondary">
                                            e.g. mid 4.50 @ 2% → buy 4.4550, sell 4.5450
                                        </span>
                                    </div>
                                    {errors.spread_percent && (
                                        <div className="text-danger small mt-2">{errors.spread_percent}</div>
                                    )}
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Currency</th>
                                            <th className="text-end">Mid Rate</th>
                                            <th className="text-end">Calc Buy</th>
                                            <th className="text-end">Calc Sell</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rates.map((r, idx) => {
                                            const entry = data.entries[idx];
                                            const { buy, sell } = calcBuySell(entry.mid);
                                            return (
                                                <tr key={r.currency_id}>
                                                    <td>
                                                        <span style={{ fontSize: 20 }}>{flagOf(r.flag_icon)}</span>
                                                        <span className="fw-semibold ms-2">{r.code}</span>
                                                        <span className="small text-secondary ms-1">×{r.unit}</span>
                                                    </td>
                                                    <td className="text-end">
                                                        <input
                                                            type="number"
                                                            step="0.0001"
                                                            value={entry.mid}
                                                            onChange={(e) => setMid(idx, e.target.value)}
                                                            className="form-control form-control-sm text-end font-monospace"
                                                            style={{ width: 120, display: 'inline-block' }}
                                                        />
                                                    </td>
                                                    <td className="text-end font-monospace text-success">{buy || '—'}</td>
                                                    <td className="text-end font-monospace text-danger">{sell || '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={submit}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>Saving…
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check2-all me-1"></i>Apply to All
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show" />
        </>
    );
}
