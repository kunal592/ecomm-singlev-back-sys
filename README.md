# Single Vendor White-Label E-commerce Backend

A production-ready, highly modular, and scalable backend for single-vendor e-commerce applications. Built with **NestJS**, **Prisma**, and **PostgreSQL**.

---

## 🚀 Key Features

- **StoreConfig Driven**: Dynamic store settings (name, logo, colors, order modes) managed via database.
- **Multi-Mode Ordering**: Supports **WhatsApp**, **Cash on Delivery (COD)**, and **Online Payments**.
- **User Management**: Unified system for Admins, Staff, and Customers.
- **Product & Category CRUD**: With search, pagination, and filtering.
- **Cart System**: Persistent user-based shopping cart.
- **JWT Auth**: Secure authentication with Access and Refresh tokens.
- **Payment Mock**: Razorpay-ready structure for online transactions.
- **Mock Image Upload**: Built-in support for image handling.

---

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Documentation**: [Swagger](https://swagger.io/)

---

## 🏗️ Project Setup

### 1. Installation
```bash
$ npm install
```

### 2. Configuration
Update the `.env` file with your PostgreSQL database URL and JWT secrets.
```env
DATABASE_URL="postgresql://user:password@localhost:5432/db_name"
JWT_ACCESS_SECRET="your_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
```

### 3. Database Migration
```bash
$ npx prisma migrate dev --name init
```

### 4. Running the Project
```bash
# development
$ npm run start:dev

# production
$ npm run start:prod
```

### 5. API Documentation
Once the server is running, visit:
`http://localhost:3000/api/docs`

---

## 🌎 Official Website
Check out our services and platform at:
**[www.kdxlabs.cloud](https://www.kdxlabs.cloud)**

---

## 📜 License
This project is [MIT licensed](LICENSE).

---

Developed and maintained by **KDX Labs**.
