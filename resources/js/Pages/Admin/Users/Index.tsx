import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { adminNav } from '@/Layouts/adminNav';
import type { PageProps, Role } from '@/types';

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: Role;
    branch_id: number | null;
    branch: { id: number; name: string; slug: string } | null;
    active: boolean;
}

interface Props {
    users: UserRow[];
    branches: { id: number; name: string }[];
}

export default function UsersIndex({ users, branches }: Props) {
    const { auth } = usePage().props as unknown as PageProps;
    const [editing, setEditing] = useState<UserRow | null>(null);
    const [creating, setCreating] = useState(false);

    return (
        <AppLayout title="Users" nav={adminNav('users')}>
            <Head title="Users" />
            <div className="d-flex justify-content-between mb-3">
                <p className="text-secondary small mb-0">
                    Admin, manager, and staff accounts. Managers/staff assigned to a branch.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
                    <i className="bi bi-plus-lg me-1"></i>Add User
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Branch</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>
                                        <span className="fw-semibold">{u.name}</span>
                                        {u.id === auth.user?.id && (
                                            <span className="badge text-bg-primary ms-2">You</span>
                                        )}
                                    </td>
                                    <td className="text-secondary">{u.email}</td>
                                    <td>
                                        <span className={`badge ${
                                            u.role === 'admin'
                                                ? 'text-bg-danger'
                                                : u.role === 'manager'
                                                ? 'text-bg-warning'
                                                : 'text-bg-secondary'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="text-secondary">{u.branch?.name ?? '—'}</td>
                                    <td>
                                        <span className={`badge ${u.active ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                            {u.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary me-1"
                                            onClick={() => setEditing(u)}
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                        {u.id !== auth.user?.id && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => {
                                                    if (confirm(`Delete ${u.name}?`))
                                                        router.delete(`/admin/users/${u.id}`);
                                                }}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {(creating || editing) && (
                <UserModal
                    user={editing}
                    branches={branches}
                    onClose={() => {
                        setCreating(false);
                        setEditing(null);
                    }}
                />
            )}
        </AppLayout>
    );
}

function UserModal({
    user,
    branches,
    onClose,
}: {
    user: UserRow | null;
    branches: { id: number; name: string }[];
    onClose: () => void;
}) {
    const isEdit = !!user;
    const { data, setData, post, put, processing, errors } = useForm<{
        name: string;
        email: string;
        password: string;
        role: Role;
        branch_id: number | '';
        active: boolean;
    }>({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        role: user?.role ?? 'staff',
        branch_id: user?.branch_id ?? '',
        active: user?.active ?? true,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (isEdit) put(`/admin/users/${user!.id}`, { onSuccess: onClose });
        else post('/admin/users', { onSuccess: onClose });
    };

    return (
        <>
            <div className="modal d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                    <form onSubmit={submit} className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold">
                                {isEdit ? `Edit ${user!.name}` : 'Add User'}
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
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                    />
                                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Role</label>
                                    <select
                                        value={data.role}
                                        onChange={(e) => setData('role', e.target.value as Role)}
                                        className="form-select"
                                    >
                                        <option value="admin">Admin (HQ)</option>
                                        <option value="manager">Manager (Branch)</option>
                                        <option value="staff">Staff (Counter)</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Branch</label>
                                    <select
                                        value={data.branch_id}
                                        onChange={(e) =>
                                            setData('branch_id', e.target.value ? parseInt(e.target.value) : '')
                                        }
                                        disabled={data.role === 'admin'}
                                        className="form-select"
                                    >
                                        <option value="">{data.role === 'admin' ? 'N/A (HQ admin)' : 'Select branch'}</option>
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12">
                                    <label className="form-label">
                                        Password {isEdit && <span className="text-secondary small">(leave blank to keep)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        autoComplete="new-password"
                                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                    />
                                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
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
                                            Active (inactive users cannot log in)
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
