import * as admin from "firebase-admin";
import path from "path";

// Initialize Firebase Admin SDK
// Check if Firebase app is already initialized to avoid re-initialization errors
if (!admin.apps.length) {
  const serviceAccountPath = path.resolve(
    __dirname,
    "/var/www/rozIPS_backend/rpzaps-firebase-adminsdk-fbsvc-807622884e.json"
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
}

const fcmService = {
  send: async (message: admin.messaging.Message) => {
    try {
      const response = await admin.messaging().send(message);
      console.log("Successfully sent message:", response);
      return response;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },
};

export default fcmService;
