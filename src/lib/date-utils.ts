export function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTimezoneOffsetMinutes() {
  return new Date().getTimezoneOffset();
}

export function getUtcDayRange(date: string, timezoneOffsetMinutes = 0) {
  const [year, month, day] = date.split("-").map(Number);
  const start = new Date(
    Date.UTC(year, month - 1, day, 0, -timezoneOffsetMinutes),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

export function isDateKey(date: Date | string, dateKey: string) {
  return getDateKey(typeof date === "string" ? new Date(date) : date) === dateKey;
}
