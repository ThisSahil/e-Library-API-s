import mongoose from "mongoose";
import { config } from "./config";

const connectToDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("DB connected");
    });

    mongoose.connection.on("error", () => {
      console.log("DB connection failed");
    });
    await mongoose.connect(config.dbConnectionString as string);
  } catch (error) {
    console.log("Failed to connect to DB ", error);
    process.exit(1);
  }
};

export default connectToDB;
