
export const sortDaysChronologically = (days: string[]): string[] => {
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shortDayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Handle both full and abbreviated day names
  const order = days[0]?.length > 3 ? dayOrder : shortDayOrder;
  
  return days.sort((a, b) => {
    const indexA = order.indexOf(a);
    const indexB = order.indexOf(b);
    return indexA - indexB;
  });
};

export const getDayOfWeek = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

export const isDateInAllowedDays = (date: Date, allowedDays: string[]): boolean => {
  const dayName = getDayOfWeek(date);
  // Handle both full and abbreviated day names
  const normalizedDays = allowedDays.map(day => 
    day.length === 3 ? 
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayName)] :
    dayName
  );
  return allowedDays.some(day => 
    day === dayName || 
    (day.length === 3 && day === dayName.substring(0, 3))
  );
};
