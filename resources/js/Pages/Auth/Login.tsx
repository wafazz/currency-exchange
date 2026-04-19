import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import AuthLayout from '@/Layouts/AuthLayout';

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login', { onFinish: () => reset('password') });
    };

    return (
        <AuthLayout title="Sign in to your account">
            <Head title="Login" />
            <form onSubmit={submit}>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="username"
                        autoFocus
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="current-password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    />
                    {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>
                <div className="form-check mb-3">
                    <input
                        id="remember"
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="form-check-input"
                    />
                    <label className="form-check-label" htmlFor="remember">
                        Remember me
                    </label>
                </div>
                <button
                    type="submit"
                    disabled={processing}
                    className="btn btn-primary w-100 py-2"
                >
                    {processing ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2"></span>Signing in…
                        </>
                    ) : (
                        'Sign in'
                    )}
                </button>
                <hr />
                <div className="small text-secondary">
                    <div className="fw-semibold mb-1">Demo accounts (password: password)</div>
                    <div>admin@moneyexchange.test</div>
                    <div>manager@moneyexchange.test</div>
                    <div>staff@moneyexchange.test</div>
                </div>
            </form>
        </AuthLayout>
    );
}
