import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { adminNav } from '@/Layouts/adminNav';

interface Branch {
    id: number;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    logo: string | null;
    theme: 'light' | 'dark';
    is_hq: boolean;
    active: boolean;
}

interface Props {
    branches: Branch[];
}

export default function BranchesIndex({ branches }: Props) {
    const [editing, setEditing] = useState<Branch | null>(null);
    const [creating, setCreating] = useState(false);

    return (
        <AppLayout title="Branches" nav={adminNav('branches')}>
            <Head title="Branches" />
            <div className="d-flex justify-content-between mb-3">
                <p className="text-secondary small mb-0">
                    Manage branches. Each has its own rates, users, and display URL.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
                    <i className="bi bi-plus-lg me-1"></i>Add Branch
                </button>
            </div>

            <div className="row g-3">
                {branches.map((b) => (
                    <div key={b.id} className="col-md-6 col-xl-4">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body">
                                <div className="d-flex align-items-start gap-3">
                                    {b.logo ? (
                                        <img
                                            src={`/storage/${b.logo}`}
                                            alt={b.name}
                                            className="rounded-3 bg-body-tertiary"
                                            style={{ width: 56, height: 56, objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div
                                            className="rounded-3 bg-body-tertiary d-inline-flex align-items-center justify-content-center text-secondary"
                                            style={{ width: 56, height: 56, fontSize: 28 }}
                                        >
                                            <i className="bi bi-shop"></i>
                                        </div>
                                    )}
                                    <div className="flex-fill min-w-0">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fw-bold">{b.name}</span>
                                            {b.is_hq && <span className="badge text-bg-info">HQ</span>}
                                            <span className={`badge ${b.active ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                                {b.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="small text-secondary">
                                            /display/{b.slug} · {b.theme}
                                        </div>
                                        {b.address && (
                                            <div className="small text-secondary mt-1 text-truncate">{b.address}</div>
                                        )}
                                        {b.phone && <div className="small text-secondary">{b.phone}</div>}
                                    </div>
                                </div>
                                <div className="mt-3 d-flex gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => setEditing(b)}
                                    >
                                        <i className="bi bi-pencil me-1"></i>Edit
                                    </button>
                                    <a
                                        href={`/display/${b.slug}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn btn-sm btn-outline-secondary"
                                    >
                                        <i className="bi bi-box-arrow-up-right me-1"></i>Display
                                    </a>
                                    {!b.is_hq && (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger ms-auto"
                                            onClick={() => {
                                                if (confirm(`Delete ${b.name}?`))
                                                    router.delete(`/admin/branches/${b.id}`);
                                            }}
                                        >
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {(creating || editing) && (
                <BranchModal
                    branch={editing}
                    onClose={() => {
                        setCreating(false);
                        setEditing(null);
                    }}
                />
            )}
        </AppLayout>
    );
}

function BranchModal({ branch, onClose }: { branch: Branch | null; onClose: () => void }) {
    const isEdit = !!branch;
    const { data, setData, post, processing, errors, progress } = useForm<{
        name: string;
        slug: string;
        address: string;
        phone: string;
        theme: 'light' | 'dark';
        is_hq: boolean;
        active: boolean;
        logo: File | null;
        _method?: string;
    }>({
        name: branch?.name ?? '',
        slug: branch?.slug ?? '',
        address: branch?.address ?? '',
        phone: branch?.phone ?? '',
        theme: branch?.theme ?? 'light',
        is_hq: branch?.is_hq ?? false,
        active: branch?.active ?? true,
        logo: null,
        _method: isEdit ? 'POST' : undefined,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            post(`/admin/branches/${branch!.id}`, { forceFormData: true, onSuccess: onClose });
        } else {
            post('/admin/branches', { forceFormData: true, onSuccess: onClose });
        }
    };

    return (
        <>
            <div className="modal d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <form onSubmit={submit} className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold">
                                {isEdit ? `Edit ${branch!.name}` : 'Add Branch'}
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>
                        <div className="modal-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                    />
                                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Slug</label>
                                    <input
                                        type="text"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value.toLowerCase())}
                                        placeholder="auto"
                                        className={`form-control ${errors.slug ? 'is-invalid' : ''}`}
                                    />
                                    {errors.slug && <div className="invalid-feedback">{errors.slug}</div>}
                                    <div className="form-text">Used in URL: /display/[slug]</div>
                                </div>
                                <div className="col-md-8">
                                    <label className="form-label">Address</label>
                                    <input
                                        type="text"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Display Theme</label>
                                    <select
                                        value={data.theme}
                                        onChange={(e) => setData('theme', e.target.value as 'light' | 'dark')}
                                        className="form-select"
                                    >
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Logo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setData('logo', e.target.files?.[0] ?? null)}
                                        className={`form-control ${errors.logo ? 'is-invalid' : ''}`}
                                    />
                                    {errors.logo && <div className="invalid-feedback">{errors.logo}</div>}
                                    {progress && (
                                        <div className="progress mt-2" style={{ height: 4 }}>
                                            <div
                                                className="progress-bar"
                                                style={{ width: `${progress.percentage ?? 0}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <div className="form-check form-switch">
                                        <input
                                            id="is_hq"
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={data.is_hq}
                                            onChange={(e) => setData('is_hq', e.target.checked)}
                                        />
                                        <label htmlFor="is_hq" className="form-check-label">
                                            HQ Branch (only one allowed)
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-6">
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
