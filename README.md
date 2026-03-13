# 🔧 IT Support & Maintenance Web App

Full-stack IT support management system with client portal, visit logging, network auditing, and reporting.

## Stack
- **Backend:** Laravel 11 (PHP 8.2+)
- **Database:** PostgreSQL 15
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Auth:** Laravel Sanctum (JWT-style tokens)
- **Hosting:** Coolify (self-hosted PaaS on your VPS)

## User Roles
| Role | Access |
|------|--------|
| `super_admin` | Everything — clients, users, system config |
| `manager` | All reports across clients, no editing |
| `technician` | Log visits, issues, network points, credentials |
| `client` | Own reports only, submit tickets, track issues |

## Local Development

### Prerequisites
- PHP 8.2+, Composer
- Node 18+, npm
- PostgreSQL 15
- Git

### Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Edit .env — set DB_* variables
php artisan migrate --seed
php artisan serve
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local — set VITE_API_URL=http://localhost:8000
npm run dev
```

### Default Login (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@itsupport.local | password |
| Manager | manager@itsupport.local | password |
| Technician | tech@itsupport.local | password |
| Client | client@itsupport.local | password |

---

## Coolify Deployment (Step-by-Step)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/itsupport-app.git
git push -u origin main
```

### 2. On Coolify Dashboard
1. Add new **Resource → Application**
2. Connect your GitHub repo
3. Set **Build Pack → Dockerfile**
4. Point to `docker/Dockerfile.backend` for backend
5. Add a **PostgreSQL** service from Coolify's one-click services
6. Set environment variables (see below)

### 3. Environment Variables (Backend)
```
APP_NAME="IT Support"
APP_ENV=production
APP_KEY=        # auto-generate: php artisan key:generate --show
APP_URL=https://api.yourdomain.com
DB_CONNECTION=pgsql
DB_HOST=        # Coolify PostgreSQL host
DB_PORT=5432
DB_DATABASE=itsupport
DB_USERNAME=itsupport
DB_PASSWORD=    # set a strong password
FRONTEND_URL=https://yourdomain.com
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
SESSION_DOMAIN=.yourdomain.com
```

### 4. Environment Variables (Frontend)
```
VITE_API_URL=https://api.yourdomain.com
```

### 5. Run Migrations on Coolify
In Coolify terminal for your backend app:
```bash
php artisan migrate --seed --force
```

---

## Project Structure
```
itsupport-app/
├── backend/                  # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/   # All API controllers
│   │   │   ├── Middleware/        # Auth, role checks
│   │   │   └── Requests/          # Form validation
│   │   ├── Models/               # Eloquent models
│   │   ├── Policies/             # Role-based access
│   │   └── Services/             # Business logic
│   ├── database/
│   │   ├── migrations/           # All DB tables
│   │   └── seeders/              # Sample data
│   └── routes/api.php            # All API routes
│
├── frontend/                 # React SPA
│   └── src/
│       ├── pages/                # One file per page/role
│       ├── components/           # Reusable UI components
│       ├── hooks/                # Custom React hooks
│       └── utils/                # API client, helpers
│
└── docker/                   # Coolify deployment
    ├── Dockerfile.backend
    ├── Dockerfile.frontend
    └── nginx.conf
```
