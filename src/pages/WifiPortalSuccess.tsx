
import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, Wifi } from "lucide-react";

const WifiPortalSuccess = () => {
  useEffect(() => {
    // Auto-redirect after 10 seconds if not manually clicked
    const timer = setTimeout(() => {
      window.open('https://the-nuthatch.com', '_blank');
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleMenuClick = () => {
    // Open in new tab to ensure it works in captive portal browsers
    window.open('https://the-nuthatch.com', '_blank');
  };

  const handleBookingClick = () => {
    // Navigate to booking widget
    window.location.href = '/booking/nuthatch';
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#2B3840] via-[#384140] to-[#2B3840] relative"
      style={{ fontFamily: 'Playfair Display' }}
    >
      {/* Background decoration */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='7' r='1'/%3E%3Ccircle cx='47' cy='7' r='1'/%3E%3Ccircle cx='7' cy='27' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='27' r='1'/%3E%3Ccircle cx='7' cy='47' r='1'/%3E%3Ccircle cx='27' cy='47' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>
      
      <div className="w-full max-w-lg mx-auto relative z-10">
        {/* Success Icon and Message */}
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Wifi className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            You're Connected!
          </h1>
          <p className="text-xl text-white/90 mb-2">
            Welcome to The Nuthatch WiFi
          </p>
          <p className="text-white/70">
            Enjoy your visit with us
          </p>
        </div>

        {/* Main Success Card */}
        <Card className="backdrop-blur-sm bg-white/95 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                  Explore The Nuthatch
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  While you're here, why not explore our carefully crafted cocktail menu 
                  or book your next visit to our intimate cocktail bar?
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleMenuClick}
                  className="flex-1 bg-[#2B3840] hover:bg-[#384140] text-white py-3 text-lg font-medium"
                >
                  <ExternalLink className="mr-2 h-5 w-5" />
                  View Our Menu
                </Button>
                
                <Button 
                  onClick={handleBookingClick}
                  variant="outline"
                  className="flex-1 border-[#2B3840] text-[#2B3840] hover:bg-[#2B3840] hover:text-white py-3 text-lg font-medium"
                >
                  Book a Table
                </Button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Your WiFi session is active. Links will open in your default browser.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            Experience exceptional cocktails in Birmingham's most intimate bar
          </p>
        </div>
      </div>

      {/* Auto-redirect notice */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/20 backdrop-blur-sm text-white/80 px-4 py-2 rounded-full text-xs">
          Our menu will open automatically in a few moments
        </div>
      </div>
    </div>
  );
};

export default WifiPortalSuccess;
