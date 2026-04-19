import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { adminNav } from '@/Layouts/adminNav';

interface Currency {
    id: number;
    code: string;
    name: string;
    symbol: string | null;
    flag_icon: string | null;
    decimal_places: number;
    unit: number;
    display_order: number;
    is_base: boolean;
    active: boolean;
}

interface Props {
    currencies: Currency[];
}

const FLAG: Record<string, string> = {
    us: '🇺🇸', sg: '🇸🇬', eu: '🇪🇺', gb: '🇬🇧', au: '🇦🇺', jp: '🇯🇵',
    cn: '🇨🇳', hk: '🇭🇰', th: '🇹🇭', id: '🇮🇩', sa: '🇸🇦', my: '🇲🇾',
};

const flagOf = (c: string | null) => (c ? FLAG[c.toLowerCase()] ?? '🌐' : '🌐');

export default function CurrenciesIndex({ currencies }: Props) {
    const [editing, setEditing] = useState<Currency | null>(null);
    const [creating, setCreating] = useState(false);

    return (
        <AppLayout title="Currencies" nav={adminNav('currencies')}>
            <Head title="Currencies" />
            <div className="d-flex justify-content-between mb-3">
                <p className="text-secondary small mb-0">
                    Manage supported currencies. Base currency (MYR) is read-only.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
                    <i className="bi bi-plus-lg me-1"></i>Add Currency
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th className="text-end">Unit</th>
                                <th className="text-end">Decimals</th>
                                <th className="text-end">Order</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currencies.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <span style={{ fontSize: 24 }}>{flagOf(c.flag_icon)}</span>
                                        <span className="fw-semibold ms-2">{c.code}</span>
                                        {c.is_base && <span className="badge text-bg-info ms-2">BASE</span>}
                                    </td>
                                    <td>
                                        {c.name}
                                        <span className="small text-secondary ms-2">{c.symbol}</span>
                                    </td>
                                    <td className="text-end">{c.unit}</td>
                                    <td className="text-end">{c.decimal_places}</td>
                                    <td className="text-end">{c.display_order}</td>
                                    <td>
                                        <span className={`badge ${c.active ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                            {c.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        {!c.is_base && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary me-1"
                                                    onClick={() => setEditing(c)}
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => {
                                                        if (confirm(`Delete ${c.code}?`))
                                                            router.delete(`/admin/currencies/${c.id}`);
                                                    }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {(creating || editing) && (
                <CurrencyModal
                    currency={editing}
                    onClose={() => {
                        setCreating(false);
                        setEditing(null);
                    }}
                />
            )}
        </AppLayout>
    );
}

function CurrencyModal({ currency, onClose }: { currency: Currency | null; onClose: () => void }) {
    const isEdit = !!currency;
    const { data, setData, post, put, processing, errors } = useForm({
        code: currency?.code ?? '',
        name: currency?.name ?? '',
        symbol: currency?.symbol ?? '',
        flag_icon: currency?.flag_icon ?? '',
        decimal_places: currency?.decimal_places ?? 2,
        unit: currency?.unit ?? 1,
        display_order: currency?.display_order ?? 99,
        active: currency?.active ?? true,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (isEdit) put(`/admin/currencies/${currency!.id}`, { onSuccess: onClose });
        else post('/admin/currencies', { onSuccess: onClose });
    };

    return (
        <>
            <div className="modal d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                    <form onSubmit={submit} className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold">
                                {isEdit ? `Edit ${currency!.code}` : 'Add Currency'}
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>
                        <div className="modal-body">
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label">Code</label>
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        maxLength={3}
                                        className={`form-control text-uppercase ${errors.code ? 'is-invalid' : ''}`}
                                    />
                                    {errors.code && <div className="invalid-feedback">{errors.code}</div>}
                                </div>
                                <div className="col-md-8">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                    />
                                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Symbol</label>
                                    <input
                                        type="text"
                                        value={data.symbol ?? ''}
                                        onChange={(e) => setData('symbol', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Flag (ISO, e.g. us)</label>
                                    <input
                                        type="text"
                                        value={data.flag_icon ?? ''}
                                        onChange={(e) => setData('flag_icon', e.target.value.toLowerCase())}
                                        maxLength={2}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Display Order</label>
                                    <input
                                        type="number"
                                        value={data.display_order}
                                        onChange={(e) => setData('display_order', parseInt(e.target.value) || 0)}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Decimal Places</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={4}
                                        value={data.decimal_places}
                                        onChange={(e) => setData('decimal_places', parseInt(e.target.value) || 0)}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Unit (per 1/100)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={data.unit}
                                        onChange={(e) => setData('unit', parseInt(e.target.value) || 1)}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-12">
                                    <div className="form-check form-switch">
                                        <input
                                            id="active"
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={data.active}
                                            onChange={(e) => setData('active', e.target.checked)}
                                        />
                                        <label htmlFor="active" className="form-check-label">
                                            Active
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={processing}>
                                {processing ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <div className="modal-backdrop show" />
        </>
    );
}
