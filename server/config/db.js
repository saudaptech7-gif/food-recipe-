// eslint-disable-next-line no-undef
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // eslint-disable-next-line no-undef
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    // eslint-disable-next-line no-undef
    process.exit(1);
  }
};

// eslint-disable-next-line no-undef
module.exports = connectDB;