import { Router } from "express";
import {
  getMyNotifications,
  markAsRead,
  getUnreadNotificationCount,
  //   sendNotification1,
} from "../controllers/notificationController";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/me", auth, getMyNotifications);
router.put("/:id/read", auth, markAsRead);
router.get("/unread/count", auth, getUnreadNotificationCount);
// router.post("/send", auth, sendNotification1);

export default router;
