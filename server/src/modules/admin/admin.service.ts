import mongoose from 'mongoose';
import { Booking } from '../booking/booking.model';
import { Event } from '../event/event.model';
import { Show } from '../event/show.model';
import { User } from '../auth/user.model';
import { Hall, Venue } from '../venue/venue.model';

type DashboardRange = 'today' | '7d' | '30d';

interface DashboardStats {
	totalRevenue: number;
	totalBookings: number;
	activeShows: number;
	avgOccupancy: number;
	totalUsers: number;
	totalVenues: number;
	totalEvents: number;
}

interface DashboardChanges {
	totalRevenue: number;
	totalBookings: number;
	activeShows: number;
	avgOccupancy: number;
}

const toObjectId = (value: string) => new mongoose.Types.ObjectId(value);

const getRangeStart = (range: DashboardRange): Date => {
	const now = new Date();
	if (range === 'today') {
		const start = new Date(now);
		start.setHours(0, 0, 0, 0);
		return start;
	}

	const days = range === '7d' ? 7 : 30;
	const start = new Date(now);
	start.setDate(start.getDate() - days);
	start.setHours(0, 0, 0, 0);
	return start;
};

const getPreviousRangeStart = (range: DashboardRange): Date => {
	const currentStart = getRangeStart(range);
	const now = new Date();
	const diff = now.getTime() - currentStart.getTime();
	return new Date(currentStart.getTime() - diff);
};

const percentageChange = (current: number, previous: number): number => {
	if (previous === 0) {
		return current === 0 ? 0 : 100;
	}
	return Number((((current - previous) / previous) * 100).toFixed(1));
};

const getRevenueInRange = async (start: Date, end: Date) => {
	const result = await Booking.aggregate([
		{
			$match: {
				status: 'CONFIRMED',
				createdAt: { $gte: start, $lte: end }
			}
		},
		{
			$group: {
				_id: null,
				total: { $sum: '$totalAmount' }
			}
		}
	]);

	return result[0]?.total || 0;
};

const getBookingCountInRange = async (start: Date, end: Date) => {
	return Booking.countDocuments({
		status: { $in: ['PENDING', 'CONFIRMED'] },
		createdAt: { $gte: start, $lte: end }
	});
};

const getActiveShowsCount = async () => {
	const now = new Date();
	return Show.countDocuments({
		startTime: { $lte: now },
		endTime: { $gte: now }
	});
};

const getAvgOccupancyInRange = async (start: Date, end: Date) => {
	const occupancy = await Show.aggregate([
		{
			$match: {
				startTime: { $gte: start, $lte: end }
			}
		},
		{
			$project: {
				occupancyPct: {
					$cond: [
						{ $gt: ['$totalSeats', 0] },
						{
							$multiply: [
								{ $divide: [{ $size: '$bookedSeats' }, '$totalSeats'] },
								100
							]
						},
						0
					]
				}
			}
		},
		{
			$group: {
				_id: null,
				avg: { $avg: '$occupancyPct' }
			}
		}
	]);

	return Number((occupancy[0]?.avg || 0).toFixed(1));
};

const getRevenueTrend = async (start: Date, end: Date) => {
	return Booking.aggregate([
		{
			$match: {
				status: 'CONFIRMED',
				createdAt: { $gte: start, $lte: end }
			}
		},
		{
			$group: {
				_id: {
					year: { $year: '$createdAt' },
					month: { $month: '$createdAt' },
					day: { $dayOfMonth: '$createdAt' }
				},
				revenue: { $sum: '$totalAmount' },
				bookings: { $sum: 1 }
			}
		},
		{
			$sort: {
				'_id.year': 1,
				'_id.month': 1,
				'_id.day': 1
			}
		},
		{
			$project: {
				_id: 0,
				date: {
					$concat: [
						{ $toString: '$_id.year' },
						'-',
						{ $toString: '$_id.month' },
						'-',
						{ $toString: '$_id.day' }
					]
				},
				revenue: 1,
				bookings: 1
			}
		}
	]);
};

