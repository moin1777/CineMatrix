import { Types } from 'mongoose';
import { 
  VenueTemplate, 
  IVenueTemplate, 
  ISeat,
  generateStandardLayout, 
  generateCurvedLayout 
} from './venue-template.model';
import { 
  CreateVenueTemplateInput, 
  UpdateVenueTemplateInput,
  GenerateLayoutInput,
  CloneTemplateInput,
  UpdateSeatInput,
  BulkUpdateSeatsInput,
  AddSeatsInput,
  RemoveSeatsInput
} from './venue-template.validation';
import { Venue } from '../venue/venue.model';

export class VenueTemplateService {
  /**
   * Create a new venue template
   */
  async create(data: CreateVenueTemplateInput, userId: string): Promise<IVenueTemplate> {
    // Verify venue exists
    const venue = await Venue.findById(data.venueId);
    if (!venue) {
      throw new Error('Venue not found');
    }

    const template = new VenueTemplate({
      ...data,
      venueId: new Types.ObjectId(data.venueId),
      createdBy: new Types.ObjectId(userId),
      version: 1
    });

    return template.save();
  }

  /**
   * Generate a layout automatically based on parameters
   */
  async generateLayout(data: GenerateLayoutInput, userId: string): Promise<IVenueTemplate> {
    // Verify venue exists
    const venue = await Venue.findById(data.venueId);
    if (!venue) {
      throw new Error('Venue not found');
    }

    let layoutData: { seats: ISeat[]; sections: any[]; aisles: any[] };

    if (data.layoutType === 'curved' || data.layoutType === 'stadium') {
      layoutData = generateCurvedLayout(
        data.rows,
        data.seatsPerRow,
        data.basePrice,
        data.options?.curveRadius
      );
    } else {
      layoutData = generateStandardLayout(
        data.rows,
        data.seatsPerRow,
        data.basePrice,
        data.options
      );
    }

    // Calculate max columns including aisles
    const maxCol = Math.max(...layoutData.seats.map(s => s.colIndex)) + 1;

    const template = new VenueTemplate({
      name: data.name,
      venueId: new Types.ObjectId(data.venueId),
      screenId: data.screenId,
      screenName: data.screenName,
      screenType: data.screenType,
      totalCapacity: layoutData.seats.filter(s => s.status === 'active').length,
      layout: {
        maxRows: data.rows,
        maxColumns: maxCol,
        defaultSeatSize: { width: 30, height: 30 },
        seatGap: { horizontal: 4, vertical: 8 },
        padding: { top: 60, right: 40, bottom: 40, left: 60 },
        stagePosition: 'top',
        shape: data.layoutType === 'curved' ? 'curved' : 'rectangular',
        curveRadius: data.options?.curveRadius,
        backgroundColor: '#1a1a2e',
        showGrid: false,
        rowLabelsPosition: 'left'
      },
      stage: {
        label: 'SCREEN',
        widthPercent: 80,
        height: 20,
        color: '#6366f1',
        glowEffect: true
      },
      seats: layoutData.seats,
      sections: layoutData.sections,
      aisles: layoutData.aisles,
      version: 1,
      isDraft: true,
      createdBy: new Types.ObjectId(userId)
    });

    return template.save();
  }

  /**
   * Get template by ID
   */
  async getById(id: string): Promise<IVenueTemplate | null> {
    return VenueTemplate.findById(id)
      .populate('venueId', 'name address city')
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');
  }

  /**
   * Get active template for a venue screen
   */
  async getActiveTemplate(venueId: string, screenId: string): Promise<IVenueTemplate | null> {
    return VenueTemplate.findOne({
      venueId: new Types.ObjectId(venueId),
      screenId,
      isActive: true,
      isDraft: false
    }).sort({ version: -1 });
  }

  /**
   * Get all templates for a venue
   */
  async getByVenue(venueId: string, includeInactive = false): Promise<IVenueTemplate[]> {
    const query: Record<string, any> = { 
      venueId: new Types.ObjectId(venueId) 
    };
    
    if (!includeInactive) {
      query.isActive = true;
    }

    return VenueTemplate.find(query)
      .sort({ screenId: 1, version: -1 })
      .populate('createdBy', 'name email');
  }

