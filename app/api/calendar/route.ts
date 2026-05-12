import { getServerSession } from 'next-auth';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { getWeekStart } from '@/lib/week';

const WORK_START = 10 * 60;       // 10:00 in minutes
const WORK_END = 18 * 60 + 30;    // 18:30 in minutes

function clampToWorkHours(startMin: number, endMin: number): number {
  const s = Math.max(startMin, WORK_START);
  const e = Math.min(endMin, WORK_END);
  return Math.max(0, e - s);
}

function toMinutes(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const weekKey = searchParams.get('weekKey');
  const calendarId = searchParams.get('calendarId');

  if (!weekKey || !calendarId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    auth.setCredentials({ access_token: (session as any).accessToken });

    const calendar = google.calendar({ version: 'v3', auth });

    const monday = getWeekStart(weekKey);
    const friday = new Date(monday);
    friday.setUTCDate(monday.getUTCDate() + 5); // Saturday 00:00 UTC

    const res = await calendar.events.list({
      calendarId,
      timeMin: monday.toISOString(),
      timeMax: friday.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = res.data.items ?? [];
    let totalMinutes = 0;

    for (const event of events) {
      // Skip all-day events
      if (!event.start?.dateTime || !event.end?.dateTime) continue;
      // Skip declined events
      const myStatus = event.attendees?.find(
        (a) => a.self
      )?.responseStatus;
      if (myStatus === 'declined') continue;

      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);

      // Convert to local minutes-of-day (using local timezone of the event)
      const startLocal = new Date(event.start.dateTime);
      const endLocal = new Date(event.end.dateTime);
      const startMin = startLocal.getHours() * 60 + startLocal.getMinutes();
      const endMin = endLocal.getHours() * 60 + endLocal.getMinutes();

      // Handle multi-day events: count only weekday portions
      const dayStart = new Date(start);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(end);
      dayEnd.setHours(0, 0, 0, 0);

      if (dayStart.getTime() === dayEnd.getTime()) {
        // Single day
        totalMinutes += clampToWorkHours(startMin, endMin);
      } else {
        // Multi-day: first day
        totalMinutes += clampToWorkHours(startMin, WORK_END);
        // Middle days
        const cur = new Date(dayStart);
        cur.setDate(cur.getDate() + 1);
        while (cur < dayEnd) {
          if (cur.getDay() !== 0 && cur.getDay() !== 6) {
            totalMinutes += clampToWorkHours(WORK_START, WORK_END);
          }
          cur.setDate(cur.getDate() + 1);
        }
        // Last day
        if (dayEnd.getDay() !== 0 && dayEnd.getDay() !== 6) {
          totalMinutes += clampToWorkHours(WORK_START, endMin);
        }
      }
    }

    // Round to nearest 0.5h
    const hours = Math.round((totalMinutes / 60) * 2) / 2;

    return NextResponse.json({ hours });
  } catch (err: any) {
    console.error('Calendar fetch error:', err?.message);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
