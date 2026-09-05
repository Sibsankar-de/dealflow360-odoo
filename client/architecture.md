# DealFlow360 Client Architecture

## Overview

DealFlow360 is a deal lifecycle and quotation management platform designed to streamline quotation creation, approval workflows, customer negotiations, fulfillment visibility, and invoicing.

The frontend client is built using Next.js (App Router), TypeScript, and Tailwind CSS.

---

## High-Level Architecture

The frontend acts as the interface layer for platform users and company members:

```text
+-----------------------------------------------------------+
|                      UI Layer                             |
|  (App Router Pages, Layouts, Feature Modules, Components) |
+-----------------------------------------------------------+
                             |
                             v
+-----------------------------------------------------------+
|                   State Management Layer                  |
|  - Server State: Centralized API Services / RTK Query      |
|  - Client State: Feature Slices & Local React State       |
+-----------------------------------------------------------+
                             |
                             v
+-----------------------------------------------------------+
|                     API Service Layer                     |
|  - Typed Request/Response Contracts                       |
|  - Centralized Auth Headers & Error Interceptors          |
+-----------------------------------------------------------+
                             |
                             v
+-----------------------------------------------------------+
|                    DealFlow360 Backend                    |
+-----------------------------------------------------------+
```

---

## Directory Structure

The project follows a modular, feature-oriented structure under `src/`:

```text
src/
├── app/                  # Next.js App Router (pages, layouts, route handlers)
├── components/           # Reusable shared UI and layout components
│   ├── ui/               # Base primitives (Avatar, AppLogo, Select, CurrencySelector, FilterSelector, SearchableInput, Button, Input, Modal, Card, Badge, Tabs)
│   ├── shared/           # Shared compound components (navbar, sidebar, tables)
│   └── modules/          # Feature module UI components
│       ├── auth/         # LoginForm, SignupForm, AuthBrandingPanel
│       ├── layout/       # Collapsible Sidebar, Navbar: profile vs company view, StoreInfo, UserAvatarMenu
│       ├── profile/      # ProfileInfoCard, CompanyCard, CompanyList, EditProfileModal, ChangePasswordModal, CreateCompanyModal
│       ├── quotations/   # QuotationKanbanBoard, QuotationKanbanColumn, QuotationKanbanCard
│       ├── fulfillment/  # Delivery tracking, backorders
│       ├── finance/      # Invoices, financial approvals
│       ├── customers/    # Customer directory and interaction history
│       ├── dealhealth/   # Deal health risk metrics, anomaly detection & action alerts
│       └── company/      # Team, roles, product management
├── context/              # React Context Providers (AuthContext.tsx, AuthProvider)
├── hooks/                # Reusable custom React hooks
├── schemas/              # Zod validation schemas (auth.schema.ts, company.schema.ts)
├── store/                # Global state management (Redux Toolkit store, StoreProvider)
│   ├── baseApi.ts        # Base RTK Query API configuration with re-auth interceptor
│   ├── features/         # Feature slices & injected endpoints
│   │   ├── user/         # userSlice.ts, userApi.ts
│   │   └── company/      # companyApi.ts (user company affiliations, company creation)
│   └── index.ts          # Central Redux store configuration
├── types/                # Global TypeScript interfaces and type definitions (auth.ts, profile.ts, company.ts, SelectType.ts)
├── utils/                # Pure helper functions and formatters
└── assets/               # Static assets, icons, and media
```

---

## State Management Architecture

State is strictly divided into two categories:

### 1. Server State
* **Examples**: Quotations, Deals, Products, Invoices, Delivery Batches, Users, Notifications.
* **Management**: Centralized RTK Query caching (`store/baseApi.ts`) with feature endpoints (e.g. `store/features/user/userApi.ts`) and tag invalidation (`User`, `Company`, `Quotation`).
* **Authentication**: Automatic session recovery via `baseQueryWithReauth` in `baseApi.ts` on `401 Unauthorized` responses by calling `/auth/refresh`.
* **Rules**: Do not duplicate server data in local client state. Rely on normalized query caching.

### 2. Client State
* **Examples**: Modal open/close state, active filters, form draft steps, temporary selection IDs.
* **Management**: React local state (`useState`, `useReducer`), `AuthContext` (`useAuth()` hook for user session lifecycle), and Redux Toolkit feature slices (`store/features/user/userSlice.ts`).

---

## API Layer & Data Flow

* All API calls must go through RTK Query services under `src/store/features/`.
* Feature APIs inject endpoints directly into `src/store/baseApi.ts`.
* `credentials: "include"` is configured by default for httpOnly cookie authentication (`accessToken`, `refreshToken`).
* Direct `fetch` or `axios` calls inside UI components are prohibited.
* Requests and responses must use strictly typed interfaces defined in `src/types/auth.ts`.
* Standardized loading, empty, and error handling must be implemented across all views.

---

## Routing & Page Structure

Routes are structured around user roles and core platform workflows:

* `/(auth)`: Authentication routes (Login, Register).
* `/profile`: User profile, credentials, and company memberships (Profile Navbar layout).
* `/company/[company-id]/(dashboard)`: Company tenant dashboard workspace (Company Navbar layout).
  * `/company/[company-id]/dashboard`: Company metrics and KPIs.
  * `/company/[company-id]/quotations`: Quotation Kanban pipeline board and table views.
  * `/company/[company-id]/approvals`: Managerial and finance approval workflows.
  * `/company/[company-id]/fulfillment`: Delivery and backorder fulfillment tracking.
  * `/company/[company-id]/subscriptions`: Recurring billing and subscription contracts.
  * `/company/[company-id]/invoices`: Invoice management based on delivered items.
  * `/company/[company-id]/deal-health`: Deal health alerts and stalled quotation indicators.
  * `/company/[company-id]/reports`: Analytics and exportable business reports.
  * `/company/[company-id]/products`: Product catalog, pricing constraints, and risk limits.
* `/company/[company-id]/(customer)`: Customer quotation review, negotiation, and sign-off portal.

---

## Security & Authentication Flow

* **Session Validation & Route Protection**:
  - Client-side `<ProtectedRoute>` wraps all private layouts (`ProfileLayout`, `CompanyDashboardLayout`), verifying live `useAuth()` status and redirecting unauthenticated users to `/login?redirect=<path>`.
* **Tokens**:
  - `accessToken` and `refreshToken` are stored in httpOnly cookies set by the backend.
  - Automatic `401` re-authentication happens seamlessly in `baseQueryWithReauth` (`baseApi.ts`).
* **Role-based access control (RBAC)** boundaries (Platform User, Company Admin, Sales Rep, Sales Manager, Finance Manager) are respected across routing guards and UI actions.
* **Multi-company context**: requests include active company context parameters to preserve tenant isolation.

---

## Architecture Maintenance

Any modification to:
* Folder hierarchy
* State management patterns
* API integration mechanisms
* Authentication or routing workflows

Must be documented in this file (`architecture.md`) prior to completion.
