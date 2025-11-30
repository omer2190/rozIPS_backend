import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

export interface AuthRequest extends Request {
  user?: IUser;
}

export const auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "لا يوجد رمز، الوصول مرفوض" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
    };
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "المستخدم غير موجود" });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "المستخدم غير نشط" });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "الرمز غير صالح" });
  }
};

export const isManager = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && (req.user.role === "manager" || req.user.role === "owner")) {
    next();
  } else {
    res.status(403).json({ message: "الوصول مرفوض. يتطلب دور المدير." });
  }
};

export const isMarketer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.role === "marketer") {
    next();
  } else {
    res.status(403).json({ message: "الوصول مرفوض. يتطلب دور المسوق." });
  }
};

export const isInstaller = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.role === "installer") {
    next();
  } else {
    res.status(403).json({ message: "الوصول مرفوض. يتطلب دور الفني." });
  }
};
