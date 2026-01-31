import { Event, IEvent } from './event.model';
import { Show, IShow } from './show.model';
import { Hall } from '../venue/venue.model';
import mongoose from 'mongoose';

// ============ EVENT SERVICES ============

interface CreateEventInput {
  title: string;
  description?: string;
  durationMinutes: number;
  posterUrl?: string;
  genre?: string[];
  language?: string;
  rating?: string;
  releaseDate?: Date;
}

interface UpdateEventInput extends Partial<CreateEventInput> {
  isActive?: boolean;
}

interface EventFilters {
  genre?: string;
  language?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const createEvent = async (input: CreateEventInput): Promise<IEvent> => {
  const event = await Event.create(input);
  return event;
};

export const getEventById = async (id: string): Promise<IEvent | null> => {
  return Event.findById(id);
};

export const getAllEvents = async (filters: EventFilters = {}): Promise<{ events: IEvent[]; total: number; page: number; pages: number }> => {
  const query: any = {};
  
  if (filters.genre) {
    query.genre = { $in: [filters.genre] };
  }
  if (filters.language) {
    query.language = filters.language;
  }
  if (filters.search) {
    query.$or = [
      { title: new RegExp(filters.search, 'i') },
      { description: new RegExp(filters.search, 'i') }
    ];
  }
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  } else {
    query.isActive = true; // Default to active only
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    Event.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Event.countDocuments(query)
  ]);

  return {
    events,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

export const updateEvent = async (id: string, input: UpdateEventInput): Promise<IEvent | null> => {
  return Event.findByIdAndUpdate(id, input, { new: true, runValidators: true });
};

export const deleteEvent = async (id: string): Promise<boolean> => {
  // Soft delete
  await Event.findByIdAndUpdate(id, { isActive: false });
  return true;
};

export const getEventsByGenre = async (genre: string): Promise<IEvent[]> => {
  return Event.find({ genre: { $in: [genre] }, isActive: true }).sort({ createdAt: -1 });
};

export const searchEvents = async (query: string): Promise<IEvent[]> => {
  return Event.find({
    $or: [
      { title: new RegExp(query, 'i') },
      { description: new RegExp(query, 'i') }
    ],
    isActive: true
  }).limit(20);
};

// ============ SHOW SERVICES ============

interface CreateShowInput {
  eventId: string;
  hallId: string;
  startTime: Date;
  price: number;
}

interface ShowFilters {
  eventId?: string;
  hallId?: string;
  venueId?: string;
  date?: string; // YYYY-MM-DD
  city?: string;
}

export const createShow = async (input: CreateShowInput): Promise<IShow> => {
  const event = await Event.findById(input.eventId);
  if (!event) throw new Error('Event not found');
  if (!event.isActive) throw new Error('Event is not active');

  const hall = await Hall.findById(input.hallId).populate('venueId');
  if (!hall) throw new Error('Hall not found');
  if (!hall.isActive) throw new Error('Hall is not active');

  // Check for overlapping shows in the same hall
  const showEndTime = new Date(input.startTime.getTime() + event.durationMinutes * 60000);
  const existingShow = await Show.findOne({
    hallId: input.hallId,
    $or: [
      {
        startTime: { $lte: input.startTime },
        endTime: { $gt: input.startTime }
      },
      {
        startTime: { $lt: showEndTime },
        endTime: { $gte: showEndTime }
      },
      {
        startTime: { $gte: input.startTime },
        endTime: { $lte: showEndTime }
      }
    ]
  });

  if (existingShow) {
    throw new Error('Time slot conflicts with an existing show');
  }

  const show = await Show.create({
    eventId: input.eventId,
    hallId: input.hallId,
    startTime: input.startTime,
    endTime: showEndTime,
    price: input.price,
    totalSeats: hall.capacity,
    bookedSeats: []
  });

  return show;
};

export const getShowById = async (id: string): Promise<IShow | null> => {
  return Show.findById(id)
    .populate('eventId', 'title durationMinutes posterUrl genre')
    .populate({
      path: 'hallId',
      select: 'name capacity venueId',
      populate: {
        path: 'venueId',
        select: 'name city address'
      }
    });
};

export const getShowsForEvent = async (eventId: string, date?: string): Promise<IShow[]> => {
  const query: any = { eventId };
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.startTime = { $gte: startOfDay, $lte: endOfDay };
  } else {
    // Only future shows
    query.startTime = { $gte: new Date() };
  }

  return Show.find(query)
    .populate({
      path: 'hallId',
      select: 'name venueId',
      populate: {
        path: 'venueId',
        select: 'name city'
      }
    })
    .sort({ startTime: 1 });
};

export const getShowsByVenue = async (venueId: string, date?: string): Promise<IShow[]> => {
  // First get all halls for this venue
  const halls = await Hall.find({ venueId, isActive: true });
  const hallIds = halls.map(h => h._id);

  const query: any = { hallId: { $in: hallIds } };
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.startTime = { $gte: startOfDay, $lte: endOfDay };
  } else {
    query.startTime = { $gte: new Date() };
  }

  return Show.find(query)
    .populate('eventId', 'title posterUrl durationMinutes')
    .populate('hallId', 'name')
    .sort({ startTime: 1 });
};

export const updateShow = async (id: string, input: Partial<CreateShowInput>): Promise<IShow | null> => {
  return Show.findByIdAndUpdate(id, input, { new: true, runValidators: true });
};

export const deleteShow = async (id: string): Promise<boolean> => {
  const show = await Show.findById(id);
  if (!show) throw new Error('Show not found');
  
  if (show.bookedSeats.length > 0) {
    throw new Error('Cannot delete show with existing bookings');
  }

  await Show.findByIdAndDelete(id);
  return true;
};

export const getAvailableSeats = async (showId: string) => {
  const show = await Show.findById(showId).populate('hallId');
  if (!show) throw new Error('Show not found');

  const hall = await Hall.findById(show.hallId);
  if (!hall) throw new Error('Hall not found');

  const bookedSeatsSet = new Set(show.bookedSeats);
  
  const availableSeats = hall.seatMap.map(seat => {
    const seatId = `${seat.row}${seat.number}`;
    return {
      ...seat,
      seatId,
      isAvailable: !bookedSeatsSet.has(seatId),
      isBooked: bookedSeatsSet.has(seatId)
    };
  });

  // Group by row for easier frontend rendering
  const seatsByRow: Record<string, typeof availableSeats> = {};
  availableSeats.forEach(seat => {
    if (!seatsByRow[seat.row]) {
      seatsByRow[seat.row] = [];
    }
    seatsByRow[seat.row].push(seat);
  });

  return {
    showId: show._id,
    eventId: show.eventId,
    hallId: hall._id,
    hallName: hall.name,
    totalSeats: hall.capacity,
    bookedCount: show.bookedSeats.length,
    availableCount: hall.capacity - show.bookedSeats.length,
    seatsByRow,
    allSeats: availableSeats
  };
};

export const bulkCreateShows = async (input: {
  eventId: string;
  hallId: string;
  showTimes: Date[];
  price: number;
}): Promise<IShow[]> => {
  const shows: IShow[] = [];
  
  for (const startTime of input.showTimes) {
    try {
      const show = await createShow({
        eventId: input.eventId,
        hallId: input.hallId,
        startTime,
        price: input.price
      });
      shows.push(show);
    } catch (error) {
      // Skip conflicting shows, continue with others
      console.warn(`Skipped show at ${startTime}: ${(error as Error).message}`);
    }
  }

  return shows;
};
