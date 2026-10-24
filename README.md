# Restaurant Reservation & Management System — Backend

Backend REST API for the Restaurant Reservation & Management System.

The backend is built using **Node.js**, **Express.js**, and **PostgreSQL**. It provides authentication, authorization, menu management, restaurant table management, reservation management, customer profile management, and administrator dashboard functionality.

---

## Technologies

- Node.js
- Express.js
- PostgreSQL
- `pg`
- JSON Web Token (JWT)
- bcrypt
- Express Validator
- CORS
- dotenv
- Nodemon

---

## Main Features

### Authentication
- Customer registration
- Customer and Admin login
- Password hashing using bcrypt
- JWT authentication
- Protected API routes

### Authorization
Two roles are supported:

- `customer`
- `admin`

Customers can access their own reservations and profile.

Admins can manage:

- Reservations
- Menu items
- Restaurant tables
- Customers
- Dashboard information

---

## Project Structure

```text
restaurant-backend/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   ├── menuController.js
│   ├── reservationController.js
│   ├── tableController.js
│   ├── userController.js
│   └── adminController.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   └── errorMiddleware.js
│
├── routes/
│   ├── authRoutes.js
│   ├── menuRoutes.js
│   ├── reservationRoutes.js
│   ├── tableRoutes.js
│   ├── userRoutes.js
│   └── adminRoutes.js
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── verify.sql
│
├── .env
├── .gitignore
├── server.js
├── package.json
└── README.md
```

---

# Database

Database name:

```text
restaurant_reservation_db
```

The database contains five main tables:

1. `users`
2. `menu_categories`
3. `menu_items`
4. `restaurant_tables`
5. `reservations`

The database uses:

- Primary keys
- Foreign keys
- NOT NULL constraints
- UNIQUE constraints
- CHECK constraints
- Referential integrity
- Double-booking protection

---

# Installation

Clone the repository:

```bash
git clone <BACKEND_GITHUB_URL>
```

Enter the project directory:

```bash
cd restaurant-reservation-backend
```

Install dependencies:

```bash
npm install
```

---

# Environment Variables

Create a `.env` file in the backend root:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_reservation_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD

JWT_SECRET=YOUR_JWT_SECRET
JWT_EXPIRES_IN=1d

FRONTEND_URL=http://localhost:5173
```

The `.env` file must not be committed to GitHub.

---

# Running the Backend

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

Default API address:

```text
http://localhost:5000
```

---

# Health Check

## API Health

```http
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "api": true,
  "database": true
}
```

---

# API Documentation

## Authentication

### Register Customer

```http
POST /api/auth/register
```

Authentication:

```text
Public
```

Request:

```json
{
  "fullName": "Ahmad Ali",
  "email": "ahmad@example.com",
  "phone": "0791234567",
  "password": "Password123!"
}
```

Successful response:

```json
{
  "message": "Account created successfully",
  "user": {
    "id": 1,
    "fullName": "Ahmad Ali",
    "email": "ahmad@example.com",
    "phone": "0791234567",
    "role": "customer"
  },
  "token": "JWT_TOKEN"
}
```

Public registration always creates a `customer` account.

---

### Login

```http
POST /api/auth/login
```

Authentication:

```text
Public
```

Request:

```json
{
  "email": "ahmad@example.com",
  "password": "Password123!"
}
```

Successful response:

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "fullName": "Ahmad Ali",
    "email": "ahmad@example.com",
    "role": "customer"
  },
  "token": "JWT_TOKEN"
}
```

---

### Current Logged-In User

```http
GET /api/auth/me
```

Authentication:

```text
Bearer JWT required
```

Header:

```http
Authorization: Bearer JWT_TOKEN
```

---

## Menu

### Get Menu

```http
GET /api/menu
```

Authentication:

```text
Public
```

Returns all menu items with category information.

---

### Get Menu Categories

```http
GET /api/menu/categories
```

Authentication:

```text
Public
```

---

### Get Menu Item

```http
GET /api/menu/:id
```

Authentication:

```text
Public
```

---

### Create Menu Item

```http
POST /api/menu
```

Authorization:

```text
Admin only
```

Example:

```json
{
  "categoryId": 3,
  "name": "Cheesecake",
  "description": "Classic creamy cheesecake.",
  "price": 4.5,
  "imageUrl": "/images/cheesecake.png",
  "isAvailable": true
}
```

---

### Update Menu Item

```http
PUT /api/menu/:id
```

Authorization:

```text
Admin only
```

---

### Delete Menu Item

```http
DELETE /api/menu/:id
```

Authorization:

```text
Admin only
```

---

# Restaurant Tables

