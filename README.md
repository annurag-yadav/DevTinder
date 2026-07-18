# DevTinder Backend

A RESTful backend API for **DevTinder** — a developer networking platform inspired by Tinder. Users can create profiles, discover other developers through a personalized feed, send connection requests, and manage their professional network.

Built with **Node.js**, **Express.js**, and **MongoDB**, featuring JWT-based authentication via HTTP-only cookies and a complete connection request lifecycle.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Application Flow](#application-flow)
- [Database Models](#database-models)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Connection Request Lifecycle](#connection-request-lifecycle)
- [Feed Algorithm](#feed-algorithm)
- [Error Handling](#error-handling)
- [Frontend Integration](#frontend-integration)
- [Resume Points](#resume-points)

---

## Features

| Feature | Description |
|---------|-------------|
| **User Authentication** | Signup, login, and logout with JWT tokens stored in cookies |
| **Profile Management** | View and edit user profile (name, age, gender, skills, about, photo) |
| **Developer Feed** | Paginated feed of developers excluding self and existing connections |
| **Connection Requests** | Send, receive, accept, or reject connection requests |
| **Connections List** | View all accepted connections with populated user details |
| **Input Validation** | Email, password strength, age, gender, and URL validation |
| **Password Security** | Bcrypt hashing with salt rounds before storage |
| **CORS Support** | Configured for frontend at `http://localhost:5173` |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express.js v5 |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JSON Web Tokens (JWT) + Cookie-based sessions |
| Password Hashing | bcrypt |
| Validation | validator.js |
| Dev Server | nodemon |
| Cross-Origin | cors |

---

## Project Structure

```
DevTinder-Backend/
├── src/
│   ├── app.js                    # Express app entry point, middleware, route mounting
│   ├── config/
│   │   └── database.js           # MongoDB connection setup
│   ├── middlewares/
│   │   └── auth.js               # JWT verification middleware (userAuth)
│   ├── models/
│   │   ├── user.js               # User schema, JWT & password methods
│   │   └── connectionRequest.js  # Connection request schema & validations
│   ├── routes/
│   │   ├── auth.js               # Signup, login, logout
│   │   ├── profile.js            # Profile view & edit
│   │   ├── request.js            # Send & review connection requests
│   │   └── user.js               # Feed, connections, received requests
│   └── utils/
│       └── validation.js         # Signup & profile edit validation helpers
├── apiList.md                    # Quick API reference
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) — local instance or MongoDB Atlas cluster
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd DevTinder-Backend

# Install dependencies
npm install
```

### Database Configuration

Update the MongoDB connection string in `src/config/database.js`:

```javascript
await mongoose.connect('mongodb+srv://<username>:<password>@<cluster-url>/DevTinder');
```

> **Recommended:** Move the connection string to an environment variable (e.g., `process.env.MONGODB_URI`) and add a `.env` file (ensure `.env` is in `.gitignore`).

### Run the Server

```bash
# Development (with hot reload)
npm run dev

# Production
node src/app.js
```

The server starts at **http://localhost:3000**

---

## Application Flow

### High-Level Architecture

```
┌─────────────┐     HTTP + Cookies      ┌──────────────────┐
│   Frontend  │ ◄──────────────────────► │  Express Server  │
│ (React/Vite)│                          │   (Port 3000)    │
└─────────────┘                          └────────┬─────────┘
                                                  │
                                         ┌────────▼─────────┐
                                         │     MongoDB      │
                                         │  (DevTinder DB)  │
                                         └──────────────────┘
```

### User Journey Flow

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌─────────────┐
│  Signup  │───►│  Login   │───►│ View/Edit    │───►│ Browse Feed │
│          │    │ (JWT in  │    │   Profile    │    │  (paginated)│
└──────────┘    │  cookie) │    └──────────────┘    └──────┬──────┘
                └──────────┘                               │
                                                           ▼
              ┌────────────────────────────────────────────────────┐
              │              Connection Request Flow               │
              │                                                    │
              │  User A ──[interested]──► User B                   │
              │  User A ──[ignored]────► User B  (swipe left)      │
              │                                                    │
              │  User B ──[accepted]──► Request becomes connection │
              │  User B ──[rejected]──► Request closed             │
              └────────────────────────────────────────────────────┘
```

### Request Pipeline (Protected Routes)

Every protected endpoint follows this middleware chain:

```
Client Request
     │
     ▼
┌─────────────┐
│   CORS      │  Allow frontend origin with credentials
└──────┬──────┘
       ▼
┌─────────────┐
│ cookieParser│  Extract JWT from `token` cookie
└──────┬──────┘
       ▼
┌─────────────┐
│  userAuth   │  Verify JWT → Fetch user → Attach to req.user
└──────┬──────┘
       ▼
┌─────────────┐
│   Route     │  Business logic (feed, profile, requests)
│   Handler   │
└──────┬──────┘
       ▼
   JSON Response
```

### Signup Flow (Step-by-Step)

1. Client sends `POST /signup` with user details
2. `validateSignupData()` checks required fields, email format, password strength, age, and gender
3. Password is hashed using **bcrypt** (10 salt rounds)
4. New user document is saved to MongoDB
5. JWT is generated via `user.getJWT()` (8-hour expiry)
6. Token is set as an HTTP cookie named `token`
7. User data is returned in the response

### Login Flow (Step-by-Step)

1. Client sends `POST /login` with `emailId` and `password`
2. User is looked up by email
3. `user.validatePassword()` compares plain password with bcrypt hash
4. On success, JWT is issued and stored in cookie (8-hour expiry)
5. User object is returned

### Logout Flow

1. Client sends `POST /logout`
2. Server clears the `token` cookie by setting it to `null` with immediate expiry
3. Success message is returned

---

## Database Models

### User Schema

| Field | Type | Constraints |
|-------|------|-------------|
| `firstName` | String | Required |
| `lastName` | String | Optional |
| `emailId` | String | Required, unique, lowercase, valid email |
| `password` | String | Strong password validation |
| `age` | Number | Minimum 18 |
| `gender` | String | `Male`, `Female`, or `Other` |
| `photoUrl` | String | Valid URL, default avatar |
| `about` | String | Default bio text |
| `skills` | [String] | Array of skill tags |
| `createdAt` / `updatedAt` | Date | Auto-managed timestamps |

**Instance Methods:**
- `getJWT()` — Signs and returns a JWT with user `_id`, 8h expiry
- `validatePassword(password)` — Compares input password with stored bcrypt hash

### ConnectionRequest Schema

| Field | Type | Constraints |
|-------|------|-------------|
| `fromUserId` | ObjectId | Ref: User, required |
| `toUserId` | ObjectId | Ref: User, required |
| `status` | String | `ignored`, `interested`, `accepted`, `rejected` |
| `createdAt` / `updatedAt` | Date | Auto-managed timestamps |

**Validations & Indexes:**
- Compound index on `{ fromUserId, toUserId }` for fast duplicate detection
- Pre-save hook prevents sending a request to yourself

---

## API Reference

### Auth Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/signup` | No | Register a new user |
| `POST` | `/login` | No | Authenticate and receive JWT cookie |
| `POST` | `/logout` | No | Clear JWT cookie |

#### Signup — Request Body

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "emailId": "john@example.com",
  "password": "StrongPass@123",
  "age": 25,
  "gender": "Male"
}
```

#### Login — Request Body

```json
{
  "emailId": "john@example.com",
  "password": "StrongPass@123"
}
```

---

### Profile Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/profile/view` | Yes | Get logged-in user's profile |
| `PATCH` | `/profile/edit` | Yes | Update allowed profile fields |

#### Editable Fields

`firstName`, `lastName`, `emailId`, `age`, `gender`, `about`, `skills`, `photoUrl`

#### Edit Profile — Request Body (example)

```json
{
  "about": "Full-stack developer passionate about Node.js",
  "skills": ["JavaScript", "Node.js", "React", "MongoDB"],
  "photoUrl": "https://example.com/photo.jpg"
}
```

---

### Connection Request Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/request/send/:status/:toUserId` | Yes | Send a connection request |
| `POST` | `/request/review/:status/:requestId` | Yes | Accept or reject a received request |

#### Send Request — Status Values

| Status | Meaning |
|--------|---------|
| `interested` | User wants to connect (swipe right) |
| `ignored` | User is not interested (swipe left) |

```
POST /request/send/interested/64a1b2c3d4e5f6789012345
POST /request/send/ignored/64a1b2c3d4e5f6789012345
```

#### Review Request — Status Values

| Status | Meaning |
|--------|---------|
| `accepted` | Approve the incoming request |
| `rejected` | Decline the incoming request |

```
POST /request/review/accepted/64a1b2c3d4e5f6789012345
POST /request/review/rejected/64a1b2c3d4e5f6789012345
```

**Business Rules:**
- Cannot send duplicate requests (checks both directions)
- Cannot send a request to yourself
- Only the recipient (`toUserId`) can review a request
- Only requests with status `interested` can be reviewed

---

### User Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/user/requests/received` | Yes | Pending requests sent to logged-in user |
| `GET` | `/user/connections` | Yes | All accepted connections |
| `GET` | `/feed` | Yes | Discover new developers (paginated) |

#### Feed — Query Parameters

| Param | Default | Max | Description |
|-------|---------|-----|-------------|
| `page` | 1 | — | Page number |
| `limit` | 10 | 50 | Users per page |

```
GET /feed?page=1&limit=10
```

---

## Authentication

DevTinder uses **JWT (JSON Web Token)** authentication with **HTTP cookies**.

| Detail | Value |
|--------|-------|
| Token storage | Cookie named `token` |
| Token expiry | 8 hours |
| Secret key | Defined in `user.js` and `auth.js` middleware |
| Protected routes | Use `userAuth` middleware |

### How It Works

1. On signup/login, server generates JWT containing `{ _id: userId }`
2. Token is sent to client as a cookie
3. Client includes cookie automatically on subsequent requests (`credentials: true`)
4. `userAuth` middleware reads cookie, verifies JWT, loads user, and sets `req.user`
5. Route handlers access the authenticated user via `req.user`

### Frontend Fetch Example

```javascript
fetch('http://localhost:3000/profile/view', {
  method: 'GET',
  credentials: 'include',  // Required to send cookies
});
```

---

## Connection Request Lifecycle

```
                    ┌─────────────┐
                    │  interested │  ◄── User A sends request to User B
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
       ┌────────────┐            ┌────────────┐
       │  accepted  │            │  rejected  │
       └────────────┘            └────────────┘
       (Both users appear        (Request closed,
        in each other's           no connection)
        connections list)

       ┌────────────┐
       │   ignored  │  ◄── User A swipes left (no review needed)
       └────────────┘
       (User hidden from feed)
```

| Status | Set By | Next Action |
|--------|--------|-------------|
| `interested` | Sender | Recipient can accept/reject |
| `ignored` | Sender | Final — user excluded from feed |
| `accepted` | Recipient | Both users become connections |
| `rejected` | Recipient | Final — request closed |

---

## Feed Algorithm

The `/feed` endpoint returns developers the logged-in user has **not yet interacted with**:

1. Fetch all connection requests involving the logged-in user (any status)
2. Build a set of user IDs to hide (self + all users in existing requests)
3. Query users excluding hidden IDs
4. Apply pagination (`skip` / `limit`)
5. Return selected fields: `firstName`, `lastName`, `skills`, `about`, `gender`, `age`

This ensures users only see **new, undiscovered profiles** in their feed.

---

## Error Handling

| Scenario | HTTP Status | Example Response |
|----------|-------------|------------------|
| Missing/invalid token | 401 | `{ "message": "Unauthorized" }` |
| Validation failure | 400 | `{ "message": "Error creating user", "error": "..." }` |
| User not found | 400 | `{ "message": "Error logging in", "error": "User not found" }` |
| Duplicate connection | 400 | `{ "message": "Connection request already exists" }` |
| Invalid status param | 400 | `{ "message": "Invalid status value" }` |
| Request not found | 404 | `{ "message": "Connection request not found" }` |

---

## Frontend Integration

This backend is designed to work with a React/Vite frontend running on **http://localhost:5173**.

CORS is configured with:

```javascript
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
```

Ensure your frontend:
- Sends requests with `credentials: 'include'`
- Points API calls to `http://localhost:3000`

---

## Resume Points

Use these bullet points when adding DevTinder to your resume. Pick 3–5 that best match the role you are applying for.

### Backend & API Development

- Built a **RESTful API** with **Node.js** and **Express.js** for a developer networking platform, supporting user auth, profile management, and real-time connection workflows
- Designed and implemented **12+ API endpoints** across authentication, profile, connection requests, and a paginated discovery feed
- Structured backend using **MVC-style architecture** with separate routers, middleware, models, and validation utilities for maintainability

### Authentication & Security

- Implemented **JWT-based authentication** with **HTTP-only cookies** for secure, stateless session management (8-hour token expiry)
- Secured user passwords using **bcrypt hashing** (10 salt rounds) before database storage
- Built reusable **`userAuth` middleware** to protect routes and inject authenticated user context into request handlers

### Database & Data Modeling

- Modeled relational data in **MongoDB** using **Mongoose ODM** with schema validation, compound indexes, and pre-save hooks
- Designed a **ConnectionRequest** schema with status lifecycle (`interested` → `accepted`/`rejected`) and bidirectional duplicate prevention
- Used **MongoDB populate** to efficiently fetch related user data in connection and request queries

### Business Logic & Features

- Developed a **smart feed algorithm** that excludes self and previously interacted users using Set-based filtering and cursor pagination
- Implemented a full **connection request lifecycle** — send, receive, accept, reject, and ignore — with role-based authorization (only recipients can review)
- Added comprehensive **input validation** for email, password strength, age, gender, and URL fields using validator.js and custom Mongoose validators

### DevOps & Integration

- Configured **CORS** with credential support for seamless integration with a **React/Vite** frontend
- Set up **MongoDB Atlas** cloud database and modular database connection layer for production readiness
- Used **nodemon** for development hot-reload and organized npm scripts for local development workflow

### One-Liner (for project title line on resume)

> **DevTinder** — Full-stack developer networking platform backend (Node.js, Express, MongoDB, JWT) with auth, profile management, connection requests, and paginated discovery feed

---

## Author

**Anurag Yadav**

---

## License

ISC
