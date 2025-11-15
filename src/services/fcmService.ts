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
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCvG0+cxZFNX/Ph\nTu71RKSqUu6TlUfqrIF2jFDVUPeu0IEhOyu2iV67gf0VOqdWaX7HhHIp8icXhRwA\nicIxH8jz2RZNREhuXg7XRSDJrJbR44aIVtO4jKkMzj0ONKHogHf8Gbsy4FHNyfFG\nr7EjuzKApkESbgRKMUaCNfMWjwxkStqkVcWeElPR6QmgaxNrt4WI8FWip/S2D3oZ\ns0kRTjvWIEI/XOS+KVWQsS0Q3emqPVcxvOfN1P0v13eN+PZ7gyMFB/9TCOhB806p\n/wbG8PjXkvibVQkpuwFlpLIQgaCuz8bESIxwxVxazptJiTfqNRjLL2h7wUmry5fA\nCE1YedvXAgMBAAECggEANkqJ9wn8gJh49YjzJuGHCnYXGXQF7blZlIdxwonNmYp1\nFvgRGBHkaM+nR889NdoUoEis2tuFClJPec08g92egRh0RTWgHXQVNuJshYr44g+g\n1SHSmBwoh9tj68Ue1AcM7IGP3HjXdC4iHC/6BKGUSXYCo/Ovac94VIPkoEBu76MP\nfxrzzDKUDD5fFQytWh5aIFMA24NroHmfs3XYzLXOBEBSNc/12Xy4JXAbmUBbJZfw\nLqD77okiUdIwqd1eIH49Uwuq1mfC99bQWSHQuvfveeoZPZ5eM8sf6E2M3N6Dh/Ou\nCxMQJ/xwbiGCZ804cvuMi3r0DaVenFhpm5JBzllqKQKBgQDvF8EPU/pnYOj7Zep1\nJ+dKZpWWoqJRy7/PjCn1cTXbLfzxgBvuIk0e1VymIwxiDtTEp1dGPByHeWgWrFO5\n+pt+fB8kNu4qdNz5o2P0FPyKsFkHFKI3ziQED2YXMGSGq2acAXP9iS2aRRo11mhX\n+Nr7eHkC+YiWBrgxNEBlijCIKQKBgQC7fTrgxT3JN7PChHXEAcmDRbetqfzxBb+C\nX9vu7EdJPcgOlUkEppmKI8OihaCkQDyWNllG/YiMdDQR8YAlUTug0IiT7Q89iDms\n7yUU0H+T5QZ8/2sQX+aXmMKWValTqMXZhW3U3wFsvxH6ryJ1hMnqVezZC0v0ps7N\nEYSmEHPD/wKBgH/0JXTPi4XBvk20OCpkpYoSpmGMPfQqZ0dqipX49UqMLP8NgWUK\n5Fzo8IFU5m6f40wvBiznRJlX5tWjeddg/9BMGtplr0X3br8GqxpYFOMgBzUb3Mii\nwHGP0CH+2v2bQvmgaXO48zfJXYKMcSELZB4KVjC6XFd11yM2BHSS5PApAoGAO0je\n/EICRoUhh0mBP4hdIvBBo11UCRaLNvt+vO7jn6o0fz//RcQ0WrTyYIqmgCl7vvfS\nhRsYOWlpKZ9WqPYlx7UI6tWT8x4HNsKr1AgVvzs1MQNG5Heen6MDLKxLjZOZdC23\nzA70EWHdmooUeFqTylB/QyZKT0MLs1ZtvmEHahsCgYEAjVZpPryN2tgj2dadsNq+\nfcj/8uREg7Ib5+qrOZBpG2p4eKodiMyaom5SLA/nykTIi3jSOlr8jqyJRW7qYIfi\nhinRzTXdKJw2G8BJCPgG5wC87Dn3Gr1grx6vsZUr/x5spOJysofLu/xVAxbvIGn1\nbF6Mz8Wu6kQhq0b00f/ba0c=\n-----END PRIVATE KEY-----\n",
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
