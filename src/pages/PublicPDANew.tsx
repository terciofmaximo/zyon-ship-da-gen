import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NewPDAWizard } from "@/components/forms/NewPDAWizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { getOrCreateSessionId } from "@/utils/sessionTracking";

export default function PublicPDANew() {
  const navigate = useNavigate();
  const [sessionId] = useState(getOrCreateSessionId());

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-xl font-bold">Create PDA</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/pda")}>
              My PDAs
            </Button>
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pre-Departure Approval Form</CardTitle>
            <CardDescription>
              Create a new PDA. Your form will be saved and you'll receive a tracking link to share.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <NewPDAWizard isPublic sessionId={sessionId} />
      </main>
    </div>
  );
}
