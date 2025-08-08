
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi } from 'lucide-react';

interface WelcomeStepProps {
  venue: any;
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ venue, onNext }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nuthatch Header */}
      <div className="bg-black text-white">
        <div className="max-w-md mx-auto px-6 py-6">
          <div className="text-center">
            <img 
              src="/lovable-uploads/0fac96e7-74c4-452d-841d-1d727bf769c7.png" 
              alt="The Nuthatch" 
              className="h-12 w-auto mx-auto mb-3" 
            />
            <h1 className="text-xl font-semibold">The Nuthatch</h1>
            <p className="text-gray-300 text-sm mt-1">Free WiFi Access</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center">
              <Wifi className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome! Connect to our free WiFi
            </CardTitle>
            <p className="text-gray-600">
              Get online in just a few quick steps. No passwords required.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-xs">1</span>
                </div>
                <span>Enter your details</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-xs">2</span>
                </div>
                <span>Accept our terms</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-xs">3</span>
                </div>
                <span>Start browsing!</span>
              </div>
            </div>
            
            <Button 
              onClick={onNext} 
              className="w-full bg-black hover:bg-gray-800 text-white py-6 text-lg font-medium"
            >
              Get Started
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to our terms of service and privacy policy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-md mx-auto px-6">
          <p className="text-center text-xs text-gray-500">
            Powered by Grace Restaurant Management
          </p>
        </div>
      </div>
    </div>
  );
};
