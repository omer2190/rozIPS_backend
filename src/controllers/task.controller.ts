import { Request, Response } from "express";
import Task from "../models/task";
import { AuthRequest } from "../middlewares/auth.middleware";
import NotificationService from "../services/notification.service";

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { name, number, address, price, assignedTo, note } = req.body;
    const user = req.user;
    if (!name || !number || !address || !price || !assignedTo) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const newTask = new Task({
      name,
      number,
      address,
      price,
      assignedTo,
      note,
      createdBy: user?.id,
    });
    await newTask.save();

    // Notify the assigned user about the new task
    NotificationService.sendToUser(assignedTo, {
      title: "مهمة جديدة تم تعيينها لك",
      body: `تم تعيين مهمة جديدة لك: ${name}`,
    });

    res.status(201).json(newTask);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user = req.user;
    const tasks = await Task.find()
      .sort({ createdAt: -1 })
      .populate("assignedTo")
      .skip((+page - 1) * +limit)
      .limit(+limit);
    res.status(200).json({
      tasks,
      page: +page,
      limit: +limit,
      total: await Task.countDocuments(),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.user!.id;
    const task = await Task.find({
      assignedTo: id,
      status: { $in: ["pending", "in-progress"] },
    });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({
      task,
      total: task.length,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, number, address, price, assignedTo, note } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { name, number, address, price, assignedTo, note },
      { new: true }
    );
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    if (
      !["pending", "in-progress", "completed", "cancelled"].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }
    let image;
    if (status === "completed") {
      // دمج الرابط الخاص بالصورة المرسلة مع اسم الملف
      image = `${req.protocol}://${req.get("host")}/uploads/${
        req.file?.filename
      }`;
    }
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { status, image },
      { new: true }
    );
    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    NotificationService.sendToUser(updatedTask.createdBy.toString(), {
      title: "تحديث حالة مهمة",
      body: `تم تحديث حالة المهمة إلى: ${status}`,
    });
    res.status(200).json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
