import { useState } from "react";
import { NewPDAWizard } from "@/components/forms/NewPDAWizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrCreateSessionId } from "@/utils/sessionTracking";
import { PublicHeader } from "@/components/layout/PublicHeader";

export default function PublicPDANew() {
  const [sessionId] = useState(getOrCreateSessionId());

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
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
