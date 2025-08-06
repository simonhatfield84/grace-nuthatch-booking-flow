
export const developmentStats = {
  startDate: new Date('2025-07-03'),
  totalCommands: 923, // Updated from 793 to 923
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
