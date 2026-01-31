import { Request, Response } from 'express';
import * as EventService from './event.service';
import { 
  createEventSchema, 
  updateEventSchema, 
  createShowSchema, 
  updateShowSchema,
  bulkCreateShowsSchema 
} from './event.validation';

// ============ EVENT CONTROLLERS ============

export const createEvent = async (req: Request, res: Response) => {
  try {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const event = await EventService.createEvent({
      ...parsed.data,
      releaseDate: parsed.data.releaseDate ? new Date(parsed.data.releaseDate) : undefined
    });
    res.status(201).json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getEvent = async (req: Request, res: Response) => {
  try {
    const event = await EventService.getEventById(req.params.id as string);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const { genre, language, search, active, page, limit } = req.query;
    const result = await EventService.getAllEvents({
      genre: genre as string,
      language: language as string,
      search: search as string,
      isActive: active === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const updateData = {
      ...parsed.data,
      releaseDate: parsed.data.releaseDate ? new Date(parsed.data.releaseDate) : undefined
    };
    const event = await EventService.updateEvent(req.params.id as string, updateData);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    await EventService.deleteEvent(req.params.id as string);
    res.json({ message: 'Event deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const searchEvents = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });

    const events = await EventService.searchEvents(q as string);
    res.json({ events, count: events.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ============ SHOW CONTROLLERS ============

export const createShow = async (req: Request, res: Response) => {
  try {
    const parsed = createShowSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const show = await EventService.createShow({
      ...parsed.data,
      startTime: new Date(parsed.data.startTime)
    });
    res.status(201).json({ show });
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('not active')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('conflicts')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getShow = async (req: Request, res: Response) => {
  try {
    const show = await EventService.getShowById(req.params.id as string);
    if (!show) return res.status(404).json({ error: 'Show not found' });
    res.json({ show });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getShowsForEvent = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const shows = await EventService.getShowsForEvent(req.params.eventId as string, date as string);
    res.json({ shows, count: shows.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getShowsByVenue = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const shows = await EventService.getShowsByVenue(req.params.venueId as string, date as string);
    res.json({ shows, count: shows.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateShow = async (req: Request, res: Response) => {
  try {
    const parsed = updateShowSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const updateData = {
      ...parsed.data,
      startTime: parsed.data.startTime ? new Date(parsed.data.startTime) : undefined
    };
    const show = await EventService.updateShow(req.params.id as string, updateData);
    if (!show) return res.status(404).json({ error: 'Show not found' });
    res.json({ show });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteShow = async (req: Request, res: Response) => {
  try {
    await EventService.deleteShow(req.params.id as string);
    res.json({ message: 'Show deleted successfully' });
  } catch (error: any) {
    if (error.message.includes('existing bookings')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getAvailableSeats = async (req: Request, res: Response) => {
  try {
    const seatInfo = await EventService.getAvailableSeats(req.params.showId as string);
    res.json(seatInfo);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const bulkCreateShows = async (req: Request, res: Response) => {
  try {
    const parsed = bulkCreateShowsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const shows = await EventService.bulkCreateShows({
      ...parsed.data,
      showTimes: parsed.data.showTimes.map(t => new Date(t))
    });

    res.status(201).json({ 
      shows, 
      created: shows.length,
      requested: parsed.data.showTimes.length 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
