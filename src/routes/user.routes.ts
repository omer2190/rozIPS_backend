import { Router } from "express";
import {
  createUser,
  getUsers,
  getUserStats,
} from "../controllers/user.controller";
import { auth, isManager } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", auth, isManager, createUser);
router.get("/", auth, isManager, getUsers);
router.get("/stats/:id", auth, isManager, getUserStats);

export default router;
