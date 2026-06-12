# API (Pankh POS)

Quick setup and developer notes for the API.

Prerequisites
- Node 18+
- PostgreSQL database (Neon or other)

Install
```bash
cd API
npm install
```

Required environment variables (create `API/.env` locally)
- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — secret used to sign JWTs
- `ENABLE_DEV_AUTH` — set to `1` to enable the dev token generator route (`POST /api/auth/token`)

Generate a test JWT locally
```bash
# using helper script (reads JWT_SECRET from .env)
node scripts/make_jwt.js --user_id=1 --store_id=1 --username=admin

# or via API (dev only)
curl -X POST http://localhost:5000/api/auth/token -H 'Content-Type: application/json' -d '{"user_id":1,"store_id":1}'
```

Run
```bash
# development (requires nodemon)
npm run dev

# production
npm start
```

Migration
- See `API/migration_store_fix.sql` for the tenant-fix migration.
- Use your provider SQL console (Neon) or `psql` to run the migration.

Security notes
- Do NOT commit `API/.env` to source control. Rotate DB credentials if they were exposed.
- `ENABLE_DEV_AUTH` should be disabled in production.

If you want, I can run `npm install` here and start the server to smoke-test endpoints.
