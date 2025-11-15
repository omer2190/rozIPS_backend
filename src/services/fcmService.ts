// fcmService.ts

import * as admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// 🛑 تحذير: هذا الأسلوب أقل أمانًا لأنه يضع المفتاح الخاص في شفرة المصدر.
// يفضل استخدامه فقط في بيئات التطوير أو إذا لم يكن هناك خيار آخر.

const FIREBASE_SERVICE_ACCOUNT_OBJECT = {
  type: "service_account",
  project_id: "rpzaps",
  private_key_id: "abaa58c6e5d7df69a3938c8cf9c9496763eb0f2e",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDWQp0UHkXcKpyt\n5/Oh5KunQim+HM7nJ0fU4xuMDWPDqbQFViKy5ToGs4TTBjRD27JfY+gmygTsKJTS\ntrFsiBEszlVlllYIY5OlbHPNl0nquqX/dJ9nj3LSRaQsACcfVTcueFiFyv/0J5oW\nwqK7morS0dzct5L6XImj6dbkDT+ucn9KDjg/cBBckyYn8WH4EBd7f7rQxE1K9V1C\nlFjhy3qzmxzG9993iK6wxmMDLayaaZHok4oq9epUSjfOSHza0TwGnB9mIkjhqPrk\nkmaMA1L3mdtmpwFuYPzNGPb3WgUK7uikUVdecuOXy+/+HBI1pB+Idr+N5pkSdPXb\n9f64UdrPAgMBAAECggEAL8O15NBC3qwZNaOp6oNhyO21BI7DiUB2gP0IHRa3EN16\nJl5nad40K15F1A1kBWSqxR0umccbhdIeK0NTFlDXE1gELZtwHnqkZZJh1olNjyiA\n7QwApUOTY1DnIm/+SLvki1WE1n7ExJc3gK9vO8dd/1WNmR7Lg0ix3nq4zyos8iRn\ncOndG8Qq/vjBH7EeyeWcbtXeJgrrhLeOpwOdKYyT1Uf86ZNasU9DfAw85DLJuDHF\nv7RlZm3yMpM5YuzNjakB1Gdt8FWqCrekX6n3z2ojpzfqe79UkmcW/AM1eA4A+mE1\nnJ6sQPUPkGlBHdZyHzL0hbUqtHXCX7sXIIaur30yUQKBgQD/QsY0rl54RBr1Iwo6\nAEAGH1R915gMi3dAtyku6MRMjJugUP0ZtVIxuMUH9JOCYn8uolz2P4l499TfTcrw\nZzNEmLF4LdTfHFehfdKUbVMO+J4rj/9fBnMWXUQfA4KUWInESTMBkXlhPhF+UIug\n4u5ouFFYIda0EUOjjXz3cmhvkwKBgQDW4XIIKfsDGfsUuv1mpRDTAhByavGPo7fy\nKnIifOevpOp9uuhMohzkSsANJT8e6riyGTap4MgSu152W3HwxqCsg7ouQB/QTeRF\nixWecKiSeM4rV1dpdp5uEyKmw1BuRaYUYO5PFCCBKxHacR7CUS8c9MXmiPc1Z9js\nnTiYbKNVVQJ/Af6DjeXO1yGxFDkx20IlPecAwfrtNSvhwp+rsrIe1npCvP3k/E5u\nVfUblPRUMrCSTcr27vWQHWHSR+xTqY0k2WRX/phdEWEnThutiXtRKszGb5Cwbg2e\n2I3h+lwMqRwH94Ca5Wg9ioTxngsDDD65nhfSit24z69S1/RDBavfJQKBgQC+7eLc\nzjBzOQqYCO5P3its0lC62bt53gb77isr6cATmX2h6gmuzfzN/H1ZMNc9KWKjHTQt\nDcW4nzP4BpjfUB5EK2eq4N9jv1ItWMAE4CVowF6wtBK/at6q/+WyN6mn0csYIGif\na0rWeuaKKikij/BE0lll1h2SHovo8mnvRdh7YQKBgQChwRYbU3nf8dudimWM2FRZ\noK6ysRWo1aEOJJF//qJP+5cLEW4aA2MCAZRWwXlNeCzCQzTTaJuOIjaOkc+XYs8h\nRJt2QW2IeiM3uJBGdeETFibl758pUVQx6yskzwCPkxaAMZ3t1jQVRymoxCc03kSm\n+3VECMo4O32WLwLVZ0KsNg==\n-----END PRIVATE KEY-----\n",
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
