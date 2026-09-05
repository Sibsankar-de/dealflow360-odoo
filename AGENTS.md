# AGENT.md

## Project Overview

Project Name: DealFlow360

DealFlow360 is a deal lifecycle and quotation management platform designed to streamline the process of creating, approving, negotiating, fulfilling, and invoicing customer quotations.

The platform enables organizations to manage internal approval workflows while providing customers with a transparent interface to review and respond to quotations.

The system supports role-based collaboration between sales, management, and finance teams.

---

## Core Objective

Reduce quotation approval delays while maintaining pricing control, risk management, fulfillment visibility, and customer engagement.

The platform should:

- Automate low-risk quotation approvals.
- Escalate high-risk quotations through configurable approval chains.
- Provide customers with a simple quotation review experience.
- Track quotation health throughout its lifecycle.
- Support partial deliveries and backorder management.
- Generate invoices based on delivered quantities.

---

## Platform Concepts

The platform operates at two levels:

### Platform Level

Users exist independently of companies.

Any registered user can:

- Log in.
- View quotations sent to them.
- Create companies.
- Join companies.
- Access companies where they have an assigned role.

By default every registered account receives:

Role: User

A registered user may act as both:

- Customer receiving quotations.
- Company member operating within one or more companies.

The same account can simultaneously be a customer for one company and an employee or collaborator in another company.

---

### Company Level

Users may belong to one or more companies.

Each company operates independently.

A user may have different roles in different companies.

Example:

User A:

- Company X -> Admin
- Company Y -> Sales Representative

Permissions must always be evaluated within the currently selected company context.

---

## Company Creation

When a user creates a company:

- The company is created.
- The creator becomes Company Admin.
- Initial company setup begins.

Company Admin is responsible for:

- Product management
- Team management
- Workflow configuration
- Business rule configuration

---

## Roles

### User

Platform-level role.

Capabilities:

- View quotations received as a customer.
- Create companies.
- Join companies.

---

### Company Admin

Responsibilities:

- Manage company configuration.
- Add and update products.
- Configure approval rules.
- Manage collaborators.
- Access all company data.

---

### Sales Representative

Responsibilities:

- Create quotations.
- Manage customer discussions.
- Request approvals.
- Track quotation progress.

---

### Sales Manager

Responsibilities:

- Review quotations requiring managerial approval.
- Approve or reject escalated quotations.
- Escalate high-risk quotations to finance when necessary.
- Participate in quotation discussions.

---

### Finance Manager

Responsibilities:

- Review financially sensitive quotations.
- Review fulfillment feasibility.
- Approve fulfillment.
- Generate invoices.
- Manage delivery and backorder status.

---

## Product Management

Products are maintained by Company Admins.

A product may contain:

- Name
- Description
- Price
- Maximum Allowed Discount
- Minimum Quantity
- Inventory Information
- Approval Constraints
- Risk Constraints

Additional product attributes may be added later.

---

## Quotation Lifecycle

### Step 1 - Creation

Sales Representative creates quotation.

Quotations can only be created for registered DealFlow360 users.

The intended customer must already have an account on the platform.

Sales Representatives cannot create quotations for arbitrary email addresses or external recipients.

Quotation contains:

- Customer User
- Products
- Quantities
- Pricing
- Discounts
- Notes

---

### Step 2 - Automated Evaluation

System evaluates quotation using:

- Product rules
- Discount thresholds
- Quantity constraints
- Risk constraints
- Future business rules

Possible outcomes:

#### Auto Approved

Quotation proceeds directly to customer.

#### Manager Approval Required

Quotation is routed to Sales Manager.

#### High Risk Escalation

Quotation is routed to Finance Manager.

---

### Step 3 - Internal Review

Reviewers may:

- Approve
- Reject
- Escalate
- Add comments

Comments form part of quotation history.

Commenting may be performed by:

- Sales Representative
- Sales Manager
- Finance Manager

---

### Step 4 - Customer Review

Once approved internally, the quotation becomes available to the target customer inside DealFlow360.

The customer is a registered platform user.

The customer may be notified through email and/or in-app notifications.

The customer accesses the quotation through their authenticated DealFlow360 account.

Customer may:

- Approve
- Negotiate
- Reject

---

### Step 5 - Negotiation

If customer negotiates:

- Quotation returns to internal workflow.
- New comments may be added.
- Revised quotation may be generated.
- Approval chain may execute again.

---

### Step 6 - Customer Approval

If customer approves:

Quotation proceeds to fulfillment review.

---

### Step 7 - Fulfillment Review

Finance Manager reviews:

- Inventory availability
- Delivery feasibility
- Operational constraints

Possible outcomes:

- Fulfillment Approved
- Fulfillment Delayed
- Fulfillment Rejected

---

### Step 8 - Delivery

Deliveries may occur partially.

Example:

Ordered Quantity: 100

Delivered:

- Batch 1 -> 60
- Batch 2 -> 40

The system must support multiple deliveries for a single quotation.

---

### Step 9 - Invoicing

Invoices are generated based only on delivered quantities.

Example:

Delivered: 60

Invoice Generated:

- 60 units

Remaining:

- 40 units

Second invoice generated when remaining quantity is delivered.

---

### Step 10 - Backorders

Undelivered quantities become Backorders.

Backorders should:

- Remain linked to original quotation.
- Be visible separately.
- Be grouped and tracked until fulfilled.

---

## Customer Model

Customers are registered DealFlow360 users.

A quotation must always reference an existing user account.

Benefits:

- No anonymous quotation access.
- Complete negotiation history.
- Centralized customer activity tracking.
- Consistent authorization and auditing.
- Better deal health analytics.

Future enhancements may include:

- Customer organizations
- Multiple customer contacts
- Customer teams
- Customer-side collaboration

## Deal Health Monitoring

The platform should continuously evaluate quotation and deal health.

Examples:

- No activity for 9 days.
- Approval pending too long.
- Customer has not responded.
- Backorder unresolved.
- Fulfillment delayed.

Health indicators should identify deals requiring attention.

---

## Anomaly Detection

The platform should surface unusual situations.

Examples:

- Excessive discount requests.
- Repeated negotiations.
- Long approval chains.
- Stalled quotations.
- Unusual order quantities.
- Repeated fulfillment failures.

Specific anomaly rules will be defined later.

---

## High-Level Modules

Platform Module

- Authentication
- User Management
- Company Management

Company Module

- Role Management
- Product Management
- Collaborator Management

Quotation Module

- Creation
- Evaluation
- Approval
- Negotiation
- Commenting

Fulfillment Module

- Delivery Tracking
- Backorder Tracking

Finance Module

- Invoice Generation
- Financial Approval

Insights Module

- Deal Health
- Anomaly Detection
- Reporting

---

## Important Development Rule

When implementing any feature:

1. Understand the business workflow first.
2. Preserve the quotation lifecycle.
3. Preserve role boundaries.
4. Preserve company isolation.
5. Do not bypass approval workflows.
6. Do not introduce logic that conflicts with documented lifecycle states.
7. Update this document whenever business rules change.

This document is the source of truth for business behavior across frontend and backend services.
