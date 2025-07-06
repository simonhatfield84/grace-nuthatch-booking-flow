
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, CalendarDays, Code } from 'lucide-react';
import { calculateStats } from '@/data/developmentStats';

const StatsSection = () => {
  const stats = calculateStats();

  return (
    <section id="project" className="container mx-auto px-4 py-20">
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
        About This Project
      </h2>
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Project Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-6 w-6 text-grace-primary" />
              AI-Assisted Development Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              This ongoing AI-assisted collaboration between Fred (the AI developer) and Simon Hatfield 
              demonstrates what's possible when human creativity meets AI coding capability. We're building 
              a complete hospitality management system—EPOS, booking system, guest management, and more—
              with full transparency about costs, time, and development process.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              This isn't a product sales page. It's a live documentation of an AI-human development 
              partnership, showing real costs, real time investment, and real results.
            </p>
          </CardContent>
        </Card>

        {/* Development Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-grace-primary" />
                Development Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-grace-primary mb-2">£{stats.totalCost.toFixed(2)}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI Fred: £{stats.aiCost.toFixed(2)} | Simon's time: £{stats.simonTimeCost.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-grace-primary" />
                Simon's Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-grace-primary mb-2">{stats.simonTimeHours.toFixed(1)} hrs</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stats.totalCommands} interactive commands
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-grace-primary" />
                Days in Development
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-grace-primary mb-2">{stats.daysDiff}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Since July 3rd, 2025
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code className="h-5 w-5 text-grace-primary" />
                AI Fred Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-grace-primary mb-2">{stats.totalCredits}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Lovable development credits
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Total Development Cost So Far */}
        <Card className="border-2 border-grace-primary">
          <CardHeader>
            <CardTitle className="text-center text-grace-primary text-xl">
              Total Development Cost So Far
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-4xl font-bold text-grace-primary mb-4">
              £{stats.totalCost.toFixed(2)}
            </div>
            <p className="text-center text-gray-600 dark:text-gray-300">
              <strong>Cost Calculation:</strong> Simon's time calculated based on average UK software engineer 
              rate of £19/hour. Each command to Fred takes approximately 3 minutes of Simon's time. 
              AI Fred costs £0.18 per credit consumed.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default StatsSection;
