import mongoose, { Document, Schema } from "mongoose";

const InstallationDetailsSchema = new Schema({
  cabinet: { type: String },
  port: { type: String },
  serial: { type: String },
  username: { type: String },
  password: { type: String },
  installPhotoURL: { type: String },
  installDate: { type: Date },
});

const StatusHistorySchema = new Schema({
  status: { type: String, required: true },
  changedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    // default: null,
    // index: true,
  },
  timestamp: { type: Date, default: Date.now },
});

const LeadSchema = new Schema(
  {
    customerName: { type: String, required: true },
    motherName: { type: String, required: true },
    phone: { type: String, required: true, unique: true, index: true },
    addressText: { type: String, required: true },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    homePhotoURL: { type: String },
    notes: { type: String },
    status: {
      type: String,
      enum: [
        "new",
        // "qualified",
        "assigned",
        "installed",
        "rejected",
        // "postponed",
      ],
      default: "new",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    rejectionReason: { type: String },
    installationDetails: { type: InstallationDetailsSchema },
    statusHistory: [StatusHistorySchema],
  },
  { timestamps: true }
);

export interface ILead extends Document {
  customerName: string;
  motherName: string;
  phone: string;
  addressText: string;
  location?: { latitude: number; longitude: number };
  homePhotoURL?: string;
  notes?: string;
  status:
    | "new" // جديد
    | "qualified" // مؤهل
    | "assigned" // معين
    | "installed" // مثبت
    | "rejected" // مرفوض
    | "postponed"; // مؤجل
  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  installationDetails?: {
    cabinet?: string;
    port?: string;
    serial?: string;
    username?: string;
    password?: string;
    installPhotoURL?: string;
    installDate?: Date;
    notes?: string;
  };
  statusHistory: {
    status: string;
    changedBy: mongoose.Types.ObjectId;
    timestamp: Date;
  }[];
}

export default mongoose.model<ILead>("Lead", LeadSchema);
