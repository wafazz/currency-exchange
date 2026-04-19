import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { adminNav } from '@/Layouts/adminNav';

interface Props {
    settings: {
        site_name: string;
        hq_logo: string;
        default_theme: 'light' | 'dark';
        default_refresh_seconds: number;
        default_display_mode: 'grid' | 'ticker';
        default_spread_percent: number;
    };
}

export default function SettingsIndex({ settings }: Props) {
    const { data, setData, post, processing, errors, progress } = useForm<{
        site_name: string;
        default_theme: 'light' | 'dark';
        default_refresh_seconds: number;
        default_display_mode: 'grid' | 'ticker';
        default_spread_percent: number;
        hq_logo_file: File | null;
    }>({
        site_name: settings.site_name,
        default_theme: settings.default_theme,
        default_refresh_seconds: settings.default_refresh_seconds,
        default_display_mode: settings.default_display_mode,
        default_spread_percent: settings.default_spread_percent,
        hq_logo_file: null,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/admin/settings', { forceFormData: true, preserveScroll: true });
    };

    return (
        <AppLayout title="Settings" nav={adminNav('settings')}>
            <Head title="Settings" />
            <form onSubmit={submit}>
                <div className="row g-3">
                    <div className="col-lg-6">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body">
                                <div className="fw-bold mb-3">
                                    <i className="bi bi-building text-primary me-2"></i>General
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Site Name</label>
                                    <input
                                        type="text"
                                        value={data.site_name}
                                        onChange={(e) => setData('site_name', e.target.value)}
                                        className={`form-control ${errors.site_name ? 'is-invalid' : ''}`}
                                    />
                                    {errors.site_name && <div className="invalid-feedback">{errors.site_name}</div>}
                                </div>
                                <div className="mb-0">
                                    <label className="form-label">HQ Logo</label>
                                    {settings.hq_logo && (
                                        <div className="mb-2">
                                            <img
                                                src={`/storage/${settings.hq_logo}`}
                                                alt="HQ logo"
                                                style={{ maxHeight: 60 }}
                                                className="rounded bg-body-tertiary p-2"
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setData('hq_logo_file', e.target.files?.[0] ?? null)}
                                        className="form-control"
                                    />
                                    {progress && (
                                        <div className="progress mt-2" style={{ height: 4 }}>
                                            <div className="progress-bar" style={{ width: `${progress.percentage ?? 0}%` }}></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body">
                                <div className="fw-bold mb-3">
                                    <i className="bi bi-display text-primary me-2"></i>Display Defaults
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Default Theme</label>
                                    <select
                                        value={data.default_theme}
                                        onChange={(e) => setData('default_theme', e.target.value as 'light' | 'dark')}
                                        className="form-select"
                                    >
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Default View Mode</label>
                                    <select
                                        value={data.default_display_mode}
                                        onChange={(e) =>
                                            setData('default_display_mode', e.target.value as 'grid' | 'ticker')
                                        }
                                        className="form-select"
                                    >
                                        <option value="grid">Grid (cards)</option>
                                        <option value="ticker">Ticker (scrolling)</option>
                                    </select>
                                </div>
                                <div className="mb-0">
                                    <label className="form-label">
                                        Refresh Interval (seconds)
                                        <span className="small text-secondary ms-2">1–300</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={300}
                                        value={data.default_refresh_seconds}
                                        onChange={(e) => setData('default_refresh_seconds', parseInt(e.target.value) || 10)}
                                        className={`form-control ${errors.default_refresh_seconds ? 'is-invalid' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body">
                                <div className="fw-bold mb-3">
                                    <i className="bi bi-cash-stack text-primary me-2"></i>Rate Defaults
                                </div>
                                <div className="mb-0">
                                    <label className="form-label">
                                        Default Spread %
                                        <span className="small text-secondary ms-2">used by Bulk Update</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="20"
                                        value={data.default_spread_percent}
                                        onChange={(e) => setData('default_spread_percent', parseFloat(e.target.value) || 0)}
                                        className={`form-control ${errors.default_spread_percent ? 'is-invalid' : ''}`}
                                    />
                                    <div className="form-text">e.g. 1.5 → buy = mid × 0.9925, sell = mid × 1.0075</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12">
                        <button type="submit" className="btn btn-primary btn-lg" disabled={processing}>
                            {processing ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>Saving…
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check2-circle me-1"></i>Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
