import { Request, Response } from 'express';
import {
  cancelShowByAdmin,
  deletePricingRule,
  getAdminAnalyticsData,
  getAdminMoviesData,
  getAdminPricingData,
  getAdminShowsData,
  getDashboardData,
  togglePricingRuleStatus,
  toggleEventActiveStatus
} from './admin.service';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const rawRange = (req.query.range as string) || 'today';
    const range = rawRange === '7d' || rawRange === '30d' ? rawRange : 'today';

    const data = await getDashboardData(range);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
  }
};

export const getMovies = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
    const search = (req.query.search as string) || '';
    const statusQuery = (req.query.status as string) || 'all';
    const status = statusQuery === 'active' || statusQuery === 'inactive' ? statusQuery : 'all';

    const data = await getAdminMoviesData({
      page,
      limit,
      search,
      status
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch movies' });
  }
};

export const updateMovieStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body as { isActive?: boolean };

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const event = await toggleEventActiveStatus(id as string, isActive);
    res.json({ event });
  } catch (error: any) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to update movie status' });
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const rawRange = (req.query.range as string) || '7d';
    const range = rawRange === '30d' || rawRange === '90d' ? rawRange : '7d';
    const venueId = (req.query.venueId as string) || 'all';

    const data = await getAdminAnalyticsData(range, venueId);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch analytics data' });
  }
};

export const getPricing = async (req: Request, res: Response) => {
  try {
    const rawType = (req.query.type as string) || 'all';
    const allowed = ['all', 'base', 'time_based', 'occupancy', 'day_of_week', 'special_event', 'early_bird', 'last_minute'];
    const type = allowed.includes(rawType) ? (rawType as any) : 'all';

    const data = await getAdminPricingData(type);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch pricing data' });
  }
};

export const updatePricingRuleStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body as { active?: boolean };

    if (typeof active !== 'boolean') {
      return res.status(400).json({ error: 'active must be a boolean' });
    }

    const rule = await togglePricingRuleStatus(id as string, active);
    res.json({ rule });
  } catch (error: any) {
    if (error.message === 'Pricing rule not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to update pricing rule' });
  }
};

export const removePricingRule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deletePricingRule(id as string);
    res.json({ ok: true });
  } catch (error: any) {
    if (error.message === 'Pricing rule not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to delete pricing rule' });
  }
};

export const getShows = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
    const statusRaw = (req.query.status as string) || 'all';
    const status = ['all', 'scheduled', 'ongoing', 'completed', 'cancelled'].includes(statusRaw)
      ? (statusRaw as any)
      : 'all';

    const data = await getAdminShowsData({
      page,
      limit,
      search: (req.query.search as string) || '',
      venue: (req.query.venue as string) || 'all',
      status,
      from: req.query.from as string,
      to: req.query.to as string
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch shows' });
  }
};

export const cancelShow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const reason = (req.body?.reason as string) || 'Cancelled by admin';
    const show = await cancelShowByAdmin(id as string, reason);
    res.json({ show });
  } catch (error: any) {
    if (error.message === 'Show not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Cannot cancel a completed show') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to cancel show' });
  }
};
