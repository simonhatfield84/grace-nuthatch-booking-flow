
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
        AI-Assisted Hospitality
        <span className="block text-grace-primary">Management System</span>
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
        This is an ongoing AI-assisted collaboration between Fred (AI) and Simon Hatfield, 
        building a custom EPOS and booking system from the ground up. No funding, no sales pitch—
        just transparent development documenting what's possible with AI coding assistance.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <Link to="/auth">
          <Button size="lg" className="text-lg px-8 py-3">
            View Live Dashboard
          </Button>
        </Link>
        <Button variant="outline" size="lg" className="text-lg px-8 py-3">
          <a href="#project">See Development Progress</a>
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
