import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { adminNav } from '@/Layouts/adminNav';

interface ColumnRow {
    name: string;
    type: string;
    length: number | null;
    nullable: boolean;
    default: string;
    primary: boolean;
    auto_increment: boolean;
}

const TYPES = ['integer', 'bigInteger', 'string', 'text', 'boolean', 'date', 'dateTime', 'decimal', 'float', 'json'];

const newCol = (overrides: Partial<ColumnRow> = {}): ColumnRow => ({
    name: '',
    type: 'string',
    length: 255,
    nullable: false,
    default: '',
    primary: false,
    auto_increment: false,
    ...overrides,
});

export default function CreateTable() {
    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        columns: ColumnRow[];
        timestamps: boolean;
    }>({
        name: '',
        columns: [
            newCol({ name: 'id', type: 'bigInteger', length: null, primary: true, auto_increment: true }),
        ],
        timestamps: true,
    });

    const update = (i: number, patch: Partial<ColumnRow>) => {
        const next = [...data.columns];
        next[i] = { ...next[i], ...patch };
        setData('columns', next);
    };

    const addCol = () => setData('columns', [...data.columns, newCol()]);
    const removeCol = (i: number) => setData('columns', data.columns.filter((_, idx) => idx !== i));

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/database/tables');
    };

    return (
        <AppLayout title="Create Table" nav={adminNav('database')}>
            <Head title="Create Table" />

            <div className="mb-3">
                <Link href="/admin/database" className="btn btn-outline-secondary btn-sm">
                    <i className="bi bi-arrow-left me-1"></i>Back
                </Link>
            </div>

            <form onSubmit={submit}>
                <div className="card shadow-sm border-0 mb-3">
                    <div className="card-body">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-6">
                                <label className="form-label">Table Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. transactions"
                                    className={`form-control font-monospace ${errors.name ? 'is-invalid' : ''}`}
                                />
                                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                            </div>
                            <div className="col-md-6">
                                <div className="form-check">
                                    <input
                                        id="ts"
                                        type="checkbox"
                                        checked={data.timestamps}
                                        onChange={(e) => setData('timestamps', e.target.checked)}
                                        className="form-check-input"
                                    />
                                    <label htmlFor="ts" className="form-check-label">
                                        Add <code>created_at</code> / <code>updated_at</code>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card shadow-sm border-0 mb-3">
                    <div className="card-body">
                        <div className="fw-bold mb-3">Columns</div>
                        <div className="table-responsive">
                            <table className="table table-sm align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th style={{ width: 90 }}>Length</th>
                                        <th style={{ width: 70 }}>Null</th>
                                        <th>Default</th>
                                        <th style={{ width: 60 }}>PK</th>
                                        <th style={{ width: 60 }}>AI</th>
                                        <th style={{ width: 50 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.columns.map((c, i) => (
                                        <tr key={i}>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={c.name}
                                                    onChange={(e) => update(i, { name: e.target.value })}
                                                    className="form-control form-control-sm font-monospace"
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    value={c.type}
                                                    onChange={(e) => update(i, { type: e.target.value })}
                                                    className="form-select form-select-sm font-monospace"
                                                >
                                                    {TYPES.map((t) => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={c.length ?? ''}
                                                    onChange={(e) => update(i, { length: e.target.value ? parseInt(e.target.value) : null })}
                                                    disabled={c.type !== 'string'}
                                                    className="form-control form-control-sm"
                                                />
                                            </td>
                                            <td className="text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={c.nullable}
                                                    onChange={(e) => update(i, { nullable: e.target.checked })}
                                                    className="form-check-input"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={c.default}
                                                    onChange={(e) => update(i, { default: e.target.value })}
                                                    className="form-control form-control-sm font-monospace"
                                                />
                                            </td>
                                            <td className="text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={c.primary}
                                                    onChange={(e) => update(i, { primary: e.target.checked })}
                                                    className="form-check-input"
                                                />
                                            </td>
                                            <td className="text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={c.auto_increment}
                                                    onChange={(e) => update(i, { auto_increment: e.target.checked })}
                                                    disabled={!['integer', 'bigInteger'].includes(c.type)}
                                                    className="form-check-input"
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() => removeCol(i)}
                                                    className="btn btn-sm btn-outline-danger"
                                                    disabled={data.columns.length === 1}
                                                >
                                                    <i className="bi bi-x"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button type="button" onClick={addCol} className="btn btn-sm btn-outline-primary">
                            <i className="bi bi-plus-lg me-1"></i>Add Column
                        </button>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" disabled={processing}>
                    {processing ? 'Creating…' : (<><i className="bi bi-check2-circle me-1"></i>Create Table</>)}
                </button>
            </form>
        </AppLayout>
    );
}
