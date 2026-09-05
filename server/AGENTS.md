# AGENTS.md

## Purpose

This file defines the engineering rules for the DealFlow360 server. Every agent or developer working on the server must follow these rules.

## Project Scope

This repository contains the server side of DealFlow360. The server is responsible for business logic, authentication and authorization, sales workflows, quotations, products, inventory related state, delivery and backorder state, invoicing state, discounts and deal rules, audit history, and APIs consumed by the client.

Keep the server independent from client presentation concerns.

## Source of Truth

1. `architecture.md` is the source of truth for backend architecture and workflow.
2. When an implementation changes the architecture, update `architecture.md` in the same change.
3. If a requested change conflicts with `architecture.md`, inspect the current implementation and resolve the architecture decision before coding.
4. Do not silently introduce a new service, module, database, queue, event, or external dependency without documenting it in `architecture.md`.
5. Keep architecture documentation aligned with the actual code. Never document an intended design as if it were already implemented.

## General Engineering Rules

1. Prefer simple, explicit, maintainable code.
2. Follow the existing project structure and conventions before introducing new patterns.
3. Keep business rules in the server domain layer rather than duplicating them across API handlers.
4. Validate input at API boundaries and enforce business invariants in the domain or service layer.
5. Use transactions for operations that must update multiple related records atomically.
6. Never trust client supplied authorization, price, discount, stock, invoice, delivery, or order state.
7. Enforce authorization on the server for every protected operation.
8. Do not expose internal database details unless the API contract requires them.
9. Use consistent error handling and response formats.
10. Keep functions and modules focused on one responsibility.
11. Avoid premature abstractions.
12. Do not add dependencies when the existing stack can solve the problem cleanly.
13. Preserve backward compatibility for existing API contracts unless a deliberate breaking change is documented.
14. Add or update tests whenever business behavior changes.

## Architecture and Layering

1. Organize the codebase using a modular structure with clear domain boundaries.
2. Use classes for all components in `services/`, `controllers/`, and `repositories/`.
3. Repositories handle database operations, queries, and data mapping using Prisma.
4. Services encapsulate business workflows, commercial rules, state transitions, and transactions.
5. Controllers handle HTTP requests, invoke services, and return standard API responses without implementing business logic.
6. Maintain clean separation between transport (controllers), business logic (services), and persistence (repositories).
7. Explicitly use `public` or `private` access modifiers for all class properties, constructors, and methods.

## DealFlow360 Business Rules

1. A customer requirement is the starting point of the sales flow.
2. Products are selected based on the customer requirement.
3. A quotation is created from the selected products and applicable commercial rules.
4. Upsell and cross sell recommendations belong during product selection and quotation preparation. They are recommendations and must not silently modify the customer order.
5. The customer must explicitly accept the final commercial offer before it becomes a confirmed sales order.
6. Prices and discounts must be calculated by server side rules. The client may display calculated values but must not be the authority for them.
7. An order may result in one or more deliveries when stock is fulfilled partially.
8. Remaining quantities can stay in backorder according to the configured fulfillment policy.
9. A delivery must not be treated as shipped merely because an order exists.
10. Billing must follow the configured invoicing policy. For shipped quantity based invoicing, quantities should become billable only after the corresponding shipment condition is satisfied.
11. Partial deliveries and partial invoices must remain traceable to the same customer order and its relevant order lines.
12. Payment, invoice, delivery, and order states must not be conflated. They are related state machines with explicit transitions.
13. Every state transition that affects business records should be auditable.

## API Rules

1. Keep controllers or route handlers thin.
2. Parse and validate request data at the API boundary.
3. Call application services for business operations.
4. Return stable API models instead of leaking ORM models directly.
5. Use appropriate HTTP status codes consistently.
6. Do not return stack traces, SQL errors, secrets, tokens, or internal implementation details.
7. Protect endpoints with authentication and role or permission checks where required.
8. Use idempotency for operations where duplicate requests could create duplicate business records, when the architecture defines it.

## Database Rules

1. Treat migrations as permanent history. Do not edit an already applied migration to change production history.
2. Add indexes based on real query paths and constraints.
3. Use foreign keys and database constraints for invariants that belong at the persistence layer.
4. Store monetary values using a precise decimal representation, never floating point.
5. Store timestamps consistently and document timezone assumptions.
6. Avoid hard deletes for records that are required for audit or financial traceability.
7. Use explicit status fields and transition rules instead of ambiguous boolean combinations when an entity has multiple lifecycle states.

## Security Rules

1. Never commit secrets, credentials, private keys, tokens, or production configuration.
2. Never log passwords, authentication tokens, payment secrets, or other sensitive credentials.
3. Apply least privilege to roles and service access.
4. Validate object ownership and tenant or company scope on the server.
5. Treat all external input as untrusted.
6. Use parameterized database queries or the ORM safely. Never construct SQL from untrusted input.
7. Do not bypass authorization for development convenience.
8. Do not add hidden administrative endpoints.

## Comments and Documentation

1. Do not write AI comments.
2. Do not add comments that describe the assistant, AI generation, prompts, reasoning, or that the code was generated.
3. Comments must explain a non-obvious business rule, constraint, tradeoff, or safety requirement.
4. Prefer clear code over comments.
5. Never use non-keyboard characters in comments or text documentation.
6. Use plain ASCII characters only in comments, Markdown documentation, commit-style messages, and other repository text documentation.
7. Avoid Unicode punctuation, emojis, smart quotes, em dashes, arrows, bullets, mathematical symbols, and decorative characters in repository comments or documentation.
8. Markdown headings may use normal ASCII Markdown syntax such as `#`, `##`, and `-`.
9. Do not copy Unicode characters from chat responses into repository files.
10. Keep comments short and factual.

## Logging and Errors

1. Log enough information to diagnose failures without exposing secrets or sensitive data.
2. Use structured logs if the existing stack supports them.
3. Include correlation or request identifiers where the architecture supports them.
4. Do not use logs as a replacement for audit records.
5. Errors returned to clients should be actionable but should not expose internals.

## Testing

1. Test business rules, not implementation details.
2. Cover happy paths, validation failures, authorization failures, state transition failures, and important edge cases.
3. Add regression tests for every fixed bug that can reasonably be reproduced.
4. Test partial delivery, backorder, partial invoicing, discount calculation, upsell and cross sell behavior where applicable.
5. Keep tests deterministic and isolated.
6. Do not weaken tests just to make an implementation pass.

## Changes and Refactoring

Before changing behavior:

1. Read the relevant architecture section.
2. Find the current implementation and its tests.
3. Identify affected API, database, domain, and integration boundaries.
4. Implement the smallest coherent change.
5. Update tests.
6. Update `architecture.md` if the architecture or workflow changed.
7. Review for security, transactionality, authorization, and data consistency.

Do not perform broad unrelated refactors while implementing a feature.

## Completion Checklist

Before considering a server task complete:

- The requested behavior works.
- Existing behavior remains intact unless intentionally changed.
- Input validation is present.
- Authorization is enforced.
- Business rules are server side.
- Database changes have migrations when required.
- Relevant tests are added or updated.
- No secrets or sensitive logs were introduced.
- No AI comments were introduced.
- Comments and text documentation use ASCII characters only.
- `architecture.md` is updated if architecture or workflow changed.
- The implementation matches the documented architecture.
