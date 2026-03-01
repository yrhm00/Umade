import { BookingWithDetails } from '@/types';

function pad2(v: number): string {
  return String(v).padStart(2, '0');
}

function toDateParts(date: Date) {
  return {
    y: date.getUTCFullYear(),
    m: date.getUTCMonth() + 1,
    d: date.getUTCDate(),
    hh: date.getUTCHours(),
    mm: date.getUTCMinutes(),
    ss: date.getUTCSeconds(),
  };
}

export function toIcsDateTime(input: Date): string {
  const p = toDateParts(input);
  return `${p.y}${pad2(p.m)}${pad2(p.d)}T${pad2(p.hh)}${pad2(p.mm)}${pad2(p.ss)}Z`;
}

export function buildBookingDateTimes(booking: Pick<BookingWithDetails, 'booking_date' | 'start_time' | 'end_time'>) {
  const startTime = booking.start_time || '10:00';
  const endTime = booking.end_time || '12:00';

  const start = new Date(`${booking.booking_date}T${startTime}:00`);
  let end = new Date(`${booking.booking_date}T${endTime}:00`);
  if (Number.isNaN(end.getTime()) || end <= start) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }
  return { start, end };
}

export function buildGoogleCalendarUrl(params: {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
}) {
  const dates = `${toIcsDateTime(params.start)}/${toIcsDateTime(params.end)}`;
  const query = new URLSearchParams({
    action: 'TEMPLATE',
    text: params.title,
    dates,
    details: params.description || '',
    location: params.location || '',
  });
  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

export function buildIcsForBookings(bookings: Array<{
  id: string;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  service_name: string;
  provider_name: string;
  location?: string | null;
  note?: string | null;
}>): string {
  const now = toIcsDateTime(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Umade//Booking Calendar//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  bookings.forEach((booking) => {
    const { start, end } = buildBookingDateTimes(booking as any);
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:booking-${booking.id}@umade.app`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${toIcsDateTime(start)}`);
    lines.push(`DTEND:${toIcsDateTime(end)}`);
    lines.push(`SUMMARY:${escapeIcsText(`${booking.service_name} - ${booking.provider_name}`)}`);
    if (booking.location) {
      lines.push(`LOCATION:${escapeIcsText(booking.location)}`);
    }
    const description = booking.note
      ? `${booking.note}\nRéservation Umade #${booking.id}`
      : `Réservation Umade #${booking.id}`;
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

