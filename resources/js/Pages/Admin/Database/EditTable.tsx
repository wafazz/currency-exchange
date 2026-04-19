import { Head, Link, router, useForm } from '@inertiajs/react';
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
}

const TYPES = ['integer', 'bigInteger', 'string', 'text', 'boolean', 'date', 'dateTime', 'decimal', 'float', 'json'];

export default function EditTable({ table, columns }: Props) {
    const [showAdd, setShowAdd] = useState(false);

    const addForm = useForm({
        name: '',
        type: 'string',
        length: 255 as number | null,
        nullable: false,
        default: '',
    });

    const renameForm = useForm({ new_name: table });

    const submitAdd = (e: FormEvent) => {
        e.preventDefault();
        addForm.post(`/admin/database/tables/${table}/columns`, {
            preserveScroll: true,
            onSuccess: () => {
                addForm.reset();
                setShowAdd(false);
            },
        });
    };

    const submitRename = (e: FormEvent) => {
        e.preventDefault();
        renameForm.post(`/admin/database/tables/${table}/rename`);
    };

    const dropColumn = (col: string) => {
        if (!confirm(`Drop column '${col}'? This cannot be undone.`)) return;
        router.delete(`/admin/database/tables/${table}/columns`, {
            data: { column: col },
            preserveScroll: true,
        });
    };

    const dropTable = () => {
        if (!confirm(`DROP TABLE '${table}' permanently? This cannot be undone.`)) return;
        if (!confirm('Are you absolutely sure? All data will be lost.')) return;
        router.delete(`/admin/database/tables/${table}`);
    };

    return (
        <AppLayout title={`Edit: ${table}`} nav={adminNav('database')}>
            <Head title={`Edit ${table}`} />

            <div className="d-flex flex-wrap gap-2 mb-3">
                <Link href={`/admin/database/tables/${table}`} className="btn btn-outline-secondary btn-sm">
                    <i className="bi bi-arrow-left me-1"></i>Back to Table
                </Link>
                <button className="btn btn-success btn-sm" onClick={() => setShowAdd(true)}>
                    <i className="bi bi-plus-lg me-1"></i>Add Column
                </button>
                <button className="btn btn-danger btn-sm ms-auto" onClick={dropTable}>
                    <i className="bi bi-trash me-1"></i>Drop Table
                </button>
            </div>

            <div className="card shadow-sm border-0 mb-3">
                <div className="card-body">
                    <div className="fw-bold mb-2">
                        <i className="bi bi-pencil me-2"></i>Rename Table
                    </div>
                    <form onSubmit={submitRename} className="row g-2">
                        <div className="col-md-6">
                            <input
                                type="text"
                                value={renameForm.data.new_name}
                                onChange={(e) => renameForm.setData('new_name', e.target.value)}
                                className={`form-control font-monospace ${renameForm.errors.new_name ? 'is-invalid' : ''}`}
                            />
                            {renameForm.errors.new_name && (
                                <div className="invalid-feedback">{renameForm.errors.new_name}</div>
                            )}
                        </div>
                        <div className="col-md-auto">
                            <button type="submit" className="btn btn-primary" disabled={renameForm.processing}>
                                Rename
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body">
                    <div className="fw-bold mb-3">
                        <i className="bi bi-columns me-2"></i>Columns ({columns.length})
                    </div>
                    <div className="table-responsive">
                        <table className="table table-sm align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Nullable</th>
                                    <th>Default</th>
                                    <th>Key</th>
                                    <th style={{ width: 80 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {columns.map((c) => (
                                    <tr key={c.name}>
                                        <td className="font-monospace fw-bold">{c.name}</td>
                                        <td className="font-monospace small">{c.type}</td>
                                        <td>
                                            {c.nullable ? (
                                                <span className="badge text-bg-secondary">YES</span>
                                            ) : (
                                                <span className="badge text-bg-light">NO</span>
                                            )}
                                        </td>
                                        <td className="font-monospace small">{c.default ?? <span className="text-secondary">NULL</span>}</td>
                                        <td>
                                            {c.key === 'PRI' && <span className="badge text-bg-warning">PK</span>}
                                            {c.key === 'UNI' && <span className="badge text-bg-info">UNIQUE</span>}
                                            {c.auto_increment && <span className="badge text-bg-success ms-1">AI</span>}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => dropColumn(c.name)}
                                                className="btn btn-sm btn-outline-danger"
                                                title="Drop column"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showAdd && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={submitAdd}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Add Column</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowAdd(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Column Name</label>
                                        <input
                                            type="text"
                                            value={addForm.data.name}
                                            onChange={(e) => addForm.setData('name', e.target.value)}
                                            className={`form-control font-monospace ${addForm.errors.name ? 'is-invalid' : ''}`}
                                        />
                                        {addForm.errors.name && <div className="invalid-feedback">{addForm.errors.name}</div>}
                                    </div>
                                    <div className="row g-2 mb-3">
                                        <div className="col-md-8">
                                            <label className="form-label">Type</label>
                                            <select
                                                value={addForm.data.type}
                                                onChange={(e) => addForm.setData('type', e.target.value)}
                                                className="form-select font-monospace"
                                            >
                                                {TYPES.map((t) => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Length</label>
                                            <input
                                                type="number"
                                                value={addForm.data.length ?? ''}
                                                onChange={(e) =>
                                                    addForm.setData('length', e.target.value ? parseInt(e.target.value) : null)
                                                }
                                                disabled={addForm.data.type !== 'string'}
                                                className="form-control"
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Default (leave blank for none)</label>
                                        <input
                                            type="text"
                                            value={addForm.data.default}
                                            onChange={(e) => addForm.setData('default', e.target.value)}
                                            className="form-control font-monospace"
                                        />
                                    </div>
                                    <div className="form-check">
                                        <input
                                            id="nullable"
                                            type="checkbox"
                                            checked={addForm.data.nullable}
                                            onChange={(e) => addForm.setData('nullable', e.target.checked)}
                                            className="form-check-input"
                                        />
                                        <label htmlFor="nullable" className="form-check-label">
                                            Nullable
                                        </label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAdd(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={addForm.processing}>
                                        {addForm.processing ? 'Adding…' : 'Add Column'}
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
