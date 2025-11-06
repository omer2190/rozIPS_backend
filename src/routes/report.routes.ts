import { Router } from "express";
import {
  getMarketerPerformance,
  getEmployeePerformance,
} from "../controllers/report.controller";
import { auth, isManager } from "../middlewares/auth.middleware";

const router = Router();

router.get("/marketers", auth, isManager, getMarketerPerformance);
router.get("/employees", auth, isManager, getEmployeePerformance);

export default router;
