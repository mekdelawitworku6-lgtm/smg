import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("MONGO_URI is not set in environment variables.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop problematic uuid_1 index that blocks user creation
    try {
      await conn.connection.db.collection("users").dropIndex("uuid_1");
      console.log("Dropped uuid_1 index from users collection");
    } catch {
      // Index may not exist, that's fine
    }
  } catch (error) {
    console.error("DB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
