
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { journalEntries } from '@/data/journalEntries';
import { developmentStats } from '@/data/developmentStats';

const DevelopmentJournal = () => {
  const { aiCostPerCommand, simonHourlyRate, minutesPerCommand } = developmentStats;

  return (
    <section id="journal" className="container mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Latest Development Updates
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Daily development logs documenting the progress, challenges, and discoveries 
          of building Grace OS through human-AI collaboration.
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-6">
        {journalEntries.map((entry) => {
          const aiCost = entry.commands * aiCostPerCommand;
          const simonTime = (entry.commands * minutesPerCommand / 60) * simonHourlyRate;
          const sessionTotal = aiCost + simonTime;
          const simonHours = (entry.commands * minutesPerCommand / 60);

          const toneColors = {
            optimistic: 'text-green-600',
            challenging: 'text-orange-600',
            reflective: 'text-blue-600'
          };

          return (
            <Card key={entry.date} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-grace-primary text-white font-bold">F</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-lg sm:text-xl">{entry.displayDate}</span>
                      <span className="text-lg font-medium text-grace-primary">£{sessionTotal.toFixed(2)}</span>
                    </CardTitle>
                    <CardDescription>
                      Session {entry.sessionNumber} • {entry.commands} AI commands • {simonHours.toFixed(1)} hours Simon's time
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-gray-500">
                    <span>AI Fred Cost: {entry.commands} × £{aiCostPerCommand} = £{aiCost.toFixed(2)}</span>
                    <span>Simon's Time: {(entry.commands * minutesPerCommand).toFixed(0)} min × £{simonHourlyRate}/hr = £{simonTime.toFixed(2)}</span>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Today's Focus:</p>
                    <p className="text-gray-900 dark:text-white">{entry.focus}</p>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <p><strong>What we accomplished:</strong></p>
                    <ul className="space-y-1">
                      {entry.accomplishments.map((accomplishment, index) => (
                        <li key={index}>{accomplishment}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-grace-background/30 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Achievement:</p>
                    <p className="font-medium text-grace-primary">{entry.keyAchievement}</p>
                  </div>

                  <div className="border-t pt-4">
                    {/* Simon's Thoughts (if available) */}
                    {entry.simonNote && (
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-600 text-white text-sm">S</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Simon's Thoughts <span className={`text-xs ${toneColors[entry.tone]}`}>({entry.tone})</span>
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                            "{entry.simonNote}"
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Fred's Thoughts */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-grace-primary text-white text-sm">F</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          Fred's Thoughts <span className={`text-xs ${toneColors[entry.tone]}`}>({entry.tone})</span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                          "{entry.personalNote}"
                        </p>
                      </div>
                    </div>
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
