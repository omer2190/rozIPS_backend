import { Request, Response } from "express";
import User from "../models/User";
import Lead from "../models/Lead";
import { AuthRequest } from "../middlewares/auth.middleware";
import bcrypt from "bcryptjs";

// @route   POST api/users
// @desc    Create a new user
// @access  Private (Manager)
export const createUser = async (req: Request, res: Response) => {
  const { username, password, name, role, phone } = req.body;

  try {
    let user = await User.findOne({ $or: [{ username }] });
    if (user) {
      return res
        .status(400)
        .json({ message: "يوجد مستخدم بهذا الاسم بالفعل." });
    }

    user = new User({
      username,
      password,
      name,
      role,
      phone,
    });

    await user.save();
    res.status(201).json({ message: "تم إنشاء المستخدم بنجاح." });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};

// @route   GET api/users
// @desc    Get users (can filter by role)
// @access  Private (Manager)
export const getUsers = async (req: Request, res: Response) => {
  const { role } = req.query;
  const filter: any = {};

  if (role) {
    filter.role = role;
  }

  try {
    const users = await User.find(filter).select("-password");
    res.json(users);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};

// @route   PUT api/users/:id
// @desc    Update a user
// @access  Private (Manager)
export const updateUser = async (req: AuthRequest, res: Response) => {
  const userId = req.params.id;
  const { password, name, fcm, role, isActive } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    // تحديث بيانات المستخدم
    if (password) user.password = password;
    if (name) user.name = name;
    if (fcm) user.fcm = fcm;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();
    res.json(user);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({ message: "خطأ في الخادم" });
  }
};

// جلب احصائية على مستخدم معين// جلب احصائية على مستخدم معين (نسخة محسّنة)

// دالة مساعدة لحساب الطوابع الزمنية (timestamps)
const getDates = () => {
  const now = Date.now();
  return {
    dayAgo: new Date(now - 24 * 60 * 60 * 1000),
    weekAgo: new Date(now - 7 * 24 * 60 * 60 * 1000),
    monthAgo: new Date(now - 30 * 24 * 60 * 60 * 1000),
  };
};

export const getUserStats = async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { dayAgo, weekAgo, monthAgo } = getDates();

  try {
    // 1. جلب بيانات المستخدم
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    // 2. تحديد حالة (status) البحث الرئيسية
    const statusToCount = "installed";
    // user.role === "marketer"
    //   ? "new"
    //   :
    // user.role == "installer"
    //   ? "installed"
    //   : // يجلب لكل الحالات للمستخدمين الآخرين
    //     null;

    // **3. استخدام Aggregation Pipeline لتحسين الأداء**
    const matchCondition = {
      $or: [{ createdBy: user._id }, { assignedTo: user._id }],
    };

    // نستخدم $facet لدمج عدة عمليات عد في استعلام واحد
    const [statsResult] = await Lead.aggregate([
      // المرحلة الأولى: تصفية السجلات حسب المستخدم (يجب أن تكون أول مرحلة لتحسين الأداء)
      { $match: matchCondition },

      // المرحلة الثانية: Facet لتقسيم العد حسب الفئات المطلوبة
      {
        $facet: {
          // عد السجلات ذات حالة statusToCount (مثل new أو assigned)
          statusCounts: [
            // تصفية إضافية حسب الحالة المطلوبة
            // user.role == "installer"
            //   ? { $match: { status: statusToCount } }
            //   : {
            //       $match: {},
            //     },
            { $match: statusToCount ? { status: statusToCount } : {} },
            {
              $group: {
                _id: null,
                // العد الإجمالي
                totalCount: { $sum: 1 },
                // العد اليومي (باستخدام $cond لتطبيق شرط على الحقل createdAt)
                dailyCount: {
                  $sum: { $cond: [{ $gte: ["$createdAt", dayAgo] }, 1, 0] },
                },
                // العد الأسبوعي
                weeklyCount: {
                  $sum: { $cond: [{ $gte: ["$createdAt", weekAgo] }, 1, 0] },
                },
                // العد الشهري
                monthlyCount: {
                  $sum: { $cond: [{ $gte: ["$createdAt", monthAgo] }, 1, 0] },
                },
              },
            },
            { $project: { _id: 0 } }, // إزالة حقل _id
          ],

          // عد السجلات ذات حالة 'rejected'
          rejectedCounts: [
            { $match: { status: "rejected" } },
            {
              $group: {
                _id: null,
                // العد الإجمالي
                totalFiledCount: { $sum: 1 },
                // العد اليومي
                dailyFiledCount: {
                  $sum: { $cond: [{ $gte: ["$createdAt", dayAgo] }, 1, 0] },
                },
                // العد الأسبوعي
                weeklyFiledCount: {
                  $sum: { $cond: [{ $gte: ["$createdAt", weekAgo] }, 1, 0] },
                },
                // العد الشهري
                monthlyFiledCount: {
                  $sum: { $cond: [{ $gte: ["$createdAt", monthAgo] }, 1, 0] },
                },
              },
            },
            { $project: { _id: 0 } },
          ],
        },
      },
    ]);

    // معالجة النتيجة وإرجاعها
    // يتم دمج نتائج الـ statusCounts و rejectedCounts في كائن واحد
    console.log("Stats Result: ", statsResult);
    const finalStats = {
      user,
      ...(statsResult.statusCounts[0] || {}), // استخدام || {} في حالة عدم وجود نتائج (للتجنب undefined)
      ...(statsResult.rejectedCounts[0] || {}),
    };

    // إرسال البيانات المجمعة
    res.json(finalStats);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({
      message: "خطأ في الخادم",
      details: err.message,
    });
  }
};

// ايقاف حساب المستخدم او تفعيله
export const toggleUserStatus = async (req: Request, res: Response) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ message: "تم تغيير حالة المستخدم بنجاح", user });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({
      message: "خطأ في الخادم",
      details: err.message,
    });
  }
};
