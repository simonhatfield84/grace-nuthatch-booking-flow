
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PoundSterling, Bot, Clock, Calendar, Shield, Zap, Users, Target } from 'lucide-react';
import { calculateStats } from '@/data/developmentStats';
import { journalEntries } from '@/data/journalEntries';

const StatsSection = () => {
  const stats = calculateStats();
  const sessionCount = journalEntries.length;

  return (
    <section id="stats" className="container mx-auto px-4 py-20 bg-muted/30">
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
        Development Transparency
      </h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
        <Card className="text-center">
          <CardHeader className="flex flex-col items-center space-y-2 pb-2">
            <PoundSterling className="h-6 w-6 text-grace-primary" />
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold text-grace-primary">£{stats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Over {stats.daysDiff} days
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardHeader className="flex flex-col items-center space-y-2 pb-2">
            <Bot className="h-6 w-6 text-grace-primary" />
            <CardTitle className="text-sm font-medium">AI Commands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{stats.totalCommands}</div>
            <p className="text-xs text-muted-foreground">
              £{stats.aiCost.toFixed(2)} AI cost
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardHeader className="flex flex-col items-center space-y-2 pb-2">
            <Clock className="h-6 w-6 text-grace-primary" />
            <CardTitle className="text-sm font-medium">Simon's Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{stats.simonTimeHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              £{stats.simonTimeCost.toFixed(2)} time cost
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardHeader className="flex flex-col items-center space-y-2 pb-2">
            <Calendar className="h-6 w-6 text-grace-primary" />
            <CardTitle className="text-sm font-medium">Dev Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{sessionCount}</div>
            <p className="text-xs text-muted-foreground">
              Avg £{(stats.totalCost / sessionCount).toFixed(2)} per session
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            About This Experiment
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This project documents what's possible when humans and AI work together to build software. 
            We're sharing every cost, every command, and every lesson learned - both the victories and the struggles.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-6 w-6 text-grace-primary" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Cost Breakdown</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Bot className="h-4 w-4 text-grace-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">AI Commands</p>
                  <p className="text-xs text-muted-foreground">£0.18 per command</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-4 w-4 text-grace-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Simon's Time</p>
                  <p className="text-xs text-muted-foreground">£19/hour (UK software engineer rate)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Zap className="h-4 w-4 text-grace-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Time Per Command</p>
                  <p className="text-xs text-muted-foreground">~3 minutes average</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-grace-primary" />
              <h4 className="font-semibold text-gray-900 dark:text-white">No Hidden Costs</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <Users className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">No Team Overhead</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Just Simon + AI assistance</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <PoundSterling className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">No Infrastructure</p>
                  <p className="text-xs text-green-600 dark:text-green-400">No servers, subscriptions, or overhead</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <Target className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Real Investment</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Every penny tracked and reported</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
