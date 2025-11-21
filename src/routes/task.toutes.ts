import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
  updateTaskStatus,
} from "../controllers/task.controller";
import { auth, isManager, isInstaller } from "../middlewares/auth.middleware";
import upload from "../middlewares/upload.middleware";

const router = Router();

router.post("/", auth, isManager, createTask);
router.get("/", auth, isManager, getTasks);
router.get("/my", auth, isInstaller, getTaskById);
router.put("/:id", auth, isManager, updateTask);
router.put("/:id/status", auth, upload.single("image"), updateTaskStatus);
router.delete("/:id", auth, isManager, deleteTask);

export default router;
