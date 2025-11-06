import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const payload = {
      id: user.id,
      role: user.role,
    };

    jwt.sign(payload, process.env.JWT_SECRET as string, (err, token) => {
      if (err) throw err;
      res.json({
        user: user,
        token: token,
      });
    });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

export const getMy = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({ user });
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
