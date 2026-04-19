import { Head, router } from '@inertiajs/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { adminNav } from '@/Layouts/adminNav';

export default function DatabaseUnlock() {
    const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<{ pin?: string }>({});
    const inputs = useRef<Array<HTMLInputElement | null>>([]);
    const submittedRef = useRef(false);

    useEffect(() => {
        inputs.current[0]?.focus();
    }, []);

    const submitPin = (pin: string) => {
        if (submittedRef.current || processing) return;
        submittedRef.current = true;
        setProcessing(true);
        setErrors({});
        router.post('/admin/database/verify', { pin }, {
            onError: (errs) => {
                setErrors({ pin: (errs.pin as string) || 'Incorrect PIN.' });
                setDigits(['', '', '', '', '', '']);
                inputs.current[0]?.focus();
            },
            onFinish: () => {
                submittedRef.current = false;
                setProcessing(false);
            },
        });
    };

    const handleChange = (i: number, v: string) => {
        const digit = v.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[i] = digit;
        setDigits(next);
        if (digit && i < 5) inputs.current[i + 1]?.focus();
        if (next.every((d) => d !== '')) {
            inputs.current[i]?.blur();
            submitPin(next.join(''));
        }
    };

    const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) {
            inputs.current[i - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
        if (pasted.length === 0) return;
        const next = ['', '', '', '', '', ''];
        pasted.forEach((d, i) => (next[i] = d));
        setDigits(next);
        if (pasted.length === 6) {
            inputs.current[5]?.blur();
            submitPin(next.join(''));
        } else {
            inputs.current[Math.min(pasted.length, 5)]?.focus();
        }
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (digits.every((d) => d !== '')) submitPin(digits.join(''));
    };

    return (
        <AppLayout title="Database Vault" nav={adminNav('database')}>
            <Head title="Unlock Database" />
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-4 p-md-5 text-center">
                            <div
                                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary mb-3"
                                style={{ width: 72, height: 72, fontSize: 32 }}
                            >
                                <i className="bi bi-shield-lock-fill"></i>
                            </div>
                            <h2 className="h4 fw-bold mb-2">Enter 6-Digit PIN</h2>
                            <p className="text-secondary mb-4">
                                Database management is protected. Enter your PIN to continue.
                            </p>

                            <form onSubmit={submit}>
                                <div className="d-flex justify-content-center gap-2 mb-3">
                                    {digits.map((d, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => (inputs.current[i] = el)}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={d}
                                            onChange={(e) => handleChange(i, e.target.value)}
                                            onKeyDown={(e) => handleKey(i, e)}
                                            onPaste={handlePaste}
                                            className={`form-control form-control-lg text-center fw-bold ${
                                                errors.pin ? 'is-invalid' : ''
                                            }`}
                                            style={{ width: 48, height: 56, fontSize: 24 }}
                                        />
                                    ))}
                                </div>
                                {errors.pin && (
                                    <div className="text-danger small mb-3">
                                        <i className="bi bi-exclamation-circle me-1"></i>
                                        {errors.pin}
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={processing || digits.some((d) => d === '')}
                                    className="btn btn-primary btn-lg w-100"
                                >
                                    {processing ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>Verifying…
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-unlock-fill me-1"></i>Unlock
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="small text-secondary mt-4">
                                <i className="bi bi-info-circle me-1"></i>
                                Default PIN: <span className="font-monospace">123456</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
