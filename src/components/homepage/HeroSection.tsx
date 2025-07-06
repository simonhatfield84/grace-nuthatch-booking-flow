
import React from 'react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
        AI-Assisted Hospitality
        <span className="block text-grace-primary">Management System</span>
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
        This ongoing AI-assisted collaboration between Fred (the AI developer) and Simon Hatfield 
        demonstrates what's possible when human creativity meets AI coding capability. We're building 
        a complete hospitality management system—EPOS, booking system, guest management, and more—
        with full transparency about costs, time, and development process.
      </p>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
        This isn't a product sales page. It's a live documentation of an AI-human development 
        partnership, showing real costs, real time investment, and real results.
      </p>
      <div className="flex justify-center mb-8">
        <Button size="lg" className="text-lg px-8 py-3">
          <a href="#journal">View Today's Update</a>
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
