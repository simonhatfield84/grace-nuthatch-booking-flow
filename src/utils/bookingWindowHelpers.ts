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
  
  if (windows.length === 2) {
    // For 2 windows, try to show both concisely
    const window1 = windows[0];
    const window2 = windows[1];
    
    const days1 = formatDaysOfWeek(window1.days);
    const times1 = formatTimeRange(window1.start_time, window1.end_time);
    const days2 = formatDaysOfWeek(window2.days);
    const times2 = formatTimeRange(window2.start_time, window2.end_time);
    
    // If both have same times, combine days
    if (times1 === times2) {
      return `${days1} + ${days2} ${times1}`;
    }
    
    // If one is weekdays and other is weekends, show abbreviated
    if ((days1 === 'Mon-Fri' && days2 === 'Sat-Sun') || (days1 === 'Sat-Sun' && days2 === 'Mon-Fri')) {
      const [weekdayWindow, weekendWindow] = days1 === 'Mon-Fri' ? [window1, window2] : [window2, window1];
      const weekdayTimes = formatTimeRange(weekdayWindow.start_time, weekdayWindow.end_time);
      const weekendTimes = formatTimeRange(weekendWindow.start_time, weekendWindow.end_time);
      
      if (weekdayTimes === weekendTimes) {
        return `Every day ${weekdayTimes}`;
      }
      return `Weekdays ${weekdayTimes}, Weekends ${weekendTimes}`;
    }
    
    // Otherwise show abbreviated
    return `${days1} ${times1.split('-')[0]} + ${days2} ${times2.split('-')[0]}`;
  }
  
  // For 3+ windows, show count with hint about complexity
  return `${windows.length} booking schedules`;
};
