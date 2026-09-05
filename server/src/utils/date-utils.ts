export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function compareDates(date1: Date, date2: Date): number {
  return date1.getTime() - date2.getTime();
}

export function isAfter(date1: Date, date2: Date): boolean {
  return date1.getTime() > date2.getTime();
}

export function isBefore(date1: Date, date2: Date): boolean {
  return date1.getTime() < date2.getTime();
}
