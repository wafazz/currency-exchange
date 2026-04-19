import { Head, Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

interface Props {
    page: {
        slug: string;
        title: string;
        icon: string | null;
        content: string | null;
        map_embed: string | null;
        meta_description: string | null;
        updated_at: string | null;
    };
}

function sanitizeEmbed(html: string): string {
    const iframe = html.match(/<iframe[\s\S]*?<\/iframe>/i);
    if (!iframe) return '';
    // strip width/height attributes so our ratio wrapper controls sizing
    return iframe[0].replace(/\s(width|height)="[^"]*"/gi, '');
}

export default function PublicPage({ page }: Props) {
    const { auth } = usePage().props as unknown as PageProps;

    return (
        <>
            <Head title={page.title}>
                {page.meta_description && <meta name="description" content={page.meta_description} />}
            </Head>

            <nav className="navbar navbar-expand-lg bg-body border-bottom sticky-top shadow-sm">
                <div className="container">
                    <Link href="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold">
                        <span
                            className="d-inline-flex align-items-center justify-content-center rounded-3 text-white"
                            style={{ width: 36, height: 36, background: '#0d6efd', fontSize: 18 }}
                        >
                            <i className="bi bi-currency-exchange"></i>
                        </span>
                        <span>Money Exchange</span>
                    </Link>
                    <div className="ms-auto d-flex align-items-center gap-2">
                        <Link href="/about" className="btn btn-link btn-sm text-decoration-none">About</Link>
                        <Link href="/terms" className="btn btn-link btn-sm text-decoration-none">Terms</Link>
                        <Link href="/contact" className="btn btn-link btn-sm text-decoration-none">Contact</Link>
                        <a href="/display" className="btn btn-outline-primary btn-sm d-none d-sm-inline-flex align-items-center">
                            <i className="bi bi-display me-1"></i>Live Rates
                        </a>
                        {auth.user ? (
                            <Link href="/admin/dashboard" className="btn btn-primary btn-sm">
                                Dashboard
                            </Link>
                        ) : (
                            <Link href="/login" className="btn btn-primary btn-sm">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <section
                className="py-5"
                style={{
                    background: 'linear-gradient(135deg, #0d6efd, #0a58ca)',
                    color: '#fff',
                }}
            >
                <div className="container">
                    <div className="d-flex align-items-center gap-3">
                        <div
                            className="d-inline-flex align-items-center justify-content-center rounded-3"
                            style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.15)', fontSize: 32 }}
                        >
                            <i className={`bi ${page.icon ?? 'bi-file-text'}`}></i>
                        </div>
                        <div>
                            <h1 className="fw-bold mb-1">{page.title}</h1>
                            {page.meta_description && (
                                <p className="opacity-75 mb-0">{page.meta_description}</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <main className="py-5">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-8 mx-auto">
                            <article
                                className="page-content"
                                dangerouslySetInnerHTML={{ __html: page.content ?? '' }}
                            />
                            {page.updated_at && (
                                <div className="small text-secondary mt-5 pt-3 border-top">
                                    Last updated {page.updated_at}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {page.map_embed && (
                <section className="mex-map-full">
                    <div
                        className="mex-map-iframe"
                        dangerouslySetInnerHTML={{ __html: sanitizeEmbed(page.map_embed) }}
                    />
                </section>
            )}

            <footer className="py-4 bg-body border-top">
                <div className="container d-flex flex-wrap justify-content-between gap-2">
                    <div className="small text-secondary">
                        © {new Date().getFullYear()} Money Exchange
                    </div>
                    <div className="small">
                        <Link href="/about" className="text-decoration-none me-3">About</Link>
                        <Link href="/terms" className="text-decoration-none me-3">Terms</Link>
                        <Link href="/contact" className="text-decoration-none">Contact</Link>
                    </div>
                </div>
            </footer>
        </>
    );
}
