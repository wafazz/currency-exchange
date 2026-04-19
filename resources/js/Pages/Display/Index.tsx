import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

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
    branch: { name: string; slug: string; logo: string | null; theme: 'light' | 'dark' };
    rates: RateItem[];
    updated_at: string;
}

interface TrendInfo {
    dir: 'up' | 'down';
    delta: number;
    pct: number;
    from: number;
    decimals: number;
}

interface Props {
    branch?: string;
}

const FLAG: Record<string, string> = {
    us: '🇺🇸', sg: '🇸🇬', eu: '🇪🇺', gb: '🇬🇧', au: '🇦🇺', jp: '🇯🇵',
    cn: '🇨🇳', hk: '🇭🇰', th: '🇹🇭', id: '🇮🇩', sa: '🇸🇦', my: '🇲🇾',
};

function flagOf(code: string | null): string {
    return code ? FLAG[code.toLowerCase()] ?? '🌐' : '🌐';
}

// Short beep on rate change (data URI WAV, ~0.15s 880Hz)
const BEEP_SRC =
    'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVoGAAB/f39/f39/f39/f3+AgICAgICAgICAf39/f39/f39/f39/gICAgICAgICAgA==';

type ViewMode = 'grid' | 'ticker';

export default function DisplayIndex({ branch }: Props) {
    const [data, setData] = useState<Payload | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [mode, setMode] = useState<ViewMode>('grid');
    const [now, setNow] = useState(new Date());
    const [controlsVisible, setControlsVisible] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [soundOn, setSoundOn] = useState(false);
    const [selected, setSelected] = useState<RateItem | null>(null);
    const [pop, setPop] = useState<Record<string, { buy?: boolean; sell?: boolean }>>({});
    const prev = useRef<Record<string, { buy: number; sell: number }>>({});
    const [flash, setFlash] = useState<Record<string, { buy?: 'up' | 'down'; sell?: 'up' | 'down' }>>({});
    const [trend, setTrend] = useState<Record<string, { buy?: TrendInfo; sell?: TrendInfo }>>({});
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        document.documentElement.setAttribute('data-bs-theme', theme);
    }, [theme]);

    useEffect(() => {
        const clock = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(clock);
    }, []);

    useEffect(() => {
        const onFs = () => setFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFs);
        return () => document.removeEventListener('fullscreenchange', onFs);
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
    }, []);

    useEffect(() => {
        let cancelled = false;
        const url = `/api/rates${branch ? '/' + branch : ''}`;

        const fetchOnce = async () => {
            try {
                const res = await fetch(url, { headers: { Accept: 'application/json' } });
                if (!res.ok) return;
                const payload: Payload = await res.json();
                if (cancelled) return;

                const nextFlash: typeof flash = {};
                const trendPatch: typeof trend = {};
                const popPatch: typeof pop = {};
                let anyChange = false;
                payload.rates.forEach((r) => {
                    const p = prev.current[r.code];
                    if (p) {
                        const buyDelta = r.buy - p.buy;
                        const sellDelta = r.sell - p.sell;
                        if (buyDelta !== 0) {
                            anyChange = true;
                            const dir = buyDelta > 0 ? 'up' : 'down';
                            nextFlash[r.code] = { ...nextFlash[r.code], buy: dir };
                            popPatch[r.code] = { ...popPatch[r.code], buy: true };
                            trendPatch[r.code] = {
                                ...trendPatch[r.code],
                                buy: { dir, delta: buyDelta, pct: (buyDelta / p.buy) * 100, from: p.buy, decimals: r.decimals },
                            };
                        }
                        if (sellDelta !== 0) {
                            anyChange = true;
                            const dir = sellDelta > 0 ? 'up' : 'down';
                            nextFlash[r.code] = { ...nextFlash[r.code], sell: dir };
                            popPatch[r.code] = { ...popPatch[r.code], sell: true };
                            trendPatch[r.code] = {
                                ...trendPatch[r.code],
                                sell: { dir, delta: sellDelta, pct: (sellDelta / p.sell) * 100, from: p.sell, decimals: r.decimals },
                            };
                        }
                    }
                    prev.current[r.code] = { buy: r.buy, sell: r.sell };
                });

                setData(payload);
                setSelected((s) => (s ? payload.rates.find((r) => r.code === s.code) ?? s : s));
                if (!data) setTheme(payload.branch.theme);
                if (Object.keys(trendPatch).length) {
                    setTrend((s) => {
                        const next = { ...s };
                        for (const code of Object.keys(trendPatch)) {
                            next[code] = { ...next[code], ...trendPatch[code] };
                        }
                        return next;
                    });
                }
                if (Object.keys(popPatch).length) {
                    setPop(popPatch);
                    setTimeout(() => setPop({}), 500);
                }
                if (Object.keys(nextFlash).length) {
                    setFlash(nextFlash);
                    setTimeout(() => setFlash({}), 1400);
                }
                if (anyChange && soundOn && audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(() => {});
                }
            } catch {
                // silent fail; next poll retries
            }
        };

        fetchOnce();
        const iv = setInterval(fetchOnce, 2_000);
        return () => {
            cancelled = true;
            clearInterval(iv);
        };
    }, [branch, soundOn]);

    const lastUpdatedAgo = data ? secondsAgo(data.updated_at, now) : null;
    const isDark = theme === 'dark';

    return (
        <>
            <Head title={data ? `${data.branch.name} — Live Rates` : 'Live Rates'} />
            <audio ref={audioRef} src={BEEP_SRC} preload="auto" />
            <div
                className="min-vh-100 bg-body"
                onMouseMove={() => {
                    setControlsVisible(true);
                    window.clearTimeout((window as any).__mex_ctrl_t);
                    (window as any).__mex_ctrl_t = window.setTimeout(() => setControlsVisible(false), 3000);
                }}
            >
                <header className="bg-body-tertiary border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                        <div
                            className="d-inline-flex align-items-center justify-content-center rounded-3"
                            style={{
                                width: 56,
                                height: 56,
                                background: isDark ? 'rgba(13,110,253,0.2)' : 'rgba(13,110,253,0.1)',
                                color: '#0d6efd',
                                fontSize: 30,
                            }}
                        >
                            <i className="bi bi-currency-exchange"></i>
                        </div>
                        <div>
                            <div className="h4 fw-bold mb-0">{data?.branch.name ?? 'Money Exchange'}</div>
                            <div className="small text-secondary">
                                Live Foreign Exchange Rates · <span className="text-primary">Tap a currency to calculate</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-end">
                        <div className="h3 fw-semibold font-monospace tabular mb-0">
                            {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="small text-secondary">
                            {now.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </header>

                {mode === 'grid' && (
                    <main className="p-4" style={{ paddingBottom: 50 }}>
                        <div className="row g-3">
                            {data?.rates.map((r) => {
                                const f = flash[r.code] ?? {};
                                const t = trend[r.code] ?? {};
                                const pp = pop[r.code] ?? {};
                                const cardDir = t.buy?.dir ?? t.sell?.dir;
                                const borderClass =
                                    cardDir === 'up'
                                        ? 'border border-3 border-success'
                                        : cardDir === 'down'
                                        ? 'border border-3 border-danger'
                                        : '';
                                return (
                                    <div key={r.code} className={gridColClass(data.rates.length)}>
                                        <div
                                            className={`card mex-display-card shadow-sm h-100 ${borderClass}`}
                                            onClick={() => setSelected(r)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setSelected(r);
                                                }
                                            }}
                                        >
                                            <div className="card-body">
                                                <div className="d-flex align-items-center justify-content-between mb-3">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span style={{ fontSize: 36 }}>{flagOf(r.flag)}</span>
                                                        <div>
                                                            <div className="h4 fw-bold mb-0">{r.code}</div>
                                                            <div className="small text-secondary">
                                                                {r.unit > 1 ? `${r.unit} ${r.code}` : r.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <i className="bi bi-calculator text-secondary fs-5"></i>
                                                </div>
                                                <div className="row g-2">
                                                    <div className="col-6">
                                                        <div
                                                            className={`p-2 rounded-3 ${isDark ? 'bg-body' : 'bg-body-tertiary'} ${
                                                                f.buy === 'up' ? 'flash-up' : f.buy === 'down' ? 'flash-down' : ''
                                                            }`}
                                                        >
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <span className="small text-secondary text-uppercase fw-semibold">
                                                                    We Buy
                                                                </span>
                                                                <TrendBadge info={t.buy} />
                                                            </div>
                                                            <div
                                                                className={`h3 fw-bold text-success font-monospace tabular mb-0 mt-1 ${
                                                                    pp.buy ? 'rate-pop' : ''
                                                                }`}
                                                                style={{ transformOrigin: 'left' }}
                                                            >
                                                                {r.buy.toFixed(r.decimals + 2)}
                                                            </div>
                                                            <TrendDelta info={t.buy} />
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div
                                                            className={`p-2 rounded-3 ${isDark ? 'bg-body' : 'bg-body-tertiary'} ${
                                                                f.sell === 'up' ? 'flash-up' : f.sell === 'down' ? 'flash-down' : ''
                                                            }`}
                                                        >
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <span className="small text-secondary text-uppercase fw-semibold">
                                                                    We Sell
                                                                </span>
                                                                <TrendBadge info={t.sell} />
                                                            </div>
                                                            <div
                                                                className={`h3 fw-bold text-danger font-monospace tabular mb-0 mt-1 ${
                                                                    pp.sell ? 'rate-pop' : ''
                                                                }`}
                                                                style={{ transformOrigin: 'left' }}
                                                            >
                                                                {r.sell.toFixed(r.decimals + 2)}
                                                            </div>
                                                            <TrendDelta info={t.sell} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </main>
                )}

                {mode === 'ticker' && data && (
                    <main className="py-5" style={{ overflow: 'hidden' }}>
                        <div className="mex-ticker-track" style={{ fontSize: 28 }}>
                            {[...data.rates, ...data.rates].map((r, i) => {
                                const f = flash[r.code] ?? {};
                                const t = trend[r.code] ?? {};
                                return (
                                    <span
                                        key={`${r.code}-${i}`}
                                        className="d-inline-flex align-items-center gap-3 mx-4"
                                        onClick={() => setSelected(r)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <span style={{ fontSize: 36 }}>{flagOf(r.flag)}</span>
                                        <span className="fw-bold">{r.code}</span>
                                        {r.unit > 1 && <span className="small text-secondary">×{r.unit}</span>}
                                        <span className={`font-monospace tabular text-success ${f.buy === 'up' ? 'flash-up' : f.buy === 'down' ? 'flash-down' : ''}`}>
                                            B {r.buy.toFixed(r.decimals + 2)}
                                        </span>
                                        <TrendBadge info={t.buy} size="lg" />
                                        <span className={`font-monospace tabular text-danger ${f.sell === 'up' ? 'flash-up' : f.sell === 'down' ? 'flash-down' : ''}`}>
                                            S {r.sell.toFixed(r.decimals + 2)}
                                        </span>
                                        <TrendBadge info={t.sell} size="lg" />
                                        <span className="text-secondary">•</span>
                                    </span>
                                );
                            })}
                        </div>
                    </main>
                )}

                <footer
                    className="bg-body-tertiary border-top px-4 py-2 d-flex align-items-center justify-content-between small text-secondary position-fixed bottom-0 start-0 end-0"
                    style={{ zIndex: 10 }}
                >
                    <div>
                        {data ? (
                            <>
                                <span
                                    className="d-inline-block rounded-circle bg-success me-2"
                                    style={{ width: 8, height: 8, animation: 'pulse 2s infinite' }}
                                ></span>
                                Live · Updated {lastUpdatedAgo !== null ? `${lastUpdatedAgo}s ago` : '—'}
                            </>
                        ) : (
                            <>
                                <span
                                    className="d-inline-block rounded-circle bg-warning me-2"
                                    style={{ width: 8, height: 8 }}
                                ></span>
                                Loading rates…
                            </>
                        )}
                    </div>
                    <div>Click any currency to calculate · Refresh every 2s</div>
                </footer>

                <div
                    className="position-fixed top-0 end-0 p-3 d-flex gap-2"
                    style={{ zIndex: 20, opacity: controlsVisible ? 1 : 0, transition: 'opacity .3s' }}
                >
                    <button
                        type="button"
                        onClick={() => setMode(mode === 'grid' ? 'ticker' : 'grid')}
                        className="btn btn-sm btn-light shadow-sm"
                        title="Toggle view"
                    >
                        <i className={`bi ${mode === 'grid' ? 'bi-text-left' : 'bi-grid'} me-1`}></i>
                        {mode === 'grid' ? 'Ticker' : 'Grid'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        className="btn btn-sm btn-light shadow-sm"
                        title="Toggle theme"
                    >
                        <i className={`bi ${isDark ? 'bi-sun' : 'bi-moon'} me-1`}></i>
                        {isDark ? 'Light' : 'Dark'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSoundOn((s) => !s)}
                        className={`btn btn-sm shadow-sm ${soundOn ? 'btn-primary' : 'btn-light'}`}
                        title="Toggle sound on rate change"
                    >
                        <i className={`bi ${soundOn ? 'bi-volume-up-fill' : 'bi-volume-mute'}`}></i>
                    </button>
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="btn btn-sm btn-light shadow-sm"
                        title="Toggle fullscreen"
                    >
                        <i className={`bi ${fullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'}`}></i>
                    </button>
                </div>

                {selected && <CalcModal rate={selected} onClose={() => setSelected(null)} />}
            </div>
            <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }`}</style>
        </>
    );
}

function CalcModal({ rate, onClose }: { rate: RateItem; onClose: () => void }) {
    const [direction, setDirection] = useState<'buy' | 'sell'>('sell');
    const [foreignAmount, setForeignAmount] = useState<string>('100');
    const [myrAmount, setMyrAmount] = useState<string>('');
    const [lastEdited, setLastEdited] = useState<'foreign' | 'myr'>('foreign');

    const rateUsed = direction === 'buy' ? rate.buy : rate.sell;
    const unit = rate.unit || 1;

    useEffect(() => {
        if (lastEdited === 'foreign') {
            const f = parseFloat(foreignAmount);
            if (!isNaN(f)) setMyrAmount(((f / unit) * rateUsed).toFixed(2));
            else setMyrAmount('');
        } else {
            const m = parseFloat(myrAmount);
            if (!isNaN(m) && rateUsed > 0) setForeignAmount(((m * unit) / rateUsed).toFixed(2));
            else setForeignAmount('');
        }
    }, [direction, rateUsed, unit, foreignAmount, myrAmount, lastEdited]);

    const summary =
        direction === 'sell'
            ? `Customer pays MYR, receives ${rate.code}. Using "We Sell" rate.`
            : `Customer gives ${rate.code}, receives MYR. Using "We Buy" rate.`;

    return (
        <>
            <div className="modal d-block" tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                                <span style={{ fontSize: 32 }}>{flagOf(rate.flag)}</span>
                                <span>
                                    {rate.code} · {rate.name}
                                </span>
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>
                        <div className="modal-body">
                            <div className="btn-group w-100 mb-3" role="group">
                                <button
                                    type="button"
                                    className={`btn ${direction === 'sell' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setDirection('sell')}
                                >
                                    <i className="bi bi-arrow-right me-1"></i>Buying {rate.code}
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${direction === 'buy' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setDirection('buy')}
                                >
                                    <i className="bi bi-arrow-left me-1"></i>Selling {rate.code}
                                </button>
                            </div>

                            <div className="row g-3 align-items-center">
                                <div className="col">
                                    <label className="form-label small text-secondary">
                                        {rate.code} Amount
                                    </label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text">{rate.symbol ?? rate.code}</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={foreignAmount}
                                            onChange={(e) => {
                                                setLastEdited('foreign');
                                                setForeignAmount(e.target.value);
                                            }}
                                            className="form-control font-monospace text-end"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="col-auto fs-3 text-secondary">
                                    <i className="bi bi-arrow-left-right"></i>
                                </div>
                                <div className="col">
                                    <label className="form-label small text-secondary">MYR Amount</label>
                                    <div className="input-group input-group-lg">
                                        <span className="input-group-text">RM</span>
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
                            </div>

                            <div className="mt-3 p-3 rounded-3 bg-body-tertiary small">
                                <div className="d-flex justify-content-between">
                                    <span className="text-secondary">Rate used:</span>
                                    <span className="font-monospace fw-semibold">
                                        {unit > 1 ? `${unit} ` : ''}
                                        {rate.code} = {rateUsed.toFixed(rate.decimals + 2)} MYR
                                    </span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-secondary">Direction:</span>
                                    <span className="fw-semibold">
                                        {direction === 'sell' ? 'We Sell (You Buy)' : 'We Buy (You Sell)'}
                                    </span>
                                </div>
                                <hr className="my-2" />
                                <div className="text-secondary">{summary}</div>
                            </div>

                            <div className="mt-3 d-flex gap-2 flex-wrap">
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
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop show" onClick={onClose} />
        </>
    );
}

function TrendBadge({ info, size = 'sm' }: { info?: TrendInfo; size?: 'sm' | 'lg' }) {
    if (!info) return null;
    const isUp = info.dir === 'up';
    const bg = isUp ? '#198754' : '#dc3545';
    const padding = size === 'lg' ? '4px 10px' : '2px 6px';
    const fontSize = size === 'lg' ? 18 : 11;
    const absDelta = Math.abs(info.delta).toFixed(info.decimals + 2);
    const absPct = Math.abs(info.pct).toFixed(2);
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: bg,
                color: '#fff',
                padding,
                borderRadius: 6,
                fontWeight: 700,
                fontSize,
                lineHeight: 1,
                letterSpacing: 0.2,
                fontVariantNumeric: 'tabular-nums',
            }}
        >
            {isUp ? '▲' : '▼'}
            {size === 'lg' ? (
                <span>
                    {isUp ? '+' : '-'}
                    {absDelta} ({absPct}%)
                </span>
            ) : (
                <span style={{ fontSize: 10 }}>{absPct}%</span>
            )}
        </span>
    );
}

function TrendDelta({ info }: { info?: TrendInfo }) {
    if (!info) return <div style={{ height: 16, marginTop: 6 }} />;
    const isUp = info.dir === 'up';
    const color = isUp ? '#198754' : '#dc3545';
    const sign = isUp ? '+' : '-';
    const absDelta = Math.abs(info.delta).toFixed(info.decimals + 2);
    return (
        <div
            style={{
                color,
                fontSize: 11,
                marginTop: 4,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 600,
                lineHeight: 1.2,
            }}
        >
            {sign}
            {absDelta}
            <span style={{ opacity: 0.65, marginLeft: 6 }}>from {info.from.toFixed(info.decimals + 2)}</span>
        </div>
    );
}

function gridColClass(count: number): string {
    if (count <= 4) return 'col-12 col-md-6';
    if (count <= 6) return 'col-12 col-md-4';
    if (count <= 9) return 'col-12 col-md-4';
    return 'col-12 col-md-4 col-xl-3';
}

function secondsAgo(iso: string, now: Date): number {
    const then = new Date(iso).getTime();
    return Math.max(0, Math.floor((now.getTime() - then) / 1000));
}