  /**
   * Get all templates (paginated)
   */
  async getAll(options: {
    page?: number;
    limit?: number;
    venueId?: string;
    screenType?: string;
    isDraft?: boolean;
    includeInactive?: boolean;
  }): Promise<{ templates: IVenueTemplate[]; total: number; pages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (options.venueId) {
      query.venueId = new Types.ObjectId(options.venueId);
    }
    if (options.screenType) {
      query.screenType = options.screenType;
    }
    if (typeof options.isDraft === 'boolean') {
      query.isDraft = options.isDraft;
    }
    if (!options.includeInactive) {
      query.isActive = true;
    }

    const [templates, total] = await Promise.all([
      VenueTemplate.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('venueId', 'name city')
        .populate('createdBy', 'name email'),
      VenueTemplate.countDocuments(query)
    ]);

    return {
      templates,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Update a template
   */
  async update(
    id: string, 
    data: UpdateVenueTemplateInput, 
    userId: string
  ): Promise<IVenueTemplate | null> {
    const template = await VenueTemplate.findById(id);
    if (!template) {
      throw new Error('Template not found');
    }

    // Update fields
    Object.assign(template, data);
    template.lastModifiedBy = new Types.ObjectId(userId);

    return template.save();
  }

  /**
   * Clone a template (creates a new version or copy)
   */
  async clone(
    sourceId: string, 
    data: CloneTemplateInput, 
    userId: string
  ): Promise<IVenueTemplate> {
    const source = await VenueTemplate.findById(sourceId);
    if (!source) {
      throw new Error('Source template not found');
    }

    const venueId = data.venueId ? new Types.ObjectId(data.venueId) : source.venueId;

    // Check if this is a new version of the same template
    const isNewVersion = !data.venueId || data.venueId === source.venueId.toString();
    
    let version = 1;
    if (isNewVersion) {
      const latestVersion = await VenueTemplate.findOne({
        venueId,
        screenId: data.screenId || source.screenId
      }).sort({ version: -1 });
      
      version = (latestVersion?.version || 0) + 1;
    }

    const cloned = new VenueTemplate({
      name: data.name,
      description: source.description,
      venueId,
      screenId: data.screenId || source.screenId,
      screenName: data.screenName || source.screenName,
      screenType: source.screenType,
      totalCapacity: source.totalCapacity,
      layout: source.layout,
      stage: source.stage,
      seats: source.seats,
      sections: source.sections,
      aisles: source.aisles,
      version,
      isActive: false,
      isDraft: true,
      createdBy: new Types.ObjectId(userId)
    });

    return cloned.save();
  }

  /**
   * Publish a draft template (makes it active)
   */
  async publish(id: string, userId: string): Promise<IVenueTemplate | null> {
    const template = await VenueTemplate.findById(id);
    if (!template) {
      throw new Error('Template not found');
    }

    if (!template.isDraft) {
      throw new Error('Template is already published');
    }

    // Deactivate other active templates for the same screen
    await VenueTemplate.updateMany(
      {
        venueId: template.venueId,
        screenId: template.screenId,
        _id: { $ne: template._id },
        isActive: true
      },
      { $set: { isActive: false } }
    );

    // Publish this template
    template.isDraft = false;
    template.isActive = true;
    template.lastModifiedBy = new Types.ObjectId(userId);

    return template.save();
  }

  /**
   * Update a single seat
   */
  async updateSeat(
    templateId: string, 
    data: UpdateSeatInput, 
    userId: string
  ): Promise<IVenueTemplate | null> {
    const template = await VenueTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const seatIndex = template.seats.findIndex(s => s.seatId === data.seatId);
    if (seatIndex === -1) {
      throw new Error('Seat not found');
    }

    // Update seat properties
    Object.assign(template.seats[seatIndex], data.updates);
    template.lastModifiedBy = new Types.ObjectId(userId);

    return template.save();
  }

  /**
   * Bulk update seats
   */
  async bulkUpdateSeats(
    templateId: string, 
    data: BulkUpdateSeatsInput, 
    userId: string
  ): Promise<IVenueTemplate | null> {
    const template = await VenueTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const seatIdSet = new Set(data.seatIds);
    
    for (const seat of template.seats) {
      if (seatIdSet.has(seat.seatId)) {
        Object.assign(seat, data.updates);
      }
    }

    template.lastModifiedBy = new Types.ObjectId(userId);
    return template.save();
  }

  /**
   * Add seats to template
   */
  async addSeats(
    templateId: string, 
    data: AddSeatsInput, 
    userId: string
  ): Promise<IVenueTemplate | null> {
    const template = await VenueTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Check for duplicate seat IDs
    const existingIds = new Set(template.seats.map(s => s.seatId));
    for (const seat of data.seats) {
      if (existingIds.has(seat.seatId)) {
        throw new Error(`Seat ID ${seat.seatId} already exists`);
      }
    }

    template.seats.push(...data.seats);
    template.lastModifiedBy = new Types.ObjectId(userId);

    return template.save();
  }

  /**
   * Remove seats from template
   */
  async removeSeats(
    templateId: string, 
    data: RemoveSeatsInput, 
    userId: string
  ): Promise<IVenueTemplate | null> {
    const template = await VenueTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const removeSet = new Set(data.seatIds);
    template.seats = template.seats.filter(s => !removeSet.has(s.seatId));
    template.lastModifiedBy = new Types.ObjectId(userId);

    return template.save();
  }

  /**
   * Delete a template (soft delete - marks as inactive)
   */
  async delete(id: string): Promise<boolean> {
    const result = await VenueTemplate.findByIdAndUpdate(id, {
      isActive: false,
      isDraft: false
    });
    return !!result;
  }

  /**
   * Hard delete a template
   */
  async hardDelete(id: string): Promise<boolean> {
    const result = await VenueTemplate.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Get statistics for a template
   */
  async getTemplateStats(id: string): Promise<{
    totalSeats: number;
    activeSeats: number;
    seatsByCategory: Record<string, number>;
    seatsBySection: Record<string, number>;
    priceRange: { min: number; max: number };
  } | null> {
    const template = await VenueTemplate.findById(id);
    if (!template) {
      return null;
    }

    const activeSeats = template.seats.filter(s => s.status === 'active');
    
    const seatsByCategory: Record<string, number> = {};
    const seatsBySection: Record<string, number> = {};
    
    let minPrice = Infinity;
    let maxPrice = 0;

    for (const seat of activeSeats) {
      // Count by category
      seatsByCategory[seat.category] = (seatsByCategory[seat.category] || 0) + 1;
      
      // Calculate price range
      const baseSection = template.sections.find(s => s.category === seat.category);
      if (baseSection) {
        const price = baseSection.basePrice * seat.priceMultiplier;
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      }
    }

    // Count by section
    for (const section of template.sections) {
      if (section.bounds) {
        seatsBySection[section.sectionId] = activeSeats.filter(seat =>
          seat.rowIndex >= section.bounds!.rowStart &&
          seat.rowIndex <= section.bounds!.rowEnd &&
          seat.colIndex >= section.bounds!.colStart &&
          seat.colIndex <= section.bounds!.colEnd
        ).length;
      } else {
        // If no bounds, count by category match
        seatsBySection[section.sectionId] = activeSeats.filter(
          seat => seat.category === section.category
        ).length;
      }
    }

    return {
      totalSeats: template.seats.length,
      activeSeats: activeSeats.length,
      seatsByCategory,
      seatsBySection,
      priceRange: {
        min: minPrice === Infinity ? 0 : minPrice,
        max: maxPrice
      }
    };
  }

  /**
   * Get templates requiring maintenance
   */
  async getMaintenanceRequired(): Promise<IVenueTemplate[]> {
    return VenueTemplate.find({
      isActive: true,
      'seats.status': 'maintenance'
    }).populate('venueId', 'name city');
  }

  /**
   * Export template as JSON
   */
  async exportTemplate(id: string): Promise<object | null> {
    const template = await VenueTemplate.findById(id);
    if (!template) {
      return null;
    }

    return {
      name: template.name,
      description: template.description,
      screenType: template.screenType,
      layout: template.layout,
      stage: template.stage,
      seats: template.seats,
      sections: template.sections,
      aisles: template.aisles,
      exportedAt: new Date().toISOString(),
      version: template.version
    };
  }
}

export const venueTemplateService = new VenueTemplateService();
