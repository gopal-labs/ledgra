# Ledgra — Modular Inventory Management System

**Ledgra** is a modern, modular, full-stack Inventory Management System built with **Node.js, Express, MongoDB (Mongoose), React (Vite)**, and **Tailwind CSS**. Inspired by modern enterprise ERP systems like Odoo, Ledgra provides real-time stock tracking, multi-warehouse support, location management, incoming receipts, and outgoing delivery fulfillment with stock reservation workflows.

---

## 🌟 Key Features

- **Modern UI & Dark Theme**: Sleek dark mode by default with light theme toggle, responsive layout, custom badges, and micro-interactions.
- **Authentication & Security**: JWT-based authentication, user roles, persistent session state, and 3-step OTP password reset.
- **Interactive Dashboard**: Aggregation metrics, low-stock threshold warning banners, quick action shortcuts, and recent activity feeds.
- **Product Management**: SKU search, category filters, cost calculation, unit of measure (UOM) selection, and real-time stock breakdown per warehouse location.
- **Multi-Warehouse & Locations**: Warehouse configuration (default selection, short code prefixing) and location management (*Internal*, *Vendor*, *Customer*, *Inventory Loss*).
- **Operations — Incoming Receipts**: Full lifecycle (`Draft` → `Ready` → `Done`) with automatic destination stock increment upon validation.
- **Operations — Outgoing Delivery Orders**: Full lifecycle (`Draft` → `Waiting Stock` → `Ready` → `Done`) with stock reservation checking (`quantityFree = onHand - reserved`), automatic stock deduction, and printable packing slip modal.

---

## 🛠️ Tech Stack

### Backend
- **Node.js** & **Express**
- **MongoDB** & **Mongoose**
- **JWT (JSON Web Tokens)** & **Bcrypt** for authentication
- **Nodemailer** for OTP notifications

### Frontend
- **React 18** (Vite)
- **React Router v6**
- **Zustand** (Auth & Theme state persistence)
- **Axios** (With request/response interceptors)
- **Vanilla CSS & Tailwind CSS** for styling

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or MongoDB Atlas connection string)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/gopal-labs/ledgra.git
   cd ledgra
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory (refer to `.env.example`):
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/ledgra
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   OTP_EXPIRE_MINUTES=10
   ```
   Start the backend development server:
   ```bash
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📂 Repository Structure

```
ledgra/
├── backend/
│   ├── config/             # DB Connection config
│   ├── controllers/        # Express controllers (auth, dashboard, product, delivery, receipt, warehouse, location)
│   ├── middleware/         # Auth JWT protection middleware
│   ├── models/             # Mongoose schemas (User, Product, StockLevel, Delivery, Receipt, Warehouse, Location)
│   ├── routes/             # API route endpoints
│   └── server.js           # Server entry point
│
└── frontend/
    ├── src/
    │   ├── api/            # Axios instance and API service calls
    │   ├── components/     # UI components (AppLayout, Button, Badge, Modal, Input, Table, Sidebar, Topbar)
    │   ├── pages/          # Page views (Dashboard, Products, Receipts, Deliveries, Warehouse, Locations, Auth)
    │   ├── store/          # Zustand state management
    │   ├── App.jsx         # React router configuration
    │   └── index.css       # Core CSS design system
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
