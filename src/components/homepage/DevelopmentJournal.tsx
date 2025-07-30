
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { journalEntries } from '@/data/journalEntries';
import { developmentStats } from '@/data/developmentStats';

const DevelopmentJournal = () => {
  const { aiCostPerCommand, simonHourlyRate, minutesPerCommand } = developmentStats;

  return (
    <section id="journal" className="container mx-auto px-4 py-20">
      <header className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Development Progress Timeline
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Transparent development logs documenting the technical progress and achievements 
          of building Grace OS through human-AI collaboration.
        </p>
      </header>
      
      <div className="max-w-4xl mx-auto space-y-6">
        {journalEntries.map((entry) => {
          const aiCost = entry.commands * aiCostPerCommand;
          const simonTime = (entry.commands * minutesPerCommand / 60) * simonHourlyRate;
          const sessionTotal = aiCost + simonTime;
          const simonHours = (entry.commands * minutesPerCommand / 60);

          return (
            <Card key={entry.date} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-grace-primary text-white font-bold">
                      S{entry.sessionNumber}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-lg sm:text-xl">{entry.displayDate}</span>
                      <span className="text-lg font-medium text-grace-primary">£{sessionTotal.toFixed(2)}</span>
                    </CardTitle>
                    <CardDescription>
                      Session {entry.sessionNumber} • {entry.commands} AI commands • {simonHours.toFixed(1)} hours development time
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Cost Breakdown */}
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <span>AI Development Cost: {entry.commands} × £{aiCostPerCommand} = £{aiCost.toFixed(2)}</span>
                    <span>Human Time Cost: {(entry.commands * minutesPerCommand).toFixed(0)} min × £{simonHourlyRate}/hr = £{simonTime.toFixed(2)}</span>
                  </div>
                  
                  {/* Session Focus */}
                  <div className="bg-grace-background/30 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Focus:</p>
                    <p className="text-gray-900 dark:text-white">{entry.focus}</p>
                  </div>

                  {/* Technical Accomplishments */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Technical Accomplishments:</h4>
                    <ul className="space-y-2">
                      {entry.accomplishments.map((accomplishment, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-grace-primary mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-900 dark:text-white">{accomplishment}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Key Achievement Highlight */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Key Achievement:</p>
                    <p className="font-medium text-green-900 dark:text-green-100">{entry.keyAchievement}</p>
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
