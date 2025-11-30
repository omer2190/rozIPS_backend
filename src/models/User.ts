import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ["manager", "marketer", "installer", "owner"],
    required: true,
  },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  fcm: { type: String },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export interface IUser extends Document {
  username: string;
  password?: string;
  name: string;
  role: "manager" | "marketer" | "installer" | "owner";
  phone: string;
  isActive: boolean;
  fcm?: string;
}

export default mongoose.model<IUser>("User", UserSchema);
