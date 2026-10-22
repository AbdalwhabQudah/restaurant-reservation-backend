# Restaurant Reservation Backend - Base Setup

This starter contains the code for backend setup Steps 7-14.

## 1. Required packages

Run from the backend root:

```bash
npm install express pg cors dotenv bcrypt jsonwebtoken express-validator
npm install --save-dev nodemon
```

## 2. package.json scripts

Use:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

## 3. Environment file

Copy `.env.example` to `.env` and replace `YOUR_POSTGRES_PASSWORD`.
Never commit `.env`.

## 4. Database files

- `database/schema.sql`: creates the five tables and constraints.
- `database/seed.sql`: inserts development sample data.
- `database/verify.sql`: useful verification queries.

The current local database has already been created in pgAdmin, so these files are primarily for reproducibility/submission. Do not rerun `schema.sql` against a database that already contains the tables unless you first reset that database.

## 5. Run backend

```bash
npm run dev
```

Expected console output includes:

```text
PostgreSQL connected
Server running on http://localhost:5000
```

## 6. Browser tests

Open:

- http://localhost:5000
- http://localhost:5000/api/test-db
- http://localhost:5000/api/health

## 7. Git

Before committing:

```bash
git status
```

Confirm `.env` and `node_modules/` are NOT staged.

Then:

```bash
git add .
git commit -m "Initialize Express backend and PostgreSQL connection"
git branch -M main
git remote add origin <YOUR_BACKEND_SSH_URL>
git push -u origin main
```

Then create the authentication feature branch:

```bash
git switch -c feature/authentication
```

## Security note

The seeded `password_hash` values are placeholders. They are not valid login passwords. Real bcrypt password hashing is implemented in the next authentication phase.
