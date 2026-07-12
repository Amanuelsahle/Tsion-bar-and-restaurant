# Hotel Management System (HMS)

## Overview

The Hotel Management System (HMS) is a modern, scalable ERP-style web application designed to manage the daily operations of a hotel.

The application follows a modular architecture where each business module is developed independently, allowing future features to be added without major refactoring.

**Phase 1** focuses on **Store Management** and **Bar Inventory Management**.

---

# Technology Stack

## Frontend

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Query
- TanStack Table

## Backend

- Next.js Route Handlers
- Server Actions (where appropriate)

## Authentication & Authorization

- Supabase Authentication
- JWT Access Tokens
- JWT Verification in protected API routes
- Role-Based Access Control (RBAC)
- Supabase Row Level Security (RLS)

## Database

- Supabase PostgreSQL
- Prisma ORM
- Prisma Migrations

## Storage (Future)

- Supabase Storage

---

# Security Architecture

Authentication and authorization must be implemented using Supabase.

## Authentication

Users authenticate using Supabase Auth.

Supported methods:

- Email & Password
- Password Reset
- Email Verification

After login:

- Supabase issues a JWT access token.
- Protected routes verify the JWT.
- API endpoints only accept authenticated requests.
- User sessions are securely managed.

---

## Authorization

The application uses Role-Based Access Control (RBAC).

Available roles:

- Manager
- Bar Manager

Roles are stored in the application's database and enforced in both the application layer and database layer.

Permissions are verified before executing any sensitive action.

---

## Row Level Security (RLS)

Enable Row Level Security on all business tables.

Examples:

### Managers

Managers can:

- View all products
- Create products
- Edit products
- Add stock
- Create distributions
- View reports
- View inventory history

### Bar Managers

Bar Managers can:

- View distributions assigned to them
- View distribution details
- Print receipts

Bar Managers cannot:

- Edit inventory
- Add stock
- Delete records
- View other Bar Managers' distributions

All access must be enforced through RLS policies and verified JWT claims.

---

# User Roles

## Manager

Full system access.

Responsibilities:

- Product Management
- Inventory Management
- Daily Distribution
- Reports
- User Management
- Stock Monitoring

---

## Bar Manager

Limited permissions.

Responsibilities:

- View assigned distributions
- Print distribution receipts
- View history

---

# Phase 1 Modules

## Dashboard

Display:

- Total Products
- Beer Types
- Soft Drink Types
- Water Types
- Current Inventory
- Today's Distributions
- Low Stock Alerts
- Recent Activity

Quick Actions:

- Add Product
- Add Stock
- Create Distribution
- View Reports

---

# Product Management

Managers define beverage types.

Each product contains:

- Category
- Product Name
- Quantity Per Box
- Unit Price
- Current Boxes
- Minimum Stock

Example:

| Field            | Value           |
| ---------------- | --------------- |
| Category         | Beer            |
| Name             | St. George Beer |
| Quantity Per Box | 24              |
| Unit Price       | 90 Birr         |
| Current Boxes    | 150             |

Categories:

- Beer
- Soft Drink
- Water

The design should support adding more categories in future releases.

---

# Store Management

Products are stored **by boxes only**.

The system never stores individual bottles as inventory.

Example:

Current Boxes:

150

New Delivery:

20

Updated Inventory:

170 Boxes

Every stock addition creates an immutable inventory movement record.

---

# Daily Bar Distribution

Every day the manager distributes inventory to a Bar Manager.

Example:

**Date**

01/01/2026

**Bar Manager**

Abebe

| Product         | Boxes | Qty/Box | Unit Price | Total |
| --------------- | ----: | ------: | ---------: | ----: |
| St. George Beer |     3 |      24 |         90 |  6480 |
| Dashen Beer     |     4 |      24 |         90 |  8640 |
| Coca-Cola       |     2 |      24 |         60 |  2880 |
| Pepsi           |     1 |      24 |         55 |  1320 |

Grand Total:

19,320 Birr

---

# Distribution Formula

