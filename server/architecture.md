# DealFlow360 Server Architecture

## 1. Purpose

DealFlow360 is a sales and deal management platform that takes a customer requirement through product selection, quotation, approval, order confirmation, fulfillment, delivery, invoicing, and payment tracking.

This document describes the server architecture and the main business workflow.

## 2. Architectural Principles

1. The server is the source of truth for business state.
2. APIs expose business operations rather than database operations.
3. Business rules are centralized in application and domain services.
4. Financial and fulfillment records are traceable back to the original customer order.
5. State transitions are explicit and validated.
6. Operations that update multiple related records are transactional.
7. Auditability is required for important commercial and operational changes.
8. The architecture should remain modular so pricing, discounts, fulfillment, and invoicing rules can evolve independently.

## 3. High Level Architecture

```text
Client
  |
  v
API Layer
  |
  v
Authentication and Authorization
  |
  v
Application Services
  |
  +-------------------+-------------------+-------------------+
  |                   |                   |                   |
  v                   v                   v                   v
Customer and CRM    Product and       Deal and Pricing     Fulfillment
                    Catalog           Engine               Services
  |                   |                   |                   |
  +-------------------+-------------------+-------------------+
                          |
                          v
                    Order Management
                          |
                 +--------+--------+
                 |                 |
                 v                 v
              Delivery          Invoicing
                 |                 |
                 +--------+--------+
                          |
                          v
                       Database
                          |
                          v
                    Audit and Events
```

The exact framework, database engine, queue technology, and deployment topology must follow the implementation in the repository. If those choices change, update this document.

## 4. Server Layers

### 4.1 API Layer

Responsibilities:

- Authentication entry points.
- Request parsing.
- Input validation.
- API versioning where required.
- Mapping requests to application commands.
- Mapping application results to API responses.
- HTTP error handling.

The API layer must remain thin. It must not contain complex pricing, discount, fulfillment, or invoicing rules.

### 4.2 Authentication and Authorization

Responsibilities:

- Authenticate users via bearer tokens or session cookies (`verifyAuth` middleware).
- Resolve the current user (`req.user`) and validate active session tokens.
- Resolve company context via `verifyCompanyAccess` middleware:
  - Extracts company ID from route parameters (`:companyId`, `:id`), `x-company-id` header, request body, or query parameters.
  - Validates company existence and active state (rejects suspended or deleted companies).
  - Verifies the user is either the company owner or an active member of `company_users`.
  - Attaches `req.company`, `req.companyUser`, and `req.companyRole` to the request object.
  - Eliminates redundant company database queries across downstream controllers and application services.
- Enforce Role-Based Access Control (RBAC) via `rbac.middleware.ts`:
  - `requireRole` / `requireCompanyRole`: Validates that `req.companyRole` matches required company roles (`ADMIN`, `SALES_REP`, `SALES_MANAGER`, `FINANCE_MANAGER`, `CUSTOMER`). Company owners and users with the `ADMIN` role are always permitted through company-level RBAC checks.
  - `requirePlatformRole`: Validates platform-level user roles (`USER`, `ADMIN`). Platform administrators are always permitted through platform-level RBAC checks.
- Prevent unauthorized access to commercial, catalog, configuration, and financial data.

Typical roles include:

- Platform roles:
  - User (`USER`)
  - Platform Admin (`ADMIN`)
- Company roles:
  - Company Admin (`ADMIN`)
  - Sales Representative (`SALES_REP`)
  - Sales Manager (`SALES_MANAGER`)
  - Finance Manager (`FINANCE_MANAGER`)
  - Customer (`CUSTOMER`)


### 4.3 Application Services

Application services coordinate complete business operations.

Examples:

- Create customer requirement.
- Recommend products.
- Create quotation.
- Recalculate quotation.
- Apply discount rules.
- Accept quotation.
- Confirm sales order.
- Reserve or allocate stock.
- Create delivery.
- Create backorder.
- Generate invoice.
- Record payment.
- Cancel or amend an order.

Application services own transaction boundaries for multi-step operations.

### 4.4 Domain and Business Modules

The server should separate business concepts into modules with clear boundaries.

Core modules:

```text
Identity
Company
Customer
Product
Pricing
Deal
Quotation
Sales Order
Inventory
Delivery
Backorder
Invoice
Payment
Audit
Notification
```

A module should own its rules and expose operations to other modules through application services or well-defined interfaces.

### 4.5 Persistence Layer

Responsibilities:

- Database models.
- Repositories or data access services.
- Transactions.
- Query optimization.
- Constraints and indexes.
- Database migrations.

Persistence models must not become the public API contract automatically.

