import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { adminNav } from '@/Layouts/adminNav';

interface QueryResult {
    type: 'select' | 'modify' | 'error';
    message: string;
    columns: string[];
    rows: Record<string, any>[];
    affected: number;
    duration_ms: number;
}

interface Props {
    sql: string;
    result: QueryResult | null;
}

export default function QueryPage({ sql, result }: Props) {
    const { data, setData, post, processing } = useForm({ sql });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/database/query', { preserveScroll: true });
    };

    const formatCell = (v: any): string => {
        if (v === null || v === undefined) return '';
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v);
    };

    return (
        <AppLayout title="SQL Query" nav={adminNav('database')}>
            <Head title="SQL Query" />

            <div className="mb-3">
                <Link href="/admin/database" className="btn btn-outline-secondary btn-sm">
                    <i className="bi bi-arrow-left me-1"></i>Back
                </Link>
            </div>

            <div className="card shadow-sm border-0 mb-3">
                <div className="card-body">
                    <form onSubmit={submit}>
                        <label className="form-label fw-bold">
                            <i className="bi bi-terminal me-2"></i>SQL Query
                        </label>
                        <textarea
                            value={data.sql}
                            onChange={(e) => setData('sql', e.target.value)}
                            rows={8}
                            placeholder="SELECT * FROM users LIMIT 10;"
                            className="form-control font-monospace"
                            spellCheck={false}
                            style={{ fontSize: 14 }}
                        />
                        <div className="d-flex justify-content-between align-items-center mt-2">
                            <div className="small text-secondary">
                                <i className="bi bi-info-circle me-1"></i>
                                SELECT/SHOW/DESCRIBE return rows. Other statements return affected count.
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={processing || !data.sql.trim()}>
                                {processing ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span>Running…</>
                                ) : (
                                    <><i className="bi bi-play-fill me-1"></i>Run Query</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {result && (
                <div className="card shadow-sm border-0">
                    <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                {result.type === 'error' && (
                                    <span className="badge text-bg-danger">
                                        <i className="bi bi-exclamation-circle me-1"></i>Error
                                    </span>
                                )}
                                {result.type === 'select' && (
                                    <span className="badge text-bg-success">
                                        <i className="bi bi-check2-circle me-1"></i>
                                        {result.rows.length} row(s)
                                    </span>
                                )}
                                {result.type === 'modify' && (
                                    <span className="badge text-bg-info">
                                        <i className="bi bi-check2-circle me-1"></i>
                                        {result.affected} row(s) affected
                                    </span>
                                )}
                            </div>
                            <div className="small text-secondary">{result.duration_ms} ms</div>
                        </div>

                        {result.type === 'error' && (
                            <pre className="bg-danger-subtle text-danger p-3 rounded mb-0 small">{result.message}</pre>
                        )}

                        {result.type === 'modify' && (
                            <div className="alert alert-info mb-0">{result.message}</div>
                        )}

                        {result.type === 'select' && (
                            <div className="table-responsive" style={{ maxHeight: 500 }}>
                                <table className="table table-sm table-hover align-middle mb-0">
                                    <thead className="table-light sticky-top">
                                        <tr>
                                            {result.columns.map((c) => (
                                                <th key={c} className="font-monospace small">{c}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.rows.map((r, i) => (
                                            <tr key={i}>
                                                {result.columns.map((c) => (
                                                    <td key={c} className="font-monospace small" style={{ maxWidth: 300 }}>
                                                        <div className="text-truncate" title={formatCell(r[c])}>
                                                            {formatCell(r[c])}
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                        {result.rows.length === 0 && (
                                            <tr>
                                                <td colSpan={result.columns.length || 1} className="text-center text-secondary py-4">
                                                    Empty result.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
