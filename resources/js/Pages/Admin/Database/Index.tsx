import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { adminNav } from '@/Layouts/adminNav';

interface Table {
    name: string;
    rows: number;
    size: number;
}

interface Props {
    database: string;
    tables: Table[];
    totals: { tables: number; rows: number; size: number };
    mysqldump_available: boolean;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

export default function DatabaseIndex({ database, tables, totals, mysqldump_available }: Props) {
    const [showPinModal, setShowPinModal] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);

    const pinForm = useForm({
        current_pin: '',
        new_pin: '',
        new_pin_confirmation: '',
    });

    const doBackup = () => {
        if (!mysqldump_available) return;
        window.location.href = '/admin/database/backup';
    };

    const doClearCache = () => {
        if (!confirm('Clear all application caches?')) return;
        setBusy('cache');
        router.post('/admin/database/clear-cache', {}, {
            preserveScroll: true,
            onFinish: () => setBusy(null),
        });
    };

    const doOptimize = () => {
        if (!confirm('Optimize all database tables? This may take a moment.')) return;
        setBusy('optimize');
        router.post('/admin/database/optimize', {}, {
            preserveScroll: true,
            onFinish: () => setBusy(null),
        });
    };

    const doLock = () => {
        router.post('/admin/database/lock');
    };

    const submitPin = (e: FormEvent) => {
        e.preventDefault();
        pinForm.post('/admin/database/change-pin', {
            preserveScroll: true,
            onSuccess: () => {
                pinForm.reset();
                setShowPinModal(false);
            },
        });
    };

