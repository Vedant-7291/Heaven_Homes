import dbConnect, { isDbConnected } from '@/lib/mongodb';
import Lead from '@/lib/models/Lead';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!isDbConnected()) {
      const conn = await dbConnect();
      if (!conn) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
    }

    const [
      total,
      active,
      converted,
      newCount,
      contacted,
      interested,
      svScheduled,
      svCompleted,
      lost,
      purchase,
      rent,
      rentOut,
    ] = await Promise.all([
      Lead.countDocuments({}),
      Lead.countDocuments({ currentStatus: { $in: ['active', 'contacted', 'interested', 'site_visit_scheduled', 'site_visit_completed'] } }),
      Lead.countDocuments({ currentStatus: 'converted' }),
      Lead.countDocuments({ currentStatus: 'new' }),
      Lead.countDocuments({ currentStatus: 'contacted' }),
      Lead.countDocuments({ currentStatus: 'interested' }),
      Lead.countDocuments({ currentStatus: 'site_visit_scheduled' }),
      Lead.countDocuments({ currentStatus: 'site_visit_completed' }),
      Lead.countDocuments({ currentStatus: 'lost' }),
      Lead.countDocuments({ propertyCategory: 'purchase' }),
      Lead.countDocuments({ propertyCategory: 'rent_lease' }),
      Lead.countDocuments({ propertyCategory: 'rent_out' }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        active,
        converted,
        byStatus: { new: newCount, active, contacted, interested, site_visit_scheduled: svScheduled, site_visit_completed: svCompleted, lost, converted },
        byCategory: { purchase, rent, rentOut },
      },
    });
  } catch (error) {
    console.error('[leads/stats] error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats', message: error.message }, { status: 500 });
  }
}