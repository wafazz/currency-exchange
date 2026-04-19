# Money Exchange

A currency exchange management system for money changer businesses — rate management, live TV display, multi-branch support, user/role access, and a PIN-protected DB admin.

Built on **Laravel 12** + **Inertia 2** + **React 18** + **TypeScript** + **Bootstrap 5**.

---

## Features

### Operations
- **Rate Management** — inline edit, bulk update with mid+spread calculator, full audit trail in `rate_history`
- **Live TV Display** — Grid & Ticker views, flash ↑/↓ on changes, 10s polling, Light/Dark theme, per-branch routing (`/display/{branch-slug}`)
- **Public Rates API** — `GET /api/rates/{branch?}` with 10s cache, auto-busts on rate writes
- **Visitor Stats** — tracks display views

### Admin
- **Currencies CRUD** — flag emoji, unit (1 / 100 for JPY/IDR), decimals, active toggle; base currency (MYR) locked
- **Branches CRUD** — card layout, logo upload, HQ singleton guard, per-branch theme & slug
- **Users CRUD** — role-based (admin / manager / staff), optional password on edit, self-delete guard
- **Pages CMS** — CRUD public pages (About, Terms, Contact, custom slugs) with TinyMCE
- **Settings** — site name, HQ logo, theme, refresh interval, display mode, default spread %

### Database Vault (PIN-Protected)
- **6-digit PIN** (default `123456`, bcrypt-hashed, 30-min sliding session)
- **Backup** via mysqldump (auto-detects XAMPP path)
- **SQL Query Runner** — SELECT/SHOW/DESCRIBE render as tables; DML shows affected rows; errors inline
- **Table Management** — create new table (column builder), add/drop columns, rename table, drop table
- **Row Ops** — browse (paginated), insert (modal form auto-built from schema), copy row, delete row
- **Maintenance** — clear all caches, OPTIMIZE TABLE on all tables

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12, PHP 8.2+ |
| Frontend | Inertia 2, React 18, TypeScript 5 |
| UI | Bootstrap 5.3, Bootstrap Icons, custom SCSS |
| Bundler | Vite 7 (+ `laravel-vite-plugin`, `vite-tsconfig-paths`) |
| Routing | Ziggy (type-safe named routes in JS) |
| Editor | TinyMCE 8 (pages CMS) |
| Database | MySQL / MariaDB |

---

## Prerequisites

- PHP ≥ 8.2
- Composer 2.x
- Node.js ≥ 20
- MySQL / MariaDB (XAMPP recommended on macOS — MySQL on port **3307**)

---

## Setup

### One-step install (recommended)

```bash
cp .env.example .env     # edit DB_* values if needed
./setup.sh               # installs deps, creates DB, migrates, seeds, links storage
```

Add `--fresh` to drop and recreate the database:

```bash
./setup.sh --fresh
```

### Manual steps

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan app:install   # reads .env, creates DB, migrates, seeds, storage:link
```

The `app:install` command works standalone — run it any time you need to bootstrap a fresh DB (e.g. CI, new machine, teammate onboarding).

### .env database values used

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=money_exchange
DB_USERNAME=root
DB_PASSWORD=
```

---

## Run Dev

```bash
# Option A — run both servers in one command
composer dev

# Option B — run separately
php artisan serve      # http://localhost:8000
npm run dev            # Vite on :5173
```

> **Note:** Vite is pinned to `server.host: 'localhost'`. If you see a blank page after switching networks, delete `public/hot` and restart `npm run dev`.

---

## Build for Production

```bash
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Demo Accounts

Seeded by `UserSeeder`. Password for all: `password`

| Role | Email | Redirects to |
|---|---|---|
| Admin | `admin@moneyexchange.test` | `/admin/dashboard` |
| Manager | `manager@moneyexchange.test` | `/branch/dashboard` |
| Staff | `staff@moneyexchange.test` | `/pos` |

**Database Vault PIN:** `123456` (change via Admin → Database → Change PIN)

---

## Key URLs

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Welcome / landing |
| `/display` | public | Live TV display (HQ) |
| `/display/{slug}` | public | Per-branch live display |
| `/api/rates/{branch?}` | public | JSON rates feed (cached 10s) |
| `/login` | guest | Sign in |
| `/admin/*` | admin | Admin panel |
| `/admin/database` | admin + PIN | DB Vault (backup / query / tables) |
| `/branch/dashboard` | admin, manager | Branch dashboard |
| `/pos` | all roles | POS screen |

---

## Project Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Admin/                  # Rate, Currency, Branch, User, Settings, Database, Page
│   │   ├── PublicPageController    # About / Terms / Contact + custom
│   │   ├── RatesApiController      # public cached JSON
│   │   └── VisitorController       # tracks display hits
│   └── Middleware/
│       ├── DbPinMiddleware.php     # 30-min sliding PIN session
│       ├── RoleMiddleware.php      # role:admin,manager,staff
│       └── HandleInertiaRequests.php
├── Models/                         # User, Branch, Currency, Rate, RateHistory, RateMargin, Setting, Page
│
database/
├── migrations/                     # 7 tables
└── seeders/                        # 12 currencies, HQ branch, 3 users, 11 rates, 6 settings
│
resources/js/
├── Pages/
│   ├── Admin/
│   │   ├── Database/               # Unlock, Index, Table, CreateTable, EditTable, Query
│   │   ├── Rates, RateHistory, Currencies, Branches, Users, Settings, Pages
│   │   └── Dashboard.tsx
│   ├── Auth/Login.tsx
│   ├── Branch/Dashboard.tsx
│   ├── Display/Index.tsx           # Live TV (Grid / Ticker)
│   ├── Pos/Index.tsx
│   └── Welcome.tsx
├── Layouts/
│   ├── AppLayout.tsx               # sidebar shell with flash toasts
│   ├── AuthLayout.tsx
│   └── adminNav.ts                 # sidebar nav config
├── app.tsx                         # Inertia entry
└── bootstrap.ts                    # Bootstrap + axios setup
│
routes/
├── web.php                         # public + admin + branch + pos
└── auth.php                        # login/logout
```

---

## Data Model

| Table | Notes |
|---|---|
| `users` | role ENUM(admin,manager,staff), branch_id nullable, active bool |
| `branches` | HQ singleton guard, slug, theme, logo path |
| `currencies` | MYR = base (`is_base=true`), unit (1/100), decimals, flag |
| `rates` | buy / sell / mid per currency × branch (null branch = HQ default) |
| `rate_history` | every rate change logged before write (in a DB transaction) |
| `rate_margins` | per-currency spread overrides |
| `settings` | key / value / type / group; includes `db_pin` (hashed) |
| `pages` | CMS content — slug, title, body (HTML), is_published |

---

## Notable Conventions

- **MYR is base currency** (`is_base=true`); rates stored per foreign currency
- **JPY / IDR** use `unit=100` (display: `100 JPY = RM X`)
- **Rate updates** always log to `rate_history` first, then upsert `rates` — in a single DB transaction
- **API cache keys** — `public.rates.hq` or `public.rates.{slug}`; busted on any rate write
- **npm install** requires `--legacy-peer-deps` if you add Material Tailwind back (peer mismatch)
- **Inertia 2** pinned; v3 requires React 19
- **Tailwind** is NOT used (stack is Bootstrap); references to Tailwind in older notes are outdated

---

## Testing

```bash
php artisan test
```

Smoke tests cover public routes, auth flow, and role redirects.

---

## License

MIT
