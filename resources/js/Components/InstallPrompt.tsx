import { useEffect, useState } from 'react';

interface BIPEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
    const [deferred, setDeferred] = useState<BIPEvent | null>(null);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        const dismissedAt = Number(localStorage.getItem('pwa-install-dismissed-at') || 0);
        if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;

        const onPrompt = (e: Event) => {
            e.preventDefault();
            setDeferred(e as BIPEvent);
        };
        const onInstalled = () => {
            setInstalled(true);
            setDeferred(null);
        };
        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const install = async () => {
        if (!deferred) return;
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === 'dismissed') {
            localStorage.setItem('pwa-install-dismissed-at', String(Date.now()));
        }
        setDeferred(null);
    };

    const dismiss = () => {
        localStorage.setItem('pwa-install-dismissed-at', String(Date.now()));
        setDeferred(null);
    };

    if (installed || !deferred) return null;

    return (
        <div
            className="position-fixed shadow-lg rounded-3 bg-body border d-flex align-items-center gap-2 p-2"
            style={{ bottom: 16, right: 16, zIndex: 1090, maxWidth: 360 }}
        >
            <i className="bi bi-download text-primary fs-4 ms-1"></i>
            <div className="small flex-grow-1">
                <div className="fw-semibold">Install app</div>
                <div className="text-secondary">Add to home screen for a full-screen live display.</div>
            </div>
            <button onClick={install} className="btn btn-primary btn-sm">
                Install
            </button>
            <button onClick={dismiss} className="btn btn-outline-secondary btn-sm" aria-label="Dismiss">
                <i className="bi bi-x"></i>
            </button>
        </div>
    );
}
