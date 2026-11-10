# WellVision — Optical Shop Management System

A full-stack management system for an optical shop. It covers the whole retail
cycle: customer records and prescriptions, product catalogue and stock, order
tracking, billing and payments, sales analytics, staff performance and
role-based access control.

The project is split into two independent applications:

| Application | Stack | Default URL |
| --- | --- | --- |
| `wellvision-backend` | Node.js, Express 5, MongoDB (Mongoose) | `http://localhost:4000` |
| `wellvision-frontend` | React 18 (Create React App), MUI, Redux Toolkit, Nivo | `http://localhost:3000` |

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Repository structure](#repository-structure)
5. [Prerequisites](#prerequisites)
6. [Installation](#installation)
7. [Environment variables](#environment-variables)
8. [Running the project](#running-the-project)
9. [Authentication and roles](#authentication-and-roles)
10. [Business rules](#business-rules)
11. [API reference](#api-reference)
12. [Data models](#data-models)
13. [Frontend routes](#frontend-routes)
14. [Seeding and sample data](#seeding-and-sample-data)
15. [Testing](#testing)
16. [Troubleshooting](#troubleshooting)
17. [Security notes](#security-notes)
18. [Known limitations](#known-limitations)

---

## Features

### Admin portal (`/admin/*`)

- **Dashboard** — sales totals, today/month/year figures, Actual Revenue,
  category breakdown pie chart, sales overview chart and recent transactions.
  All figures come from the database.
- **Products** — catalogue cards with stock, price, category and (admin only)
  cost, stock value and profit margin. Add products, edit products and delete
  products.
- **Customers** — searchable customer directory with profile pages.
- **Transactions** — real transactions showing Staff ID, customer name, order
  date/time, total and amount paid. Clicking a row opens the full transaction
  detail.
- **Geography / Sales Overview / Daily / Monthly / Breakdown** — sales analysis
  views backed by real invoice + order + product data.
- **Performance** — per-staff sales performance. Admin accounts are excluded,
  because admins review sales rather than make them.
- **Staff** — staff directory backed by real user accounts, with roles, status,
  department and hire date.
- **Configuration** — grant or revoke page-level access for a staff member.
- **Admin Management** — list and create additional admin accounts.
- **Prescriptions** — upload, view, download and delete customer prescription
  files from the customer profile.

### Staff portal (`/dashboard`, `/products`, ...)

- Sales dashboard, customer directory, order flow, invoice/bill creation,
  daily reports, product catalogue, profile and settings.
- Products can be added and viewed, but **product cost is never sent to a staff
  session** (the backend strips it from responses).
- Staff cannot edit products: the general product update endpoint is
  admin-only.

### Shared / business functionality

- Order creation automatically reduces the stock of every ordered product.
- Bills are generated with unique, sequential bill numbers.
- Sales figures count **money actually collected** (invoice `advance`), not the
  full billed amount.
- **Actual Revenue** = collected money minus the cost of the products that the
  payment covers.
- Changing a product's selling price re-prices all existing orders and bills
  that contain that product, so revenue stays consistent with the catalogue.
- JWT authentication in an httpOnly cookie, tracked sessions, login history and
  temporary account lockout after repeated failed logins.
- Email OTP verification and password reset through Brevo SMTP; optional SMS via
  Twilio, AWS SNS, txtmsg.lk or TextBee.
- Invoice printing and PDF export in the frontend.

---

## Tech stack

### Backend

| Concern | Package |
| --- | --- |
| HTTP server | `express` 5 |
| Database | `mongoose` 8 / MongoDB |
| Authentication | `jsonwebtoken`, `bcryptjs`, `cookie-parser` |
| Validation | `express-validator` |
| Email | `nodemailer` (Brevo SMTP relay) |
| SMS | `twilio` (with optional AWS SNS / txtmsg.lk providers) |
| File uploads | `multer` (prescription files) |
| Config | `dotenv` |
| Dev reload | `nodemon` |

### Frontend

| Concern | Package |
| --- | --- |
| Framework | `react` 18, `react-dom` 18 |
| Build tooling | `react-scripts` (Create React App 5) |
| Routing | `react-router-dom` 7 |
| State / data fetching | `@reduxjs/toolkit`, `react-redux`, RTK Query |
| UI | `@mui/material`, `@mui/icons-material`, `@mui/x-data-grid` |
| Charts | `@nivo/pie`, `@nivo/bar`, `@nivo/line`, `@nivo/geo` |
| HTTP | `axios` (plus RTK Query `fetchBaseQuery`) |
| PDF / export | `jspdf`, `jspdf-autotable`, `html2canvas`, `xlsx` |
| Forms / UI extras | `react-datepicker`, `react-toastify`, `lucide-react` |

---

## Architecture

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  React SPA (port 3000)       │        │  Express API (port 4000)     │
│                              │        │                              │
│  App.js / DashboardRoutes    │  HTTP  │  index.js                    │
│   ├─ Auth pages              │ <────> │   ├─ /api/auth               │
│   ├─ Staff portal            │ cookie │   ├─ /api/user               │
│   └─ Admin portal            │ (JWT)  │   ├─ /api/admin              │
│                              │        │   ├─ /api/products           │
│  AuthContext (localStorage)  │        │   ├─ /api/orders             │
│  Redux + RTK Query           │        │   ├─ /api/invoices           │
│                              │        │   ├─ /api/customers          │
└──────────────────────────────┘        │   ├─ /api/settings           │
                                        │   ├─ /api/prescriptions      │
                                        │   ├─ /api/notifications      │
                                        │   └─ /api/forex              │
                                        │                              │
                                        │  MongoDB (Mongoose models)   │
                                        └──────────────────────────────┘
```

- The frontend never talks to MongoDB directly. Every screen goes through the
  REST API.
- Admin screens use RTK Query with a base URL of
  `REACT_APP_BASE_URL` (default `http://localhost:4000/api/admin`) and
  `credentials: "include"`, so the httpOnly auth cookie is sent automatically.
- Staff screens use the `/api/*` endpoints directly (via `axios` / `fetch`) with
  the same cookie.
- On startup the backend syncs the staff directory with real user accounts and
  backfills `createdBy` on old invoices for the performance report.

---

## Repository structure

```
OpticalShop/
├── package.json                  # Minimal root package (react-scripts only)
├── .gitignore                    # Ignores .env, node_modules, build, etc.
├── README.md                     # This file
│
├── wellvision-backend/
│   ├── index.js                  # Express app, CORS, route mounts, Mongo start
│   ├── package.json              # Backend scripts and dependencies
│   ├── .env.example              # Environment template (copy to .env)
│   ├── seedProducts.js           # Idempotent sample product seeder
│   ├── scripts/
│   │   └── seedOrders.js         # Sample order seeder
│   ├── config/
│   │   ├── accessModules.js      # Pages that can be granted to staff
│   │   ├── config.js             # Env config + cookie options
│   │   └── nodemailer.js         # Brevo SMTP transporter
│   ├── controllers/              # Request handlers
│   ├── middleware/               # userAuth, adminOnly, validation, errors
│   ├── models/                   # Mongoose schemas
│   ├── routes/                   # Express routers
│   ├── utils/                    # Billing, performance, pricing, SMS, tokens
│   ├── validators/               # express-validator rule sets
│   ├── uploads/                  # Uploaded prescription files (served statically)
│   └── test-reports/             # Manual API test cases and recommendations
│
└── wellvision-frontend/
    ├── package.json              # CRA scripts and dependencies
    ├── public/
    └── src/
        ├── App.js                # Public routes + dashboard mount
        ├── DashboardRoutes.js    # Role-based split: admin vs staff
        ├── context/AuthContext.js
        ├── components/           # Staff portal screens
        ├── admin/
        │   ├── components/       # Sidebar, header, charts, stat boxes
        │   ├── scenes/           # Admin screens (dashboard, products, ...)
        │   ├── state/            # Redux store + RTK Query API slice
        │   └── theme.js
        └── index.js              # Providers: Redux, Auth, ErrorBoundary
```

---

## Prerequisites

- **Node.js 18+** (Node 20+ recommended; the backend uses ES modules and
  modern syntax).
- **npm 9+**.
- **MongoDB** — either a local server (`mongodb://127.0.0.1:27017`) or a MongoDB
  Atlas connection string.
- Optional: an SMTP account (Brevo) for verification/reset emails and an SMS
  provider for SMS notifications.

---

## Installation

The backend and frontend are separate npm projects. Install each one.

### 1. Clone the repository

```bash
git clone <repository-url>
cd OpticalShop
```

### 2. Backend

```bash
cd wellvision-backend
npm install
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux
```

Edit `.env` and set at least `MONGODB_URI` and a long random `JWT_SECRET`.
See [Environment variables](#environment-variables).

### 3. Frontend

```bash
cd ../wellvision-frontend
npm install
```

If the API is not running on `http://localhost:4000`, create a `.env` in
`wellvision-frontend` with:

```
REACT_APP_BASE_URL=http://localhost:4000/api/admin
```

---

## Environment variables

Backend variables (`.env` in `wellvision-backend/`):

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | `4000` | HTTP port |
| `NODE_ENV` | No | `development` | Enables `secure`/`SameSite=None` cookies in production |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string, including database name, e.g. `mongodb://127.0.0.1:27017/wellvision` |
| `JWT_SECRET` | **Yes** | — | Signing secret for auth tokens. Use a long random string |
| `SMTP_USER` | For email | — | Brevo SMTP login |
| `SMTP_PASS` | For email | — | Brevo SMTP password/key |
| `SENDER_EMAIL` | For email | — | From address used in outgoing mail |
| `TWILIO_ACCOUNT_SID` | For SMS | — | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | For SMS | — | Twilio auth token |
| `TWILIO_FROM_NUMBER` | For SMS | — | Sender number, unless a messaging service SID is used |
| `TWILIO_MESSAGING_SERVICE_SID` | No | — | Preferred Twilio messaging service |
| `SMS_PROVIDER` | No | `twilio` | `twilio`, `aws`, `textbee`, or `txtmsg` / `txtmsg.lk` |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | For AWS SMS | — | AWS SNS credentials |
| `TXTMSG_API_KEY`, `TXTMSG_SENDER_ID` | For txtmsg.lk | — | txtmsg.lk credentials |

Frontend variables (`wellvision-frontend/.env`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `REACT_APP_BASE_URL` | `http://localhost:4000/api/admin` | Base URL used by the admin RTK Query slice |

> **Never commit `.env`.** It is already excluded by `.gitignore`. Only
> `.env.example` is committed.

---

## Running the project

Start the backend first, then the frontend. Use two terminals.

### Backend (development, auto-reload)

```bash
cd wellvision-backend
npm run dev
```

Expected output:

```
✅ MongoDB Connected
🚀 Server running on port 4000
```

For a production-style start (no nodemon):

```bash
node index.js
```

> `package.json` still lists `"main": "server.js"`, but the real entry point is
> `index.js`. Use `npm run dev` or `node index.js`.

### Frontend (development)

```bash
cd wellvision-frontend
npm start
```

Open `http://localhost:3000`. The app redirects to `/login` until a session
exists.

### Production build

```bash
cd wellvision-frontend
npm run build
```

The static bundle is written to `wellvision-frontend/build/`. Serve it with any
static host and point `REACT_APP_BASE_URL` at the deployed API.

### CORS

The backend allows only these origins (with credentials):

- `http://localhost:3000`
- `http://localhost:5173`

If you run the frontend on another origin, add it to `allowedOrigins` in
`wellvision-backend/index.js`.

---

## Authentication and roles

### Login flow

1. `POST /api/auth/login` validates the email/password.
2. On success the server signs a JWT (`{ id, jti }`, 7-day expiry), stores the
   `jti` in `activeSessions`, and sets it as an **httpOnly** cookie named
   `token`.
3. The frontend stores non-sensitive user info (name, email, role) in
   `localStorage` via `AuthContext` for routing decisions.
4. `DashboardRoutes.js` renders the admin portal when `role === "Admin"`
   (case-insensitive), otherwise the staff portal.
5. `POST /api/auth/logout` clears the cookie.

### Account protection

- After **5 failed password attempts**, the account is locked for **15 minutes**
  (`423 Locked`).
- Failed and successful logins are written to `loginHistory` with IP and
  user-agent.
- Email verification uses OTPs; password reset uses email OTP + new password.
- `admin@example.com` is always treated as `Admin`, regardless of stored role.

### Roles

| Role | Scope |
| --- | --- |
| `Admin` | Full admin portal, all `/api/admin` endpoints, product cost, staff/access management |
| `Manager` | Staff portal; by default all access modules except Admin Management and Configuration |
| `Supervisor` | Staff portal; dashboard, products, customers, transactions, overview, daily, monthly, breakdown, performance |
| `Employee` | Staff portal; dashboard, products, customers, daily, monthly |
| `User` | Default `userModel` role; treated as staff-side (non-admin) |

Staff page access is controlled by keys defined in
`wellvision-backend/config/accessModules.js`:

`dashboard`, `products`, `customers`, `transactions`, `geography`, `overview`,
`daily`, `monthly`, `breakdown`, `admin`, `staff`, `performance`,
`configuration`.

Admins can change a staff member's access from **Configuration**.

### Authorization middleware

- `userAuth` — verifies the JWT cookie and loads `req.user`.
- `adminOnly` — rejects non-admin roles, used on all management endpoints and on
  the general product update route.

---

## Business rules

### Orders and stock

- Creating an order decrements `product.stock` by the ordered quantity and
  increments `product.totalSold`.
- Order statuses: `Order Received`, `Order Placed in Lab`, `In Lab Processing`,
  `Transit to Shop`, `Ready for Customer`, `Customer Collected`.
- Marking an order `Customer Collected` sets `collected = true` and
  `amountGiven = total`.
- Order numbers are generated from a counter using the shop's configured prefix
  (preview endpoints do **not** increment the counter).

### Billing and payments

- A bill (`Invoice`) stores `amount` (billed total), `advance` (money actually
  paid) and `balance` (`amount - advance`).
- Bill numbers are unique and sequential, e.g. `INV-0001`, using the prefix from
  settings and a shared `Counter` document.
- `status` is `pending` or `collected`.
- Order-generated bills are linked by `orderNo`; manually created bills may have
  no order link.
- **Sales count `advance`, not `amount`.** An unpaid balance is a receivable
  until the customer pays.

### Sales and Actual Revenue

For each invoice:

```
paidAmount   = invoice.advance
billedAmount = invoice.amount
paidRatio    = billedAmount > 0 ? clamp(paidAmount / billedAmount, 0, 1) : ...
invoiceCost  = Σ(line.quantity × current product.cost)
actualRevenue = paidAmount − invoiceCost × paidRatio
```

- A **fully paid** bill subtracts the full product cost.
- A **part-paid** bill subtracts only the paid-for share of the cost.
- Negative Actual Revenue is shown in red with a hover explanation.
- The dashboard replaces the old "Total Customers" card with **Actual Revenue**.

**Worked example**

| Case | Billed | Paid | Product cost | Cost recognised | Actual Revenue |
| --- | --- | --- | --- | --- | --- |
| Fully paid | 12,000 | 12,000 | 10,000 | 10,000 | **2,000** |
| Part-paid (5,000 of 8,000) | 8,000 | 5,000 | 5,000 | 3,125 | **1,875** |
| Unpaid | 8,000 | 0 | 5,000 | 0 | **0** |

### Category breakdown

- Each invoice becomes one or more product lines:
  - Order-linked bills use the real order items, product IDs, categories and
    quantities.
  - Manual bills are matched back to the catalogue by item name or SKU; each
    line counts as 1 unit.
- The paid amount is allocated across lines **proportionally to line amount**,
  using real product categories.
- Units are counted for every billed line, including free/unpaid lines, so the
  "products sold" number reflects everything that left the shop.
- Clicking a pie slice opens a dialog listing the products sold with numeric
  quantities.

### Cost visibility and product editing

| Action | Admin | Staff |
| --- | --- | --- |
| View products | Yes | Yes |
| View remaining stock | Yes | Yes |
| View `cost`, stock value, profit margin | Yes | **Never** (stripped by API) |
| Add product | Yes | Yes (cost defaults to `0`) |
| Edit product | Yes | **No** (`PUT /api/products/:id` is admin-only) |
| Delete product | Yes | Yes (soft delete) |

- Staff product responses strip `cost`, `stockValue` and `profitMargin` in
  `productController.toStaffProduct`.
- The admin endpoint `GET /api/admin/client/products` returns `cost`.
- Staff-created products get `cost: 0`; an admin fills it in later in the Edit
  dialog.

### Price propagation

When an admin changes a product's `price`:

1. Every order containing that product gets its line `unitPrice` updated.
2. Each order's `total` is recalculated.
3. The linked bill (matched by `orderNo`) gets new line amounts and a new
   `amount`.
4. If the bill was fully paid/collected, `advance` is raised to the new total
   and `balance` becomes `0`.
5. If the bill was part-paid, the real cash received stays as `advance` and only
   `balance` is recalculated.
6. Actual Revenue and dashboard/sales/transactions views change on the next
   fetch because they are computed live from invoices, orders and current
   product cost.

Implementation: `wellvision-backend/utils/productPricing.js`, called from both
`updateAdminProduct` and `updateProduct`.

### Performance attribution

- `invoice.createdBy` identifies the staff account that made the sale.
- The Performance page only includes non-admin users.
- Sales count `advance` (collected money).
- On startup, old invoices without `createdBy` are attributed to the earliest
  non-admin staff account (`backfillInvoiceCreators`).

### Transactions

The transactions endpoint combines invoice and order data:

- Staff ID / staff name
- Customer name
- Order number and date/time
- Total and amount paid
- Clicking a row opens the full transaction detail

---

## API reference

All routes are prefixed with `/api`. Authentication is the `token` httpOnly
cookie unless noted.

### Auth — `/api/auth`

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/register` | Register a user |
| `POST` | `/login` | Log in and set the auth cookie |
| `POST` | `/logout` | Clear the auth cookie |
| `POST` | `/send-verify-otp` | Send an email verification OTP (auth required) |
| `POST` | `/verify-account` | Verify email with OTP (auth required) |
| `POST` | `/is-auth` | Check whether the current session is valid (auth required) |
| `POST` | `/send-reset-otp` | Send a password-reset OTP |
| `POST` | `/reset-password` | Reset password using email + OTP + new password |

### User — `/api/user`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/profile` | Current user profile |
| `PUT` | `/profile` | Update profile |
| `GET` | `/settings` | User settings |
| `PUT` | `/settings` | Update user settings |
| `POST` | `/change-password` | Change password |
| `GET` | `/sessions` | List active sessions |
| `DELETE` | `/sessions/:jti` | Revoke one session |
| `DELETE` | `/sessions` | Revoke all other sessions |
| `GET` | `/login-history` | Login history |

### Admin — `/api/admin` (all admin-only except `general/me`)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/general/dashboard` | Dashboard totals, charts, recent transactions |
| `GET` | `/general/me` | Current admin profile |
| `PUT` | `/general/me` | Update current admin profile |
| `GET` | `/sales/sales` | Sales series and totals |
| `GET` | `/management/performance` | Per-staff performance |
| `GET` | `/management/admins` | List admin accounts |
| `POST` | `/management/admins` | Create an admin account |
| `GET` | `/client/customers` | Admin customer list |
| `GET` | `/client/products` | Product catalogue including `cost` |
| `POST` | `/client/products` | Create a product |
| `PUT` | `/client/products/:id` | Update a product (propagates price) |
| `GET` | `/client/transactions` | Transaction list with filters/paging |
| `GET` | `/staff` | Staff directory (search/page/sort) |
| `POST` | `/staff/lookup` | Look up a staff member's access |
| `POST` | `/staff` | Create a staff profile |
| `GET` | `/staff/:id` | Staff member detail |
| `PUT` | `/staff/:id/access` | Update access modules |
| `PUT` | `/staff/:id` | Update staff details |
| `DELETE` | `/staff/:id` | Delete staff |

### Products — `/api/products` (auth required)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | List with search/filter/pagination |
| `GET` | `/:id` | Product detail (cost stripped for staff) |
| `POST` | `/` | Create product (staff allowed; cost optional) |
| `PUT` | `/:id` | Update product — **admin only** |
| `PATCH` | `/:id/stock` | Update stock |
| `PUT` | `/bulk/stock` | Bulk stock update |
| `DELETE` | `/:id` | Soft-delete product |
| `GET` | `/stats` | Product statistics |
| `GET` | `/categories` | Category list |
| `GET` | `/analytics` | Product analytics |
| `GET` | `/alerts/low-stock` | Low-stock products |
| `GET` | `/alerts/out-of-stock` | Out-of-stock products |
| `GET` | `/export` | Export product data |

### Orders — `/api/orders` (auth required)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | All orders |
| `GET` | `/pending` | Pending orders |
| `GET` | `/customer/:customerId` | Orders for a customer |
| `GET` | `/preview-order-no` | Preview next order number (no increment) |
| `POST` | `/` | Create order (decrements stock) |
| `GET` | `/:id` | Order detail |
| `PATCH` | `/:id/status` | Update status |
| `PATCH` | `/:id/collect` | Mark collected / settle balance |
| `DELETE` | `/:id` | Delete order |

### Invoices — `/api/invoices`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/preview-bill-no` | Preview next bill number (auth) |
| `GET` | `/next-bill-no` | Allocate next bill number |
| `GET` | `/` | List invoices |
| `GET` | `/:id` | Invoice detail |
| `POST` | `/create` | Create invoice |
| `PUT` | `/:id` | Update invoice |
| `DELETE` | `/:id` | Delete invoice |

### Customers — `/api/customers`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | List with search + pagination |
| `GET` | `/recent` | Recently added customers |
| `GET` | `/:id` | Customer detail |
| `POST` | `/` | Create customer |
| `PUT` | `/:id` | Update customer |
| `DELETE` | `/:id` | Delete customer |

> Customer routes do not currently require authentication; the frontend still
> only exposes them behind a login.

### Prescriptions — `/api/prescriptions` (auth required)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/customer/:customerId` | List a customer's prescription files |
| `POST` | `/customer/:customerId` | Upload a prescription (multipart) |
| `GET` | `/:id/download` | Download a prescription |
| `DELETE` | `/:id` | Delete a prescription |

### Settings — `/api/settings` (auth required)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | All settings for the current user |
| `PUT` | `/` | Update all settings |
| `POST` | `/reset` | Reset to defaults |
| `GET` | `/:key` | Read one setting |
| `PUT` | `/:key` | Update one setting |

### Notifications — `/api/notifications` (auth required)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/prefs` | Notification preferences |
| `POST` | `/test/email` | Send a test email |
| `POST` | `/test/sms` | Send a test SMS |
| `GET` | `/verify-sms` | Verify SMS delivery |
| `GET` | `/verify-sms-config` | Check SMS configuration |
| `GET` | `/verify-smtp` | Check SMTP configuration |

### Forex — `/api/forex`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/rates?base=LKR` | Cached exchange rates |
| `POST` | `/refresh` | Refresh rates from the provider |

### Static files

| Path | Description |
| --- | --- |
| `/uploads/prescriptions/...` | Uploaded prescription files |
| `/uploads/...` | Any other uploaded asset under `wellvision-backend/uploads` |

---

## Data models

| Model | File | Key fields |
| --- | --- | --- |
| **User** | `models/userModel.js` | `name`, `email` (unique), `password` (bcrypt), `avatar`, `phone`, `role`, `staffId`, `isAccountVerified`, `failedLoginAttempts`, `lockUntil`, `loginHistory`, `activeSessions`, `lastLogin` |
| **Staff** | `models/staffModel.js` | `staffId` (unique), `name`, `email` (unique), `phoneNumber`, `role` (`Admin`/`Manager`/`Supervisor`/`Employee`), `status`, `department`, `hireDate`, `access[]` |
| **Customer** | `models/customer.js` | `givenName`, `familyName`, `ageYears`, `birthDate`, `nicPassport`, `gender`, `ethnicity`, `phoneNo`, `address`, `email`, timestamps |
| **Product** | `models/productModel.js` | `sku` (auto `PRD000001`), `name`, `category` (`eyeglasses`, `sunglasses`, `contact-lenses`, `lens`, `accessories`), `brand`, `model`, `price`, `cost`, `stock`, `reorderLevel`, `description`, `images[]`, `isActive`, `totalSold`; virtuals: `profitMargin`, `stockValue`, `stockStatus` |
| **Order** | `models/orderModel.js` | `orderNumber` (unique), `customerId`, `customerName`, `customerEmail`, `items[]` (`productId`, `sku`, `description`, `quantity`, `unitPrice`), `status`, `collected`, `total`, `amountGiven`, `createdBy`, `placedAt` |
| **Invoice** | `models/invoiceModel.js` | `orderNo`, `date`, `billNo` (unique), `name`, `tel`, `address`, `customerId`, `createdBy`, `items[]` (`item`, `description`, `rs`, `cts`), `amount`, `advance`, `balance`, `status` (`pending`/`collected`) |
| **Settings** | `models/settingsModel.js` | `userId` (unique), `general` (shop name/email/phone/address, currency, timezone, language), `notifications`, `invoice` (prefix, start number, logo, terms), etc. |
| **Prescription** | `models/prescriptionModel.js` | `customerId`, `fileName`, `originalName`, `mimeType`, `size`, `url`, timestamps |
| **Counter** | `models/counterModel.js` | `name` (unique), `seq` — used for bill numbers and product SKUs |
| **ForexRate** | `models/forexRateModel.js` | `base`, `rates` map, `fetchedAt` |

---

## Frontend routes

### Public

| Path | Screen |
| --- | --- |
| `/`, `/login` | Login |
| `/register` | Register |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password |
| `/send-verify-otp` | Send verification OTP |
| `/verify-email` | Verify email |

### Admin (`role === "Admin"`)

All under `/admin/*`:

`dashboard`, `products`, `customers`, `transactions`, `geography`, `overview`,
`daily`, `daily-reports`, `monthly`, `breakdown`, `admin`, `staff`,
`performance`, `configuration`.

Unknown admin paths redirect to `/admin/dashboard`.

### Staff / other roles

| Path | Screen |
| --- | --- |
| `/dashboard` | Sales dashboard |
| `/products` | Product catalogue |
| `/daily-reports` | Daily reports |
| `/customers` | Customer directory |
| `/customer/:customerId` | Customer profile |
| `/invoice` | Invoice / bill creation |
| `/bills` | Bills |
| `/settings` | Settings |
| `/profile` | Profile |

Unknown staff paths redirect to `/dashboard`.

---

## Seeding and sample data

### Products

```bash
cd wellvision-backend
node seedProducts.js
```

- Connects using `MONGODB_URI` from `.env`.
- Inserts six sample optical products only if their names do not already exist,
  so it is safe to run repeatedly.
- Sample categories: eyeglasses, sunglasses, contact lenses, lenses,
  accessories.

### Orders

```bash
cd wellvision-backend
node scripts/seedOrders.js
```

Seeds a couple of demo orders (`WV-2003`, `WV-2004`). These use placeholder
product IDs, so they are only useful for UI/demo purposes.

### First admin account

There is no dedicated admin seeder. Register a user through the frontend and
either:

- set that user's `role` to `Admin` in MongoDB, or
- use `admin@example.com`, which is always treated as `Admin` at login.

---

## Testing

There is no automated test suite wired up.

- `wellvision-backend` → `npm test` prints a placeholder error.
- `wellvision-frontend` → `npm test` starts the CRA/Jest watch runner, but only
  the default smoke test exists.
- Manual API test cases live in `wellvision-backend/test-reports/`:
  - Authentication, User, Product, Order, Invoice, Customer, Settings,
    Notification, Forex and Testing Recommendations.

Useful manual checks:

```bash
# Health: server should respond (401/200 rather than connection refused)
curl http://localhost:4000/api/auth/is-auth -X POST

# Syntax-check backend files
node --check index.js
```

---

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| `❌ Failed to connect to MongoDB` | MongoDB is not running or `MONGODB_URI` is wrong/missing the database name. The URI is trimmed of surrounding quotes. |
| Requests fail with CORS error | Frontend origin is not `localhost:3000`/`localhost:5173`. Add it to `allowedOrigins` in `index.js`. |
| Login succeeds but protected calls return 401 | Cookie not sent. The admin API must use `credentials: "include"`; in production cookies require HTTPS (`SameSite=None; Secure`). |
| `Account locked` (423) | 5 failed attempts. Wait 15 minutes or clear `lockUntil`/`failedLoginAttempts` in MongoDB. |
| Emails not delivered | Check `SMTP_USER`, `SMTP_PASS`, `SENDER_EMAIL`. Brevo relay is `smtp-relay.brevo.com:587`. |
| SMS tests fail | Configure `SMS_PROVIDER` plus the matching credentials; `GET /api/notifications/verify-sms-config` reports what is missing. |
| Duplicate schema index warnings on startup | Harmless Mongoose warnings for `sku`/`userId` duplicate index declarations. |
| Admin pages show mock data | The RTK Query slice falls back to mock data for unimplemented GET endpoints. Real endpoints are listed in `REAL_GET_ENDPOINTS` and surface errors instead. |
| Port already in use | Change `PORT` in backend `.env`, or stop the other process on 3000/4000. |
| PDF/print output wrong | Invoice printing depends on browser print CSS and `jspdf`/`html2canvas`; test in Chrome. |

---

## Security notes

- **Secrets:** `.env` files are git-ignored. An older commit in this repository
  exposed `.env` contents in history; the values were unchanged and history was
  not rewritten. Rotate `JWT_SECRET`, SMTP and SMS credentials before deploying
  publicly.
- **JWT:** stored in an httpOnly cookie, signed with `JWT_SECRET`, 7-day expiry,
  with a `jti` tracked in `user.activeSessions` so sessions can be revoked.
- **Passwords:** hashed with bcrypt (cost 10).
- **Lockout:** 5 failed attempts → 15-minute lock.
- **Role checks:** enforced server-side (`adminOnly`), not just hidden in the UI.
- **Cost data:** stripped server-side for staff; do not rely on the UI alone.
- **Uploads:** prescription uploads are restricted by MIME type/size (see
  `routes/prescriptionRoutes.js`) and served from `/uploads`.
- **CORS:** allow-list with credentials; no wildcard.
- **Production:** set `NODE_ENV=production` so cookies become
  `Secure` + `SameSite=None`, serve the frontend over HTTPS, and set a strong
  `JWT_SECRET`.

---

## Known limitations

- No automated tests; regression checking is manual (see `test-reports/`).
- The root `package.json` is minimal and does not orchestrate both apps; run
  each project separately.
- Customer routes are not auth-protected at the API level.
- Staff deletion of products is allowed; only editing is admin-only.
- The admin RTK Query layer can fall back to mock data for endpoints that are
  not implemented yet.
- Product cost is taken from the current catalogue; historical cost snapshots
  are not stored.
- Sample order seeder uses placeholder product IDs and is demo-only.

---

## License

No license file is included. Treat this as private/internal software unless a
license is added by the repository owner.