### 4.6 Company and Multi-Tenancy Context

Responsibilities:

- Store company records with owner reference, currency, address, country, postal code, and status (ACTIVE, SUSPENDED, DELETED).
- Map users to companies using the `company_users` table with role assignments (ADMIN, SALES_REP, SALES_MANAGER, FINANCE_MANAGER, CUSTOMER) and optional customer tier classification (`customer_tier` enum: BRONZE, SILVER, GOLD).
- Store company settings (`company_settings`) created automatically on company creation, storing `customer_discount_tier` as JSONB and converted using safe Zod schemas.
- Execute multi-step company and relation creation within database transactions via `prismaTransaction`.
- Enforce company-level role-based authorization for administrative, sales, and financial operations.
- Provide paginated company listing (GET /api/v1/companies) scoped to the authenticated user's memberships and ownerships with assigned userRole, search, status filtering, and standard PaginatedResult metadata (docs, totalDocs, limit, page, totalPages, hasNextPage, hasPrevPage).
- Provide company role definition endpoint (GET /api/v1/companies/:id/roles) listing all company roles (ADMIN, SALES_REP, SALES_MANAGER, FINANCE_MANAGER, CUSTOMER).
- Ensure soft-delete support with `deletedAt` timestamps.

### 4.7 Warehouse, Product, and Stock Persistence Context

Responsibilities:

- Store warehouse records (`warehouses`) scoped to a company, containing name, country, postal code (`postal_code`), address line (`address_line`), and soft delete support (`deletedAt`).
- Store product records (`products`) scoped to a company, containing name, description, monetary price stored as decimal, base unit (`base_unit`), product type (`ProductType` enum: ONE_TIME, RECURRING), and soft delete support (`deletedAt`).
- Store product inventory levels per warehouse (`product_stocks`) linking products and warehouses with decimal stock quantity (`stock_qty`) and a unique constraint across product and warehouse.
- Store product discount tiers per customer tier (`product_discount_tiers`) linking products with customer tiers (BRONZE, SILVER, GOLD) and percentage discounts stored as decimal (`discount_percent`).

### 4.8 Deal, Quotation, Revision, and Negotiation Persistence Context

Responsibilities:

- Store sales opportunity records (`deals`) scoped to a company, linking customer and sales representative.
  - Track opportunity progress via `DealStage` enum (`NEW`, `QUALIFICATION`, `REQUIREMENT`, `QUOTATION`, `NEGOTIATION`, `WON`, `LOST`).
  - Track overall outcome via `DealStatus` enum (`OPEN`, `WON`, `LOST`, `CANCELLED`).
  - Maintain commercial forecasts including `expected_value`, `probability`, `expected_close_date`, and lead `source`.
- Store quotation records (`quotations`) linking company, parent deal, sales representative, and customer.
  - Track quotation status via `QuotationStatus` enum (`DRAFT`, `SENT`, `NEGOTIATING`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `CANCELLED`).
  - Maintain link to the active commercial revision (`current_revision_id`).
  - Protect commercial endpoints with RBAC middleware (`verifyCompanyAccess`, `requireRole`).
- Store active quotation line items (`quotation_items`) representing current products, quantities, unit prices, discount types (`PERCENTAGE`, `FIXED`), discount values, discount amounts, tax rates, final unit prices, and line totals.
- Store immutable, versioned quotation revisions (`quotation_revisions`) capturing the proposal state at every commercial iteration.
  - Track revision metadata: `revision_no`, author (`created_by`), `revision_type` (`INITIAL`, `SALES_COUNTER`, `CUSTOMER_COUNTER`, `FINAL`), and `status` (`DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`).
  - Store financial totals: `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, and customer/internal notes.
- Store historical snapshot line items (`quotation_revision_items`) preserving exact commercial values for each revision, independent of subsequent product price changes.
- Store negotiation sessions (`negotiations`) per quotation with `NegotiationStatus` enum (`OPEN`, `CLOSED`, `CANCELLED`).
- Store negotiation offers (`negotiation_offers`) representing distinct offers and counter-offers made by either party (`OfferParty`: `CUSTOMER`, `SALES_REP`) with `OfferStatus` (`PENDING`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`, `WITHDRAWN`) and base revision references.
- Store line-level negotiation requests (`negotiation_offer_items`) specifying requested quantities, unit prices, discount types, discount values, and line totals.

### 4.9 Company Configuration Context

Responsibilities:

- Store company key-value configurations (`company_configs`) with unique constraints per company and config key (`companyId`, `config_key`).



## 5. Core Domain Model

The following relationships describe the intended commercial traceability.

