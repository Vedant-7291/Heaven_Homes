// app/api/properties/route.js
import dbConnect, { isDbConnected } from '@/lib/mongodb';
import Property from '@/lib/models/Property';
import { NextResponse } from 'next/server';
import { generateUniquePropertyId } from '@/lib/property-id';
import { logActivity } from '@/lib/activity/log';

const ALLOWED_FIELDS = [
  'title', 'internalName',
  'city', 'area', 'propertyType', 'propertySubType',
  'budgetRange', 'price', 'configuration', 'spaceSize', 'location',
  'areaSqft', 'furnishing', 'description', 'features', 'imageUrl',
  'imagePublicId', 'images', 'ownerPhone', 'ownerName', 'source',
  'dimensions', 'facing', 'floor', 'monthlyRent', 'securityDeposit',
  'setupType', 'availableFrom', 'categoryTab',
];

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------- GET ----------
export async function GET(request) {
  try {
    if (!isDbConnected()) {
      const conn = await dbConnect();
      if (!conn) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const query = {};

    if (status && status !== 'all') query.status = status;
    else if (!status) query.status = 'available';

    if (city) query.city = { $regex: escapeRegex(city), $options: 'i' };

    if (category) {
      if (category === 'residential_buy') {
        query.propertyType = 'buy';
        query.propertySubType = {
          $in: ['apartment', 'flat', 'house', 'villa', 'builder_floor', 'studio', 'penthouse', 'farmhouse'],
        };
      } else if (category === 'commercial_buy') {
        query.propertyType = 'commercial';
        query.categoryTab = 'commercial_buy';
      } else if (category === 'residential_rent') {
        query.propertyType = 'rent';
        query.categoryTab = 'residential_rent';
      } else if (category === 'commercial_rent') {
        query.propertyType = 'commercial';
        query.categoryTab = 'commercial_rent';
      } else {
        query.propertyType = category;
      }
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const [properties, total] = await Promise.all([
      Property.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Property.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: properties,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties', message: error.message },
      { status: 500 }
    );
  }
}

// ---------- POST ----------
export async function POST(request) {
  try {
    if (!isDbConnected()) {
      const conn = await dbConnect();
      if (!conn) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
    }

    const body = await request.json();

    const requiredFields = ['title', 'city', 'area', 'propertyType', 'propertySubType',
      'budgetRange', 'price', 'configuration', 'location', 'areaSqft'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const cleanBody = {};
    for (const key of ALLOWED_FIELDS) {
      if (body[key] !== undefined) cleanBody[key] = body[key];
    }

    const propertyId = await generateUniquePropertyId(Property, body.city, body.area);

    const property = new Property({
      ...cleanBody,
      propertyId,
      status: body.status || 'available',
      views: 0,
      inquiries: 0,
    });

    await property.save();

    await logActivity(request, {
      action: 'property.created',
      category: 'property',
      description: `Property created: ${property.title}`,
      targetType: 'Property',
      targetId: property._id,
      targetLabel: property.title,
      severity: 'success',
      changes: { price: property.price, city: property.city },
    });

    console.log('✅ Property created:', propertyId);

    return NextResponse.json(
      { success: true, data: property, message: 'Property created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating property:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create property', details: error.message },
      { status: 500 }
    );
  }
}