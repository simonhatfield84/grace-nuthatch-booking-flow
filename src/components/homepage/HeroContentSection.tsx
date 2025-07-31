
import React from 'react';

const HeroContentSection = () => {
  return (
    <section className="container mx-auto px-4 py-8 sm:py-12 text-center">
      <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-4xl mx-auto px-2">
        This is a live, behind-the-scenes collaboration between Simon—20 years in hospitality—and Fred, his AI coding partner. Together we're building a full hospitality management system from the ground up: reservations today, with CRM, marketing, guest Wi-Fi and EPOS on the roadmap. There's no outside funding, no marketing fluff—just honest, day-by-day documentation of what we actually build, the bugs we squash, and the lessons we learn.
      </p>
      <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
        We track every "command" Simon gives Fred and log our time and costs in real time. You'll see exactly how many hours we've spent and how much it's all costing, because this isn't a product launch—it's an experiment in human-AI teamwork. Follow along to watch Grace OS grow piece by piece.
      </p>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4">
        Questions about this AI build project? Email{' '}
        <a href="mailto:hello@grace-os.co.uk" className="text-grace-primary hover:underline font-medium">
          hello@grace-os.co.uk
        </a>
      </p>
    </section>
  );
};

export default HeroContentSection;