    return (
        <AppLayout title="Database Management" nav={adminNav('database')}>
            <Head title="Database" />

            <div className="d-flex flex-wrap gap-2 mb-4">
                <div className="badge text-bg-success fs-6 py-2 px-3">
                    <i className="bi bi-unlock-fill me-1"></i>Vault Unlocked
                </div>
                <Link href="/admin/database/tables/create" className="btn btn-success btn-sm ms-auto">
                    <i className="bi bi-plus-lg me-1"></i>New Table
                </Link>
                <Link href="/admin/database/query" className="btn btn-primary btn-sm">
                    <i className="bi bi-terminal me-1"></i>SQL Query
                </Link>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowPinModal(true)}>
                    <i className="bi bi-key me-1"></i>Change PIN
                </button>
                <button className="btn btn-outline-danger btn-sm" onClick={doLock}>
                    <i className="bi bi-lock-fill me-1"></i>Lock Vault
                </button>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-md-3 col-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <div className="small text-secondary">Database</div>
                            <div className="fw-bold font-monospace text-truncate">{database}</div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <div className="small text-secondary">Tables</div>
                            <div className="fw-bold fs-4">{totals.tables}</div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <div className="small text-secondary">Total Rows</div>
                            <div className="fw-bold fs-4">{totals.rows.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <div className="small text-secondary">Total Size</div>
                            <div className="fw-bold fs-4">{formatSize(totals.size)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <div className="fw-bold mb-2">
                                <i className="bi bi-download text-primary me-2"></i>Backup Database
                            </div>
                            <p className="small text-secondary mb-3">
                                Download a full SQL dump of the database.
                            </p>
                            <button
                                className="btn btn-primary w-100"
                                onClick={doBackup}
                                disabled={!mysqldump_available}
                            >
                                <i className="bi bi-download me-1"></i>Download Backup
                            </button>
                            {!mysqldump_available && (
                                <div className="small text-danger mt-2">
                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                    mysqldump not found on server.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <div className="fw-bold mb-2">
                                <i className="bi bi-trash text-warning me-2"></i>Clear Caches
                            </div>
                            <p className="small text-secondary mb-3">
                                Clear application, config, view, and route caches.
                            </p>
                            <button
                                className="btn btn-warning w-100"
                                onClick={doClearCache}
                                disabled={busy === 'cache'}
                            >
                                {busy === 'cache' ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span>Clearing…</>
                                ) : (
                                    <><i className="bi bi-trash me-1"></i>Clear All Caches</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <div className="fw-bold mb-2">
                                <i className="bi bi-speedometer text-success me-2"></i>Optimize Tables
                            </div>
                            <p className="small text-secondary mb-3">
                                Run OPTIMIZE TABLE on all tables to reclaim space.
                            </p>
                            <button
                                className="btn btn-success w-100"
                                onClick={doOptimize}
                                disabled={busy === 'optimize'}
                            >
                                {busy === 'optimize' ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span>Optimizing…</>
                                ) : (
                                    <><i className="bi bi-speedometer me-1"></i>Optimize Tables</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body">
                    <div className="fw-bold mb-3">
                        <i className="bi bi-table text-primary me-2"></i>Tables
                    </div>
                    <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Table Name</th>
                                    <th className="text-end">Rows</th>
                                    <th className="text-end">Size</th>
                                    <th style={{ width: 160 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tables.map((t) => (
                                    <tr key={t.name}>
                                        <td>
                                            <Link
                                                href={`/admin/database/tables/${t.name}`}
                                                className="font-monospace text-decoration-none fw-semibold"
                                            >
                                                {t.name}
                                            </Link>
                                        </td>
                                        <td className="text-end">{t.rows.toLocaleString()}</td>
                                        <td className="text-end">{formatSize(t.size)}</td>
                                        <td>
                                            <div className="btn-group btn-group-sm">
                                                <Link
                                                    href={`/admin/database/tables/${t.name}`}
                                                    className="btn btn-outline-primary"
                                                    title="Browse"
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </Link>
                                                <Link
                                                    href={`/admin/database/tables/${t.name}/edit`}
                                                    className="btn btn-outline-secondary"
                                                    title="Structure"
                                                >
                                                    <i className="bi bi-columns"></i>
                                                </Link>
                                                <button
                                                    className="btn btn-outline-danger"
                                                    title="Drop"
                                                    onClick={() => {
                                                        if (!confirm(`DROP TABLE '${t.name}'? This cannot be undone.`)) return;
                                                        router.delete(`/admin/database/tables/${t.name}`);
                                                    }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {tables.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center text-secondary py-4">
                                            No tables found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showPinModal && (
                <>
                    <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <form onSubmit={submitPin}>
                                    <div className="modal-header">
                                        <h5 className="modal-title">
                                            <i className="bi bi-key me-2"></i>Change PIN
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setShowPinModal(false)}
                                        ></button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label">Current PIN</label>
                                            <input
                                                type="password"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={pinForm.data.current_pin}
                                                onChange={(e) =>
                                                    pinForm.setData('current_pin', e.target.value.replace(/\D/g, ''))
                                                }
                                                className={`form-control ${pinForm.errors.current_pin ? 'is-invalid' : ''}`}
                                            />
                                            {pinForm.errors.current_pin && (
                                                <div className="invalid-feedback">{pinForm.errors.current_pin}</div>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">New 6-Digit PIN</label>
                                            <input
                                                type="password"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={pinForm.data.new_pin}
                                                onChange={(e) =>
                                                    pinForm.setData('new_pin', e.target.value.replace(/\D/g, ''))
                                                }
                                                className={`form-control ${pinForm.errors.new_pin ? 'is-invalid' : ''}`}
                                            />
                                            {pinForm.errors.new_pin && (
                                                <div className="invalid-feedback">{pinForm.errors.new_pin}</div>
                                            )}
                                        </div>
                                        <div className="mb-0">
                                            <label className="form-label">Confirm New PIN</label>
                                            <input
                                                type="password"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={pinForm.data.new_pin_confirmation}
                                                onChange={(e) =>
                                                    pinForm.setData(
                                                        'new_pin_confirmation',
                                                        e.target.value.replace(/\D/g, '')
                                                    )
                                                }
                                                className={`form-control ${pinForm.errors.new_pin_confirmation ? 'is-invalid' : ''}`}
                                            />
                                            {pinForm.errors.new_pin_confirmation && (
                                                <div className="invalid-feedback">{pinForm.errors.new_pin_confirmation}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setShowPinModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={pinForm.processing}
                                        >
                                            {pinForm.processing ? 'Saving…' : 'Update PIN'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    );
}