### Get All Tables

```http
GET /api/tables
```

Returns restaurant tables including:

- Table number
- Capacity
- Location
- Active status

---

### Get One Table

```http
GET /api/tables/:id
```

---

### Create Table

```http
POST /api/tables
```

Authorization:

```text
Admin only
```

Example:

```json
{
  "tableNumber": 8,
  "capacity": 4,
  "location": "Indoor",
  "isActive": true
}
```

---

### Update Table

```http
PUT /api/tables/:id
```

Authorization:

```text
Admin only
```

---

### Delete Table

```http
DELETE /api/tables/:id
```

Authorization:

```text
Admin only
```

A table with reservation history cannot be deleted. It should instead be marked inactive.

---

# Reservations

### Check Availability

```http
GET /api/reservations/availability
```

Example:

```text
/api/reservations/availability?date=2026-11-20&time=19:00&guests=4
```

The system finds the smallest active table that:

- Has sufficient capacity
- Is not already booked
- Is available for the requested date/time

---

### Create Reservation

```http
POST /api/reservations
```

Authorization:

```text
Customer only
```

Example:

```json
{
  "reservationDate": "2026-11-20",
  "reservationTime": "19:00",
  "guestCount": 4,
  "specialRequest": "Birthday celebration"
}
```

New reservations are initially assigned:

```text
Pending
```

---

### Get Customer Reservations

```http
GET /api/reservations/my
```

Authorization:

```text
Customer only
```

A customer only receives their own reservations.

---

### Update Own Reservation

```http
PUT /api/reservations/:id
```

Authorization:

```text
Customer only
```

A customer cannot update another customer's reservation.

---

### Cancel Reservation

```http
PATCH /api/reservations/:id/cancel
```

Authorization:

```text
Customer only
```

---

### Admin — Get All Reservations

```http
GET /api/reservations
```

Authorization:

```text
Admin only
```

---

### Admin — Update Reservation Status

```http
PATCH /api/reservations/:id/status
```

Authorization:

```text
Admin only
```

Example:

```json
{
  "status": "Confirmed"
}
```

Allowed statuses:

```text
Pending
Confirmed
Completed
Cancelled
Rejected
```

---

# Users

### Get Profile

```http
GET /api/users/profile
```

Authentication:

```text
JWT required
```

---

### Update Profile

```http
PUT /api/users/profile
```

Authentication:

```text
JWT required
```

Example:

```json
{
  "fullName": "Ahmad Ali",
  "email": "ahmad@example.com",
  "phone": "0791234567"
}
```

---

### Get Customers

```http
GET /api/users/customers
```

Authorization:

```text
Admin only
```

Returns customer information and reservation counts.

---

# Admin Dashboard

### Dashboard Statistics

```http
GET /api/admin/dashboard
```

Authorization:

```text
Admin only
```

Returns:

- Today's reservations
- Pending reservations
- Number of customers
- Number of active restaurant tables
- Recent reservations

---

# Authentication Header

Protected API requests use:

```http
Authorization: Bearer JWT_TOKEN
```

The backend verifies the JWT before allowing access.

---

# Authentication vs Authorization

Authentication answers:

```text
Who is the user?
```

JWT is used to authenticate the user.

Authorization answers:

```text
What is the user allowed to do?
```

Role middleware checks whether the authenticated user has the required role.

For example:

```text
Customer → POST /api/menu → 403 Forbidden

Admin → POST /api/menu → Allowed
```

---

# Error Handling

Common HTTP responses:

| Status | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Validation error |
| 401 | Authentication required |
| 403 | Forbidden |
| 404 | Resource not found |
| 409 | Conflict |
| 500 | Internal server error |

Centralized error middleware is used to provide consistent API error responses.

---

# Security

Security measures include:

- Password hashing with bcrypt
- JWT authentication
- Role-based authorization
- Environment variables
- Parameterized PostgreSQL queries
- Server-side validation
- Database constraints
- `.env` excluded from GitHub

---

# Git Workflow

Development uses GitHub feature branches such as:

```text
feature/authentication
feature/menu-api
feature/table-api
feature/reservation-api
feature/profile-admin-api
```

Features are developed separately and merged into `main` through Pull Requests.

This reduces the risk of introducing unstable code into the main branch.

---

# Database Files

Database files are available inside:

```text
database/
```

Files:

```text
schema.sql
seed.sql
verify.sql
```

`schema.sql` contains the database structure and constraints.

`seed.sql` contains realistic initial data.

`verify.sql` contains queries used to verify database relationships.

---

# Authors

Developed for the Special Topics in Computer Science 1 full-stack web application assignment.