Each row is calculated automatically.

```
Line Total = Boxes × Quantity Per Box × Unit Price
```

Example:

```
3 × 24 × 90 = 6480
```

Grand Total is the sum of all line totals.

---

# Inventory Rules

Managers only record the number of boxes.

Each product stores:

- Quantity Per Box
- Unit Price

When a distribution is saved:

1. Validate inventory availability.
2. Prevent negative inventory.
3. Decrease the number of boxes.
4. Create inventory movement records.
5. Save the distribution.
6. Save each distribution item.
7. Generate a printable receipt.

All operations should execute inside a single database transaction.

---

# Distribution History

Managers can search historical distributions.

Search by:

- Date
- Product
- Bar Manager

Each record displays:

- Date
- Manager
- Bar Manager
- Total Boxes
- Grand Total
- Status

Selecting a record opens the complete distribution details.

---

# Distribution Details

Display:

- Date
- Manager
- Bar Manager

Items:

- Product
- Boxes
- Quantity Per Box
- Unit Price
- Line Total

Show Grand Total.

Actions:

- Print Receipt
- Export PDF

---

# Inventory

Display:

- Product
- Category
- Current Boxes
- Total Units
- Unit Price
- Status

Status values:

- In Stock
- Low Stock
- Out of Stock

Low stock should be highlighted automatically.

---

# Reports

Generate:

- Daily Reports
- Weekly Reports
- Monthly Reports

Include:

- Inventory Added
- Inventory Distributed
- Remaining Inventory
- Distribution Value
- Most Distributed Products
- Low Stock Products

---

# Database Schema

## users

- id
- authUserId
- fullName
- email
- role
- createdAt
- updatedAt

---

## products

- id
- category
- name
- quantityPerBox
- unitPrice
- currentBoxes
- minimumStock
- isArchived
- createdAt
- updatedAt

---

## stock_entries

Stores inventory additions.

Fields:

- id
- productId
- boxesAdded
- createdBy
- createdAt

---

## bar_distributions

Stores one distribution per transaction.

Fields:

- id
- date
- managerId
- barManagerId
- grandTotal
- createdAt

---

## bar_distribution_items

Stores each product included in a distribution.

Fields:

- id
- distributionId
- productId
- boxesGiven
- quantityPerBox
- unitPrice
- lineTotal

---

## inventory_movements

Tracks every inventory change.

Fields:

- id
- productId
- movementType
- boxesChanged
- previousBoxes
- newBoxes
- referenceId
- createdBy
- createdAt

Movement Types:

- STOCK_IN
- DISTRIBUTION
- ADJUSTMENT

Every inventory modification must create an inventory movement record.

---

# API Requirements

- Validate JWTs on every protected API route.
- Never trust client-supplied roles.
- Retrieve the authenticated user from the verified JWT.
- Enforce authorization in both the API layer and database layer (RLS).
- Return consistent JSON responses.
- Validate all requests using Zod.
- Use Prisma transactions for inventory and distribution operations.

---

# UI Requirements

Create a modern ERP-style interface.

Include:

- Responsive Sidebar
- Sticky Header
- Dashboard Cards
- Data Tables
- Search
- Filters
- Pagination
- Dialogs
- Drawers
- Toast Notifications
- Skeleton Loading
- Empty States
- Dark Mode
- Fully Responsive Layout

The application should be optimized for desktop while remaining usable on tablets and mobile devices.

---

# Future Roadmap

The architecture should support future modules without major redesign.

Planned modules include:

- Hotel Room Management
- Reservations
- Guest Check-In / Check-Out
- Restaurant Management
- Kitchen Inventory
- Purchasing
- Suppliers
- Employee Management
- Payroll
- Accounting
- Point of Sale (POS)
- Barcode & QR Code Scanning
- Multi-Branch Support
- Sales Analytics
- Customer Loyalty Program
- Mobile Application
- Offline Synchronization

The codebase should follow clean architecture, SOLID principles, and a feature-based structure to ensure long-term scalability, maintainability, and ease of development.