```text
Customer
   |
   v
Deal (Sales Opportunity)
   |
   v
Quotation (Commercial Proposal)
   |
   +----> Quotation Items (Active Products)
   |
   +----> Quotation Revision 1 (Versioned Snapshot)
   |        |
   |        +----> Revision Items
   |
   +----> Quotation Revision 2 (Versioned Snapshot)
   |        |
   |        +----> Revision Items
   |
   +----> Negotiation (Negotiation Session)
            |
            +----> Offer 1 (Customer/Sales Offer)
            |        |
            |        +----> Offer Items (Requested Lines)
            |
            +----> Offer 2 (Counter Offer)
                     |
                     +----> Offer Items (Requested Lines)
   |
   v
Accepted Quotation Revision
   |
   v
Sales Order
   |
   +-------------------+
   |                   |
   v                   v
Delivery 1          Delivery 2
   |                   |
   v                   v
Invoice 1            Invoice 2
   |                   |
   +---------+---------+
             |
             v
          Payment
```

The exact database normalization can differ, but the traceability between these business records must remain intact.


## 6. Customer Sales Workflow

### Step 1: Customer Requirement

The process begins when the customer provides a requirement.

The requirement can contain:

- Desired products or product categories.
- Quantity.
- Budget.
- Required delivery date.
- Business context.
- Optional preferences or constraints.

The server stores the requirement so later recommendations and quotation decisions are traceable.

### Step 2: Product Selection

Products are selected based on the requirement.

The server can evaluate:

- Product compatibility.
- Availability.
- Pricing.
- Customer specific pricing.
- Existing promotions.
- Deal rules.
- Upsell opportunities.
- Cross sell opportunities.

Upsell and cross sell happen before the final quotation is accepted.

The important distinction is:

```text
Recommendation != Order Line
```

A recommendation may be shown to the customer or sales user, but it does not become part of the order unless explicitly selected.

### Step 3: Deal and Discount Evaluation

The pricing engine calculates the commercial offer.

Inputs may include:

- Customer.
- Product.
- Quantity.
- Customer segment.
- Price list.
- Active promotion.
- Deal rules.
- Discount rules.
- Sales representative permissions.
- Approval thresholds.

The server returns the calculated price and discount information.

Client supplied prices must not override server side pricing rules.

### Step 4: Quotation Creation and Lifecycle

A quotation is created from the selected products and applicable commercial rules, linked to a parent Deal.

Quotation Creation and Item Management Flow:
1. Create Quotation in DRAFT state (POST /api/v1/quotations):
   - Created with initial status DRAFT determined by the backend.
   - Initial quotation contains no items.
   - Requires deal_id, customer_id, optional sales_rep_id, currency, and valid_until.
   - Protected by company RBAC (ADMIN, SALES_REP, SALES_MANAGER).
2. Add Quotation Item (POST /api/v1/quotations/:id/items or /api/v1/quotations/:quotationId/items):
   - Adds a single product line item to a DRAFT quotation.
   - Determines product base price and customer tier discount:
     a. Checks product specific tier discount in product_discount_tiers.
     b. Falls back to company setting customer_discount_tier.
     c. Calculates unit price, discount amount, final unit price, and line total.
   - Adding items is rejected if quotation is not in DRAFT status.
3. Remove Quotation Item (DELETE /api/v1/quotations/:id/items/:itemId):
   - Removes a line item from a DRAFT quotation.
   - Removing items is rejected if quotation is not in DRAFT status.
4. List Quotation Items (GET /api/v1/quotations/:id/items):
   - Lists all active items with product information and calculated commercial values.
5. Get Quotation Details (GET /api/v1/quotations/:id):
   - Returns quotation header, linked deal, customer, sales rep, company, items, and calculated totals (subtotal, discountAmount, taxAmount, totalAmount).
6. Send Quotation (POST /api/v1/quotations/:id/send):
   - Validates that the quotation contains at least 1 item.
   - Validates that validity date (validUntil) is not expired.
   - Transitions quotation status from DRAFT to SENT.
   - Advances parent Deal stage to QUOTATION if currently in NEW, QUALIFICATION, or REQUIREMENT.
   - Prevents further item additions or deletions once sent.

Typical quotation data:

```text
Quotation
  - company
  - deal
  - customer
  - sales representative
  - currency
  - validity period
  - status (DRAFT, SENT, NEGOTIATING, ACCEPTED, REJECTED, EXPIRED, CANCELLED)
  - current revision
```

