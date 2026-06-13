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
- Node.js 
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
