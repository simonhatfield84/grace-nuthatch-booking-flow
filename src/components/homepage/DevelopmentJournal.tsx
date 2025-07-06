
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { journalEntries } from '@/data/journalEntries';
import { developmentStats } from '@/data/developmentStats';

const DevelopmentJournal = () => {
  const { aiCostPerCredit, simonHourlyRate, minutesPerCommand } = developmentStats;

  return (
    <section id="journal" className="container mx-auto px-4 py-20">
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
        Development Journal
      </h2>
      
      <div className="max-w-4xl mx-auto space-y-6">
        {journalEntries.map((entry) => {
          const aiCost = entry.credits * aiCostPerCredit;
          const simonTime = (entry.credits * minutesPerCommand / 60) * simonHourlyRate;
          const sessionTotal = aiCost + simonTime;
          const simonHours = (entry.credits * minutesPerCommand / 60);

          return (
            <Card key={entry.date}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{entry.displayDate}</span>
                  <span className="text-lg font-medium text-grace-primary">£{sessionTotal.toFixed(2)}</span>
                </CardTitle>
                <CardDescription>
                  Session {entry.sessionNumber} • {entry.credits} AI Fred Credits • {simonHours.toFixed(1)} hours Simon's time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>AI Fred Cost: {entry.credits} × £{aiCostPerCredit} = £{aiCost.toFixed(2)}</span>
                    <span>Simon's Time: {(entry.credits * minutesPerCommand).toFixed(0)} min × £{simonHourlyRate}/hr = £{simonTime.toFixed(2)}</span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p><strong>Today's Focus:</strong> {entry.focus}</p>
                    <ul>
                      {entry.accomplishments.map((accomplishment, index) => (
                        <li key={index}>{accomplishment}</li>
                      ))}
                    </ul>
                    <p><strong>Key Achievement:</strong> {entry.keyAchievement}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default DevelopmentJournal;
