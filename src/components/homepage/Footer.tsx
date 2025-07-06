
import React from 'react';
import { calculateStats } from '@/data/developmentStats';

const Footer = () => {
  const stats = calculateStats();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="grace-logo text-2xl font-bold mb-4">grace</div>
            <p className="text-gray-400">
              An AI-assisted development project documenting human-AI collaboration 
              in building custom business software.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Project</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#project" className="hover:text-white">Development Story</a></li>
              <li><a href="#architecture" className="hover:text-white">Architecture</a></li>
              <li><a href="#journal" className="hover:text-white">Latest Updates</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Transparency</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#project" className="hover:text-white">Cost Breakdown</a></li>
              <li><a href="#journal" className="hover:text-white">Daily Progress</a></li>
              <li><a href="#project" className="hover:text-white">Time Investment</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <p className="text-gray-400">hello@grace-os.co.uk</p>
            <p className="text-gray-400 mt-2">
              Questions about AI-assisted development welcome
            </p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Grace OS - AI-Human Development Collaboration. Total investment: £{stats.totalCost.toFixed(2)} to date.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
