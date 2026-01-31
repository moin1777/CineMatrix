import { Venue, Hall, IVenue, IHall, generateSeatMap } from './venue.model';
import mongoose from 'mongoose';

// ============ VENUE SERVICES ============

interface CreateVenueInput {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
}

interface UpdateVenueInput extends Partial<CreateVenueInput> {
  isActive?: boolean;
}

export const createVenue = async (input: CreateVenueInput): Promise<IVenue> => {
  const venue = await Venue.create(input);
  return venue;
};

export const getVenueById = async (id: string): Promise<IVenue | null> => {
  return Venue.findById(id);
};

export const getAllVenues = async (filters: { city?: string; isActive?: boolean } = {}): Promise<IVenue[]> => {
  const query: any = {};
  if (filters.city) query.city = new RegExp(filters.city, 'i');
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  return Venue.find(query).sort({ name: 1 });
};

export const updateVenue = async (id: string, input: UpdateVenueInput): Promise<IVenue | null> => {
  return Venue.findByIdAndUpdate(id, input, { new: true, runValidators: true });
};

export const deleteVenue = async (id: string): Promise<boolean> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Soft delete - set isActive to false
    await Venue.findByIdAndUpdate(id, { isActive: false }, { session });
    // Also deactivate all halls in this venue
    await Hall.updateMany({ venueId: id }, { isActive: false }, { session });

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ============ HALL SERVICES ============

interface CreateHallInput {
  venueId: string;
  name: string;
  rows: number;
  seatsPerRow: number;
  basePrice: number;
  amenities?: string[];
}

interface UpdateHallInput {
  name?: string;
  amenities?: string[];
  isActive?: boolean;
}

export const createHall = async (input: CreateHallInput): Promise<IHall> => {
  const venue = await Venue.findById(input.venueId);
  if (!venue) throw new Error('Venue not found');

  const seatMap = generateSeatMap(input.rows, input.seatsPerRow, input.basePrice);
  const capacity = input.rows * input.seatsPerRow;

  const hall = await Hall.create({
    venueId: input.venueId,
    name: input.name,
    capacity,
    rows: input.rows,
    seatsPerRow: input.seatsPerRow,
    seatMap,
    amenities: input.amenities || [],
    isActive: true
  });

  return hall;
};

export const getHallById = async (id: string): Promise<IHall | null> => {
  return Hall.findById(id).populate('venueId', 'name city');
};

export const getHallsByVenue = async (venueId: string): Promise<IHall[]> => {
  return Hall.find({ venueId, isActive: true }).sort({ name: 1 });
};

export const updateHall = async (id: string, input: UpdateHallInput): Promise<IHall | null> => {
  return Hall.findByIdAndUpdate(id, input, { new: true, runValidators: true });
};

export const deleteHall = async (id: string): Promise<boolean> => {
  await Hall.findByIdAndUpdate(id, { isActive: false });
  return true;
};

export const getHallSeatMap = async (hallId: string) => {
  const hall = await Hall.findById(hallId);
  if (!hall) throw new Error('Hall not found');

  return {
    hallId: hall._id,
    hallName: hall.name,
    capacity: hall.capacity,
    rows: hall.rows,
    seatsPerRow: hall.seatsPerRow,
    seatMap: hall.seatMap
  };
};
