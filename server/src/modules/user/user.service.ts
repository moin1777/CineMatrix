import { User, IUser } from '../auth/user.model';
import { Booking } from '../booking/booking.model';
import mongoose from 'mongoose';

interface UserFilters {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============ USER PROFILE SERVICES ============

export const getUserProfile = async (userId: string): Promise<IUser | null> => {
  return User.findById(userId).select('-password');
};

export const updateUserProfile = async (userId: string, updates: { name?: string; phone?: string }): Promise<IUser | null> => {
  return User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true }).select('-password');
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new Error('User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new Error('Current password is incorrect');

  user.password = newPassword;
  await user.save();
  return true;
};

// ============ USER BOOKING HISTORY ============

interface BookingHistoryFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export const getUserBookingHistory = async (userId: string, filters: BookingHistoryFilters = {}) => {
  const query: any = { userId };
  
  if (filters.status) {
    query.status = filters.status;
  }

  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate({
        path: 'showId',
        select: 'startTime hallId eventId price',
        populate: [
          { path: 'eventId', select: 'title posterUrl durationMinutes' },
          { path: 'hallId', select: 'name venueId', populate: { path: 'venueId', select: 'name city' } }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(query)
  ]);

  return {
    bookings,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

export const getBookingDetails = async (userId: string, bookingId: string) => {
  const booking = await Booking.findOne({ _id: bookingId, userId })
    .populate({
      path: 'showId',
      select: 'startTime hallId eventId price endTime',
      populate: [
        { path: 'eventId', select: 'title posterUrl durationMinutes description genre' },
        { path: 'hallId', select: 'name venueId capacity', populate: { path: 'venueId', select: 'name city address' } }
      ]
    });

  if (!booking) throw new Error('Booking not found');
  return booking;
};

// ============ ADMIN USER MANAGEMENT ============

export const getAllUsers = async (filters: UserFilters = {}) => {
  const query: any = {};
  
  if (filters.role) {
    query.role = filters.role;
  }
  if (filters.search) {
    query.$or = [
      { email: new RegExp(filters.search, 'i') },
      { name: new RegExp(filters.search, 'i') }
    ];
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query)
  ]);

  return {
    users,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

export const getUserById = async (userId: string): Promise<IUser | null> => {
  return User.findById(userId).select('-password');
};

export const updateUserRole = async (userId: string, role: 'user' | 'admin'): Promise<IUser | null> => {
  return User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true }).select('-password');
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  // Check for active bookings
  const activeBookings = await Booking.countDocuments({ 
    userId, 
    status: { $in: ['PENDING', 'CONFIRMED'] }
  });

  if (activeBookings > 0) {
    throw new Error('Cannot delete user with active bookings');
  }

  await User.findByIdAndDelete(userId);
  return true;
};

export const getUserStats = async (userId: string) => {
  const [totalBookings, confirmedBookings, cancelledBookings, totalSpent] = await Promise.all([
    Booking.countDocuments({ userId }),
    Booking.countDocuments({ userId, status: 'CONFIRMED' }),
    Booking.countDocuments({ userId, status: 'CANCELLED' }),
    Booking.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'CONFIRMED' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
  ]);

  return {
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    totalSpent: totalSpent[0]?.total || 0
  };
};
