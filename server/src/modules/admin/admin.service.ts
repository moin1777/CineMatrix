import mongoose from 'mongoose';
import { Booking } from '../booking/booking.model';
import { Event } from '../event/event.model';
import { Show } from '../event/show.model';
import { User } from '../auth/user.model';
import { Hall, Venue } from '../venue/venue.model';
import {
  PricingRule,
  SeatCategoryPricing,
  type PricingRuleType
} from './admin-pricing.model';

type DashboardRange = 'today' | '7d' | '30d';
type AnalyticsRange = '7d' | '30d' | '90d';
type AdminShowStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

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

const getRangeStart = (range: DashboardRange | AnalyticsRange): Date => {
  const now = new Date();

  if (range === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
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
    endTime: { $gte: now },
    cancelledAt: { $exists: false }
  });
};

const getAvgOccupancyInRange = async (start: Date, end: Date) => {
  const occupancy = await Show.aggregate([
    {
      $match: {
        startTime: { $gte: start, $lte: end },
        cancelledAt: { $exists: false }
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
            {
              $cond: [
                { $lt: ['$_id.month', 10] },
                { $concat: ['0', { $toString: '$_id.month' }] },
                { $toString: '$_id.month' }
              ]
            },
            '-',
            {
              $cond: [
                { $lt: ['$_id.day', 10] },
                { $concat: ['0', { $toString: '$_id.day' }] },
                { $toString: '$_id.day' }
              ]
            }
          ]
        },
        revenue: 1,
        bookings: 1
      }
    }
  ]);
};

const calculateShowStatus = (show: {
  startTime: Date;
  endTime: Date;
  cancelledAt?: Date | null;
}): AdminShowStatus => {
  if (show.cancelledAt) return 'cancelled';
  const now = Date.now();
  if (show.startTime.getTime() <= now && show.endTime.getTime() >= now) return 'ongoing';
  if (show.endTime.getTime() < now) return 'completed';
  return 'scheduled';
};

const toHourSlot = (date: Date) => `${date.getHours().toString().padStart(2, '0')}:00`;

