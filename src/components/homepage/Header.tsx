
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'about', label: 'About' },
    { id: 'journal', label: 'Journal' },
    { id: 'architecture', label: 'Tech Stack' },
    { id: 'stats', label: 'Transparency' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="grace-logo text-3xl font-bold">grace</div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="text-gray-700 hover:text-grace-primary dark:text-gray-300 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className="hidden md:flex gap-3">
          <Link to="/auth">
            <Button variant="outline">Dashboard Login</Button>
          </Link>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <nav className="container mx-auto px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="block w-full text-left py-2 text-gray-700 hover:text-grace-primary dark:text-gray-300 transition-colors"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-3 border-t">
              <Link to="/auth" className="block">
                <Button variant="outline" className="w-full">Dashboard Login</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
