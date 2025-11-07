import { Router } from "express";
import {
  createUser,
  getUsers,
  getUserStats,
  toggleUserStatus,
} from "../controllers/user.controller";
import { auth, isManager } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", auth, isManager, createUser);
router.get("/", auth, isManager, getUsers);
router.get("/stats/:id", auth, isManager, getUserStats);
router.put("/:id/toggle-status", auth, isManager, toggleUserStatus);

export default router;
