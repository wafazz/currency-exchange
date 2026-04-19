import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { adminNav } from '@/Layouts/adminNav';

interface Column {
    name: string;
    type: string;
    nullable: boolean;
    default: string | null;
    key: string;
    auto_increment: boolean;
}

interface Props {
    table: string;
    columns: Column[];
    primary_key: string | null;
    rows: Record<string, any>[];
    pagination: { page: number; per_page: number; total: number; last_page: number };
}

export default function TableView({ table, columns, primary_key, rows, pagination }: Props) {
    const [showInsert, setShowInsert] = useState(false);
    const [insertData, setInsertData] = useState<Record<string, string>>({});
    const [insertErrors, setInsertErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);

    const openInsert = () => {
        const initial: Record<string, string> = {};
        columns.forEach((c) => (initial[c.name] = ''));
        setInsertData(initial);
        setInsertErrors({});
        setShowInsert(true);
    };

    const submitInsert = (e: FormEvent) => {
        e.preventDefault();
        setBusy(true);
        router.post(
            `/admin/database/tables/${table}/rows`,
            { row: insertData },
            {
                preserveScroll: true,
                onSuccess: () => setShowInsert(false),
                onError: (errs) => setInsertErrors(errs as Record<string, string>),
                onFinish: () => setBusy(false),
            }
        );
    };

    const copyRow = (row: Record<string, any>) => {
        if (!primary_key) return alert('No primary key on this table — cannot copy.');
        router.post(
            `/admin/database/tables/${table}/rows/copy`,
            { pk_column: primary_key, pk_value: row[primary_key] },
            { preserveScroll: true }
        );
    };

    const deleteRow = (row: Record<string, any>) => {
        if (!primary_key) return alert('No primary key on this table — cannot delete.');
        if (!confirm(`Delete row where ${primary_key} = ${row[primary_key]}?`)) return;
        router.delete(`/admin/database/tables/${table}/rows`, {
            data: { pk_column: primary_key, pk_value: row[primary_key] },
            preserveScroll: true,
        });
    };

    const formatCell = (v: any): string => {
        if (v === null || v === undefined) return '';
        if (typeof v === 'object') return JSON.stringify(v);
        const s = String(v);
        return s.length > 80 ? s.slice(0, 80) + '…' : s;
    };

    return (
        <AppLayout title={`Table: ${table}`} nav={adminNav('database')}>
            <Head title={table} />

            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <Link href="/admin/database" className="btn btn-outline-secondary btn-sm">
                    <i className="bi bi-arrow-left me-1"></i>Back
                </Link>
                <div className="text-secondary small ms-2">
                    {pagination.total.toLocaleString()} row(s) · {columns.length} column(s)
                    {primary_key && <> · PK: <code>{primary_key}</code></>}
                </div>
                <div className="ms-auto d-flex gap-2">
                    <button className="btn btn-success btn-sm" onClick={openInsert}>
                        <i className="bi bi-plus-lg me-1"></i>Insert Row
                    </button>
                    <Link href={`/admin/database/tables/${table}/edit`} className="btn btn-primary btn-sm">
                        <i className="bi bi-pencil-square me-1"></i>Edit Structure
                    </Link>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-sm table-hover align-middle mb-0">
                            <thead className="table-light sticky-top">
                                <tr>
                                    <th style={{ width: 120 }}>Actions</th>
                                    {columns.map((c) => (
                                        <th key={c.name} className="small">
                                            <div className="fw-bold">{c.name}</div>
                                            <div className="text-secondary font-monospace" style={{ fontSize: 11 }}>
                                                {c.type}
                                                {c.key === 'PRI' && <span className="ms-1 text-warning">PK</span>}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div className="btn-group btn-group-sm">
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    title="Copy row"
                                                    onClick={() => copyRow(r)}
                                                >
                                                    <i className="bi bi-files"></i>
                                                </button>
                                                <button
                                                    className="btn btn-outline-danger"
                                                    title="Delete row"
                                                    onClick={() => deleteRow(r)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                        {columns.map((c) => (
                                            <td key={c.name} className="small font-monospace">
                                                {formatCell(r[c.name])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr>
                                        <td colSpan={columns.length + 1} className="text-center text-secondary py-4">
                                            Empty table.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {pagination.last_page > 1 && (
                    <div className="card-footer d-flex justify-content-between align-items-center">
                        <div className="small text-secondary">
                            Page {pagination.page} of {pagination.last_page}
                        </div>
                        <div className="btn-group btn-group-sm">
                            <Link
                                href={`/admin/database/tables/${table}?page=${Math.max(1, pagination.page - 1)}`}
                                className={`btn btn-outline-secondary ${pagination.page <= 1 ? 'disabled' : ''}`}
                            >
                                <i className="bi bi-chevron-left"></i>
                            </Link>
                            <Link
                                href={`/admin/database/tables/${table}?page=${Math.min(
                                    pagination.last_page,
                                    pagination.page + 1
                                )}`}
                                className={`btn btn-outline-secondary ${
                                    pagination.page >= pagination.last_page ? 'disabled' : ''
                                }`}
                            >
                                <i className="bi bi-chevron-right"></i>
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {showInsert && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <form onSubmit={submitInsert}>
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        <i className="bi bi-plus-lg me-2"></i>Insert Row — {table}
                                    </h5>
                                    <button type="button" className="btn-close" onClick={() => setShowInsert(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        {columns.map((c) => {
                                            const placeholder = c.auto_increment
                                                ? 'auto'
                                                : c.default !== null
                                                  ? `default: ${c.default}`
                                                  : c.nullable
                                                    ? 'NULL'
                                                    : '';
                                            const errKey = `row.${c.name}`;
                                            const err = insertErrors[errKey];
                                            const isText = c.type.toLowerCase().includes('text') || c.type.toLowerCase().includes('json');
                                            return (
                                                <div key={c.name} className="col-md-6">
                                                    <label className="form-label small mb-1">
                                                        <span className="font-monospace fw-bold">{c.name}</span>
                                                        <span className="text-secondary ms-2" style={{ fontSize: 11 }}>
                                                            {c.type}
                                                            {!c.nullable && !c.auto_increment && <span className="text-danger ms-1">*</span>}
                                                        </span>
                                                    </label>
                                                    {isText ? (
                                                        <textarea
                                                            rows={2}
                                                            value={insertData[c.name] ?? ''}
                                                            onChange={(e) =>
                                                                setInsertData({ ...insertData, [c.name]: e.target.value })
                                                            }
                                                            placeholder={placeholder}
                                                            className={`form-control form-control-sm font-monospace ${err ? 'is-invalid' : ''}`}
                                                        />
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={insertData[c.name] ?? ''}
                                                            onChange={(e) =>
                                                                setInsertData({ ...insertData, [c.name]: e.target.value })
                                                            }
                                                            placeholder={placeholder}
                                                            className={`form-control form-control-sm font-monospace ${err ? 'is-invalid' : ''}`}
                                                        />
                                                    )}
                                                    {err && <div className="invalid-feedback">{err}</div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowInsert(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={busy}>
                                        {busy ? 'Inserting…' : 'Insert'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
