import { profile } from "console";
import mongoose, { Document, Schema, Types } from "mongoose";

// --- 🎯 1. تعريف الواجهات (Interfaces) ---

/** واجهة لموقع العميل */
export interface ILocation {
  latitude?: number;
  longitude?: number;
}

/** واجهة تفاصيل التثبيت (Installation Details) */
export interface IInstallationDetails {
  cabinet?: string;
  port?: string;
  serial?: string;
  poleNumber?: string;
  username?: string;
  password?: string;
  installPhotoURL?: string;
  installDate?: Date;
  profileType?: string;
  notes?: string;
}

/** واجهة سجل الحالة (Status History) */
export interface IStatusHistory {
  status: string;
  changedBy: Types.ObjectId; // يجب استخدام Types.ObjectId لتطابق Mongoose
  timestamp: Date;
}

/** الواجهة الرئيسية لنموذج Lead (العميل المحتمل) */
export interface ILead extends Document {
  // 📝 معلومات العميل الأساسية
  customerName: string;
  motherName: string;
  phone: string;

  // 📍 تفاصيل الموقع والعنوان
  addressText: string;
  location?: ILocation; // استخدام الواجهة المنفصلة
  homePhotoURL?: string;

  // ⚙️ حالة العميل وتصنيفه
  status: "new" | "assigned" | "installed" | "rejected" | "completed";
  type: "جديد" | "صيانة";
  rejectionReason?: string;

  // 👷‍♂️ تفاصيل الموظفين والوقت
  createdBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;

  // 📦 معلومات إضافية وتفاصيل التثبيت
  notes?: string;
  installationDetails?: IInstallationDetails; // استخدام الواجهة المنفصلة
  statusHistory: IStatusHistory[]; // استخدام الواجهة المنفصلة
}

// --- 🏗️ 2. تعريف المخططات (Schemas) ---

/** مخطط موقع العميل */
const LocationSchema = new Schema(
  {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
); // عادة لا نحتاج _id لمخططات المضمّنة البسيطة

/** مخطط تفاصيل التثبيت (Installation Details) */
const InstallationDetailsSchema = new Schema(
  {
    cabinet: { type: String },
    port: { type: String },
    serial: { type: String },
    poleNumber: { type: String },
    username: { type: String },
    password: { type: String },
    installPhotoURL: { type: String },
    installDate: { type: Date },
    profileType: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

/** مخطط سجل الحالة (Status History) */
const StatusHistorySchema = new Schema({
  status: { type: String, required: true },
  changedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
});

/** المخطط الرئيسي للـ Lead (العميل المحتمل) */
const LeadSchema = new Schema<ILead>(
  {
    // 📝 معلومات العميل الأساسية
    customerName: { type: String, required: true },
    motherName: { type: String, default: "" },
    phone: { type: String, required: true, unique: true, index: true },

    // 📍 تفاصيل الموقع والعنوان
    addressText: { type: String, required: true },
    location: { type: LocationSchema }, // استخدام المخطط المنفصل
    homePhotoURL: { type: String },

    // ⚙️ حالة العميل وتصنيفه
    status: {
      type: String,
      enum: ["new", "assigned", "installed", "rejected", "completed"],
      default: "new",
    },
    type: {
      type: String,
      enum: ["جديد", "صيانة"],
      default: "جديد",
    },
    rejectionReason: { type: String },

    // 👷‍♂️ تفاصيل الموظفين والوقت
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },

    // 📦 معلومات إضافية وتفاصيل التثبيت
    notes: { type: String },
    installationDetails: { type: InstallationDetailsSchema },
    statusHistory: [StatusHistorySchema],
  },
  {
    timestamps: true, // لإضافة createdAt و updatedAt
    collection: "leads", // تحديد اسم المجموعة بشكل واضح
  }
);

// --- 📤 3. تصدير النموذج (Export Model) ---

export default mongoose.model<ILead>("Lead", LeadSchema);
