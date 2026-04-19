import { PropsWithChildren } from 'react';

export default function AuthLayout({ children, title }: PropsWithChildren<{ title?: string }>) {
    return (
        <div
            className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3"
            style={{ background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' }}
        >
            <div className="d-flex align-items-center gap-3 mb-4">
                <div
                    className="d-inline-flex align-items-center justify-content-center rounded-3 shadow"
                    style={{ width: 48, height: 48, background: '#0d6efd', color: '#fff', fontSize: 24 }}
                >
                    <i className="bi bi-currency-exchange"></i>
                </div>
                <div>
                    <div className="fw-bold">Money Exchange</div>
                    {title && <div className="text-secondary small">{title}</div>}
                </div>
            </div>
            <div className="card shadow-lg border-0" style={{ width: '100%', maxWidth: 420 }}>
                <div className="card-body p-4">{children}</div>
            </div>
            <div className="mt-3 text-secondary small">© {new Date().getFullYear()} Money Exchange</div>
        </div>
    );
}
