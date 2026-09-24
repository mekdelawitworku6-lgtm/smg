import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || "postgres://salon:salonpass@localhost:5433/salonDB";

export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
  pool: { max: 10, min: 0, idle: 10000 },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL Connected");
    await sequelize.sync();
    console.log("Tables synced");
  } catch (error) {
    console.error("DB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;