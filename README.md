# Ledgra — Modular Inventory Management System

**Ledgra** is a modern, modular, full-stack Inventory Management System built with **Node.js, Express, MongoDB (Mongoose), React 18 (Vite)**, and **Tailwind CSS**. Inspired by modern enterprise ERP systems like Odoo, Ledgra provides real-time stock tracking, multi-warehouse management, location breakdown, incoming receipts, outgoing delivery fulfillment with stock reservation workflows, internal transfers, stock count adjustments, and a unified Stock Ledger audit trail.

---

## 🌟 Key Features

- **Modern UI & Dark Theme**: Sleek dark mode default with light mode toggle, responsive hamburger rail on tablet/mobile, custom status badges, and micro-animations.
- **Authentication & Role-Based UI**:
  - **Inventory Manager** (`admin123` / `Password123!`): Full access to Dashboard KPIs, Operations, Products, Move History, and Settings (Warehouses, Locations).
  - **Warehouse Staff** (`staff123` / `Password123!`): Operations, Products, and Move History.
- **Global Low-Stock Alert**: Topbar bell icon with real-time badge count and popover warnings for items below reorder threshold.
- **Global SKU & Reference Smart Search**: Topbar search input querying across Products, Receipts, Deliveries, and Transfers with instant navigation links.
- **Operations — Incoming Receipts**: Full lifecycle (`Draft` → `Ready` → `Done`) with destination stock auto-increment and printable receipt note.
- **Operations — Outgoing Delivery Orders**: Full lifecycle (`Draft` → `Waiting Stock` → `Ready` → `Done`) with stock reservation checking (`quantityFree = onHand - reserved`), line-level insufficient stock highlighting, stock deduction, and printable packing slip modal.
- **Operations — Internal Transfers**: Move stock between internal warehouse locations (*Main Store → Production Floor*). Total global stock stays conserved while location breakdowns update.
- **Operations — Stock Adjustments**: Count reconciliation comparing physical count vs system recorded stock. Auto-calculates stock deltas and sets stock upon validation.
- **Move History & Stock Ledger**: Centralized, filterable audit log of every stock transaction with green/red row color coding and **CSV Export**.

---

## 🛠️ Tech Stack

### Backend
- **Node.js** & **Express**
- **MongoDB** & **Mongoose**
- **JWT (JSON Web Tokens)** & **Bcrypt**
- **Nodemailer** for OTP notifications

### Frontend
- **React 18** (Vite)
- **React Router v6**
- **Zustand** (Auth & Theme state persistence)
- **Axios** (With request/response interceptors)
- **Toast Context API** for global action notifications
- **Vanilla CSS & Tailwind CSS** for styling

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Running locally on default port 27017 or MongoDB Atlas connection string)

### 1. Clone the Repository
```bash
git clone https://github.com/gopal-labs/ledgra.git
cd ledgra
```

### 2. Setup & Run Backend

```bash
cd backend
npm install
```

Create `.env` file inside `backend/` (refer to `.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ledgra
JWT_SECRET=ledgra_super_secret_jwt_key
JWT_EXPIRE=7d
OTP_EXPIRE_MINUTES=10

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
FROM_EMAIL=noreply@ledgra.app
FROM_NAME=Ledgra
```

#### Seed the Database (Required for initial sample data)
```bash
npm run seed
```
> This script populates sample warehouses, locations, products, stock levels, receipts, deliveries, internal transfers, stock adjustments, and stock moves.

#### Start Backend Server
```bash
npm run dev
```
Backend server starts on `http://localhost:5000`.

---

### 3. Setup & Run Frontend

```bash
cd ../frontend
npm install
npm run dev
```
Frontend app starts on `http://localhost:5173`.

---

## 🔑 Login Credentials

The database seed script creates two pre-configured user accounts:

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| **Inventory Manager** | `admin123` | `Password123!` | Full Access (Dashboard, Operations, Products, Move History, Settings) |
| **Warehouse Staff** | `staff123` | `Password123!` | Operational Access (Operations, Products, Move History) |

---

## 📂 Project Structure

```
ledgra/
├── backend/
│   ├── config/             # MongoDB database connection
│   ├── controllers/        # Express controllers (auth, dashboard, stock, delivery, receipt, transfer, adjustment, move)
│   ├── middleware/         # Auth JWT protection middleware
│   ├── models/             # Mongoose schemas (User, Product, StockLevel, Delivery, Receipt, Transfer, Adjustment, StockMove, Warehouse, Location)
│   ├── routes/             # Express API routes
│   ├── seed.js             # Database seeder script
│   └── server.js           # Express app entry point
│
└── frontend/
    ├── src/
    │   ├── api/            # Axios instance and API services (stockApi, deliveryApi, receiptApi, transferApi, adjustmentApi, moveApi)
    │   ├── components/     # UI components (AppLayout, Button, Badge, Modal, Input, Table, Sidebar, Topbar)
    │   ├── context/        # ToastContext notification manager
    │   ├── pages/          # View pages (Dashboard, Products, Receipts, Deliveries, Transfers, Adjustments, MoveHistory, Settings)
    │   ├── store/          # Zustand auth & theme stores
    │   ├── App.jsx         # App router configuration
    │   └── index.css       # Design system CSS tokens & styles
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
