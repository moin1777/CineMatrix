import { Request, Response, NextFunction } from 'express';
import { venueTemplateService } from './venue-template.service';
import {
  createVenueTemplateSchema,
  updateVenueTemplateSchema,
  generateLayoutSchema,
  cloneTemplateSchema,
  updateSeatSchema,
  bulkUpdateSeatsSchema,
  addSeatsSchema,
  removeSeatsSchema
} from './venue-template.validation';

export class VenueTemplateController {
  /**
   * Create a new venue template
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createVenueTemplateSchema.parse(req.body);
      const userId = req.user!.sub;
      
      const template = await venueTemplateService.create(data, userId);
      
      res.status(201).json({
        success: true,
        message: 'Venue template created successfully',
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate a layout automatically
   */
  async generateLayout(req: Request, res: Response, next: NextFunction) {
    try {
      const data = generateLayoutSchema.parse(req.body);
      const userId = req.user!.sub;
      
      const template = await venueTemplateService.generateLayout(data, userId);
      
      res.status(201).json({
        success: true,
        message: 'Layout generated successfully',
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const template = await venueTemplateService.getById(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active template for a venue screen
   */
  async getActiveTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const venueId = req.params.venueId as string;
      const screenId = req.params.screenId as string;
      const template = await venueTemplateService.getActiveTemplate(venueId, screenId);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'No active template found for this screen'
        });
      }
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all templates for a venue
   */
  async getByVenue(req: Request, res: Response, next: NextFunction) {
    try {
      const venueId = req.params.venueId as string;
      const includeInactive = req.query.includeInactive === 'true';
      
      const templates = await venueTemplateService.getByVenue(venueId, includeInactive);
      
      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all templates (paginated)
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page,
        limit,
        venueId,
        screenType,
        isDraft,
        includeInactive
      } = req.query;
      
      const result = await venueTemplateService.getAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        venueId: venueId as string,
        screenType: screenType as string,
        isDraft: isDraft === 'true' ? true : isDraft === 'false' ? false : undefined,
        includeInactive: includeInactive === 'true'
      });
      
      res.json({
        success: true,
        data: result.templates,
        pagination: {
          total: result.total,
          pages: result.pages,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a template
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = updateVenueTemplateSchema.parse(req.body);
      const userId = req.user!.sub;
      
      const template = await venueTemplateService.update(id, data, userId);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Template updated successfully',
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clone a template
   */
  async clone(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = cloneTemplateSchema.parse(req.body);
      const userId = req.user!.sub;
      
      const template = await venueTemplateService.clone(id, data, userId);
      
      res.status(201).json({
        success: true,
        message: 'Template cloned successfully',
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Publish a draft template
   */
  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.sub;
      
      const template = await venueTemplateService.publish(id, userId);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Template published successfully',
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a single seat
   */
  async updateSeat(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = updateSeatSchema.parse(req.body);
      const userId = req.user!.sub;
      
      const template = await venueTemplateService.updateSeat(id, data, userId);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Seat updated successfully',
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update seats
   */
  async bulkUpdateSeats(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = bulkUpdateSeatsSchema.parse(req.body);
      const userId = req.user!.sub;
      
      const template = await venueTemplateService.bulkUpdateSeats(id, data, userId);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Seats updated successfully',
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add seats to template
   */
  async addSeats(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = addSeatsSchema.parse(req.body);
      const userId = req.user!.sub;
      
      const template = await venueTemplateService.addSeats(id, data, userId);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Seats added successfully',
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove seats from template
   */
  async removeSeats(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = removeSeatsSchema.parse(req.body);
      const userId = req.user!.sub;
      
      const template = await venueTemplateService.removeSeats(id, data, userId);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Seats removed successfully',
        data: template
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a template (soft delete)
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const deleted = await venueTemplateService.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template statistics
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const stats = await venueTemplateService.getTemplateStats(id);
      
      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export template as JSON
   */
  async exportTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const exported = await venueTemplateService.exportTemplate(id);
      
      if (!exported) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="template-${id}.json"`);
      res.json(exported);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get templates requiring maintenance
   */
  async getMaintenanceRequired(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await venueTemplateService.getMaintenanceRequired();
      
      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      next(error);
    }
  }
}

export const venueTemplateController = new VenueTemplateController();
