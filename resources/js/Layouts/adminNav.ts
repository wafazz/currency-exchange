import type { NavItem } from './AppLayout';

export function adminNav(activeKey: string): NavItem[] {
    const items: { key: string; label: string; href: string; icon: string }[] = [
        { key: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: 'bi-speedometer2' },
        { key: 'rates', label: 'Rates', href: '/admin/rates', icon: 'bi-cash-stack' },
        { key: 'history', label: 'History', href: '/admin/rate-history', icon: 'bi-clock-history' },
        { key: 'currencies', label: 'Currencies', href: '/admin/currencies', icon: 'bi-globe2' },
        { key: 'branches', label: 'Branches', href: '/admin/branches', icon: 'bi-shop' },
        { key: 'users', label: 'Users', href: '/admin/users', icon: 'bi-people' },
        { key: 'pages', label: 'Pages', href: '/admin/pages', icon: 'bi-file-earmark-text' },
        { key: 'database', label: 'Database', href: '/admin/database', icon: 'bi-database-lock' },
        { key: 'settings', label: 'Settings', href: '/admin/settings', icon: 'bi-gear' },
        { key: 'display', label: 'Live Display', href: '/display', icon: 'bi-display' },
    ];
    return items.map((i) => ({ label: i.label, href: i.href, icon: i.icon, active: i.key === activeKey }));
}
