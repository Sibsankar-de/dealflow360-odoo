# DealFlow360

DealFlow360 is a deal lifecycle and quotation management platform. It handles the complete sales workflow from opportunity tracking and product catalog pricing to multi-tier approval chains, customer negotiations, warehouse fulfillment, delivery-backed invoicing, and recurring subscriptions.

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v18+ recommended)
- **npm**, **pnpm**, or **yarn**
- **PostgreSQL** database

---

### 1. Running the Frontend (Client)

The frontend is built with Next.js (App Router), React, Tailwind CSS, and Redux Toolkit.

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the `client/` folder:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run at [http://localhost:3000](http://localhost:3000).

---

### 2. Running the Backend Server

The backend is built with Express, TypeScript, and Prisma ORM.

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `server/` folder:
   ```env
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   COOKIE_DOMAIN=localhost

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   DB_NAME=dealflow
   DATABASE_URL="postgresql://your_postgres_user:your_postgres_password@localhost:5432/dealflow?schema=public"

   # Auth
   ACCESS_TOKEN_SECRET=your_jwt_access_secret_key
   ACCESS_TOKEN_EXPIRY=15m
   REFRESH_TOKEN_EXPIRY=10
   ```

4. Prepare the database schema:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. (Optional) Seed the database:
   ```bash
   npm run db:seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

The backend API will run at [http://localhost:5000](http://localhost:5000).
