import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminSettings extends Document {
  key: string;
  booking: {
    allowGuestCheckout: boolean;
    holdMinutes: number;
    maxTicketsPerBooking: number;
  };
  payments: {
    providerMode: 'test' | 'live';
    cashEnabled: boolean;
    cardEnabled: boolean;
    upiEnabled: boolean;
  };
  notifications: {
    supportEmail: string;
    alertOnFailedPayments: boolean;
  };
  operations: {
    maintenanceMode: boolean;
  };
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSettingsSchema = new Schema<IAdminSettings>(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    booking: {
      allowGuestCheckout: { type: Boolean, default: true },
      holdMinutes: { type: Number, default: 8, min: 1, max: 30 },
      maxTicketsPerBooking: { type: Number, default: 10, min: 1, max: 20 }
    },
    payments: {
      providerMode: { type: String, enum: ['test', 'live'], default: 'test' },
      cashEnabled: { type: Boolean, default: true },
      cardEnabled: { type: Boolean, default: true },
      upiEnabled: { type: Boolean, default: true }
    },
    notifications: {
      supportEmail: { type: String, default: 'support@cinematrix.com' },
      alertOnFailedPayments: { type: Boolean, default: true }
    },
    operations: {
      maintenanceMode: { type: Boolean, default: false }
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const AdminSettings = mongoose.model<IAdminSettings>('AdminSettings', AdminSettingsSchema);
