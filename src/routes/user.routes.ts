import { Router } from "express";
import {
  createUser,
  getUsers,
  getUserStats,
  toggleUserStatus,
  updateUser,
} from "../controllers/user.controller";
import { auth, isManager } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", auth, isManager, createUser);
router.get("/", auth, isManager, getUsers);
router.get("/stats/:id", auth, isManager, getUserStats);
router.put("/:id/toggle-status", auth, isManager, toggleUserStatus);
router.put("/:id", auth, updateUser);

export default router;
