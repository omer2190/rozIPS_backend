import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITask extends Document {
  name: string;
  number: string;
  address: string;
  price: number;
  assignedTo: Types.ObjectId;
  createdBy: Types.ObjectId;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    name: { type: String, required: true },
    number: { type: String, required: true },
    address: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITask>("Task", TaskSchema);