export const getDashboardData = async (range: DashboardRange = 'today') => {
	const now = new Date();
	const start = getRangeStart(range);
	const previousStart = getPreviousRangeStart(range);

	const [
		totalRevenue,
		totalBookings,
		activeShows,
		avgOccupancy,
		totalUsers,
		totalVenues,
		totalEvents,
		previousRevenue,
		previousBookings,
		previousAvgOccupancy,
		recentBookings,
		revenueTrend,
		topMovies
	] = await Promise.all([
		getRevenueInRange(start, now),
		getBookingCountInRange(start, now),
		getActiveShowsCount(),
		getAvgOccupancyInRange(start, now),
		User.countDocuments({ isActive: true }),
		Venue.countDocuments({ isActive: true }),
		Event.countDocuments({ isActive: true }),
		getRevenueInRange(previousStart, start),
		getBookingCountInRange(previousStart, start),
		getAvgOccupancyInRange(previousStart, start),
		Booking.find({ status: { $in: ['PENDING', 'CONFIRMED', 'CANCELLED'] } })
			.sort({ createdAt: -1 })
			.limit(8)
			.populate({
				path: 'showId',
				select: 'startTime eventId hallId',
				populate: [
					{ path: 'eventId', select: 'title' },
					{
						path: 'hallId',
						select: 'name venueId',
						populate: { path: 'venueId', select: 'name city' }
					}
				]
			})
			.populate('userId', 'email name'),
		getRevenueTrend(start, now),
		Booking.aggregate([
			{
				$match: {
					status: 'CONFIRMED',
					createdAt: { $gte: start, $lte: now }
				}
			},
			{
				$lookup: {
					from: 'shows',
					localField: 'showId',
					foreignField: '_id',
					as: 'show'
				}
			},
			{ $unwind: '$show' },
			{
				$group: {
					_id: '$show.eventId',
					revenue: { $sum: '$totalAmount' },
					bookings: { $sum: 1 }
				}
			},
			{
				$lookup: {
					from: 'events',
					localField: '_id',
					foreignField: '_id',
					as: 'event'
				}
			},
			{ $unwind: '$event' },
			{
				$project: {
					_id: 0,
					eventId: '$_id',
					title: '$event.title',
					revenue: 1,
					bookings: 1
				}
			},
			{ $sort: { revenue: -1 } },
			{ $limit: 5 }
		])
	]);

	const stats: DashboardStats = {
		totalRevenue,
		totalBookings,
		activeShows,
		avgOccupancy,
		totalUsers,
		totalVenues,
		totalEvents
	};

	const changes: DashboardChanges = {
		totalRevenue: percentageChange(totalRevenue, previousRevenue),
		totalBookings: percentageChange(totalBookings, previousBookings),
		activeShows: 0,
		avgOccupancy: percentageChange(avgOccupancy, previousAvgOccupancy)
	};

	const recent = recentBookings.map((booking: any) => ({
		id: booking._id,
		code: `CM${booking._id.toString().slice(-6).toUpperCase()}`,
		movieTitle: booking.showId?.eventId?.title || 'Unknown',
		venueName: booking.showId?.hallId?.venueId?.name || 'Unknown Venue',
		seats: booking.seats?.length || 0,
		totalAmount: booking.totalAmount,
		status: booking.status,
		createdAt: booking.createdAt
	}));

	const liveActivity = recent.slice(0, 6).map((booking) => ({
		type: booking.status === 'CANCELLED' ? 'cancellation' : 'booking',
		title: booking.status === 'CANCELLED' ? 'Booking cancelled' : 'New booking',
		detail: `${booking.movieTitle} • ${booking.seats} seat(s)`,
		createdAt: booking.createdAt
	}));

	return {
		range,
		stats,
		changes,
		recentBookings: recent,
		liveActivity,
		revenueTrend,
		topMovies
	};
};

export const getAdminMoviesData = async (params: {
	search?: string;
	status?: 'all' | 'active' | 'inactive';
	page?: number;
	limit?: number;
}) => {
	const page = params.page || 1;
	const limit = Math.min(params.limit || 12, 50);
	const skip = (page - 1) * limit;

	const query: Record<string, any> = {};
	if (params.search?.trim()) {
		query.$or = [
			{ title: new RegExp(params.search.trim(), 'i') },
			{ description: new RegExp(params.search.trim(), 'i') }
		];
	}

	if (params.status === 'active') query.isActive = true;
	if (params.status === 'inactive') query.isActive = false;

	const [events, total] = await Promise.all([
		Event.find(query).sort({ releaseDate: -1, createdAt: -1 }).skip(skip).limit(limit),
		Event.countDocuments(query)
	]);

	const eventIds = events.map((event) => event._id);

	const [showStats, bookingStats] = await Promise.all([
		Show.aggregate([
			{ $match: { eventId: { $in: eventIds } } },
			{
				$group: {
					_id: '$eventId',
					totalShows: { $sum: 1 },
					upcomingShows: {
						$sum: {
							$cond: [{ $gte: ['$startTime', new Date()] }, 1, 0]
						}
					}
				}
			}
		]),
		Booking.aggregate([
			{
				$lookup: {
					from: 'shows',
					localField: 'showId',
					foreignField: '_id',
					as: 'show'
				}
			},
			{ $unwind: '$show' },
			{
				$match: {
					'show.eventId': { $in: eventIds },
					status: 'CONFIRMED'
				}
			},
			{
				$group: {
					_id: '$show.eventId',
					bookings: { $sum: 1 },
					revenue: { $sum: '$totalAmount' }
				}
			}
		])
	]);

	const showStatsMap = new Map(showStats.map((item) => [item._id.toString(), item]));
	const bookingStatsMap = new Map(bookingStats.map((item) => [item._id.toString(), item]));

	const items = events.map((event: any) => {
		const showInfo = showStatsMap.get(event._id.toString());
		const bookingInfo = bookingStatsMap.get(event._id.toString());

		return {
			id: event._id,
			title: event.title,
			description: event.description,
			durationMinutes: event.durationMinutes,
			posterUrl: event.posterUrl,
			language: event.language,
			genre: event.genre || [],
			rating: event.rating,
			releaseDate: event.releaseDate,
			isActive: event.isActive,
			totalShows: showInfo?.totalShows || 0,
			upcomingShows: showInfo?.upcomingShows || 0,
			bookings: bookingInfo?.bookings || 0,
			revenue: bookingInfo?.revenue || 0,
			createdAt: event.createdAt,
			updatedAt: event.updatedAt
		};
	});

	const [activeCount, inactiveCount, showsCount, hallsCount] = await Promise.all([
		Event.countDocuments({ isActive: true }),
		Event.countDocuments({ isActive: false }),
		Show.countDocuments({ startTime: { $gte: new Date() } }),
		Hall.countDocuments({ isActive: true })
	]);

	return {
		items,
		pagination: {
			page,
			limit,
			total,
			pages: Math.ceil(total / limit)
		},
		summary: {
			total,
			active: activeCount,
			inactive: inactiveCount,
			upcomingShows: showsCount,
			activeHalls: hallsCount
		}
	};
};

export const toggleEventActiveStatus = async (eventId: string, isActive: boolean) => {
	const updated = await Event.findByIdAndUpdate(
		toObjectId(eventId),
		{ isActive },
		{ new: true, runValidators: true }
	);

	if (!updated) {
		throw new Error('Event not found');
	}

	return updated;
};
