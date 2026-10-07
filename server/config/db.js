/* eslint-disable no-undef */

const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    isConnected = true;

    console.log("MongoDB connected successfully");
  } catch (error) {
    isConnected = false;

    console.error("MongoDB connection failed:", error.message);

    throw error;
  }
};

module.exports = connectDB;
