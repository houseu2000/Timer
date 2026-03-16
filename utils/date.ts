export const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const newDate = new Date(date.setDate(diff));
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalDateFromStr = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const getCurrentDayIndex = () => {
  const d = new Date();
  return (d.getDay() + 6) % 7;
};

export const getISOWeekNumber = (date: Date) => {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  week1.setDate(week1.getDate() + 3 - ((week1.getDay() + 6) % 7));
  return 1 + Math.round((target.getTime() - week1.getTime()) / 604800000);
};

export const generateWeekLabel = (date: Date) => {
  return `${date.getFullYear()} - Week ${getISOWeekNumber(date)}`;
};
