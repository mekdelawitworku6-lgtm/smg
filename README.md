# SMG Salon Management System

A modern salon management application for cashier and admin workflows. The system supports service selection, staff assignment, transaction recording, expense tracking, daily summaries, offline transaction support, and role-based access for salon operations.

## Features

- Role-based authentication for cashiers and admins
- Transaction creation with service and staff selection
- Multiple payment methods including cash and digital payments
- Expense tracking and daily summaries
- Offline transaction support with automatic sync when the connection is restored
- Progressive Web App (PWA) support for a mobile-friendly experience
- Multi-language UI support
- Admin dashboard for managing services, staff, and reports

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

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB running locally or remotely

### Backend
```bash
cd salon-backend
npm install
```

Create a `.env` file in the backend folder:

```env
PORT=10000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Start the backend server:

```bash
npm run dev
```

### Frontend
```bash
cd salon-frontend
npm install
npm run dev
```

## License

This project is licensed under the ISC License.
