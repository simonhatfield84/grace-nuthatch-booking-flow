
export const formatDaysOfWeek = (days: string[]): string => {
  if (!days || days.length === 0) return 'Not scheduled';
  
  const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const dayNames = {
    mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', 
    fri: 'Fri', sat: 'Sat', sun: 'Sun'
  };
  
  const sortedDays = days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  
  // Check for common patterns
  const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const weekends = ['sat', 'sun'];
  
  if (sortedDays.length === 5 && weekdays.every(day => sortedDays.includes(day))) {
    return 'Mon-Fri';
  }
  
  if (sortedDays.length === 2 && weekends.every(day => sortedDays.includes(day))) {
    return 'Sat-Sun';
  }
  
  if (sortedDays.length === 7) {
    return 'Every day';
  }
  
  // For other cases, just list the days
  return sortedDays.map(day => dayNames[day as keyof typeof dayNames]).join(', ');
};

export const formatTimeRange = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return '';
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };
  
  return `${formatTime(startTime)}-${formatTime(endTime)}`;
};

export const getBookingWindowSummary = (windows: any[]): string => {
  if (!windows || windows.length === 0) {
    return 'Always available';
  }
  
  if (windows.length === 1) {
    const window = windows[0];
    const days = formatDaysOfWeek(window.days);
    const times = formatTimeRange(window.start_time, window.end_time);
    return `${days} ${times}`;
  }
  
  // Multiple windows - show count
  return `${windows.length} booking windows`;
};
