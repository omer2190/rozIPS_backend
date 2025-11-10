import User, { IUser } from "../models/User";
import { sendNotification } from "../controllers/notificationController";

// In a real app, this would integrate with a service like FCM, APN, or a WebSocket service.
// For now, we will simulate the notification sending by logging to the console.

interface NotificationPayload {
  title: string;
  body: string;
  leadId?: string;
}

class NotificationService {
  /**
   * Sends a notification to a single user.
   * @param userId - The ID of the user to notify.
   * @param payload - The notification content.
   */
  async sendToUser(
    userId: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (user) {
        console.log(`--- Sending Notification ---`);
        console.log(`Recipient: ${user.name} (${user.username})`);
        console.log(`Title: ${payload.title}`);
        console.log(`Body: ${payload.body}`);
        if (payload.leadId) {
          console.log(`Lead ID: ${payload.leadId}`);
        }
        console.log(`--------------------------`);
        await sendNotification(
          userId,
          payload.title,
          payload.body,
          payload.leadId
        );
      }
    } catch (error) {
      console.error(`Failed to send notification to user ${userId}`, error);
    }
  }

  /**
   * Sends a notification to all users with a specific role (or roles).
   * @param roles - An array of roles to target.
   * @param payload - The notification content.
   * @param excludeUserIds - An array of user IDs to exclude from the notification.
   */
  async sendToRoles(
    roles: Array<"manager" | "marketer" | "installer">,
    payload: NotificationPayload,
    excludeUserIds: string[] = []
  ): Promise<void> {
    try {
      const usersToNotify = await User.find({
        role: { $in: roles },
        _id: { $nin: excludeUserIds },
      });

      console.log(
        `--- Sending Notifications to Roles: ${roles.join(", ")} ---`
      );
      for (const user of usersToNotify) {
        this.sendToUser(user.id, payload);
      }
      console.log(`--------------------------------------------------`);
    } catch (error) {
      console.error(
        `Failed to send notifications to roles ${roles.join(", ")}`,
        error
      );
    }
  }
}

export default new NotificationService();
