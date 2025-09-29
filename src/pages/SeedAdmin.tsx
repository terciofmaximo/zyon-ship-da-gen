import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function SeedAdmin() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const navigate = useNavigate();

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Calling seed-platform-admin edge function...');
      
      const { data, error } = await supabase.functions.invoke('seed-platform-admin', {
        body: {},
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw error;
      }

      console.log('Function response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to seed platform admin');
      }

      setResult({
        success: true,
        message: 'Platform admin seeded successfully!',
        details: data,
      });
    } catch (error: any) {
      console.error('Error seeding admin:', error);
      setResult({
        success: false,
        message: error.message || 'Failed to seed platform admin',
        details: error,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Seed Platform Admin</CardTitle>
              <CardDescription>Development Tool</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">Platform Admin Credentials:</p>
            <div className="text-sm space-y-1">
              <p><strong>Email:</strong> contact@vesselopsportal.com</p>
              <p><strong>Password:</strong> Admin123!</p>
            </div>
          </div>

          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              This tool creates a platform admin account with email confirmation bypassed.
              Use for development only.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleSeed} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Seeding..." : "Seed Platform Admin"}
          </Button>

          {result && (
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? "text-green-900" : "text-red-900"}>
                <p className="font-medium">{result.message}</p>
                {result.details && (
                  <pre className="mt-2 text-xs overflow-auto max-h-32">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
          )}

          {result?.success && (
            <Button 
              onClick={() => navigate('/auth')}
              variant="outline"
              className="w-full"
            >
              Go to Login
            </Button>
          )}

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => navigate('/auth')}
              className="text-sm text-muted-foreground"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
