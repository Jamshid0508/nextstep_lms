# Next Step — O'quv Markazi CRM + LMS

`client/` (React + Vite + TS + Ant Design) va `server/` (Node + Express + MongoDB) papkalariga bo'lingan monorepo.

To'liq texnik hujjat: [TECHNICAL_SPECIFICATION.md](./TECHNICAL_SPECIFICATION.md)

## Tez ishga tushirish

1. Bog'liqliklarni o'rnatish:

```bash
npm run install:all
```

2. Environment fayllarini yaratish:

```bash
copy server\.env.example server\.env
copy client\.env.example client\.env
```

`server/.env` ichida `MONGO_URI`ni o'z MongoDB manzilingizga moslang (local yoki Atlas).

3. Serverni ishga tushirish:

```bash
npm run dev:server
```

4. Boshqa terminalda clientni ishga tushirish:

```bash
npm run dev:client
```

- Client: http://localhost:5173
- Server API: http://localhost:5000/api/v1

## Default Super Admin (seed)

Bazada `SUPER_ADMIN` bo'lmasa, server ishga tushganda avtomatik yaratadi:

- login: `superadmin@nextstep.uz` (yoki `.env`dagi `ADMIN_SEED_PHONE`)
- parol: `ChangeMe123!`

Bu qiymatlarni `server/.env` ichidagi `ADMIN_SEED_*` orqali o'zgartiring.

## Holat (2026-08-01)

- ✅ M0 — skeleton: auth (JWT+refresh), RBAC (5 rol), barcha asosiy modellar, dashboard summary API, login sahifasi, role-based sidebar
- ⏳ M1–M5 — CRM CRUD sahifalari, Homework, Quiz, Student/Parent portali — TECHNICAL_SPECIFICATION.md dagi roadmap bo'yicha navbatda

## API base

- Base URL: `/api/v1`
- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "error": { "code", "message", "details" } }`
