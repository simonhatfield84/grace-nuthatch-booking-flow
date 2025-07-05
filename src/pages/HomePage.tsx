
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Users, Calendar, BarChart3, Code, Clock, DollarSign, CalendarDays } from 'lucide-react';

const HomePage = () => {
  // Calculate days in development (started July 3rd, 2025)
  const startDate = new Date('2025-07-03');
  const today = new Date();
  const daysDiff = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

  // Current totals (will be updated manually via template)
  const totalCredits = 278; // 84 + 102 + 92
  const totalCommands = totalCredits; // Assuming 1 command = 1 credit
  const simonTimeHours = (totalCommands * 3) / 60; // 3 minutes per command
  const aiCost = totalCredits * 0.18;
  const simonTimeCost = simonTimeHours * 19;
  const totalCost = aiCost + simonTimeCost;

  return (
    <div className="min-h-screen bg-gradient-to-br from-grace-background to-grace-light dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="grace-logo text-3xl font-bold">grace</div>
          <nav className="hidden md:flex space-x-6">
            <a href="#project" className="text-gray-700 hover:text-grace-primary dark:text-gray-300">About This Project</a>
            <a href="#architecture" className="text-gray-700 hover:text-grace-primary dark:text-gray-300">Architecture</a>
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
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-grace-primary" />
                  Development Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-grace-primary mb-2">£{totalCost.toFixed(2)}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI Fred: £{aiCost.toFixed(2)} | Simon's time: £{simonTimeCost.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-grace-primary" />
                  Simon's Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-grace-primary mb-2">{simonTimeHours.toFixed(1)} hrs</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {totalCommands} interactive commands
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="h-5 w-5 text-grace-primary" />
                  Days in Development
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-grace-primary mb-2">{daysDiff}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Since July 3rd, 2025
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Code className="h-5 w-5 text-grace-primary" />
                  AI Fred Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-grace-primary mb-2">{totalCredits}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Lovable development credits
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Total Development Cost So Far */}
          <Card className="border-2 border-grace-primary">
            <CardHeader>
              <CardTitle className="text-center text-grace-primary text-xl">
                Total Development Cost So Far
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-4xl font-bold text-grace-primary mb-4">
                £{totalCost.toFixed(2)}
              </div>
              <p className="text-center text-gray-600 dark:text-gray-300">
                <strong>Cost Calculation:</strong> Simon's time calculated based on average UK software engineer 
                rate of £19/hour. Each command to Fred takes approximately 3 minutes of Simon's time. 
                AI Fred costs £0.18 per credit consumed.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="container mx-auto px-4 py-20 bg-muted/30">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Technical Architecture
        </h2>
        
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Current Technology Stack</CardTitle>
              <CardDescription>Technologies and frameworks powering the Grace OS platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-grace-primary mb-3">Frontend</h4>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• React 18 + TypeScript</li>
                    <li>• Vite (Build Tool)</li>
                    <li>• Tailwind CSS (Styling)</li>
                    <li>• Shadcn/UI (Component Library)</li>
                    <li>• React Router (Navigation)</li>
                    <li>• React Query (State Management)</li>
                    <li>• React Hook Form (Forms)</li>
                    <li>• Recharts (Data Visualization)</li>
                    <li>• Lucide React (Icons)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-grace-primary mb-3">Backend & Infrastructure</h4>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Supabase (Backend-as-a-Service)</li>
                    <li>• PostgreSQL (Database)</li>
                    <li>• Row Level Security (RLS)</li>
                    <li>• Supabase Auth (Authentication)</li>
                    <li>• Supabase Storage (File Storage)</li>
                    <li>• Edge Functions (Custom Logic)</li>
                    <li>• Real-time Subscriptions</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-grace-primary mb-3">Key Features Implemented</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Authentication & Authorization</strong>
                    <ul className="text-gray-600 dark:text-gray-300 mt-1">
                      <li>• Multi-role system</li>
                      <li>• Venue isolation</li>
                      <li>• Platform admin tools</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Booking System</strong>
                    <ul className="text-gray-600 dark:text-gray-300 mt-1">
                      <li>• Real-time availability</li>
                      <li>• Table allocation</li>
                      <li>• Service management</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Data Management</strong>
                    <ul className="text-gray-600 dark:text-gray-300 mt-1">
                      <li>• Guest database</li>
                      <li>• CSV imports</li>
                      <li>• Analytics dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Development Journal Section */}
      <section id="journal" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Development Journal
        </h2>
        
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Saturday July 5th, 2025 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Saturday, July 5th 2025</span>
                <span className="text-lg font-medium text-grace-primary">£{(92 * 0.18 + (92 * 3 / 60) * 19).toFixed(2)}</span>
              </CardTitle>
              <CardDescription>Session 3 • 92 AI Fred Credits • {(92 * 3 / 60).toFixed(1)} hours Simon's time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>AI Fred Cost: 92 × £0.18 = £{(92 * 0.18).toFixed(2)}</span>
                  <span>Simon's Time: {(92 * 3).toFixed(0)} min × £19/hr = £{((92 * 3 / 60) * 19).toFixed(2)}</span>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p><strong>Today's Focus:</strong> Platform administration system and multi-tenant architecture</p>
                  <ul>
                    <li>Built complete platform admin dashboard with venue management</li>
                    <li>Implemented user management system with role-based access control</li>
                    <li>Created subscription management framework</li>
                    <li>Added support ticket system for customer service</li>
                    <li>Developed platform-wide settings and configuration tools</li>
                  </ul>
                  <p><strong>Key Achievement:</strong> Transformed from single-venue to full multi-tenant SaaS platform</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Friday July 4th, 2025 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Friday, July 4th 2025</span>
                <span className="text-lg font-medium text-grace-primary">£{(102 * 0.18 + (102 * 3 / 60) * 19).toFixed(2)}</span>
              </CardTitle>
              <CardDescription>Session 2 • 102 AI Fred Credits • {(102 * 3 / 60).toFixed(1)} hours Simon's time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>AI Fred Cost: 102 × £0.18 = £{(102 * 0.18).toFixed(2)}</span>
                  <span>Simon's Time: {(102 * 3).toFixed(0)} min × £19/hr = £{((102 * 3 / 60) * 19).toFixed(2)}</span>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p><strong>Today's Focus:</strong> Service management and booking optimization</p>
                  <ul>
                    <li>Created comprehensive service management system</li>
                    <li>Implemented booking windows with time-based restrictions</li>
                    <li>Added duration rules for different service types</li>
                    <li>Built rich text editor for service descriptions</li>
                    <li>Developed media upload system for service images</li>
                    <li>Enhanced host interface with mobile optimization</li>
                  </ul>
                  <p><strong>Key Achievement:</strong> Complete service lifecycle from creation to customer booking</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thursday July 3rd, 2025 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Thursday, July 3rd 2025 - Project Start</span>
                <span className="text-lg font-medium text-grace-primary">£{(84 * 0.18 + (84 * 3 / 60) * 19).toFixed(2)}</span>
              </CardTitle>
              <CardDescription>Session 1 • 84 AI Fred Credits • {(84 * 3 / 60).toFixed(1)} hours Simon's time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>AI Fred Cost: 84 × £0.18 = £{(84 * 0.18).toFixed(2)}</span>
                  <span>Simon's Time: {(84 * 3).toFixed(0)} min × £19/hr = £{((84 * 3 / 60) * 19).toFixed(2)}</span>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p><strong>Project Launch:</strong> Foundation architecture and core systems</p>
                  <ul>
                    <li>Set up Supabase backend with PostgreSQL database</li>
                    <li>Implemented user authentication and authorization system</li>
                    <li>Created table management with drag-and-drop interface</li>
                    <li>Built booking system with real-time conflict detection</li>
                    <li>Developed guest database with CSV import functionality</li>
                    <li>Established admin dashboard with KPI tracking</li>
                  </ul>
                  <p><strong>Key Achievement:</strong> Fully functional booking system from zero to working prototype</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 bg-muted/30">
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
                <li><a href="#architecture" className="hover:text-white">Architecture</a></li>
                <li><a href="#journal" className="hover:text-white">Development Journal</a></li>
                <li><Link to="/auth" className="hover:text-white">Live Dashboard</Link></li>
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
              <h3 className="font-semibold mb-4" id="contact">Contact</h3>
              <p className="text-gray-400">hello@grace-os.co.uk</p>
              <p className="text-gray-400 mt-2">
                Questions about AI-assisted development welcome
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Grace OS - AI-Human Development Collaboration. Total investment: £{totalCost.toFixed(2)} to date.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
