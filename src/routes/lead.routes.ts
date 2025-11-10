import { Router } from "express";
import {
  createLead,
  getMyLeads,
  getAllLeads,
  assignLead,
  updateLeadStatus,
  submitInstallation,
  getInstallerTasks,
  getMyTasks,
  getLeadCounts,
} from "../controllers/lead.controller";
import {
  auth,
  isManager,
  isMarketer,
  isInstaller,
} from "../middlewares/auth.middleware";
import upload from "../middlewares/upload.middleware";

const router = Router();

router.post("/", auth, upload.single("Photo"), createLead);
router.get("/mine", auth, isMarketer, getMyLeads);
router.get("/all", auth, isManager, getAllLeads);
router.put("/:id/assign", auth, isInstaller, assignLead);
router.put("/:id/status", auth, isManager, updateLeadStatus);
router.get("/tasks", auth, isInstaller, getInstallerTasks);
router.get("/my", auth, isInstaller, getMyTasks);
router.put("/:id/install", auth, isInstaller, submitInstallation);
router.get("/counts", auth, getLeadCounts);

export default router;
