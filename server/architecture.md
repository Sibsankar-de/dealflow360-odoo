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
- Provide paginated customer listing endpoint (GET /api/v1/customers/:companyId and GET /api/v1/companies/:id/customers) returning all customers associated with the company, supporting search by name or email, filtering by customer tier, and pagination.
- Ensure soft-delete support with `deletedAt` timestamps.

### 4.7 Warehouse, Product, and Stock Persistence Context

Responsibilities:

- Store warehouse records (`warehouses`) scoped to a company, containing name, country, postal code (`postal_code`), address line (`address_line`), and soft delete support (`deletedAt`).
- Store product records (`products`) scoped to a company, containing name, description, monetary price stored as decimal, base unit (`base_unit`), product type (`ProductType` enum: ONE_TIME, RECURRING), and soft delete support (`deletedAt`).
- Store product category records (`categories`) scoped to a company, containing name and optional description, with a unique constraint across company and name (`company_id`, `name`).
- Store many-to-many product-category relationships (`category_products`) linking products and categories.
- Support synchronizing product categories via `addOrRemoveCategories` on product creation, update, and dedicated category management endpoints.
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
  - Protect commercial endpoints with RBAC middleware (`verifyCompanyAccess`, `requireRole`).
  - Provide paginated quotation listing for deals via GET /api/v1/deals/:companyId/:id/quotations and GET /api/v1/quotations/:companyId/deal/:dealId.
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

### 4.10 Sales Order, Delivery, Backorder, and Invoice Persistence Context

Responsibilities:

- Store confirmed sales orders (`sales_orders`) linking company, customer, sales representative, and originating quotation.
  - Track order progress via `SalesOrderStatus` enum (`DRAFT`, `CONFIRMED`, `PROCESSING`, `PARTIALLY_DELIVERED`, `DELIVERED`, `CANCELLED`).
  - Store financial totals: `subtotal`, `discount_amount`, `tax_amount`, `total_amount`, and currency.
- Store sales order line items (`sales_order_items`) linking orders and products.
  - Track line quantities: `ordered_quantity`, `delivered_quantity`, `invoiced_quantity`.
  - Maintain commercial line terms: `unit_price`, `discount`, `tax_rate`, `final_unit_price`, and `line_total`.
