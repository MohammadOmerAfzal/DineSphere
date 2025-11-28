# DineSphere
# Restaurant Management App

## Overview

This project is a **Restaurant Management and Registration Platform** that allows restaurant owners to register their businesses, manage menus, and configure business settings, while providing secure authentication and role-based access.  

The system is built with a **React frontend** and a **Node.js + Express backend**, using **MongoDB** for data storage, **JWT** for authentication, and **Redis** for session management.

---

## Features

### For Restaurant Owners
- **Restaurant Registration:** Owners can register their restaurant with detailed info, including name, description, cuisine type, contact, address, business hours, and images.
- **Menu Management:** Add, edit, and remove menu items with categories and prices.
- **Business Settings:** Configure delivery fee, minimum order, preparation time, delivery radius, and accepted payment methods.
- **Secure Access:** Owners must login to access and manage their restaurants.

### Common Features
- **JWT Authentication:** Ensures secure API access using tokens.
- **Role-Based Authorization:** Restricts certain actions to authenticated restaurant owners.
- **Input Validation:** All API inputs are validated using `express-validator`.
- **Session Management:** Redis is used for efficient session handling.
- **Data Sanitization & Security:** Helmet for security headers, `express-mongo-sanitize` for preventing NoSQL injection attacks.

---

## Tech Stack & Concepts

| Layer           | Technologies & Concepts                                         |
|-----------------|-----------------------------------------------------------------|
| Frontend        | React.js, useState & useEffect hooks, React Router, Fetch API   |
| Backend         | Node.js, Express.js, MVC pattern                                 |
| Database        | MongoDB (with Mongoose ORM)                                     |
| Authentication  | JWT (JSON Web Token), Passport.js                                |
| Session Store   | Redis (via `connect-redis`)                                     |
| Security        | Helmet, CORS, express-mongo-sanitize                             |
| Validation      | express-validator                                                |
| Deployment      | Environment variables via `dotenv`, scalable via Docker/Node.js |

---
## BACKEND
Create .env file 
PORT=5000
MONGO_URI=<your-mongo-uri>
JWT_SECRET=<your-secret-key>
FRONTEND_URL=http://localhost:5173
REDIS_HOST=localhost
REDIS_PORT=6379
SESSION_SECRET=<your-session-secret>
GOOGLE_CLIENT_ID=<Your-ID-Here>
GOOGLE_CLIENT_SECRET=<Your-Secret-Here>
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

Start server: npm run dev

## FRONTEND
Navigate to frontend folder
Install dependencies: npm install
Create .env:

VITE_API_URL=http://localhost:5000

Start frontend: npm run dev