Revisions capture versioned history:
- When a draft or negotiating quotation is updated with revised proposal lines or pricing, previous items are replaced on the active quotation and a versioned QuotationRevision (revision_type = SALES_COUNTER) is recorded.
- Revisions can be retrieved via GET /api/v1/quotations/:id/revisions.

### Step 5: Quotation Approval

If a quotation exceeds configured discount or commercial thresholds, it can require sales manager or administrator approval.

Example flow:

```text
Draft
  |
  v
Pending Approval
  |
  +----> Rejected
  |
  v
Approved
```

Approval must be a server side authorization decision.

### Step 6: Customer Acceptance

The customer reviews the final quotation.

Possible outcomes:

```text
Quotation
  |
  +----> Rejected
  |
  +----> Expired
  |
  v
Accepted
```

Only an accepted quotation should progress into a confirmed sales order.

### Step 7: Sales Order Creation

The accepted commercial terms are converted into a sales order.

The order must preserve a reference to the originating quotation.

```text
Quotation
   |
   v
Sales Order
```

The order becomes the central record for fulfillment and downstream financial traceability.

## 7. Fulfillment Workflow

### 7.1 Stock Check

After order confirmation, the server evaluates availability.

For each order line:

```text
Ordered Quantity
        |
        v
Available Quantity
        |
        +----> Full fulfillment
        |
        +----> Partial fulfillment
        |
        +----> Backorder
```

The system must not claim that an item was delivered merely because it was ordered.

### 7.2 Full Delivery

If the required quantity is available:

```text
Sales Order
    |
    v
Delivery
    |
    v
Shipped
```

The delivery records the actual shipped quantity.

### 7.3 Partial Delivery

If only part of the quantity is available:

```text
Ordered: 10

Delivery 1:
Shipped: 6

Remaining:
4
```

The remaining quantity stays associated with the same sales order line.

### 7.4 Backorder

A backorder represents the remaining quantity that could not be fulfilled by the current delivery.

```text
Sales Order Line
  |
  +---- Delivery 1: 6
  |
  +---- Backorder: 4
             |
             v
        Delivery 2: 4
```

The backorder must remain traceable to the original order and line.

"Consolidate remaining backorder" means combining eligible remaining quantities into a later fulfillment operation instead of treating each remaining quantity as an unrelated order.

## 8. Invoicing Workflow

The invoicing strategy must be explicit.

For shipped-quantity based invoicing:

```text
Order Quantity
      |
      v
Shipment
      |
      v
Billable Quantity
      |
      v
Invoice
```

Example:

```text
Order: 10 units

Delivery 1: 6 units
Invoice 1: 6 units

Delivery 2: 4 units
Invoice 2: 4 units
```

The two invoices map back to the same customer order through their order and order line references.

A partial invoice is not a separate customer order. It is a financial document representing part of the fulfillment of the same order.

The server must prevent billing quantities that violate the configured invoicing policy.

## 9. Delivery and Invoice Reconciliation

Delivery and invoice states must be related but independent.

Example:

```text
Sales Order
   |
   +---- Delivery 1 ----> 6 shipped
   |                         |
   |                         v
   |                      Invoice 1
   |
   +---- Delivery 2 ----> 4 shipped
                             |
                             v
                          Invoice 2
```

This allows:

- Partial delivery.
- Partial invoicing.
- Remaining backorders.
- Multiple invoices for one order.

The system should maintain quantities such as:

```text
ordered_quantity
delivered_quantity
remaining_quantity
invoiced_quantity
remaining_to_invoice
```

These quantities must be derived or updated consistently according to the chosen data model.

## 10. Payment Workflow

Payment follows invoicing.

```text
Invoice
  |
  v
Payment
```

An invoice can be:

```text
Draft
  |
  v
Posted
  |
  +---- Partially Paid
  |
  v
Paid
```

Payment records must reference the invoice or invoices they settle.

Payment state must not be confused with delivery state.

## 11. Deal and Discount Engine

The deal engine evaluates applicable commercial rules.

Conceptually:

```text
Customer
   |
Product + Quantity
   |
Price List
   |
Promotion
   |
Customer Segment
   |
Discount Rules
   |
Approval Rules
   |
   v
Final Commercial Offer
```

Rules should have clear precedence.

A recommended evaluation sequence is:

1. Determine applicable price list.
2. Determine base product price.
3. Evaluate eligible promotions.
4. Evaluate deal specific discounts.
5. Apply customer or segment rules.
6. Validate minimum and maximum discount limits.
7. Determine whether approval is required.
8. Calculate tax and final totals.

If the actual product requirements define a different precedence, that precedence becomes authoritative and must be documented here.

## 12. Upsell and Cross Sell Engine

Upsell and cross sell are recommendation capabilities during product selection and quotation preparation.

