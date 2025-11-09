import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  lead?: mongoose.Types.ObjectId;
}

const NotificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
    lead: { type: Schema.Types.ObjectId, ref: "Lead" },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
