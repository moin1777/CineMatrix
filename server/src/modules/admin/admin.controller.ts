import { Request, Response } from 'express';
import {
  getAdminMoviesData,
  getDashboardData,
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
