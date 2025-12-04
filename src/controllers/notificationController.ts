import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import Notification from "../models/notification";
import User from "../models/User";
import fcmService from "../services/fcmService";

// @route   GET api/notifications/me
// @desc    Get all notifications for the authenticated user
// @access  Private
export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ recipient: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(20); // Limit to last 20 notifications
    //اجعل الاشعارات مقروءة
    await Notification.updateMany(
      { recipient: req.user!.id, read: false },
      { $set: { read: true } }
    );

    res.json(notifications);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};

// @route   PUT api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user!.id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "الإشعار غير موجود" });
    }

    res.json({ message: "تم وضع علامة مقروء على الإشعار", notification });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};

// @route   GET api/notifications/unread/count
// @desc    Get the count of unread notifications for the authenticated user
// @access  Private
export const getUnreadNotificationCount = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user!.id,
      read: false,
    });

    res.json({ count });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};

// @route   POST api/notifications/send
// @desc    Send a notification to a user
// @access  Private
// export const sendNotification1 = async (req: AuthRequest, res: Response) => {
//   const { recipientId, title, body, leadId } = req.body;

//   try {
//     await sendNotification(recipientId, title, body, leadId);
//     res.status(200).json({ message: "تم إرسال الإشعار بنجاح" });
//   } catch (err: any) {
//     console.error(err.message);
//     res.status(500).send({ message: "خطأ في الخادم" });
//   }
// };

// دالة داخلية لارسال الاشعار عن طريق فاير بيس وتسجيل الاشعار في قاعدة البيانات
export const sendNotification = async (
  recipientId: string,
  title: string,
  body: string,
  leadId?: string
) => {
  try {
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.fcm) {
      console.log(`المستخدم ${recipientId} غير موجود أو لا يحتوي على رمز FCM.`);
      return;
    }
    // إنشاء سجل الإشعار في قاعدة البيانات
    const newNotification = new Notification({
      recipient: recipientId,
      title,
      body,
      lead: leadId,
    });
    await newNotification.save();
    // إرسال الإشعار عبر FCM
    const message = {
      notification: {
        title,
        body,
      },
      token: recipient.fcm,
    };
    // استدعاء خدمة FCM لإرسال الإشعار (يجب تنفيذ هذه الخدمة)
    await fcmService.send(message);
    console.log(`إرسال إشعار إلى المستخدم ${recipientId}: ${title} - ${body}`);
  } catch (err: any) {
    console.error(
      `خطأ أثناء إرسال الإشعار إلى المستخدم ${recipientId}:`,
      err.message
    );
  }
};