- Store fulfillment delivery records (`deliveries`) linking company and sales order.
  - Track delivery status via `DeliveryStatus` enum (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
  - Track delivery metadata: `delivery_no`, `tracking_number`, `shipped_at`, and `delivered_at`.
- Store delivery line items (`delivery_items`) linking deliveries to sales order items and products with `delivered_quantity`.
- Store backorders (`backorders`) created automatically upon partial deliveries for remaining undelivered quantities.
  - Track backorder hierarchy via self-relation `parent_backorder_id`.
  - Track backorder status via `BackorderStatus` enum (`PENDING`, `PARTIALLY_FULFILLED`, `FULFILLED`, `CANCELLED`).
  - Track quantities: `total_quantity`, `fulfilled_quantity`, and `remaining_quantity`.
- Store backorder line items (`backorder_items`) linking backorders to sales order items and products.
  - Track line-level quantities: `ordered_quantity`, `fulfilled_quantity`, and `remaining_quantity`.
- Store customer invoices (`invoices`) generated strictly for delivered quantities.
  - Track invoice status via `InvoiceStatus` enum (`DRAFT`, `POSTED`, `PARTIALLY_PAID`, `PAID`, `CANCELLED`, `VOID`).
  - Track dates and terms: `issue_date`, `due_date`, `paid_at`, and `payment_terms`.
  - Track financial totals: `subtotal`, `discount`, `tax`, `total`, `paid_amount`, and `remaining_amount`.
- Store invoice line items (`invoice_items`) linking invoices to sales order items and products.
  - Track line-level quantities and commercial values: `delivered_quantity`, `unit_price`, `discount`, `tax`, and `line_total`.



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
1. Create Quotation in DRAFT state (POST /api/v1/quotations/:companyId):
   - Created with initial status DRAFT determined by the backend.
   - Initial quotation contains no items.
   - Requires deal_id, customer_id, optional sales_rep_id, currency, and valid_until.
   - Protected by company RBAC (ADMIN, SALES_REP, SALES_MANAGER).
2. Add Quotation Item (POST /api/v1/quotations/:companyId/:id/items):
   - Adds a single product line item to a DRAFT quotation.
   - Determines product base price and customer tier discount:
     a. Checks product specific tier discount in product_discount_tiers.
     b. Falls back to company setting customer_discount_tier.
     c. Calculates unit price, discount amount, final unit price, and line total.
   - Adding items is rejected if quotation is not in DRAFT status.
3. Remove Quotation Item (DELETE /api/v1/quotations/:companyId/:id/items/:itemId):
   - Removes a line item from a DRAFT quotation.
   - Removing items is rejected if quotation is not in DRAFT status.
4. List Quotation Items (GET /api/v1/quotations/:companyId/:id/items):
   - Lists all active items with product information and calculated commercial values.
5. Get Quotation Details (GET /api/v1/quotations/:companyId/:id):
   - Returns quotation header, linked deal, customer, sales rep, company, items, and calculated totals (subtotal, discountAmount, taxAmount, totalAmount).
6. Send Quotation (POST /api/v1/quotations/:companyId/:id/send):
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
- Revisions can be retrieved via GET /api/v1/quotations/:companyId/:id/revisions.

### Step 5: Discount Violation Evaluation and Commercial Approval

If a quotation exceeds configured discount or commercial thresholds, it requires sales manager or administrator approval. The server evaluates discount violations using two quantitative formulas:

#### Formula 1: Line-Level Violation
For every order line item i:
```text
V_i = max(0, D_i - A_i)
```
Where:
- D_i = actual discount percentage given on line i
- A_i = maximum discount percentage allowed for line i (from product discount tier or customer tier default)
- V_i = discount violation percentage for that line (0% if within limit)

#### Formula 2: Blended Violation Score
Across the quotation, the blended violation score is calculated using pre-discount line weights:
```text
BV = [sum(W_i * V_i)] / [sum(W_i)]
```
Where:
- V_i = line-level violation percentage for line i
- W_i = pre-discount monetary weight/value of line i (quantity * base unit price)
- BV = blended violation percentage across the whole quotation

Quotation discount evaluations:
- The evaluation checks if any line exceeds allowed limits (maxLineViolation > 0) or if the blended score exceeds the company threshold (BLENDED_DISCOUNT_THRESHOLD).
- Automated evaluation is executed on quotation send (POST /api/v1/quotations/:companyId/:id/send), customer counter-offer (POST /api/v1/quotations/:companyId/:id/counter-offer), and retrieval (GET /api/v1/quotations/:companyId/:id/discount-evaluation).

### Step 6: Customer Review, Negotiation, and Acceptance

The customer reviews the quotation through authenticated endpoints:

#### Customer Negotiation (Counter-Offer):
- Customer submits counter-offer (POST /api/v1/quotations/:companyId/:id/counter-offer or POST /api/v1/quotations/:companyId/:id/negotiate) with proposed discount, price, line item adjustments, and an optional message.
- The server verifies that the requesting user is the assigned customer with the CUSTOMER role in that company.
- Active negotiation session is tracked in `negotiations`, `negotiation_offers`, and `negotiation_offer_items`.
- Quotation transitions to NEGOTIATING status, Deal stage advances to NEGOTIATION, and a new revision of type CUSTOMER_COUNTER is recorded.
- Open negotiations and offer history can be retrieved via GET /api/v1/quotations/:companyId/:id/negotiations.

#### Customer Rejection:
- Customer rejects quotation (POST /api/v1/quotations/:companyId/:id/reject) with an optional rejection reason.
- The server verifies customer authorization and company membership.
- Rejection closes any open negotiations, marks pending offers as REJECTED, updates the current revision with the rejection reason in customerNote, and transitions quotation status to REJECTED.

#### Customer Acceptance:
- Customer accepts the quotation (PATCH /api/v1/quotations/:companyId/:id/status with status ACCEPTED).
- Accepted quotations progress into fulfillment review and sales order confirmation.
- Only an accepted quotation should progress into a confirmed sales order.

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

When a delivery is executed with partial quantities (POST /api/v1/sales-orders/:id/deliver):
- A Delivery record is created with the delivered quantities.
- A Backorder record is automatically created for the remaining undelivered quantities.
- When fulfilling a backorder (POST /api/v1/backorders/:id/deliver), any remaining quantities create a child backorder with parentBackorderId linking back to the parent.
- Backorder endpoints:
  - GET /api/v1/backorders: List backorders with filters and pagination.
  - GET /api/v1/backorders/:id: Retrieve backorder details including hierarchy, items, and linked deliveries.
  - POST /api/v1/backorders/:id/deliver: Fulfill backorder (partial fulfillment updates status to PARTIALLY_FULFILLED and creates child backorder; full fulfillment sets status to FULFILLED).
- Delivery endpoints:
  - GET /api/v1/deliveries: List deliveries with filters and pagination.
  - GET /api/v1/deliveries/:id: Retrieve delivery details and line items.

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

Invoices strictly include only quantities actually delivered:
- An invoice can be generated from a delivery (deliveryId) or for a sales order with specified delivered quantities.
- Attempting to invoice quantities exceeding uninvoiced delivered quantities is rejected by the server.
- Invoices track invoice number, status (DRAFT, POSTED, PARTIALLY_PAID, PAID, CANCELLED, VOID), dates (issueDate, dueDate, paidAt), currency, payment terms, subtotal, discount, tax, total, paid amount, and remaining amount.
- Invoice items track the related sales order item, product, delivered quantity, unit price, discount, tax, and line total.
- Invoice endpoints:
  - POST /api/v1/invoices: Create invoice for delivered quantities.
  - GET /api/v1/invoices: List invoices with company scoping, status filtering, and pagination.
  - GET /api/v1/invoices/:id: Retrieve detailed invoice with items, customer, sales order, and delivery relations.
  - POST /api/v1/invoices/:id/pay: Record payment against an invoice (updates paidAmount, remainingAmount, and status).

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

### 16.1 Elasticsearch and RabbitMQ Event Pipeline

The platform uses RabbitMQ as an event buffer and Elasticsearch as a search index for products and users.

1. Event Ownership and Queues:
   - Base queue: elasticsearch_queue_v1
   - Retry queue: elasticsearch_queue_v1_retry (5-second message TTL with dead-letter exchange routing back to base queue)
   - Dead letter queue: elasticsearch_queue_v1_dlq

2. Event Schema:
   - action: index or delete
   - entity: product or user
   - id: Unique record identifier (UUID string)
   - companyId: Tenant identifier for company-scoped entities (optional)
   - data: Entity document payload (optional)

3. Indexed Fields:
   - Product index: id, name, description, companyId
   - User index: id, email, name

4. Delivery and Retry Behavior:
   - Messages are published with persistent delivery mode.
   - The worker prefetch is set to 5 concurrent messages.
   - Failures are retried up to 3 times using RabbitMQ x-death header tracking.
   - Exceeded retries are routed to elasticsearch_queue_v1_dlq for inspection.

5. Search Resilience and Fallback:
   - Product and user search operations query Elasticsearch first.
   - If Elasticsearch is unavailable or returns an error, search operations fall back to direct PostgreSQL queries via Prisma.

6. Search APIs:
   - Product Search: GET /api/v1/products/:companyId/search?query=...&limit=...
     Queries Elasticsearch product index, extracts ranked product IDs, queries PostgreSQL for matching company products, sorts them according to the Elasticsearch rank order, and returns a list of ProductSummaryResponseDto.
   - Customer Search: GET /api/v1/customers/:companyId/search?query=...&limit=...
     Queries Elasticsearch user index, extracts ranked user IDs, queries PostgreSQL for matching users with company membership, sorts them according to the Elasticsearch rank order, and returns a list of CustomerSummaryResponseDto.

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
