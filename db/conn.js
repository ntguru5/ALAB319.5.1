import mongoose from "mongoose";
import "dotenv/config";

// connect to database
await mongoose.connect(process.env.ATLAS_URI);
console.log("Connected to database");

const db = mongoose.connection;

export default db;
