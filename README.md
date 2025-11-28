# **DineSphere – Restaurant Management Platform**

## **Overview**

DineSphere is a comprehensive restaurant management and registration platform that empowers restaurant owners to efficiently manage their businesses while providing real-time features for both owners and customers.

---

## **Features**

### **Restaurant Management**

* **Restaurant Registration**: Complete business registration with details including name, description, cuisine type, contact info, address, business hours, and images.
* **Menu Management**: Add, edit, and remove menu items with categories, prices, and descriptions.
* **Business Configuration**: Set delivery fees, minimum order amounts, preparation times, delivery radius, and accepted payment methods.
* **Secure Access**: Role-based authentication for restaurant owners.

### **Real-time Capabilities**

* **Live Order Tracking**: Real-time order status updates from kitchen preparation to delivery.
* **Instant Notifications**: Browser push notifications for order status changes.
* **Live Menu Updates**: Real-time menu availability and pricing changes.
* **Order Analytics**: Live dashboard with order metrics and performance data.

### **Security & Authentication**

* JWT-based authentication system
* Google OAuth integration
* Role-based authorization
* Input validation and sanitization
* Session management with Redis

---

## **Technology Stack**

### **Backend**

* **Runtime**: Node.js with Express.js
* **Database**: MongoDB with Mongoose ODM
* **Authentication**: JWT, Passport.js, Google OAuth
* **Session Store**: Redis
* **Real-time Communication**: WebSocket (Socket.io)
* **Message Broker**: Apache Kafka
* **Security**: Helmet, CORS, express-mongo-sanitize
* **Validation**: express-validator

### **Frontend**

* **Framework**: React.js with hooks
* **Routing**: React Router
* **Real-time**: Socket.io client
* **HTTP Client**: Fetch API

| **Layer**    | **Technology / Tools**                          |
| ------------ | ----------------------------------------------- |
| **Backend**  | Node.js with Express.js                         |
|              | MongoDB with Mongoose ODM                       |
|              | JWT, Passport.js, Google OAuth                  |
|              | Redis (Session Store)                           |
|              | WebSocket (Socket.io)                           |
|              | Apache Kafka (Message Broker)                   |
|              | Helmet, CORS, express-mongo-sanitize (Security) |
|              | express-validator (Validation)                  |
| **Frontend** | React.js with hooks                             |
|              | React Router                                    |
|              | Socket.io client (Real-time)                    |
|              | Fetch API                                       |


---

## **Installation & Setup**

### **Prerequisites**

* Node.js (v16 or higher)
* MongoDB
* Redis
* Apache Kafka

### **Backend Setup**

1. **Install dependencies**:

```bash
npm install express mongoose redis jsonwebtoken bcryptjs cors helmet express-validator express-mongo-sanitize dotenv passport passport-google-oauth20 socket.io kafkajs
```

2. **Create environment file** (`.env`):

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
REDIS_HOST=localhost
REDIS_PORT=6379
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback


```

3. **Start backend services**:

```bash
# Start Redis
redis-server

# Start backend server
npm run dev
```

### **Frontend Setup**

1. **Navigate to frontend directory**:

```bash
cd frontend
```

2. **Install dependencies**:

```bash
npm install
npm install socket.io-client
```

3. **Create environment file** (`.env`):

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5001
```

4. **Start development server**:

```bash
npm run dev
```

---
## **Kafka Topics**

* `order-created` – New order placement events
* `order-status-changed` – Order status update events
* `menu-updated` – Menu modification events
---
## **Usage**

### **For Restaurant Owners**

1. Register your restaurant with complete business details.
2. Set up your menu with categories and pricing.
3. Configure business settings and delivery options.
4. Monitor real-time orders and analytics.
5. Manage order status and customer communications.

### **For Customers**

1. Browse restaurant menus with real-time availability.
2. Place orders with live tracking.
3. Receive instant notifications on order status.
4. Track orders from preparation to delivery.

---

## **Development**

### **Running in Development Mode**

```bash
# Backend
npm run dev

# Frontend
cd frontend && npm run dev
```

### **Building for Production**

```bash
# Frontend
cd frontend && npm run build
```

---

## **Environment Variables**

### **Backend (.env)**
* Database and cache configuration
* Authentication secrets
* Third-party service credentials
* Kafka and WebSocket settings
### **Frontend (.env)**

* API endpoint configuration
* WebSocket server URL
---
## **Contributing**

Please read the contributing guidelines before submitting pull requests.
---
## **License**

This project is licensed under the MIT License.


