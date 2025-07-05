
# Grace OS Development Journal Update Template

## Daily Update Instructions

When updating the homepage with new development progress, follow this format to add a new journal entry to `src/pages/HomePage.tsx`.

### Required Information for Each Update:

1. **Date** - The date of the development session
2. **AI Fred Credits Used** - Total Lovable credits consumed in the session  
3. **Brief Description** - What was accomplished during the session
4. **Key Features/Achievements** - Bullet points of major accomplishments

### Cost Calculations (Automatic):

- **AI Fred Cost**: Credits × £0.18
- **Simon's Time**: Credits × 3 minutes × £19/hour ÷ 60
- **Session Total**: AI Fred Cost + Simon's Time Cost

### Update Process:

1. **Add New Journal Entry** at the top of the Development Journal section
2. **Update Total Statistics** in the header cards:
   - Add new credits to `totalCredits`
   - Recalculate `totalCommands` (= totalCredits)
   - Recalculate `simonTimeHours` using 3 minutes per command
   - Recalculate all cost totals

### Journal Entry Template:

```jsx
{/* [DATE] */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      <span>[FULL_DATE]</span>
      <span className="text-lg font-medium text-grace-primary">£{([CREDITS] * 0.18 + ([CREDITS] * 3 / 60) * 19).toFixed(2)}</span>
    </CardTitle>
    <CardDescription>Session [NUMBER] • [CREDITS] AI Fred Credits • {([CREDITS] * 3 / 60).toFixed(1)} hours Simon's time</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div className="flex justify-between text-sm">
        <span>AI Fred Cost: [CREDITS] × £0.18 = £{([CREDITS] * 0.18).toFixed(2)}</span>
        <span>Simon's Time: {([CREDITS] * 3).toFixed(0)} min × £19/hr = £{(([CREDITS] * 3 / 60) * 19).toFixed(2)}</span>
      </div>
      <div className="prose prose-sm max-w-none">
        <p><strong>Today's Focus:</strong> [BRIEF_DESCRIPTION]</p>
        <ul>
          [ACCOMPLISHMENT_BULLETS]
        </ul>
        <p><strong>Key Achievement:</strong> [MAIN_ACHIEVEMENT]</p>
      </div>
    </div>
  </CardContent>
</Card>
```

### Example Usage:

**Input**: "July 6th, used 95 credits working on payment integration and Stripe setup"

**Result**: New journal entry with:
- AI Fred Cost: 95 × £0.18 = £17.10
- Simon's Time: 285 min × £19/hr = £90.25  
- Session Total: £107.35
- Updated running totals in header

### Header Updates Needed:

```javascript
const totalCredits = [OLD_TOTAL] + [NEW_CREDITS];
const totalCommands = totalCredits;
const simonTimeHours = (totalCommands * 3) / 60;
const aiCost = totalCredits * 0.18;
const simonTimeCost = simonTimeHours * 19;
const totalCost = aiCost + simonTimeCost;
```

### Architecture Section Updates:

Only update the Architecture section when:
- New major technologies are introduced
- Significant architectural changes are made
- New external services are integrated

The Architecture section should remain relatively stable compared to the daily journal entries.

### Notes:

- Each journal entry should be placed at the TOP of the Development Journal section
- Keep entries chronological with most recent first
- Always update the header statistics when adding new entries
- Include both technical achievements and business value in descriptions
- Simon's time is calculated at 3 minutes per command at UK software engineer rate of £19/hour
