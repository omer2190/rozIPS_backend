import { Request, Response } from "express";
import User from "../models/User";
import Lead from "../models/Lead";

// @route   POST api/users
// @desc    Create a new user
// @access  Private (Manager)
export const createUser = async (req: Request, res: Response) => {
  const { username, password, name, role, phone } = req.body;

  try {
    let user = await User.findOne({ $or: [{ username }, { phone }] });
    if (user) {
      return res
        .status(400)
        .json({ message: "يوجد مستخدم بهذا الاسم أو الهاتف بالفعل." });
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

// جلب احصائية على مستخدم معين
export const getUserStats = async (req: Request, res: Response) => {
  const userId = req.params.id;
  try {
    console.log("userId: ", userId);
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }
    // جلب احصائية اضافية حسب الحاجة
    // جلب عدد العملاء الذين تم اضافتهم من قبل هذا المستخدم ويجب ان تكون يوميا واسبوعيا وشهرية والكليلة
    const dailyCount = await Lead.countDocuments({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const weeklyCount = await Lead.countDocuments({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    const monthlyCount = await Lead.countDocuments({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    const totalCount = await Lead.countDocuments({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    });

    res.json({ user, dailyCount, weeklyCount, monthlyCount, totalCount });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send({
      message: "خطأ في الخادم",
      details: err.message,
    });
  }
};
