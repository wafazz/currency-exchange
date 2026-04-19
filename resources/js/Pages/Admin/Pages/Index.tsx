import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { adminNav } from '@/Layouts/adminNav';

interface Page {
    id: number;
    slug: string;
    title: string;
    icon: string | null;
    meta_description: string | null;
    published: boolean;
    updated_at: string;
}

interface Props {
    pages: Page[];
}

const DEFAULTS = ['about', 'terms', 'contact'];

function publicUrl(slug: string): string {
    return DEFAULTS.includes(slug) ? `/${slug}` : `/p/${slug}`;
}

export default function PagesIndex({ pages }: Props) {
    return (
        <AppLayout title="Pages" nav={adminNav('pages')}>
            <Head title="Pages" />
            <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-secondary small mb-0">
                    Manage public pages. Default pages (About, Terms, Contact) can be edited but not deleted.
                </p>
                <Link href="/admin/pages/create" className="btn btn-primary">
                    <i className="bi bi-plus-lg me-1"></i>New Page
                </Link>
            </div>

            <div className="row g-3">
                {pages.map((p) => {
                    const isDefault = DEFAULTS.includes(p.slug);
                    return (
                        <div key={p.id} className="col-md-6 col-lg-4">
                            <div className="card border-0 shadow-sm h-100 mex-display-card">
                                <div className="card-body">
                                    <div className="d-flex align-items-start gap-3">
                                        <div
                                            className="d-inline-flex align-items-center justify-content-center rounded-3 text-primary flex-shrink-0"
                                            style={{ width: 44, height: 44, background: 'var(--bs-primary-bg-subtle)', fontSize: 22 }}
                                        >
                                            <i className={`bi ${p.icon ?? 'bi-file-text'}`}></i>
                                        </div>
                                        <div className="flex-fill min-w-0">
                                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                                <div className="fw-bold text-truncate">{p.title}</div>
                                                <span className={`badge ${p.published ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                                    {p.published ? 'Live' : 'Draft'}
                                                </span>
                                                {isDefault && <span className="badge text-bg-info">Default</span>}
                                            </div>
                                            <div className="small text-secondary font-monospace">{publicUrl(p.slug)}</div>
                                            {p.meta_description && (
                                                <div className="small text-secondary mt-1 text-truncate">
                                                    {p.meta_description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 d-flex gap-2">
                                        <Link
                                            href={`/admin/pages/${p.id}/edit`}
                                            className="btn btn-sm btn-primary"
                                        >
                                            <i className="bi bi-pencil me-1"></i>Edit
                                        </Link>
                                        <a
                                            href={publicUrl(p.slug)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn btn-sm btn-outline-secondary"
                                        >
                                            <i className="bi bi-box-arrow-up-right me-1"></i>View
                                        </a>
                                        {!isDefault && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger ms-auto"
                                                onClick={() => {
                                                    if (confirm(`Delete "${p.title}"? This cannot be undone.`)) {
                                                        router.delete(`/admin/pages/${p.id}`);
                                                    }
                                                }}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </AppLayout>
    );
}
