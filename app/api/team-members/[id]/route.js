import dbConnect, { isDbConnected } from '@/lib/mongodb';
import TeamMember from '@/lib/models/TeamMember';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import Lead from '@/lib/models/Lead';

function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

function safeMember(m) {
  return {
    _id: m._id,
    name: m.name,
    role: m.role,
    username: m.username,
    active: m.active,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

export async function GET(request, { params }) {
  try {
    if (!isDbConnected()) {
      const conn = await dbConnect();
      if (!conn) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
    }

    const { id } = await params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const member = await TeamMember.findById(id).lean();
    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: safeMember(member) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    if (!isDbConnected()) {
      const conn = await dbConnect();
      if (!conn) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
    }

    const { id } = await params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const clean = {};

    if (body.name !== undefined) {
      const v = String(body.name).trim();
      if (!v) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      clean.name = v;
    }

    if (body.username !== undefined) {
      const v = String(body.username).trim().toLowerCase();
      if (!v) return NextResponse.json({ error: 'Username cannot be empty' }, { status: 400 });
      const dup = await TeamMember.findOne({ _id: { $ne: id }, username: v });
      if (dup) {
        return NextResponse.json({ error: `Username "${v}" is already taken` }, { status: 409 });
      }
      clean.username = v;
    }

    if (body.password !== undefined) {
      const v = String(body.password).trim();
      if (v.length < 4) {
        return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
      }
      clean.passwordHash = await bcrypt.hash(v, 10);
      clean.password = ''; // clear any legacy plaintext
    }

    if (body.role !== undefined) {
      if (!['owner', 'channel_partner'].includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      clean.role = body.role;
    }

    if (body.active !== undefined) {
      clean.active = Boolean(body.active);
    }
// If the name is changing, cascade to leads assigned to the old name
if (clean.name !== undefined) {
  const existing = await TeamMember.findById(id).lean();
  if (existing && existing.name && existing.name !== clean.name) {
    await Lead.updateMany(
      { assignedTo: existing.name },
      { $set: { assignedTo: clean.name } }
    );
  }
}
    const member = await TeamMember.findByIdAndUpdate(id, clean, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      data: safeMember(member),
      message: 'Team member updated',
    });
  } catch (error) {
    console.error('[team-members] PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!isDbConnected()) {
      const conn = await dbConnect();
      if (!conn) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
    }

    const { id } = await params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const member = await TeamMember.findByIdAndDelete(id);
    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      success: true,
      message: `Team member "${member.name}" deleted`,
    });
  } catch (error) {
    console.error('[team-members] DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}