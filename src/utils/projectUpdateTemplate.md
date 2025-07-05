
# Grace OS Project Update Template

## Manual Data Update Instructions

When updating the homepage with new project data, replace the following placeholders in `src/pages/HomePage.tsx`:

### Data Placeholders to Replace:

1. **[TODAY_DATE]** - Current date (e.g., "5th January 2025")
2. **[START_DATE]** - Project start date (you'll need to determine this)
3. **[LOVABLE_CREDITS_USED]** - Total Lovable credits consumed
4. **[USER_COMMANDS_COUNT]** - Total interactive commands/prompts
5. **[USER_TIME_HOURS]** - Calculated as: (USER_COMMANDS_COUNT × 5 min) ÷ 60
6. **[CREDIT_COST]** - Calculated as: LOVABLE_CREDITS_USED × £0.18
7. **[TIME_COST]** - Calculated as: USER_TIME_HOURS × £19.00
8. **[TOTAL_COST]** - Calculated as: CREDIT_COST + TIME_COST

### Calculation Examples:

```
If LOVABLE_CREDITS_USED = 150 and USER_COMMANDS_COUNT = 75:

USER_TIME_HOURS = (75 × 5) ÷ 60 = 6.25 hours
CREDIT_COST = 150 × £0.18 = £27.00
TIME_COST = 6.25 × £19.00 = £118.75
TOTAL_COST = £27.00 + £118.75 = £145.75
```

### How to Update:

1. Open `src/pages/HomePage.tsx`
2. Use Find & Replace to update all placeholders with actual values
3. Ensure all calculations are correct
4. Update any narrative text in the Technical or Layperson summaries as needed

### Format Guidelines:

- Costs: Always show as £XX.XX (two decimal places)
- Hours: Show as X.X (one decimal place for user time)
- Credits/Commands: Whole numbers only
- Dates: Use full format like "5th January 2025"

### Optional Content Updates:

You can also update the bullet points in the Technical Summary and Layperson Summary sections to reflect new features or progress made since the last update.
