import dbConnect, { isDbConnected } from '@/lib/mongodb';
import SiteVisit from '@/lib/models/SiteVisit';
import { NextResponse } from 'next/server';

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function GET() {
  try {
    if (!isDbConnected()) {
      const conn = await dbConnect();
      if (!conn) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
    }

    const todayStart = startOfDay();
    const todayEnd = endOfDay();

    const [
      total,
      todayCount,
      pendingCount,
      completedCount,
      scheduledCount,
      rescheduledCount,
      cancelledCount,
    ] = await Promise.all([
      SiteVisit.countDocuments({}),
      SiteVisit.countDocuments({
        scheduledDate: { $gte: todayStart, $lte: todayEnd },
        status: { $nin: ['cancelled'] },
      }),
      // Treat both 'pending' and 'scheduled' as pending — webhook creates 'scheduled'
      SiteVisit.countDocuments({ status: { $in: ['pending', 'scheduled'] } }),
      SiteVisit.countDocuments({ status: 'completed' }),
      SiteVisit.countDocuments({ status: 'scheduled' }),
      SiteVisit.countDocuments({ status: 'rescheduled' }),
      SiteVisit.countDocuments({ status: 'cancelled' }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        today: todayCount,
        pending: pendingCount,
        completed: completedCount,
        scheduled: scheduledCount,
        rescheduled: rescheduledCount,
        cancelled: cancelledCount,
      },
    });
  } catch (error) {
    console.error('[site-visits/stats] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', message: error.message },
      { status: 500 }
    );
  }
}