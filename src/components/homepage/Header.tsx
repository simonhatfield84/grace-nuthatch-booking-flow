
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Header = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="grace-logo text-3xl font-bold">grace</div>
        <nav className="hidden md:flex space-x-6">
          <button 
            onClick={() => scrollToSection('about')}
            className="text-gray-700 hover:text-grace-primary dark:text-gray-300 transition-colors"
          >
            About
          </button>
          <button 
            onClick={() => scrollToSection('architecture')}
            className="text-gray-700 hover:text-grace-primary dark:text-gray-300 transition-colors"
          >
            Tech Stack
          </button>
          <button 
            onClick={() => scrollToSection('journal')}
            className="text-gray-700 hover:text-grace-primary dark:text-gray-300 transition-colors"
          >
            Journal
          </button>
          <button 
            onClick={() => scrollToSection('stats')}
            className="text-gray-700 hover:text-grace-primary dark:text-gray-300 transition-colors"
          >
            Transparency
          </button>
          <button 
            onClick={() => scrollToSection('contact')}
            className="text-gray-700 hover:text-grace-primary dark:text-gray-300 transition-colors"
          >
            Contact
          </button>
        </nav>
        <div className="flex gap-3">
          <Link to="/auth">
            <Button variant="outline">Dashboard Login</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
