
export const developmentStats = {
  // Project start date
  startDate: new Date('2025-07-03'),
  
  // Manual totals (update these when adding new sessions)
  totalCredits: 278, // 84 + 102 + 92
  
  // Cost rates
  aiCostPerCredit: 0.18,
  simonHourlyRate: 19,
  minutesPerCommand: 3,
};

// Calculate derived values
export const calculateStats = () => {
  const { totalCredits, aiCostPerCredit, simonHourlyRate, minutesPerCommand, startDate } = developmentStats;
  
  const totalCommands = totalCredits;
  const simonTimeHours = (totalCommands * minutesPerCommand) / 60;
  const aiCost = totalCredits * aiCostPerCredit;
  const simonTimeCost = simonTimeHours * simonHourlyRate;
  const totalCost = aiCost + simonTimeCost;
  
  const today = new Date();
  const daysDiff = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  
  return {
    totalCredits,
    totalCommands,
    simonTimeHours,
    aiCost,
    simonTimeCost,
    totalCost,
    daysDiff
  };
};
