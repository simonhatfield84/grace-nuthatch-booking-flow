
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Users, Calendar, BarChart3 } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="grace-logo text-3xl font-bold">grace</div>
          <nav className="hidden md:flex space-x-6">
            <a href="#features" className="text-gray-700 hover:text-gray-900 dark:text-gray-300">Features</a>
            <a href="#pricing" className="text-gray-700 hover:text-gray-900 dark:text-gray-300">Pricing</a>
            <a href="#contact" className="text-gray-700 hover:text-gray-900 dark:text-gray-300">Contact</a>
          </nav>
          <Link to="/setup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Hospitality Management
          <span className="block text-blue-600">Made Simple</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Grace OS is the complete restaurant management platform that streamlines your operations, 
          from table bookings to guest management. Everything you need to run your venue efficiently.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/setup">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Your Free Trial
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="text-lg px-8 py-3">
            Watch Demo
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Everything Your Restaurant Needs
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Booking Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Streamline reservations with intelligent table allocation and automated confirmations.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Guest Database</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Build lasting relationships with comprehensive guest profiles and dining history.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <ChefHat className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Service Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage multiple dining services with customizable booking windows and rules.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Analytics & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Make data-driven decisions with detailed insights into your restaurant's performance.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Restaurant?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of restaurants already using Grace OS to improve their operations.
          </p>
          <Link to="/setup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="grace-logo text-2xl font-bold mb-4">grace</div>
              <p className="text-gray-400">
                The complete hospitality management platform for modern restaurants.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <p className="text-gray-400">hello@grace-os.co.uk</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Grace OS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
