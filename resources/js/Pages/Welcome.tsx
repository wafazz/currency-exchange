import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PageProps } from '@/types';

interface RateItem {
    code: string;
    name: string;
    symbol: string | null;
    flag: string | null;
    unit: number;
    decimals: number;
    buy: number;
    sell: number;
}

interface Payload {
    branch: { name: string; slug: string; logo: string | null; theme: string };
    rates: RateItem[];
    updated_at: string;
}

const FLAG: Record<string, string> = {
    us: '🇺🇸', sg: '🇸🇬', eu: '🇪🇺', gb: '🇬🇧', au: '🇦🇺', jp: '🇯🇵',
    cn: '🇨🇳', hk: '🇭🇰', th: '🇹🇭', id: '🇮🇩', sa: '🇸🇦', my: '🇲🇾',
};
const flagOf = (c: string | null) => (c ? FLAG[c.toLowerCase()] ?? '🌐' : '🌐');

export default function Welcome() {
    const { auth } = usePage().props as unknown as PageProps;
    const [rates, setRates] = useState<RateItem[]>([]);
    const [updatedAt, setUpdatedAt] = useState<string>('');
    const [now, setNow] = useState(new Date());
    const [flash, setFlash] = useState<Record<string, { buy?: 'up' | 'down'; sell?: 'up' | 'down' }>>({});
    const prev = useRef<Record<string, { buy: number; sell: number }>>({});
    const [selectedCode, setSelectedCode] = useState<string>('USD');
    const [visitor, setVisitor] = useState<{ live: number; today: number; total: number; since: string } | null>(null);
    const [visitorOpen, setVisitorOpen] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        return localStorage.getItem('mex_visitor_open') !== '0';
    });

    const toggleVisitor = (next: boolean) => {
        setVisitorOpen(next);
        try {
            localStorage.setItem('mex_visitor_open', next ? '1' : '0');
        } catch {
            // storage denied; ignore
        }
    };
    const [direction, setDirection] = useState<'buy' | 'sell'>('sell');
    const [foreignAmount, setForeignAmount] = useState<string>('100');
    const [myrAmount, setMyrAmount] = useState<string>('');
    const [lastEdited, setLastEdited] = useState<'foreign' | 'myr'>('foreign');

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const res = await fetch('/api/visitor-stats', { credentials: 'same-origin' });
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) setVisitor(data);
            } catch {
                // silent
            }
        };
        load();
        const iv = setInterval(load, 15_000);
        return () => {
            cancelled = true;
            clearInterval(iv);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const res = await fetch('/api/rates');
                if (!res.ok) return;
                const data: Payload = await res.json();
                if (cancelled) return;

                const nextFlash: typeof flash = {};
                data.rates.forEach((r) => {
                    const p = prev.current[r.code];
                    if (p) {
                        if (r.buy > p.buy) nextFlash[r.code] = { ...nextFlash[r.code], buy: 'up' };
                        else if (r.buy < p.buy) nextFlash[r.code] = { ...nextFlash[r.code], buy: 'down' };
                        if (r.sell > p.sell) nextFlash[r.code] = { ...nextFlash[r.code], sell: 'up' };
                        else if (r.sell < p.sell) nextFlash[r.code] = { ...nextFlash[r.code], sell: 'down' };
                    }
                    prev.current[r.code] = { buy: r.buy, sell: r.sell };
                });

                setRates(data.rates);
                setUpdatedAt(data.updated_at);
                if (Object.keys(nextFlash).length) {
                    setFlash(nextFlash);
                    setTimeout(() => setFlash({}), 1400);
                }
            } catch {
                // silent
            }
        };
        load();
        const iv = setInterval(load, 2_000);
        return () => {
            cancelled = true;
            clearInterval(iv);
        };
    }, []);

    const selected = useMemo(() => rates.find((r) => r.code === selectedCode), [rates, selectedCode]);
    const rateUsed = selected ? (direction === 'buy' ? selected.buy : selected.sell) : 0;
    const unit = selected?.unit ?? 1;

    useEffect(() => {
        if (!selected) return;
        if (lastEdited === 'foreign') {
            const f = parseFloat(foreignAmount);
            if (!isNaN(f)) setMyrAmount(((f / unit) * rateUsed).toFixed(2));
            else setMyrAmount('');
        } else {
            const m = parseFloat(myrAmount);
            if (!isNaN(m) && rateUsed > 0) setForeignAmount(((m * unit) / rateUsed).toFixed(2));
            else setForeignAmount('');
        }
    }, [selected, rateUsed, unit, foreignAmount, myrAmount, lastEdited]);

    const headlineRates = rates.slice(0, 6);

    return (
        <>
            <Head title="Home" />

            {/* TOP BAR */}
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
                    <div className="ms-auto d-flex align-items-center gap-1">
                        <Link href="/about" className="btn btn-link btn-sm text-decoration-none d-none d-md-inline">About</Link>
                        <Link href="/terms" className="btn btn-link btn-sm text-decoration-none d-none d-md-inline">Terms</Link>
                        <Link href="/contact" className="btn btn-link btn-sm text-decoration-none d-none d-md-inline">Contact</Link>
                        <a href="/display" className="btn btn-outline-primary btn-sm d-none d-sm-inline-flex align-items-center">
                            <i className="bi bi-display me-1"></i>Live Rates
                        </a>
                        {auth.user ? (
                            <Link href={dashboardFor(auth.user.role)} className="btn btn-primary btn-sm">
                                <i className="bi bi-speedometer2 me-1"></i>Dashboard
                            </Link>
                        ) : (
                            <Link href="/login" className="btn btn-primary btn-sm">
                                <i className="bi bi-box-arrow-in-right me-1"></i>Staff Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* HERO WITH CONVERTER */}
            <section
                className="py-5 position-relative"
                style={{
                    background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 50%, #084298 100%)',
                    color: '#fff',
                }}
            >
                <div className="container py-4">
                    <div className="row g-5 align-items-center">
                        <div className="col-lg-6">
                            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(255,255,255,0.15)' }}>
                                <span className="d-inline-block rounded-circle" style={{ width: 8, height: 8, background: '#10b981', animation: 'pulse 2s infinite' }}></span>
                                <span className="small fw-semibold">Live rates updated every 2 seconds</span>
                            </div>
                            <h1 className="display-4 fw-bold mb-3">
                                Malaysia's smartest
                                <br />
                                currency exchange
                            </h1>
                            <p className="lead opacity-75 mb-4">
                                Real-time FX rates, instant calculator, and transparent spreads. Convert before you walk in — no surprises.
                            </p>
                            <div className="d-flex flex-wrap gap-2">
                                <a href="/display" className="btn btn-light btn-lg fw-semibold">
                                    <i className="bi bi-display me-2"></i>View Live Board
                                </a>
                                <a href="#converter" className="btn btn-outline-light btn-lg">
                                    <i className="bi bi-calculator me-2"></i>Try Calculator
                                </a>
                            </div>
                        </div>

                        <div className="col-lg-6" id="converter">
                            <div className="card border-0 shadow-lg" style={{ color: '#000' }}>
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="fw-bold">
                                            <i className="bi bi-calculator text-primary me-1"></i>
                                            Instant Converter
                                        </div>
                                        {updatedAt && (
                                            <span className="small text-secondary">
                                                <i className="bi bi-broadcast text-success me-1"></i>
                                                Live
                                            </span>
                                        )}
                                    </div>

                                    <div className="btn-group w-100 mb-3" role="group">
                                        <button
                                            type="button"
                                            className={`btn ${direction === 'sell' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setDirection('sell')}
                                        >
                                            I want to buy {selectedCode}
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn ${direction === 'buy' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setDirection('buy')}
                                        >
                                            I want to sell {selectedCode}
                                        </button>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small text-secondary">{selectedCode} Amount</label>
                                        <div className="input-group input-group-lg">
                                            <select
                                                className="form-select"
                                                style={{ maxWidth: 130 }}
                                                value={selectedCode}
                                                onChange={(e) => setSelectedCode(e.target.value)}
                                            >
                                                {rates.map((r) => (
                                                    <option key={r.code} value={r.code}>
                                                        {flagOf(r.flag)} {r.code}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={foreignAmount}
                                                onChange={(e) => {
                                                    setLastEdited('foreign');
                                                    setForeignAmount(e.target.value);
                                                }}
                                                className="form-control font-monospace text-end"
                                            />
                                        </div>
                                    </div>

                                    <div className="text-center text-secondary mb-1">
                                        <i className="bi bi-arrow-down-up"></i>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small text-secondary">MYR Amount</label>
                                        <div className="input-group input-group-lg">
                                            <span className="input-group-text fw-semibold" style={{ minWidth: 130 }}>
                                                🇲🇾 MYR
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={myrAmount}
                                                onChange={(e) => {
                                                    setLastEdited('myr');
                                                    setMyrAmount(e.target.value);
                                                }}
                                                className="form-control font-monospace text-end"
                                            />
                                        </div>
                                    </div>

                                    {selected && (
                                        <div className="p-2 rounded-3 bg-body-tertiary small text-secondary d-flex justify-content-between">
                                            <span>Rate:</span>
                                            <span className="font-monospace fw-semibold text-dark">
                                                {unit > 1 ? `${unit} ` : ''}
                                                {selected.code} = {rateUsed.toFixed(selected.decimals + 2)} MYR
                                                <span className={`ms-1 ${direction === 'sell' ? 'text-danger' : 'text-success'}`}>
                                                    ({direction === 'sell' ? 'sell' : 'buy'})
                                                </span>
                                            </span>
                                        </div>
                                    )}

                                    <div className="mt-3 d-flex flex-wrap gap-1">
                                        {[100, 500, 1000, 5000].map((q) => (
                                            <button
                                                key={q}
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => {
                                                    setLastEdited('foreign');
                                                    setForeignAmount(String(q));
                                                }}
                                            >
                                                {q.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }`}</style>
            </section>

            {/* LIVE RATES STRIP */}
            <section className="py-4 bg-body-tertiary border-bottom">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="h5 fw-bold mb-0 d-flex align-items-center gap-2">
                            <span className="d-inline-block rounded-circle bg-success" style={{ width: 8, height: 8, animation: 'pulse 2s infinite' }}></span>
                            Today's rates
                            {updatedAt && (
                                <span className="small fw-normal text-secondary ms-2">
                                    Updated {secondsAgo(updatedAt, now)}s ago
                                </span>
                            )}
                        </h2>
                        <a href="/display" className="small text-decoration-none">
                            Fullscreen board <i className="bi bi-arrow-right"></i>
                        </a>
                    </div>
                    {headlineRates.length === 0 ? (
                        <div className="text-center py-4 text-secondary small">Loading rates…</div>
                    ) : (
                        <div className="row g-3">
                            {headlineRates.map((r) => {
                                const f = flash[r.code] ?? {};
                                return (
                                    <div key={r.code} className="col-6 col-md-4 col-lg-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedCode(r.code);
                                                document.getElementById('converter')?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="card border-0 shadow-sm w-100 h-100 mex-display-card text-start"
                                        >
                                            <div className="card-body p-3">
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <span style={{ fontSize: 22 }}>{flagOf(r.flag)}</span>
                                                    <span className="fw-bold">
                                                        {r.unit > 1 ? `${r.unit} ` : ''}
                                                        {r.code}
                                                    </span>
                                                </div>
                                                <div className="d-flex justify-content-between small">
                                                    <div className={`p-1 rounded ${f.buy === 'up' ? 'flash-up' : f.buy === 'down' ? 'flash-down' : ''}`} style={{ flex: 1 }}>
                                                        <div className="text-secondary" style={{ fontSize: 10 }}>
                                                            BUY {f.buy === 'up' ? '▲' : f.buy === 'down' ? '▼' : ''}
                                                        </div>
                                                        <div className="text-success font-monospace fw-semibold">{r.buy.toFixed(4)}</div>
                                                    </div>
                                                    <div className={`p-1 rounded text-end ${f.sell === 'up' ? 'flash-up' : f.sell === 'down' ? 'flash-down' : ''}`} style={{ flex: 1 }}>
                                                        <div className="text-secondary" style={{ fontSize: 10 }}>
                                                            SELL {f.sell === 'up' ? '▲' : f.sell === 'down' ? '▼' : ''}
                                                        </div>
                                                        <div className="text-danger font-monospace fw-semibold">{r.sell.toFixed(4)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* FEATURES */}
            <section className="py-5">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="fw-bold mb-2">Built for speed &amp; transparency</h2>
                        <p className="text-secondary">Everything a modern money changer needs.</p>
                    </div>
                    <div className="row g-4">
                        <Feature icon="bi-lightning-charge" tint="primary" title="Live rates"
                            desc="Our board refreshes every 2 seconds. Buy high, sell low is history." />
                        <Feature icon="bi-calculator" tint="success" title="Instant calculator"
                            desc="Know the exact MYR you need — or what you'll get — before you arrive." />
                        <Feature icon="bi-shield-check" tint="info" title="Rate lock"
                            desc="Quoted rate is the rate you get at the counter. Full audit trail kept." />
                        <Feature icon="bi-phone" tint="warning" title="Any screen"
                            desc="Works on your phone, tablet, or our wall-mounted TV displays." />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-5" style={{ background: '#0f172a', color: '#fff' }}>
                <div className="container text-center">
                    <h2 className="fw-bold mb-3">Ready to exchange?</h2>
                    <p className="opacity-75 mb-4">
                        Walk into any branch with the rate quoted above, or let us know you're coming.
                    </p>
                    <a href="/display" className="btn btn-light btn-lg me-2">
                        <i className="bi bi-display me-2"></i>See Live Board
                    </a>
                    <a href="#converter" className="btn btn-outline-light btn-lg">
                        <i className="bi bi-calculator me-2"></i>Calculate Again
                    </a>
                </div>
            </section>

            {/* FLOATING VISITOR STATS */}
            {visitor && (
                <div
                    className="position-fixed"
                    style={{ bottom: 20, left: 20, zIndex: 1030, maxWidth: 280 }}
                >
                    {visitorOpen ? (
                        <div className="card border-0 shadow-lg" style={{ background: 'rgba(15, 23, 42, 0.92)', color: '#fff', backdropFilter: 'blur(8px)' }}>
                            <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div className="fw-semibold small d-flex align-items-center gap-2">
                                        <span className="d-inline-block rounded-circle bg-success" style={{ width: 8, height: 8, animation: 'pulse 2s infinite' }}></span>
                                        Site Activity
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggleVisitor(false)}
                                        className="btn btn-sm btn-outline-light py-0 px-2"
                                        style={{ fontSize: 12 }}
                                        title="Hide"
                                    >
                                        <i className="bi bi-eye-slash me-1"></i>Hide
                                    </button>
                                </div>
                                <div className="d-flex justify-content-between align-items-center py-1">
                                    <span className="small text-white-50">
                                        <i className="bi bi-person-fill-check me-1"></i>Live users
                                    </span>
                                    <span className="fw-bold font-monospace">{visitor.live}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center py-1">
                                    <span className="small text-white-50">
                                        <i className="bi bi-calendar-day me-1"></i>Today's visitors
                                    </span>
                                    <span className="fw-bold font-monospace">{visitor.today.toLocaleString()}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center py-1">
                                    <span className="small text-white-50">
                                        <i className="bi bi-people-fill me-1"></i>Total unique
                                    </span>
                                    <span className="fw-bold font-monospace">{visitor.total.toLocaleString()}</span>
                                </div>
                                <div className="mt-2 pt-2 border-top border-secondary small text-white-50 text-center">
                                    Since {visitor.since}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => toggleVisitor(true)}
                            className="btn btn-dark rounded-pill shadow-lg d-flex align-items-center gap-2"
                            title="Show site activity"
                        >
                            <span className="d-inline-block rounded-circle bg-success" style={{ width: 8, height: 8, animation: 'pulse 2s infinite' }}></span>
                            <i className="bi bi-eye"></i>
                            <span className="fw-semibold">Show Stats</span>
                        </button>
                    )}
                </div>
            )}

            <footer className="py-4 bg-body border-top">
                <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <div className="small text-secondary">
                        © {new Date().getFullYear()} Money Exchange. Rates shown are indicative.
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

function Feature({ icon, tint, title, desc }: { icon: string; tint: string; title: string; desc: string }) {
    return (
        <div className="col-sm-6 col-lg-3">
            <div className="text-center h-100 p-3">
                <div
                    className={`d-inline-flex align-items-center justify-content-center rounded-3 text-${tint} mb-3`}
                    style={{ width: 56, height: 56, background: `var(--bs-${tint}-bg-subtle)`, fontSize: 28 }}
                >
                    <i className={`bi ${icon}`}></i>
                </div>
                <div className="fw-bold mb-1">{title}</div>
                <div className="small text-secondary">{desc}</div>
            </div>
        </div>
    );
}

function dashboardFor(role: string): string {
    return role === 'admin' ? '/admin/dashboard' : role === 'manager' ? '/branch/dashboard' : '/pos';
}

function secondsAgo(iso: string, now: Date): number {
    const then = new Date(iso).getTime();
    return Math.max(0, Math.floor((now.getTime() - then) / 1000));
}
