
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="grace-logo text-3xl font-bold">grace</div>
        <nav className="hidden md:flex space-x-6">
          <a href="#stats" className="text-gray-700 hover:text-grace-primary dark:text-gray-300">Development Transparency</a>
          <a href="#journal" className="text-gray-700 hover:text-grace-primary dark:text-gray-300">Development Journal</a>
          <a href="#contact" className="text-gray-700 hover:text-grace-primary dark:text-gray-300">Contact</a>
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
