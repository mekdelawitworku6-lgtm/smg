# SMG Salon Management System

A modern salon management application designed for cashier and admin workflows. The system supports service selection, staff assignment, transaction recording, expense tracking, daily summaries, offline transaction support, and role-based access for salon operations.

## Features

- Role-based authentication for cashiers and admins
- Transaction creation with service and staff selection
- Multiple payment methods including cash and digital payments
- Expense tracking and daily summaries
- Offline transaction support with automatic sync when the connection is restored
- Progressive Web App (PWA) support for a mobile-friendly experience
- Multi-language UI support
- Admin dashboard for managing services, staff, and reports

## Tech Stack

### Frontend
- React
- Vite
- Redux Toolkit
- React Router
- Dexie for offline storage
- PWA support

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- bcrypt for password hashing

## Project Structure

```bash
salon-backend/
  src/
    controllers/
    models/
    routes/
    services/
    middleware/
    config/

salon-frontend/
  src/
    components/
    pages/
    store/
    services/
    offline/
    i18n/
```

## Screenshots

You can add screenshots of the dashboard, transaction form, and admin views to showcase the app experience.

Example sections:

- Dashboard overview
- Cashier transaction flow
- Admin reports and management view

> Tip: Place image files in a folder such as assets/screenshots/ and reference them here.

## Demo

A live demo is planned for the project. In the meantime, you can run the app locally using the instructions below.

### Demo Flow
1. Start the backend server.
2. Start the frontend development server.
3. Log in with a cashier or admin account.
4. Create a transaction, review the summary, and test offline behavior.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB running locally or remotely

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd SMG
```

### 2. Set up the backend

```bash
cd salon-backend
npm install
```

Create a `.env` file in the backend folder with the following variables:

```env
PORT=10000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Start the backend server:

```bash
npm run dev
```

### 3. Set up the frontend

```bash
cd ../salon-frontend
npm install
npm run dev
```

The frontend will be available at the local Vite URL shown in the terminal.

## Available Scripts

### Backend
- `npm run dev` – start the backend in development mode
- `npm start` – start the backend server
- `npm run seed` – seed demo data

### Frontend
- `npm run dev` – start the Vite development server
- `npm run build` – build the production bundle
- `npm run preview` – preview the production build
- `npm run lint` – run ESLint

## Usage

- Log in as a cashier or admin
- Create transactions for salon services
- Review daily transaction and expense summaries
- Use offline capabilities when the internet is unstable
- Monitor reports and salon activity from the admin panel

## License

This project is licensed under the ISC License.
