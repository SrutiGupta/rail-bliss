import { Schema, model, type InferSchemaType } from "mongoose";

const roleSchema = new Schema({ role: { type: String, enum: ["admin", "passenger"], required: true } });

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 20, default: null },
    roles: { type: [roleSchema], default: [{ role: "passenger" }] },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User = model("User", userSchema);