### Upsell

Upsell recommends a higher value or higher capability alternative.

```text
Selected Product
      |
      v
Higher Value Alternative
```

Example:

```text
Basic Plan
   |
   v
Professional Plan
```

### Cross Sell

Cross sell recommends complementary products.

```text
Selected Product
      |
      v
Complementary Product
```

Example:

```text
Laptop
  |
  +---- Laptop Bag
  +---- Dock
  +---- Extended Warranty
```

Recommendations must be explainable through deterministic rules or configured recommendation data unless an AI capability is explicitly introduced and documented.

## 13. State Management

Business entities should use explicit state transitions.

Example quotation state machine:

```text
Draft
  |
  v
Pending Approval
  |
  v
Approved
  |
  v
Accepted
  |
  v
Converted
```

Alternative terminal states:

```text
Draft ------> Cancelled
Pending Approval -----> Rejected
Approved -------------> Expired
```

Example order state machine:

```text
Confirmed
   |
   v
Processing
   |
   +----> Partially Fulfilled
   |
   v
Fulfilled
```

Cancellation and exception states should be defined explicitly rather than inferred from missing records.

## 14. Transaction Boundaries

The following operations should normally be transactional:

- Creating a quotation and its lines.
- Accepting a quotation and creating the corresponding sales order.
- Confirming an order and creating required fulfillment records.
- Recording a delivery and updating fulfillment quantities.
- Creating an invoice from billable quantities.
- Applying a payment to an invoice.
- Creating or consolidating backorders.

A transaction must either complete the entire business operation or leave the system in a valid previous state.

## 15. Audit Trail

Audit records should capture important changes such as:

- Quotation creation.
- Price or discount changes.
- Approval decisions.
- Quotation acceptance or rejection.
- Sales order confirmation.
- Delivery creation and validation.
- Backorder creation or consolidation.
- Invoice creation.
- Payment recording.
- Cancellation.
- Administrative overrides.

Audit records should include enough context to answer:

```text
Who changed it?
What changed?
When did it change?
Which business record changed?
Why was the change made, when a reason is required?
```

Audit history should not depend on application logs.

## 16. Events and Asynchronous Processing

Events may be introduced when a workflow needs asynchronous processing or external integrations.

Potential events:

```text
QuotationAccepted
OrderConfirmed
DeliveryCompleted
BackorderCreated
InvoicePosted
PaymentReceived
```

Do not introduce a message broker only for architectural appearance. A synchronous application service is preferable when the operation is simple and does not require asynchronous behavior.

If a queue or event bus is introduced, document:

- Event ownership.
- Event schema.
- Delivery guarantees.
- Retry behavior.
- Idempotency strategy.
- Failure handling.
- Dead letter behavior.

## 17. External Integrations

Possible integrations include:

- Payment provider.
- Email provider.
- Notification provider.
- ERP or accounting system.
- Warehouse or inventory system.

External integrations must be isolated behind integration services or adapters.

Core business logic should not depend directly on vendor SDK calls.

## 18. API Workflow Summary

The primary API-level workflow is:

```text
Authenticate
    |
    v
Create Customer Requirement
    |
    v
Get Product Recommendations
    |
    v
Select Products
    |
    +---- Upsell
    |
    +---- Cross Sell
    |
    v
Calculate Price and Discount
    |
    v
Create Quotation
    |
    v
Approve if Required
    |
    v
Customer Accepts
    |
    v
Create Sales Order
    |
    v
Check Fulfillment
    |
    +---- Full Delivery
    |
    +---- Partial Delivery
    |          |
    |          v
    |       Backorder
    |          |
    |          v
    |       Later Delivery
    |
    v
Create Invoice Based on Invoicing Policy
    |
    v
Record Payment
```

## 19. Data Traceability

The server must preserve the following chain:

```text
Customer
  -> Requirement
  -> Product Selection
  -> Quotation
  -> Quotation Lines
  -> Sales Order
  -> Sales Order Lines
  -> Deliveries
  -> Backorders
  -> Invoices
  -> Payments
```

This traceability is important for customer support, financial reconciliation, reporting, auditing, and dispute resolution.

## 20. Architecture Change Rule

Whenever implementation changes any of the following, update this file in the same change:

- Module boundaries.
- API architecture.
- Database architecture.
- State machines.
- Pricing or discount flow.
- Quotation workflow.
- Order workflow.
- Delivery workflow.
- Backorder behavior.
- Invoicing behavior.
- Payment behavior.
- Event architecture.
- External integrations.
- Authorization model.
- Transaction boundaries.

The code and this document must describe the same system.
