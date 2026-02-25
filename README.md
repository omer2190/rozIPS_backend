# Roz IPS Backend — باك إند نظام Roz ISP

خادم RESTful مكتوب بـ TypeScript/Node.js لتشغيل تطبيق Roz ISP (نظام إدارة خدمات الإنترنت). يوفر API لإدارة العملاء المحتملين (Leads)، المستخدمين والأدوار، المهام الميدانية، الإشعارات، والتقارير التحليلية، مع دعم رفع الصور ونشر تلقائي عبر webhook.

---

## لمحة عامة (Overview)

هذا المستودع يحتوي على باك إند لخدمة تطبيق Roz ISP. الباك إند مبني باستخدام Express + TypeScript، ويتصل بقاعدة بيانات MongoDB عبر Mongoose. يستخدم النظام JWT للمصادقة، Firebase Admin لإرسال الإشعارات (FCM)، وMulter لإدارة رفع الملفات.

المشروع يدعم واجهات مخصّصة للأدوار: `manager`, `marketer`, `installer`, `owner` — مع سياسات وصول (middlewares) واضحة.

---

## مفهوم المشروع (Concept)

تطبيق ميداني لإدارة العمل في شركات ISP — يجمع بيانات العملاء المحتملين، يهيّئ مهام التركيب للفنيين، ويسمح للمدراء بمراقبة الأداء وإصدار تقارير. الباك إند هو قلب النظام الذي ينفذ قواعد العمل (business logic)، يرسل إشعارات لحظية، ويتكامل مع التخزين المحلي لملفات الرفع.

---

## المزايا والقدرات الرئيسية

- REST API لعمليات CRUD على Leads, Users, Tasks, Notifications و Reports.
- مصادقة باستخدام JWT وتفويض أدوار (role-based access control).
- رفع واسترجاع صور (Multer + مجلد `uploads`).
- إرسال إشعارات عبر Firebase Cloud Messaging (باستخدام `firebase-admin`).
- تجميع بيانات وتحليل (aggregation) في MongoDB لتقارير أداء المسوقين والفنيين.
- نقطة webhook لنشر التحديثات (deployment) عن طريق تنفيذ سكربت نشر آمن.
- TypeScript لتقليل الأخطاء وتحسين صيانة الكود.

---

## بنية المشروع (Project Structure)

```
src/
├── config/         — إعداد الاتصال بقاعدة البيانات وملفات التهيئة
├── controllers/    — منطق التعامل مع الطلبات (اقتران الـ routes)
├── middlewares/    — مصادقة، تفويض، ورفع ملفات
├── models/         — مخططات Mongoose (User, Lead, Task, Notification, ...)
├── routes/         — تعريف مسارات الـ API (auth, leads, users, reports, upload, notifications, tasks)
├── services/       — خدمات داخلية (مثل إرسال الإشعارات)
└── server.ts       — نقطة البداية، تهيئة السيرفر والـ routes
uploads/             — مجلد ثابت لحفظ الملفات المرفوعة
```

---

## نظرة على نقاط النهاية (API Endpoints) — أمثلة

> راجع ملفات `src/routes/*.ts` للمزيد من التفاصيل.

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| POST | `/api/auth/login` | تسجيل دخول، يعيد JWT |
| GET | `/api/auth/me` | بيانات المستخدم المصادق عليه |
| POST | `/api/leads` | إنشاء lead (مع دعم رفع صورة) |
| GET | `/api/leads/mine` | جلب leads للـ marketer |
| GET | `/api/leads/all` | جلب كل الـ leads (manager) |
| PUT | `/api/leads/:id/assign` | تعيين lead لفني |
| PUT | `/api/leads/:id/install` | رفع تقرير التركيب من installer |
| POST | `/api/tasks` | إنشاء مهمة (manager) |
| GET | `/api/tasks` | جلب المهام (manager) |
| GET | `/api/tasks/my` | جلب مهام الفني الحالي |
| GET | `/api/reports/marketers` | تقرير أداء المسوقين (aggregation) |
| GET | `/api/notifications/me` | جلب الإشعارات للمستخدم |
| POST | `/api/deploy` | webhook لتشغيل سكربت النشر (`deploy.sh`) |

---

## التقنيات المستخدمة (Tech Stack)

| التقنية | الدور |
|---------|-------|
| Node.js + TypeScript | بيئة التشغيل ولغة البرمجة |
| Express.js | إطار عمل الـ API |
| MongoDB + Mongoose | قاعدة البيانات والـ ORM |
| JWT (jsonwebtoken) | المصادقة |
| bcryptjs | تجزئة كلمات السر |
| multer | رفع الملفات |
| firebase-admin | إرسال إشعارات FCM |
| nodemon, ts-node, typescript | أدوات التطوير |

---

## المتطلبات والبيئة (Requirements / Environment)

- Node.js (14+ موصى به) و npm
- MongoDB URI (Atlas أو محلي)
- مفاتيح خدمة Firebase (service account) لتفعيل FCM

**ملف `.env` مقترح:**

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.example.mongodb.net/rozips?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/serviceAccountKey.json
NODE_ENV=development
```

> **تنبيه أمني:** لا تقم بارتكاب (commit) مفاتيح service account أو بيانات حساسة في المستودع العام. استخدم متغيرات البيئة أو secret management في المنصة المستضيفة (Vercel / Heroku / VPS).

---

## تشغيل محلي (Local Setup)

```bash
# 1. انسخ المستودع
git clone https://github.com/omer2190/rozIPS_backend.git

# 2. انتقل للمجلد
cd rozIPS_backend

# 3. ثبّت الحزم
npm install

# 4. أعدّ ملف .env كما في القسم أعلاه

# 5. للتطوير مع إعادة تشغيل تلقائي
npm run dev

# 6. لبناء المشروع وتشغيله
npm run build
npm start
```

---

## النشر (Deployment)

- يحتوي المشروع على endpoint `/api/deploy` الذي يستدعي سكربت نشر (`deploy.sh`). عند استخدام هذا webhook احرص على:
  - التحقق من سر (secret) قادم من GitHub قبل تنفيذ أي أوامر.
  - تشغيل السكربت في المسار الصحيح على الخادم وعدم منح صلاحيات أوسع من المطلوب.
- بدائل النشر: Vercel, Heroku, Docker + CI/CD pipeline.

---

## اعتبارات أمنية ونصائح

- لا ترفع ملفات مفاتيح Firebase إلى GitHub — استخدم secrets/variables في بيئة النشر.
- احرص على إعداد CORS بشكل مقنّن (لا تترك `origin: "*"`) في الإنتاج.
- عيّن صلاحيات مجلد `uploads` وراقب حجم ونوع الملفات المسموح بها.
- اجعل `JWT_SECRET` قويًا وتحقق من صلاحيات المستخدم قبل العمليات الحرجة (`isManager`, `isInstaller`, ...).
- سجّل النشاط (logging) والأخطاء في نظام مركزي عند الحاجة (مثلاً Sentry أو ملف لوجات).

---

## كيفية المساهمة (Contributing)

- افتح Issue لوصف المشكلة أو الاقتراح.
- انسخ (fork) المستودع، أنشئ فرع feature، ارفع Pull Request مع وصف التغييرات.
- التزم بأنماط الكود TypeScript والـ linter المتبع إن وُجد.

---

## الاتصال

- **GitHub:** [https://github.com/omer2190](https://github.com/omer2190)

