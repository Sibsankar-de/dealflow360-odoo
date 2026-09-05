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
│       └── company/      # Team, roles, product management
├── services/             # Centralized API clients and endpoint definitions
│   └── api/              # Base API configuration and domain services
├── hooks/                # Reusable custom React hooks
├── store/                # Global state management (Redux Toolkit / RTK Query)
│   └── slices/           # Client-side UI slices
├── types/                # Global TypeScript interfaces and type definitions
├── utils/                # Pure helper functions and formatters
└── assets/               # Static assets, icons, and media
```

---

## State Management Architecture

State is strictly divided into two categories:

### 1. Server State
* **Examples**: Quotations, Deals, Products, Invoices, Delivery Batches, Users, Notifications.
* **Management**: Centralized API services / RTK Query caching and invalidation.
* **Rules**: Do not duplicate server data in local client state. Rely on normalized query caching.

### 2. Client State
* **Examples**: Modal open/close state, active filters, form draft steps, temporary selection IDs.
* **Management**: React local state (`useState`, `useReducer`) for component-level state, and Redux Toolkit slices for shared cross-component UI state.

---

## API Layer & Data Flow

* All API calls must go through centralized services under `src/services/api/`.
* Direct `fetch` or `axios` calls inside UI components are prohibited.
* Requests and responses must use strictly typed interfaces defined in `src/types/`.
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

* Authentication tokens and company context headers are managed centrally in the API client layer.
* Role-based access control (RBAC) boundaries (Platform User, Company Admin, Sales Rep, Sales Manager, Finance Manager) are respected across routing guards and UI actions.
* Multi-company context: requests include the active company identifier header to maintain tenant isolation.

---

## Architecture Maintenance

Any modification to:
* Folder hierarchy
* State management patterns
* API integration mechanisms
* Authentication or routing workflows

Must be documented in this file (`architecture.md`) prior to completion.
