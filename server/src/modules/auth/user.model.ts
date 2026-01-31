import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  password?: string;
  name?: string;
  phone?: string;
  role: 'user' | 'admin';
  history: Array<{
    bookingId: mongoose.Types.ObjectId;
    bookedAt: Date;
    showId: mongoose.Types.ObjectId;
  }>;
  isActive: boolean;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  name: { type: String, trim: true },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
  history: [{
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    bookedAt: { type: Date, default: Date.now },
    showId: { type: Schema.Types.ObjectId, ref: 'Show' }
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });

UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err: any) {
    throw err;
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
