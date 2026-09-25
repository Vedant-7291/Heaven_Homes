// lib/models/Property.js
import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    propertyId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    internalName: { type: String, default: '' }, // optional internal name for admin use
    city: { type: String, required: true, index: true },
    area: { type: String, required: true, index: true },

    // Top-level category: 'buy' | 'rent' | 'commercial'
    // Kept for backwards-compat. New flows set this from the category tab.
    propertyType: { type: String, required: true },

    // Sub type — apartment / villa / office / shop etc.
    propertySubType: { type: String, required: true },

    budgetRange: { type: String, required: true },
    price: { type: Number, required: true },

    configuration: { type: String, required: true }, // '1bhk' | '2bhk' | ... | 'commercial'
    spaceSize: { type: String, default: null },
    location: { type: String, required: true },
    areaSqft: { type: Number, required: true, default: 1000 },

    // ---- NEW: type-specific fields (all optional) ----
    dimensions: { type: String, default: '' },       // e.g. "40 x 50"
    facing: { type: String, default: '' },           // East / West / North / South / ...
    floor: { type: String, default: '' },            // Ground / 1st / ...
    monthlyRent: { type: Number, default: null },    // rent-only
    securityDeposit: { type: Number, default: null },// rent-only
    setupType: { type: String, default: '' },        // commercial-rent-only
    availableFrom: { type: String, default: '' },    // commercial-rent-only (free-text date)

    furnishing: {
      type: String,
      default: 'unfurnished',
      // 'unfurnished' | 'semi_furnished' | 'fully_furnished'
    },
    tenantPreferences: {
  type: [String],
  enum: ['bachelors', 'family', 'both'],
  default: [],
},
foodPreferences: {
  type: [String],
  enum: ['vegetarian', 'non_vegetarian'],
  default: [],
},

  // Lifecycle: pending → (available | rejected) → sold
//   - 'pending'   : submitted by a channel partner or the WhatsApp bot, awaiting owner approval
//   - 'available' : live on the property management page
//   - 'rejected'  : declined during verification; kept for audit
//   - 'sold'      : closed/deal done
status: {
  type: String,
  enum: ['pending', 'available', 'rejected', 'sold'],
  default: 'available',   // admins/owners default to live; the POST route forces 'pending' for partners
  index: true,
},

    source: { type: String, default: 'admin' }, // 'admin' | 'whatsapp_bot'
    ownerPhone: { type: String, index: true },
    ownerName: { type: String },
    description: { type: String },
    features: [{ type: String }],
    imageUrl: { type: String },
    imagePublicId: { type: String },
    images: [{ url: String, publicId: String }],

    // NEW: category tab this property belongs to (used by the 4-tab form)
    categoryTab: {
      type: String,
      enum: ['residential_buy', 'commercial_buy', 'residential_rent', 'commercial_rent'],
      default: null,
      index: true,
    },

    views: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
  },
  { timestamps: true }
);

propertySchema.index({ status: 1, propertyType: 1, city: 1 });
propertySchema.index({ status: 1, budgetRange: 1 });
propertySchema.index({ status: 1, area: 1 });
propertySchema.index({ source: 1, status: 1 });

const Property =
  mongoose.models.Property || mongoose.model('Property', propertySchema);

export default Property;