// fcmService.ts

import * as admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// 🛑 تحذير: هذا الأسلوب أقل أمانًا لأنه يضع المفتاح الخاص في شفرة المصدر.
// يفضل استخدامه فقط في بيئات التطوير أو إذا لم يكن هناك خيار آخر.

const FIREBASE_SERVICE_ACCOUNT_OBJECT = {
  type: "service_account",
  project_id: "rpzaps",
  private_key_id: "4f6b8674fdf633fc5d43c7b3e31548b28c14957e",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCvG0+cxZFNX/Ph\nTu71RKSqUu6TlUfqrIF2jFDVUPeu0IEhOyu2iV67gf0VOqdWaX7HhHIp8icXhRwA\nicIxH8jz2RZNREhuXg7XRSDJrJbR44aIVtO4jKkMzj0ONKHogHf8Gbsy4FHNyfFG\nr7EjuzKApkESbgRKMUaCNfMWjwxkStqkVcWeElPR6QmgaxNrt4WI8FWip/S2D3oZ\ns0kRTjvWIEI/XOS+KVWQsS0Q3emqPVcxvOfN1P0v13eN+PZ7gyMFB/9TCOhB806p\n/wbG8PjXkvibVQkpuwFlpLIQgaCuz8bESIxwxVxazptJiTfqNRjLL2h7wUmry5fA\nCE1YedvXAgMBAAECggEANkqJ9wn8gJh49YjzJuGHCnYXGXQF7blZlIdxwonNmYp1\nFvgRGBHkaM+nR889NdoUoEis2tuFClJPec08g92egRh0RTWgHXQVNuJshYr44g+g\n1SHSmBwoh9tj68Ue1AcM7IGP3HjXdC4iHC/6BKGUSXYCo/Ovac94VIPkoEBu76MP\nfxrzzDKUDD5fFQytWh5aIFMA24NroHmfs3XYzLXOBEBSNc/12Xy4JXAbmUBbJZfw\nLqD77okiUdIwqd1eIH49Uwuq1mfC99bQWSHQuvfveeoZPZ5eM8sf6E2M3N6Dh/Ou\nCxMQJ/xwbiGCZ804cvuMi3r0DaVenFhpm5JBzllqKQKBgQDvF8EPU/pnYOj7Zep1\nJ+dKZpWWoqJRy7/PjCn1cTXbLfzxgBvuIk0e1VymIwxiDtTEp1dGPByHeWgWrFO5\n+pt+fB8kNu4qdNz5o2P0FPyKsFkHFKI3ziQED2YXMGSGq2acAXP9iS2aRRo11mhX\n+Nr7eHkC+YiWBrgxNEBlijCIKQKBgQC7fTrgxT3JN7PChHXEAcmDRbetqfzxBb+C\nX9vu7EdJPcgOlUkEppmKI8OihaCkQDyWNllG/YiMdDQR8YAlUTug0IiT7Q89iDms\n7yUU0H+T5QZ8/2sQX+aXmMKWValTqMXZhW3U3wFsvxH6ryJ1hMnqVezZC0v0ps7N\nEYSmEHPD/wKBgH/0JXTPi4XBvk20OCpkpYoSpmGMPfQqZ0dqipX49UqMLP8NgWUK\n5Fzo8IFU5m6f40wvBiznRJlX5tWjeddg/9BMGtplr0X3br8GqxpYFOMgBzUb3Mii\nwHGP0CH+2v2bQvmgaXO48zfJXYKMcSELZB4KVjC6XFd11yM2BHSS5PApAoGAO0je\n/EICRoUhh0mBP4hdIvBBo11UCRaLNvt+vO7jn6o0fz//RcQ0WrTyYIqmgCl7vvfS\nhRsYOWlpKZ9WqPYlx7UI6tWT8x4HNsKr1AgVvzs1MQNG5Heen6MDLKxLjZOZdC23\nzA70EWHdmooUeFqTylB/QyZKT0MLs1ZtvmEHahsCgYEAjVZpPryN2tgj2dadsNq+\nfcj/8uREg7Ib5+qrOZBpG2p4eKodiMyaom5SLA/nykTIi3jSOlr8jqyJRW7qYIfi\nhinRzTXdKJw2G8BJCPgG5wC87Dn3Gr1grx6vsZUr/x5spOJysofLu/xVAxbvIGn1\nbF6Mz8Wu6kQhq0b00f/ba0c=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@rpzaps.iam.gserviceaccount.com",
  client_id: "106539034704480510393",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40rpzaps.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

// Initialize Firebase Admin SDK
// Check if Firebase app is already initialized to avoid re-initialization errors
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // ✅ تمرير الكائن مباشرة إلى admin.credential.cert()
      credential: admin.credential.cert(
        FIREBASE_SERVICE_ACCOUNT_OBJECT as admin.ServiceAccount
      ),
    });
    console.log(
      "Firebase Admin SDK initialized successfully using embedded object."
    );
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    throw error;
  }
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