const ensureDefaultPricingData = async () => {
  const [rulesCount, categoryCount] = await Promise.all([
    PricingRule.countDocuments(),
    SeatCategoryPricing.countDocuments()
  ]);

  if (rulesCount === 0) {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 2);

    await PricingRule.insertMany([
      {
        name: 'Base Pricing',
        description: 'Default pricing for all shows',
        type: 'base',
        active: true,
        priority: 1,
        multiplier: 1,
        conditions: {},
        effectiveFrom: now,
        effectiveTo: endDate
      },
      {
        name: 'Weekend Premium',
        description: 'Higher prices for weekend shows',
        type: 'day_of_week',
        active: true,
        priority: 2,
        multiplier: 1.2,
        conditions: { daysOfWeek: [0, 6] },
        effectiveFrom: now,
        effectiveTo: endDate
      },
      {
        name: 'Prime Time',
        description: 'Evening show premium pricing',
        type: 'time_based',
        active: true,
        priority: 3,
        multiplier: 1.15,
        conditions: { startTime: '18:00', endTime: '21:00' },
        effectiveFrom: now,
        effectiveTo: endDate
      },
      {
        name: 'High Demand Surge',
        description: 'Price surge when occupancy exceeds 80%',
        type: 'occupancy',
        active: true,
        priority: 4,
        multiplier: 1.25,
        conditions: { occupancyMin: 80, occupancyMax: 100 },
        effectiveFrom: now,
        effectiveTo: endDate
      },
      {
        name: 'Early Bird Discount',
        description: 'Discount for bookings 7+ days in advance',
        type: 'early_bird',
        active: true,
        priority: 5,
        multiplier: 0.9,
        conditions: { daysBeforeShow: 7 },
        effectiveFrom: now,
        effectiveTo: endDate
      }
    ]);
  }

  if (categoryCount === 0) {
    const seatTypeStats = await Hall.aggregate([
      { $unwind: '$seatMap' },
      {
        $group: {
          _id: '$seatMap.type',
          avgPrice: { $avg: '$seatMap.price' },
          minPrice: { $min: '$seatMap.price' },
          maxPrice: { $max: '$seatMap.price' }
        }
      }
    ]);

    if (seatTypeStats.length > 0) {
      await SeatCategoryPricing.insertMany(
        seatTypeStats.map((entry) => {
          const normalized = String(entry._id || 'regular');
          const displayName =
            normalized === 'vip'
              ? 'VIP'
              : normalized === 'premium'
              ? 'Premium'
              : normalized === 'wheelchair'
              ? 'Wheelchair'
              : 'Standard';

          const avgPrice = Math.round(entry.avgPrice || 0);
          const minPrice = Math.round(entry.minPrice || avgPrice || 0);
          const maxPrice = Math.round(entry.maxPrice || avgPrice || 0);

          return {
            name: displayName,
            basePrice: avgPrice,
            minPrice,
            maxPrice,
            dynamicPricingEnabled: normalized !== 'wheelchair',
            maxMultiplier: normalized === 'vip' ? 1.3 : normalized === 'premium' ? 1.4 : 1.5,
            isActive: true
          };
        })
      );
    } else {
      await SeatCategoryPricing.insertMany([
        { name: 'Standard', basePrice: 200, minPrice: 150, maxPrice: 350, dynamicPricingEnabled: true, maxMultiplier: 1.5, isActive: true },
        { name: 'Premium', basePrice: 350, minPrice: 300, maxPrice: 500, dynamicPricingEnabled: true, maxMultiplier: 1.4, isActive: true },
        { name: 'VIP', basePrice: 500, minPrice: 450, maxPrice: 700, dynamicPricingEnabled: true, maxMultiplier: 1.3, isActive: true },
        { name: 'Wheelchair', basePrice: 200, minPrice: 200, maxPrice: 200, dynamicPricingEnabled: false, maxMultiplier: 1.0, isActive: true }
      ]);
    }
  }
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

  const recent = (recentBookings as any[]).map((booking) => ({
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

export const getAdminAnalyticsData = async (
  range: AnalyticsRange = '7d',
  venueId: string = 'all'
) => {
  const now = new Date();
  const start = getRangeStart(range);

  const venueFilterEnabled = venueId !== 'all' && mongoose.Types.ObjectId.isValid(venueId);
  const venueObjectId = venueFilterEnabled ? toObjectId(venueId) : null;

  const bookingsMatch: Record<string, any> = {
    status: { $in: ['CONFIRMED', 'PENDING', 'CANCELLED'] },
    createdAt: { $gte: start, $lte: now }
  };

  const bookingLookupPipeline = [
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
      $lookup: {
        from: 'halls',
        localField: 'show.hallId',
        foreignField: '_id',
        as: 'hall'
      }
    },
    { $unwind: '$hall' },
    {
      $lookup: {
        from: 'venues',
        localField: 'hall.venueId',
        foreignField: '_id',
        as: 'venue'
      }
    },
    { $unwind: '$venue' },
    ...(venueFilterEnabled ? [{ $match: { 'venue._id': venueObjectId } }] : [])
  ];

  const [
    revenueTrend,
    bookingCategoryBuckets,
    topMoviesRaw,
    topVenuesRaw,
    occupancyRows,
    hourPerformance,
    channelsRaw,
    venueOptions
  ] = await Promise.all([
    Booking.aggregate([
      { $match: { ...bookingsMatch, status: 'CONFIRMED' } },
      ...bookingLookupPipeline,
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
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),
    Booking.aggregate([
      { $match: { ...bookingsMatch, status: 'CONFIRMED' } },
      ...bookingLookupPipeline,
      {
        $project: {
          avgTicketPrice: {
            $cond: [
              { $gt: [{ $size: '$seats' }, 0] },
              { $divide: ['$totalAmount', { $size: '$seats' }] },
              '$totalAmount'
            ]
          }
        }
      },
      {
        $bucket: {
          groupBy: '$avgTicketPrice',
          boundaries: [0, 250, 350, 500, 1000000],
          default: 'other',
          output: { count: { $sum: 1 } }
        }
      }
    ]),
    Booking.aggregate([
      { $match: { ...bookingsMatch, status: 'CONFIRMED' } },
      ...bookingLookupPipeline,
      {
        $lookup: {
          from: 'events',
          localField: 'show.eventId',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: '$event' },
      {
        $group: {
          _id: '$event._id',
          title: { $first: '$event.title' },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]),
    Booking.aggregate([
      { $match: { ...bookingsMatch, status: 'CONFIRMED' } },
      ...bookingLookupPipeline,
      {
        $group: {
          _id: '$venue._id',
          name: { $first: '$venue.name' },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
          halls: { $addToSet: '$hall._id' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 6 }
    ]),
    Show.aggregate([
      {
        $match: {
          startTime: { $gte: start, $lte: now },
          ...(venueFilterEnabled ? {} : {}),
          cancelledAt: { $exists: false }
        }
      },
      {
        $lookup: {
          from: 'halls',
          localField: 'hallId',
          foreignField: '_id',
          as: 'hall'
        }
      },
      { $unwind: '$hall' },
      ...(venueFilterEnabled ? [{ $match: { 'hall.venueId': venueObjectId } }] : []),
      {
        $lookup: {
          from: 'venues',
          localField: 'hall.venueId',
          foreignField: '_id',
          as: 'venue'
        }
      },
      { $unwind: '$venue' },
      {
        $project: {
          screen: '$hall.name',
          venue: '$venue.name',
          slot: {
            $concat: [
              {
                $cond: [
                  { $lt: [{ $hour: '$startTime' }, 10] },
                  { $concat: ['0', { $toString: { $hour: '$startTime' } }] },
                  { $toString: { $hour: '$startTime' } }
                ]
              },
              ':00'
            ]
          },
          occupancy: {
            $cond: [
              { $gt: ['$totalSeats', 0] },
              {
                $multiply: [{ $divide: [{ $size: '$bookedSeats' }, '$totalSeats'] }, 100]
              },
              0
            ]
          }
        }
      }
    ]),
    Show.aggregate([
      {
        $match: {
          startTime: { $gte: start, $lte: now },
          cancelledAt: { $exists: false }
        }
      },
      {
        $lookup: {
          from: 'halls',
          localField: 'hallId',
          foreignField: '_id',
          as: 'hall'
        }
      },
      { $unwind: '$hall' },
      ...(venueFilterEnabled ? [{ $match: { 'hall.venueId': venueObjectId } }] : []),
      {
        $project: {
          hour: { $hour: '$startTime' },
          occupancy: {
            $cond: [
              { $gt: ['$totalSeats', 0] },
              {
                $multiply: [{ $divide: [{ $size: '$bookedSeats' }, '$totalSeats'] }, 100]
              },
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: '$hour',
          avgOccupancy: { $avg: '$occupancy' }
        }
      },
      { $sort: { avgOccupancy: -1 } },
      { $limit: 3 }
    ]),
    Booking.aggregate([
      { $match: bookingsMatch },
      ...bookingLookupPipeline,
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    Venue.find({ isActive: true }).select('_id name').sort({ name: 1 })
  ]);

  const revenueByDay = revenueTrend.map((point: any) => {
    const month = String(point._id.month).padStart(2, '0');
    const day = String(point._id.day).padStart(2, '0');
    return {
      label: `${month}/${day}`,
      value: Math.round(point.revenue || 0)
    };
  });

  const categoryLabelMap: Record<string, string> = {
    '0': 'Standard',
    '250': 'Premium',
    '350': 'VIP',
    '500': 'Recliner',
    other: 'Other'
  };

  const bookingsByCategory = bookingCategoryBuckets.map((bucket: any) => ({
    label: categoryLabelMap[String(bucket._id)] || 'Other',
    value: bucket.count || 0
  }));

  const occupancyByScreenAndTime = new Map<string, { total: number; count: number; screen: string; venue: string; time: string }>();

  for (const row of occupancyRows as any[]) {
    const time = row.slot || toHourSlot(new Date());
    const key = `${row.screen}::${time}`;
    const existing = occupancyByScreenAndTime.get(key);
    if (!existing) {
      occupancyByScreenAndTime.set(key, {
        screen: row.screen,
        venue: row.venue,
        time,
        total: row.occupancy || 0,
        count: 1
      });
    } else {
      existing.total += row.occupancy || 0;
      existing.count += 1;
    }
  }

  const occupancyHeatmap = Array.from(occupancyByScreenAndTime.values())
    .map((item) => ({
      screen: item.screen,
      venue: item.venue,
      time: item.time,
      occupancy: Math.round(item.total / item.count)
    }))
    .sort((a, b) => `${a.screen}-${a.time}`.localeCompare(`${b.screen}-${b.time}`));

  const topMovieIds = (topMoviesRaw as any[]).map((movie) => movie._id);
  const movieShowStats = await Show.aggregate([
    { $match: { eventId: { $in: topMovieIds }, cancelledAt: { $exists: false } } },
    {
      $group: {
        _id: '$eventId',
        avgOccupancy: {
          $avg: {
            $cond: [
              { $gt: ['$totalSeats', 0] },
              {
                $multiply: [{ $divide: [{ $size: '$bookedSeats' }, '$totalSeats'] }, 100]
              },
              0
            ]
          }
        }
      }
    }
  ]);

  const movieOccMap = new Map(movieShowStats.map((entry) => [entry._id.toString(), entry.avgOccupancy || 0]));

  const topMovies = (topMoviesRaw as any[]).map((movie) => {
    const avgOccupancy = Math.round(movieOccMap.get(movie._id.toString()) || 0);
    return {
      id: movie._id,
      title: movie.title,
      revenue: Math.round(movie.revenue || 0),
      bookings: movie.bookings || 0,
      avgOccupancy,
      trend: movie.bookings >= 20 ? 'up' : movie.bookings >= 8 ? 'stable' : 'down'
    };
  });

  const topVenues = (topVenuesRaw as any[]).map((venue) => ({
    id: venue._id,
    name: venue.name,
    revenue: Math.round(venue.revenue || 0),
    bookings: venue.bookings || 0,
    screens: venue.halls?.length || 0,
    avgOccupancy: venue.bookings ? Math.min(100, Math.round((venue.bookings / Math.max(venue.halls?.length || 1, 1)) * 10)) : 0
  }));

  const peakHours = (hourPerformance as any[]).map((item) => ({
    time: `${String(item._id).padStart(2, '0')}:00 - ${String((item._id + 3) % 24).padStart(2, '0')}:00`,
    percentage: Math.round(item.avgOccupancy || 0)
  }));

  const totalChannels = (channelsRaw as any[]).reduce((sum, item) => sum + (item.count || 0), 0);
  const bookingChannels = (channelsRaw as any[]).map((item) => ({
    channel: String(item._id),
    percentage: totalChannels > 0 ? Math.round(((item.count || 0) / totalChannels) * 100) : 0
  }));

  const totalRevenue = revenueByDay.reduce((sum, row) => sum + row.value, 0);
  const totalBookings = (topMoviesRaw as any[]).reduce((sum, row) => sum + (row.bookings || 0), 0);
  const avgOccupancy = occupancyHeatmap.length
    ? Math.round(occupancyHeatmap.reduce((sum, row) => sum + row.occupancy, 0) / occupancyHeatmap.length)
    : 0;

  const insights: string[] = [];
  if (peakHours[0]) {
    insights.push(`${peakHours[0].time} is currently the strongest occupancy window (${peakHours[0].percentage}%).`);
  }
  if (topMovies[0]) {
    insights.push(`${topMovies[0].title} leads performance with ₹${Math.round(topMovies[0].revenue).toLocaleString('en-IN')} revenue.`);
  }
  if (bookingChannels[0]) {
    insights.push(`${bookingChannels[0].channel} bookings represent ${bookingChannels[0].percentage}% of activity in this range.`);
  }

  return {
    range,
    filters: {
      venueId,
      venues: venueOptions.map((venue) => ({ id: venue._id, name: venue.name }))
    },
    stats: {
      totalRevenue,
      totalBookings,
      avgOccupancy,
      activeShows: occupancyHeatmap.length
    },
    charts: {
      revenueByDay,
      bookingsByCategory
    },
    occupancyHeatmap,
    topMovies,
    topVenues,
    peakHours,
    bookingChannels,
    insights
  };
};

export const getAdminPricingData = async (ruleType: 'all' | PricingRuleType = 'all') => {
  await ensureDefaultPricingData();

  const rulesQuery = ruleType === 'all' ? {} : { type: ruleType };

  const [rules, categories] = await Promise.all([
    PricingRule.find(rulesQuery).sort({ priority: 1, createdAt: -1 }),
    SeatCategoryPricing.find({ isActive: true }).sort({ name: 1 })
  ]);

  const activeRules = rules.filter((rule) => rule.active).length;
  const dynamicEnabledCount = categories.filter((category) => category.dynamicPricingEnabled).length;

  return {
    rules: rules.map((rule) => ({
      id: rule._id,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      active: rule.active,
      priority: rule.priority,
      multiplier: rule.multiplier,
      conditions: rule.conditions || {},
      effectiveFrom: rule.effectiveFrom,
      effectiveTo: rule.effectiveTo,
      createdAt: rule.createdAt
    })),
    categories: categories.map((category) => ({
      id: category._id,
      name: category.name,
      basePrice: category.basePrice,
      minPrice: category.minPrice,
      maxPrice: category.maxPrice,
      dynamicPricingEnabled: category.dynamicPricingEnabled,
      maxMultiplier: category.maxMultiplier
    })),
    summary: {
      totalRules: rules.length,
      activeRules,
      totalCategories: categories.length,
      dynamicEnabledCount
    }
  };
};

export const togglePricingRuleStatus = async (ruleId: string, active: boolean) => {
  const rule = await PricingRule.findByIdAndUpdate(ruleId, { active }, { new: true, runValidators: true });
  if (!rule) throw new Error('Pricing rule not found');
  return rule;
};

export const deletePricingRule = async (ruleId: string) => {
  const deleted = await PricingRule.findByIdAndDelete(ruleId);
  if (!deleted) throw new Error('Pricing rule not found');
  return deleted;
};

export const getAdminShowsData = async (params: {
  search?: string;
  status?: 'all' | AdminShowStatus;
  venue?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}) => {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 200);
  const skip = (page - 1) * limit;

  const from = params.from ? new Date(params.from) : new Date(new Date().setHours(0, 0, 0, 0));
  const to = params.to ? new Date(params.to) : new Date(new Date().setDate(new Date().getDate() + 30));
  to.setHours(23, 59, 59, 999);

  const baseQuery: Record<string, any> = {
    startTime: { $gte: from, $lte: to }
  };

  const shows = await Show.find(baseQuery)
    .sort({ startTime: 1 })
    .populate('eventId', 'title posterUrl durationMinutes')
    .populate({
      path: 'hallId',
      select: 'name venueId capacity',
      populate: { path: 'venueId', select: 'name' }
    })
    .lean();

  const showIds = shows.map((show: any) => show._id);
  const bookingStats = await Booking.aggregate([
    {
      $match: {
        showId: { $in: showIds },
        status: 'CONFIRMED'
      }
    },
    {
      $group: {
        _id: '$showId',
        bookings: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }
    }
  ]);
  const bookingMap = new Map(bookingStats.map((item) => [item._id.toString(), item]));

  const mapped = shows.map((show: any) => {
    const booking = bookingMap.get(show._id.toString());
    const bookedSeats = Array.isArray(show.bookedSeats) ? show.bookedSeats.length : 0;

    return {
      id: show._id.toString(),
      eventId: show.eventId?._id?.toString(),
      movieTitle: show.eventId?.title || 'Unknown',
      moviePoster: show.eventId?.posterUrl || '',
      venue: show.hallId?.venueId?.name || 'Unknown Venue',
      venueId: show.hallId?.venueId?._id?.toString(),
      screen: show.hallId?.name || 'Unknown Screen',
      screenId: show.hallId?._id?.toString(),
      startTime: show.startTime,
      endTime: show.endTime,
      date: new Date(show.startTime).toISOString().split('T')[0],
      time: new Date(show.startTime).toTimeString().slice(0, 5),
      endTimeLabel: new Date(show.endTime).toTimeString().slice(0, 5),
      duration: Math.max(1, Math.round((new Date(show.endTime).getTime() - new Date(show.startTime).getTime()) / 60000)),
      bookedSeats,
      totalSeats: show.totalSeats,
      bookings: booking?.bookings || 0,
      revenue: Math.round(booking?.revenue || 0),
      status: calculateShowStatus(show)
    };
  });

  const filtered = mapped.filter((show) => {
    const matchesSearch = params.search
      ? show.movieTitle.toLowerCase().includes(params.search.toLowerCase())
      : true;
    const matchesStatus = !params.status || params.status === 'all' ? true : show.status === params.status;
    const matchesVenue = !params.venue || params.venue === 'all' ? true : show.venueId === params.venue;
    return matchesSearch && matchesStatus && matchesVenue;
  });

  const items = filtered.slice(skip, skip + limit);
  const total = filtered.length;

  const venues = Array.from(
    new Map(filtered.map((show) => [show.venueId || show.venue, { id: show.venueId || show.venue, name: show.venue }])).values()
  );
  const screens = Array.from(new Set(filtered.map((show) => show.screen))).sort();

  const summary = {
    total,
    active: filtered.filter((show) => show.status === 'scheduled' || show.status === 'ongoing').length,
    totalRevenue: filtered.reduce((sum, show) => sum + show.revenue, 0),
    avgOccupancy:
      filtered.length > 0
        ? Math.round(
            (filtered.reduce((sum, show) => sum + (show.totalSeats > 0 ? show.bookedSeats / show.totalSeats : 0), 0) /
              filtered.length) *
              100
          )
        : 0
  };

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit))
    },
    summary,
    filters: {
      venues,
      screens,
      from,
      to
    }
  };
};

export const cancelShowByAdmin = async (showId: string, reason: string = 'Cancelled by admin') => {
  const show = await Show.findById(showId);
  if (!show) throw new Error('Show not found');

  if (show.cancelledAt) {
    return show;
  }

  if (show.endTime.getTime() < Date.now()) {
    throw new Error('Cannot cancel a completed show');
  }

  show.cancelledAt = new Date();
  show.cancellationReason = reason;
  await show.save();

  await Booking.updateMany(
    { showId: show._id, status: { $in: ['PENDING', 'CONFIRMED'] } },
    {
      $set: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason
      }
    }
  );

  return show;
};
