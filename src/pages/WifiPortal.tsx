
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WifiPortal = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    date_of_birth: '',
    marketing_consent: false
  });
  
  const [omadaParams, setOmadaParams] = useState({
    clientMac: '',
    apMac: '',
    ssidName: '',
    radioId: '',
    site: '',
    originUrl: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDebugMode, setIsDebugMode] = useState(false);

  // Extract Omada parameters from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setOmadaParams({
      clientMac: urlParams.get('clientMac') || '',
      apMac: urlParams.get('apMac') || '',
      ssidName: urlParams.get('ssidName') || '',
      radioId: urlParams.get('radioId') || '',
      site: urlParams.get('site') || '',
      originUrl: urlParams.get('originUrl') || ''
    });
    
    setIsDebugMode(urlParams.get('debug') === 'true');
  }, []);

  // Fetch WiFi settings for branding
  const { data: settings } = useQuery({
    queryKey: ['wifi-portal-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wifi_settings')
        .select('welcome_message, logo_url, background_image_url, font_family, primary_color, secondary_color, accent_color, custom_css')
        .eq('venue_id', '1') // Hardcoded for nuthatch
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching WiFi settings:', error);
      }
      
      return data;
    },
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.mobile_number.trim()) {
      newErrors.mobile_number = 'Mobile number is required';
    } else if (!/^[\d\s\-\+\(\)]{10,}$/.test(formData.mobile_number.replace(/\s/g, ''))) {
      newErrors.mobile_number = 'Please enter a valid mobile number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('wifi-portal-submit', {
        body: {
          venue_slug: 'nuthatch',
          ...formData,
          ...omadaParams
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        // Redirect to success page or original URL
        const redirectUrl = data.origin_url || '/wifiportal/success/nuthatch';
        window.location.href = redirectUrl;
      } else {
        throw new Error(data.error || 'Failed to process WiFi signup');
      }
      
    } catch (error) {
      console.error('WiFi portal submission error:', error);
      setErrors({ submit: 'Failed to connect to WiFi. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic styles based on settings
  const portalStyles = {
    fontFamily: settings?.font_family || 'Playfair Display',
    '--primary-color': settings?.primary_color || '#2B3840',
    '--secondary-color': settings?.secondary_color || '#384140',
    '--accent-color': settings?.accent_color || '#FFFFFF'
  } as React.CSSProperties;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{
        ...portalStyles,
        backgroundImage: settings?.background_image_url 
          ? `linear-gradient(rgba(43, 56, 64, 0.8), rgba(43, 56, 64, 0.8)), url(${settings.background_image_url})`
          : 'linear-gradient(135deg, #2B3840 0%, #384140 100%)'
      }}
    >
      {/* Custom CSS if provided */}
      {settings?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: settings.custom_css }} />
      )}
      
      <div className="w-full max-w-md mx-auto">
        {/* Logo and Welcome Message */}
        <div className="text-center mb-8">
          {settings?.logo_url ? (
            <img 
              src={settings.logo_url} 
              alt="The Nuthatch" 
              className="h-20 w-auto mx-auto mb-4"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-8 h-8" style={{ color: 'var(--primary-color)' }} />
            </div>
          )}
          
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: portalStyles.fontFamily }}>
            {settings?.welcome_message || "Welcome to The Nuthatch Guest WiFi"}
          </h1>
          <p className="text-white/80 text-sm">
            Please complete the form below to connect to our complimentary WiFi
          </p>
        </div>

        {/* Main Form */}
        <Card className="backdrop-blur-sm bg-white/95 shadow-2xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium">
                  Full Name *
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full"
                  placeholder="Enter your full name"
                  required
                />
                {errors.full_name && (
                  <p className="text-sm text-red-600">{errors.full_name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full"
                  placeholder="your.email@example.com"
                  required
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <Label htmlFor="mobile_number" className="text-sm font-medium">
                  Mobile Number *
                </Label>
                <Input
                  id="mobile_number"
                  type="tel"
                  value={formData.mobile_number}
                  onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                  className="w-full"
                  placeholder="+44 7XXX XXX XXX"
                  required
                />
                {errors.mobile_number && (
                  <p className="text-sm text-red-600">{errors.mobile_number}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="date_of_birth" className="text-sm font-medium">
                  Date of Birth (Optional)
                </Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Marketing Consent */}
              <div className="flex items-start space-x-3 py-2">
                <Checkbox
                  id="marketing_consent"
                  checked={formData.marketing_consent}
                  onCheckedChange={(checked) => handleInputChange('marketing_consent', checked === true)}
                />
                <Label htmlFor="marketing_consent" className="text-sm leading-relaxed">
                  I'd like to receive updates about events, special offers, and news from The Nuthatch
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-3 text-lg font-medium"
                style={{ 
                  backgroundColor: 'var(--primary-color)',
                  color: 'var(--accent-color)'
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect to WiFi"
                )}
              </Button>

              {errors.submit && (
                <p className="text-sm text-red-600 text-center mt-2">{errors.submit}</p>
              )}
            </form>

            {/* Terms and Privacy */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center leading-relaxed">
                By connecting, you agree to use our WiFi responsibly. We collect basic device information for security and analytics. 
                Your personal data is processed according to our privacy policy.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Debug Mode */}
        {isDebugMode && (
          <Card className="mt-4 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Mode - Omada Parameters</h3>
              <div className="text-xs text-yellow-700 space-y-1">
                <div>Client MAC: {omadaParams.clientMac || 'Not provided'}</div>
                <div>AP MAC: {omadaParams.apMac || 'Not provided'}</div>
                <div>SSID: {omadaParams.ssidName || 'Not provided'}</div>
                <div>Radio ID: {omadaParams.radioId || 'Not provided'}</div>
                <div>Site: {omadaParams.site || 'Not provided'}</div>
                <div>Origin URL: {omadaParams.originUrl || 'Not provided'}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WifiPortal;
