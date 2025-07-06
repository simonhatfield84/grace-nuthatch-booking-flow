
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateStats } from '@/data/developmentStats';

const StatsSection = () => {
  const stats = calculateStats();

  return (
    <section id="stats" className="container mx-auto px-4 py-20 bg-muted/30">
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
        Development Transparency
      </h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-grace-primary">£{stats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Over {stats.daysDiff} days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCommands}</div>
            <p className="text-xs text-muted-foreground">
              £{stats.aiCost.toFixed(2)} AI cost
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simon's Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.simonTimeHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              £{stats.simonTimeCost.toFixed(2)} time cost
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Development Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Avg £{(stats.totalCost / 3).toFixed(2)} per session
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-3xl mx-auto text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          About This Experiment
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          This project documents what's possible when humans and AI work together to build software. 
          We're sharing every cost, every command, and every lesson learned - both the victories and the struggles.
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Cost Breakdown</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>AI Commands:</strong> £0.18 per command<br/>
                <strong>Simon's Time:</strong> £19/hour (UK software engineer rate)<br/>
                <strong>Calculation:</strong> ~3 minutes per AI command
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>No hidden costs:</strong> No subscriptions, no infrastructure, no team overhead.<br/>
                <strong>Real investment:</strong> Just AI assistance + human guidance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
