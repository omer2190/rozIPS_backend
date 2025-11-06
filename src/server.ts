import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import leadRoutes from "./routes/lead.routes";
import userRoutes from "./routes/user.routes";
import reportRoutes from "./routes/report.routes";
import User from "./models/User";

dotenv.config();

const app = express();

// Connect Database
const startServer = async () => {
  await connectDB();

  // Create default manager if it doesn't exist
  try {
    const managerExists = await User.findOne({ role: "manager" });
    if (!managerExists) {
      const manager = new User({
        username: "manager",
        password: "password123",
        name: "Default Manager",
        role: "manager",
        phone: "0000000000", // Make sure this is unique
        isActive: true,
      });
      await manager.save();
      console.log(
        'Default manager account created. Username: "manager", Password: "password123"'
      );
    }
  } catch (error) {
    console.error("Error creating default manager:", error);
  }

  // Init Middleware
  app.use(cors());
  app.use(express.json());

  // app.use("/uploads", express.static("uploads"));

  app.get("/", (req, res) => res.send("API is running..."));

  // Define Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/leads", leadRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/reports", reportRoutes);

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () =>
    console.log(
      `Server started on host ${
        process.env.HOST || "localhost"
      } and port ${PORT}`
    )
  );
};

startServer();
