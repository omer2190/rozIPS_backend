import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import leadRoutes from "./routes/lead.routes";
import userRoutes from "./routes/user.routes";
import reportRoutes from "./routes/report.routes";
import uploadRoutes from "./routes/upload.routes";
import notificationRoutes from "./routes/notification.routes";
import { exec } from "child_process";

dotenv.config();

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(cors());
app.use(express.json());

// جعلة يستقبل الاتصال من اي موقع ويب

app.use(
  cors({
    origin: "*", // يمكنك تعديل هذا إلى النطاقات المسموح بها فقط
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Serve static files from the "uploads" directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => res.send("API is running..."));

// Define Routes
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes);

app.post("/api/deploy", (req, res) => {
  // 1. (اختياري لكن موصى به) التحقق من الـ Secret Key من GitHub هنا لضمان الأمان

  console.log("Received GitHub Webhook. Starting deployment...");

  // 2. تشغيل سكربت النشر
  exec(
    "./deploy.sh",
    { cwd: "/var/www/rozIPS_backend" },
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).send("Deployment Failed");
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      res.status(200).send("Deployment script executed.");
    }
  );
});

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server started on port ${PORT}`)
);

export default app;
