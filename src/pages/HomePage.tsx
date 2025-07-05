
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Users, Calendar, BarChart3, Code, Clock, DollarSign } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-grace-background to-grace-light dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="grace-logo text-3xl font-bold">grace</div>
          <nav className="hidden md:flex space-x-6">
            <a href="#project" className="text-gray-700 hover:text-grace-primary dark:text-gray-300">About This Project</a>
            <a href="#features" className="text-gray-700 hover:text-grace-primary dark:text-gray-300">Features</a>
            <a href="#contact" className="text-gray-700 hover:text-grace-primary dark:text-gray-300">Contact</a>
          </nav>
          <div className="flex gap-3">
            <Link to="/auth">
              <Button variant="outline">Dashboard Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
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

      {/* About This Project Section */}
      <section id="project" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          About This Project
        </h2>
        
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Project Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-6 w-6 text-grace-primary" />
                AI-Assisted Development Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                This ongoing AI-assisted collaboration between Fred (the AI developer) and Simon Hatfield 
                demonstrates what's possible when human creativity meets AI coding capability. We're building 
                a complete hospitality management system—EPOS, booking system, guest management, and more—
                with full transparency about costs, time, and development process.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                This isn't a product sales page. It's a live documentation of an AI-human development 
                partnership, showing real costs, real time investment, and real results.
              </p>
            </CardContent>
          </Card>

          {/* Development Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-grace-primary" />
                  Development Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-grace-primary mb-2">£[TOTAL_COST]</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Credits: £[CREDIT_COST] | Time: £[TIME_COST]
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-grace-primary" />
                  Time Invested
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-grace-primary mb-2">[USER_TIME_HOURS] hrs</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  [USER_COMMANDS_COUNT] interactive commands
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Code className="h-5 w-5 text-grace-primary" />
                  AI Credits Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-grace-primary mb-2">[LOVABLE_CREDITS_USED]</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lovable development credits
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Technical Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Summary</CardTitle>
              <CardDescription>As of [TODAY_DATE] - Development Architecture & Progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="font-medium mb-4">
                  As of [TODAY_DATE], I (Fred) have consumed [LOVABLE_CREDITS_USED] Lovable credits (£[CREDIT_COST]) 
                  and processed [USER_COMMANDS_COUNT] commands—equivalent to [USER_TIME_HOURS] hrs (£[TIME_COST]). 
                  Total development cost to date is £[TOTAL_COST].
                </p>
                <p>
                  <strong>Here's what Simon and I have built so far and how it's architected:</strong>
                </p>
                <ul className="space-y-2">
                  <li>Complete authentication system with Supabase integration</li>
                  <li>Multi-venue architecture with role-based access control</li>
                  <li>Table management with drag-and-drop floor planning</li>
                  <li>Booking system with time-based allocation and conflict detection</li>
                  <li>Guest database with CSV import and duplicate detection</li>
                  <li>Service management with booking windows and duration rules</li>
                  <li>Real-time dashboard with KPIs and analytics</li>
                  <li>Mobile-optimized host interface for iPad/tablet use</li>
                  <li>Platform admin tools for multi-tenant management</li>
                </ul>
                <p>
                  <strong>Technical Stack:</strong> React + TypeScript, Supabase (PostgreSQL + Auth + Storage), 
                  Tailwind CSS, Shadcn/UI components, React Query for state management, 
                  Recharts for analytics visualization.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Layperson Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Project Summary</CardTitle>
              <CardDescription>What This Means in Plain English</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="font-medium mb-4">
                  Since this AI-powered project began on [START_DATE], Simon and I have collaborated to build 
                  a custom EPOS & booking system, spending [USER_TIME_HOURS] hrs of hands-on work and using 
                  Lovable credits at a combined cost of £[TOTAL_COST]. This is a home-grown, no-funding-required 
                  development journey.
                </p>
                <p>
                  <strong>Here's why it matters:</strong>
                </p>
                <ul className="space-y-2">
                  <li><strong>Cost Transparency:</strong> Every penny spent is documented—no hidden costs or investor funding</li>
                  <li><strong>AI Partnership:</strong> Demonstrates real collaboration between human vision and AI execution</li>
                  <li><strong>Practical Results:</strong> A fully functional system that real venues could use today</li>
                  <li><strong>Open Development:</strong> The entire process is documented, showing what works and what doesn't</li>
                  <li><strong>Future-Focused:</strong> Explores how small businesses might develop custom software without traditional development costs</li>
                </ul>
                <p>
                  This isn't about selling software—it's about proving that the combination of human creativity 
                  and AI capability can produce professional-grade business applications at a fraction of 
                  traditional development costs.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          What We've Built Together
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-grace-primary mb-2" />
              <CardTitle>Booking Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Intelligent table allocation, automated confirmations, and conflict detection 
                built through AI-human collaboration.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-grace-primary mb-2" />
              <CardTitle>Guest Database</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive guest profiles, visit history, and smart duplicate detection 
                developed iteratively with AI assistance.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <ChefHat className="h-8 w-8 text-grace-primary mb-2" />
              <CardTitle>Service Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Multiple dining services with customizable booking windows and duration rules 
                architected through collaborative AI development.
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-grace-primary mb-2" />
              <CardTitle>Analytics & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Real-time KPIs and business insights with interactive charts built using 
                AI-suggested best practices and libraries.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
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

      {/* Footer */}
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
                <li><a href="#features" className="hover:text-white">What We Built</a></li>
                <li><Link to="/auth" className="hover:text-white">Live Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Transparency</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#project" className="hover:text-white">Cost Breakdown</a></li>
                <li><a href="#project" className="hover:text-white">Time Investment</a></li>
                <li><a href="#project" className="hover:text-white">AI Credits Used</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4" id="contact">Contact</h3>
              <p className="text-gray-400">hello@grace-os.co.uk</p>
              <p className="text-gray-400 mt-2">
                Questions about AI-assisted development welcome
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Grace OS - AI-Human Development Collaboration. Cost: £[TOTAL_COST] to date.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
