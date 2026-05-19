import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/* =======================
   CONNECT TO DATABASE
======================= */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected for Seeding");
    } catch (error) {
        console.error("DB Connection Failed:", error.message);
        process.exit(1);
    }
};

/* =======================
   SCHEMAS (simple version for seeding)
   (You can replace with real models later)
======================= */

const serviceSchema = new mongoose.Schema({}, { strict: false });
const staffSchema = new mongoose.Schema({}, { strict: false });
const transactionSchema = new mongoose.Schema({}, { strict: false });
const expenseSchema = new mongoose.Schema({}, { strict: false });

const Service = mongoose.model("Service", serviceSchema);
const Staff = mongoose.model("Staff", staffSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);
const Expense = mongoose.model("Expense", expenseSchema);

/* =======================
   SEED DATA
======================= */

const services = [
    { name: "Hair Cut", category: "Hair", price: 300 },
    { name: "Hair Wash", category: "Hair", price: 200 },
    { name: "Manicure", category: "Nails", price: 400 }
];

const staff = [
    { name: "Sara", role: "Stylist" },
    { name: "Helen", role: "Nails" },
    { name: "Mimi", role: "Skin Care" }
];

const transactions = [
    {
        uuid: "txn_001",
        serviceName: "Hair Cut",
        category: "Hair",
        price: 300,
        staffName: "Sara",
        paymentType: "Cash",
        status: "completed",
        synced: true
    },
    {
        uuid: "txn_002",
        serviceName: "Manicure",
        category: "Nails",
        price: 400,
        staffName: "Helen",
        paymentType: "Telebirr",
        status: "completed",
        synced: true
    }
];

const expenses = [
    {
        title: "Towels",
        amount: 500,
        paymentType: "Cash"
    },
    {
        title: "Hair Products",
        amount: 1500,
        paymentType: "Transfer"
    }
];

/* =======================
   SEED FUNCTION
======================= */

const seedData = async () => {
    try {
        await connectDB();

        // Clear old data
        await Service.deleteMany();
        await Staff.deleteMany();
        await Transaction.deleteMany();
        await Expense.deleteMany();

        // Insert new data
        await Service.insertMany(services);
        await Staff.insertMany(staff);
        await Transaction.insertMany(transactions);
        await Expense.insertMany(expenses);

        console.log("Seed Data Inserted Successfully 🚀");

        process.exit();
    } catch (error) {
        console.error("Seeding Error:", error);
        process.exit(1);
    }
};

seedData();