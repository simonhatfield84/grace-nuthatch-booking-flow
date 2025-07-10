
export const developmentStats = {
  // Project start date
  startDate: new Date('2025-07-03'),
  
  // Manual totals (update these when adding new sessions)
  totalCommands: 429, // 84 + 102 + 92 + 32 + 88 + 31
  
  // Cost rates
  aiCostPerCommand: 0.18,
  simonHourlyRate: 19,
  minutesPerCommand: 3,
};

// Calculate derived values
export const calculateStats = () => {
  const { totalCommands, aiCostPerCommand, simonHourlyRate, minutesPerCommand, startDate } = developmentStats;
  
  const simonTimeHours = (totalCommands * minutesPerCommand) / 60;
  const aiCost = totalCommands * aiCostPerCommand;
  const simonTimeCost = simonTimeHours * simonHourlyRate;
  const totalCost = aiCost + simonTimeCost;
  
  const today = new Date();
  const daysDiff = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  
  return {
    totalCommands,
    simonTimeHours,
    aiCost,
    simonTimeCost,
    totalCost,
    daysDiff
  };
};
