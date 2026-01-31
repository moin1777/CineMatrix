import { Request, Response } from 'express';
import * as VenueService from './venue.service';
import { createVenueSchema, updateVenueSchema, createHallSchema, updateHallSchema } from './venue.validation';

// ============ VENUE CONTROLLERS ============

export const createVenue = async (req: Request, res: Response) => {
  try {
    const parsed = createVenueSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const venue = await VenueService.createVenue(parsed.data);
    res.status(201).json({ venue });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getVenue = async (req: Request, res: Response) => {
  try {
    const venue = await VenueService.getVenueById(req.params.id as string);
    if (!venue) return res.status(404).json({ error: 'Venue not found' });
    res.json({ venue });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllVenues = async (req: Request, res: Response) => {
  try {
    const { city, active } = req.query;
    const venues = await VenueService.getAllVenues({
      city: city as string,
      isActive: active === 'false' ? false : true
    });
    res.json({ venues, count: venues.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateVenue = async (req: Request, res: Response) => {
  try {
    const parsed = updateVenueSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const venue = await VenueService.updateVenue(req.params.id as string, parsed.data);
    if (!venue) return res.status(404).json({ error: 'Venue not found' });
    res.json({ venue });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteVenue = async (req: Request, res: Response) => {
  try {
    await VenueService.deleteVenue(req.params.id as string);
    res.json({ message: 'Venue deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ============ HALL CONTROLLERS ============

export const createHall = async (req: Request, res: Response) => {
  try {
    const parsed = createHallSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const hall = await VenueService.createHall(parsed.data);
    res.status(201).json({ hall });
  } catch (error: any) {
    if (error.message === 'Venue not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getHall = async (req: Request, res: Response) => {
  try {
    const hall = await VenueService.getHallById(req.params.id as string);
    if (!hall) return res.status(404).json({ error: 'Hall not found' });
    res.json({ hall });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getHallsByVenue = async (req: Request, res: Response) => {
  try {
    const halls = await VenueService.getHallsByVenue(req.params.venueId as string);
    res.json({ halls, count: halls.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHall = async (req: Request, res: Response) => {
  try {
    const parsed = updateHallSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const hall = await VenueService.updateHall(req.params.id as string, parsed.data);
    if (!hall) return res.status(404).json({ error: 'Hall not found' });
    res.json({ hall });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteHall = async (req: Request, res: Response) => {
  try {
    await VenueService.deleteHall(req.params.id as string);
    res.json({ message: 'Hall deactivated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getHallSeatMap = async (req: Request, res: Response) => {
  try {
    const seatMap = await VenueService.getHallSeatMap(req.params.id as string);
    res.json(seatMap);
  } catch (error: any) {
    if (error.message === 'Hall not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};
