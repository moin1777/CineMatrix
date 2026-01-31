import mongoose, { Schema, Document } from 'mongoose';

export interface ISeatConfig {
  row: string;
  number: number;
  type: 'regular' | 'premium' | 'vip' | 'wheelchair';
  price: number;
}

export interface IVenue extends Document {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export interface IHall extends Document {
  venueId: mongoose.Types.ObjectId;
  name: string;
  capacity: number;
  rows: number;
  seatsPerRow: number;
  seatMap: ISeatConfig[];
  amenities: string[];
  isActive: boolean;
}

const VenueSchema = new Schema<IVenue>({
  name: { type: String, required: true, index: true },
  address: { type: String, required: true },
  city: { type: String, required: true, index: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const SeatConfigSchema = new Schema<ISeatConfig>({
  row: { type: String, required: true },
  number: { type: Number, required: true },
  type: { type: String, enum: ['regular', 'premium', 'vip', 'wheelchair'], default: 'regular' },
  price: { type: Number, required: true }
}, { _id: false });

const HallSchema = new Schema<IHall>({
  venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  rows: { type: Number, required: true },
  seatsPerRow: { type: Number, required: true },
  seatMap: [SeatConfigSchema],
  amenities: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Compound index for unique hall names within a venue
HallSchema.index({ venueId: 1, name: 1 }, { unique: true });

export const Venue = mongoose.model<IVenue>('Venue', VenueSchema);
export const Hall = mongoose.model<IHall>('Hall', HallSchema);

// Helper function to generate a standard seat map
export const generateSeatMap = (rows: number, seatsPerRow: number, basePrice: number): ISeatConfig[] => {
  const seatMap: ISeatConfig[] = [];
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let r = 0; r < rows; r++) {
    const rowLabel = rowLabels[r] || `R${r + 1}`;
    for (let s = 1; s <= seatsPerRow; s++) {
      let type: ISeatConfig['type'] = 'regular';
      let priceMultiplier = 1;

      // Last 2 rows are VIP (premium pricing)
      if (r >= rows - 2) {
        type = 'vip';
        priceMultiplier = 1.5;
      }
      // Middle rows are premium
      else if (r >= Math.floor(rows / 3) && r < rows - 2) {
        type = 'premium';
        priceMultiplier = 1.25;
      }
      // First seat in first row is wheelchair accessible
      if (r === 0 && s === 1) {
        type = 'wheelchair';
        priceMultiplier = 1;
      }

      seatMap.push({
        row: rowLabel,
        number: s,
        type,
        price: Math.round(basePrice * priceMultiplier * 100) / 100
      });
    }
  }

  return seatMap;
};
