
import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import { useEnhancedAuth } from "@/hooks/useEnhancedAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnhancedPasswordField } from "@/components/auth/EnhancedPasswordField";
import { AlertTriangle, Shield, LogIn } from "lucide-react";

export default function PlatformAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { data: isPlatformAdmin, isLoading: checkingAdmin } = usePlatformAdmin();
  const { loading, signInWithEnhancedSecurity } = useEnhancedAuth();

  // Redirect if already authenticated as platform admin
  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (isPlatformAdmin) {
    return <Navigate to="/platform/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      console.log('Attempting enhanced platform admin login...');
      
      const { data, error: signInError } = await signInWithEnhancedSecurity(email, password);

      if (signInError) {
        console.error('Enhanced sign in error:', signInError);
        setError(signInError.message);
        return;
      }

      if (data?.user) {
        console.log('Enhanced sign in successful, redirecting...');
        // Force a refresh of the platform admin status
        window.location.href = "/platform/dashboard";
      }
    } catch (err) {
      console.error('Unexpected error during enhanced login:', err);
      setError("An unexpected error occurred during login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Platform Administration</h1>
          <p className="text-slate-400">Secure system-level access with enhanced protection</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Administrator Login</CardTitle>
            <CardDescription className="text-slate-400">
              Enhanced security monitoring enabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6 bg-orange-950 border-orange-800">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-200">
                This is a secured system interface. All access attempts are monitored, logged, and analyzed for security threats.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Administrator Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  placeholder="Enter your administrator email"
                  required
                />
              </div>

              <EnhancedPasswordField
                id="admin-password"
                value={password}
                onChange={setPassword}
                label="Administrator Password"
                placeholder="Enter your secure password"
                showStrengthIndicator={false}
                required
              />

              {error && (
                <Alert className="bg-red-950 border-red-800">
                  <AlertDescription className="text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Authenticating with enhanced security...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Access Platform Securely
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-xs text-slate-500">
                Enhanced security features: Rate limiting, threat detection, audit logging
              </p>
              <p className="text-xs text-slate-600">
                Unauthorized access attempts will be reported and blocked
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
