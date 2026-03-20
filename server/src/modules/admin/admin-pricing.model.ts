import mongoose, { Document, Schema } from 'mongoose';

export type PricingRuleType =
	| 'base'
	| 'time_based'
	| 'occupancy'
	| 'day_of_week'
	| 'special_event'
	| 'early_bird'
	| 'last_minute';

export interface IPricingRule extends Document {
	name: string;
	description?: string;
	type: PricingRuleType;
	active: boolean;
	priority: number;
	multiplier: number;
	conditions: Record<string, any>;
	effectiveFrom: Date;
	effectiveTo: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface ISeatCategoryPricing extends Document {
	name: string;
	basePrice: number;
	minPrice: number;
	maxPrice: number;
	dynamicPricingEnabled: boolean;
	maxMultiplier: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const PricingRuleSchema = new Schema<IPricingRule>(
	{
		name: { type: String, required: true, trim: true },
		description: { type: String, default: '' },
		type: {
			type: String,
			enum: ['base', 'time_based', 'occupancy', 'day_of_week', 'special_event', 'early_bird', 'last_minute'],
			required: true,
			index: true
		},
		active: { type: Boolean, default: true, index: true },
		priority: { type: Number, required: true, min: 1, index: true },
		multiplier: { type: Number, required: true, min: 0.1, max: 5 },
		conditions: { type: Schema.Types.Mixed, default: {} },
		effectiveFrom: { type: Date, required: true, default: Date.now },
		effectiveTo: {
			type: Date,
			required: true,
			default: () => {
				const date = new Date();
				date.setFullYear(date.getFullYear() + 2);
				return date;
			}
		}
	},
	{ timestamps: true }
);

PricingRuleSchema.index({ active: 1, priority: 1 });

const SeatCategoryPricingSchema = new Schema<ISeatCategoryPricing>(
	{
		name: { type: String, required: true, trim: true, unique: true },
		basePrice: { type: Number, required: true, min: 0 },
		minPrice: { type: Number, required: true, min: 0 },
		maxPrice: { type: Number, required: true, min: 0 },
		dynamicPricingEnabled: { type: Boolean, default: true },
		maxMultiplier: { type: Number, required: true, min: 1, max: 5, default: 1.5 },
		isActive: { type: Boolean, default: true, index: true }
	},
	{ timestamps: true }
);

export const PricingRule = mongoose.model<IPricingRule>('PricingRule', PricingRuleSchema);
export const SeatCategoryPricing = mongoose.model<ISeatCategoryPricing>('SeatCategoryPricing', SeatCategoryPricingSchema);
