
import React from 'react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
        AI-Assisted Hospitality
        <span className="block text-grace-primary">Management System</span>
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto">
        This is a live, behind-the-scenes collaboration between Simon Hatfield—20 years in hospitality—and Fred, his AI coding partner. Together we're building a full hospitality management system from the ground up: reservations today, with CRM, marketing, guest Wi-Fi and EPOS on the roadmap. There's no outside funding, no marketing fluff—just honest, day-by-day documentation of what we actually build, the bugs we squash, and the lessons we learn.
      </p>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
        We track every "command" Simon gives Fred and log our time and costs in real time. You'll see exactly how many hours we've spent and how much it's all costing, because this isn't a product launch—it's an experiment in human-AI teamwork. Follow along to watch Grace OS grow piece by piece.
      </p>
      <div className="flex justify-center mb-8">
        <Button size="lg" className="text-lg px-8 py-3">
          <a href="#journal">View Latest Updates</a>
        </Button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Questions about this AI build project? Email{' '}
        <a href="mailto:hello@grace-os.co.uk" className="text-grace-primary hover:underline font-medium">
          hello@grace-os.co.uk
        </a>
      </p>
    </section>
  );
};

export default HeroSection;
