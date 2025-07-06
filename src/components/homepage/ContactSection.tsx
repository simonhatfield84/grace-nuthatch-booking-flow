
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ContactSection = () => {
  return (
    <section id="contact" className="bg-grace-secondary text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Questions About This AI Build Project?</h2>
        <p className="text-xl mb-8 opacity-90">
          This is a transparent development experiment showing AI-human collaboration in action. 
          We're documenting the entire journey—costs, challenges, and breakthroughs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3 bg-white text-grace-secondary hover:bg-gray-100">
              View Live Dashboard
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-grace-secondary">
            <a href="mailto:hello@grace-os.co.uk">Get In Touch</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
