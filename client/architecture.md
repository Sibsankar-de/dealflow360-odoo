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
│   ├── (auth)/           # Authentication routes (login, signup)
│   ├── profile/          # User profile and company workspace selector
│   └── company/
│       └── [company-id]/
│           ├── (customer)/ # Customer portal route group (Customer layout)
│           │   └── customer/ # Active deals overview, proposal tracking & quotations
│           └── app/        # Company member authenticated application layout
│               ├── access-control/
│               ├── dashboard/
│               ├── deals/ & deals/[deal-id]/ & deals/[deal-id]/quotations/ & deals/[deal-id]/quotations/[quotation-id]
│               ├── quotations/
│               ├── products/
│               ├── warehouses/
│               ├── customers/
│               ├── fulfillment/ & fulfillment/[id]/
│               ├── subscriptions/
│               ├── invoices/
│               ├── deal-health/
│               └── settings/
├── components/           # Reusable shared UI and layout components
│   ├── ui/               # Base primitives (Avatar, AppLogo, Select, CurrencySelector, FilterSelector, SearchableInput, Button, Input, Modal, Card, Badge, Tabs)
│   ├── shared/           # Shared compound components (navbar, sidebar, tables)
│   └── modules/          # Feature module UI components
│       ├── auth/         # LoginForm, SignupForm, AuthBrandingPanel
│       ├── layout/       # Collapsible Sidebar, Navbar, StoreInfo, UserAvatarMenu
│       ├── profile/      # ProfileInfoCard, CompanyCard, CompanyList, EditProfileModal, ChangePasswordModal, CreateCompanyModal
│       ├── deals/        # DealList, DealModal, DeleteDealModal
│       ├── products/     # ProductList, ProductModal, DeleteProductModal
│       ├── warehouses/   # WarehouseList, WarehouseModal, DeleteWarehouseModal
│       ├── quotations/   # QuotationKanbanBoard, QuotationKanbanColumn, QuotationKanbanCard, CreateQuotationModal, ReQuotationModal
│       ├── backorders/   # FulfillBackorderModal
│       ├── subscriptions/ # SubscriptionHistoryModal, RenewSubscriptionModal, CancelSubscriptionModal
│       ├── finance/      # Invoices, financial approvals
│       ├── customers/    # Customer directory and interaction history
│       ├── dealhealth/   # Deal health risk metrics, anomaly detection & action alerts
│       ├── settings/     # Store name, currency, discount tiers & address configuration
│       ├── accesscontrol/ # TeamMembersTable, InviteTeamMemberModal, EditTeamMemberRoleModal, DeleteTeamMemberModal, ViewTeamMemberModal
│       └── company/      # Team, roles, product management
├── services/             # Centralized API clients and endpoint definitions
│   └── api/              # Base API configuration and domain services
├── hooks/                # Reusable custom React hooks
├── schemas/              # Zod validation schemas (auth.schema.ts, company.schema.ts, product.schema.ts, warehouse.schema.ts, deal.schema.ts)
├── store/                # Global state management (Redux Toolkit store, StoreProvider)
│   ├── baseApi.ts        # Base RTK Query API configuration with re-auth interceptor & tags
│   ├── features/         # Feature slices & injected endpoints
│   │   ├── user/         # userSlice.ts, userApi.ts
│   │   ├── company/      # companySlice.ts, companyApi.ts (user company affiliations, member list/invite/role update/removal, company roles, lookup)
│   │   ├── product/      # productApi.ts (product catalog & stock allocation)
│   │   ├── warehouse/    # warehouseApi.ts (warehouses and distribution hubs)
│   │   ├── deal/         # dealApi.ts (deals lifecycle, quotations generation & revisions)
│   │   └── subscription/ # subscriptionApi.ts (recurring contracts, renewals, pricing tiers)
│   └── index.ts          # Central Redux store configuration
├── types/                # Global TypeScript interfaces and type definitions (auth.ts, profile.ts, company.ts, product.ts, warehouse.ts, deal.ts, quotation.ts, subscription.ts, SelectType.ts)
├── utils/                # Pure helper functions and formatters
└── assets/               # Static assets, icons, and media
```

---

## State Management Architecture

State is strictly divided into two categories:

### 1. Server State
* **Examples**: Quotations, Deals, Products, Subscriptions, SubscriptionPricing, Warehouses, Invoices, Delivery Batches, Users, Notifications.
* **Management**: Centralized RTK Query caching (`store/baseApi.ts`) with feature endpoints (`userApi.ts`, `companyApi.ts`, `productApi.ts`, `warehouseApi.ts`, `dealApi.ts`, `subscriptionApi.ts`) and tag invalidation (`User`, `Company`, `Quotation`, `Product`, `Warehouse`, `Deal`, `Subscription`, `SubscriptionPricing`).
* **Authentication**: Automatic session recovery via `baseQueryWithReauth` in `baseApi.ts` on `401 Unauthorized` responses by calling `/auth/refresh`.
* **Rules**: Do not duplicate server data in local client state. Rely on normalized query caching.

### 2. Client State
* **Examples**: Modal open/close state, active filters, form draft steps, temporary selection IDs.
* **Management**: React local state (`useState`, `useReducer`), `AuthContext` (`useAuth()` hook for user session lifecycle), and Redux Toolkit feature slices (`userSlice.ts`, `companySlice.ts`).

---

## API Layer & Data Flow

* All API calls must go through RTK Query services under `src/store/features/`.
* Feature APIs inject endpoints directly into `src/store/baseApi.ts`.
* `credentials: "include"` is configured by default for httpOnly cookie authentication (`accessToken`, `refreshToken`).
* Tenant requests supply active company context via the `x-company-id` header.
* Direct `fetch` or `axios` calls inside UI components are prohibited.
* Requests and responses must use strictly typed interfaces.
* Standardized loading, empty, and error handling must be implemented across all views.

---

## Routing & Page Structure

Routes are structured around user roles and core platform workflows:

* `/(auth)`: Authentication routes (Login, Register).
* `/profile`: User profile, credentials, and company memberships (Profile Navbar layout).
* `/company/[company-id]/workspace`: Company tenant workspace (Company Navbar + Sidebar layout).
  * `/company/[company-id]/workspace/dashboard`: Company metrics and KPIs.
  * `/company/[company-id]/workspace/deals`: Deals pipeline management and opportunity tracking.
  * `/company/[company-id]/workspace/deals/[deal-id]`: Deal detail view, nested commercial quotations and revision iteration cycle.
  * `/company/[company-id]/workspace/quotations`: Quotation Kanban pipeline board and table views.
  * `/company/[company-id]/workspace/products`: Product catalog, pricing models, subscription pricing tiers, and warehouse stock allocation.
  * `/company/[company-id]/workspace/warehouses`: Warehouses and inventory distribution hubs.
  * `/company/[company-id]/workspace/customers`: Customer directory and quotation history.
  * `/company/[company-id]/workspace/fulfillment`: Delivery and backorder fulfillment tracking.
  * `/company/[company-id]/workspace/fulfillment/[id]`: Fulfillment plan detail, split warehouse allocation, and automatic subscription creation.
  * `/company/[company-id]/workspace/subscriptions`: Recurring billing and subscription contracts directory, KPIs, period history audit, and renewal/cancellation workflows.
  * `/company/[company-id]/workspace/invoices`: Invoice management based on delivered items.
  * `/company/[company-id]/workspace/deal-health`: Deal health alerts and stalled quotation indicators.
  * `/company/[company-id]/workspace/settings`: Company settings, base currency, and billing rules.
* `/company/[company-id]/(customer)`: Customer portal workspace (URL: `/company/[company-id]/customer`).
  * `/company/[company-id]/customer`: List of deals associated with the customer in the company, with options to view quotations or request deal cancellation.
  * `/company/[company-id]/customer/deals/[deal-id]/quotations`: List of quotations for the selected deal filtered to active/customer-visible statuses.
  * `/company/[company-id]/customer/deals/[deal-id]/quotations/[quotation-id]`: Customer quotation review and negotiation interface featuring transparent-by-default inputs, gray-bordered editable state upon clicking Negotiate, revision history timeline, counter-offer dispatch, and approval/rejection workflows.
  * `/company/[company-id]/customer/subscriptions`: Customer active contracts, renewal dates, MRR commitment, self-service renewal, and cancellation controls.
  * `/company/[company-id]/customer/invoices`: Customer invoice overview and payment receipt tracking.

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
