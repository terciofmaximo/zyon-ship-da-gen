import { useState } from "react";
import { NewPDAWizard } from "@/components/forms/NewPDAWizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrCreateSessionId } from "@/utils/sessionTracking";

export default function PublicPDANew() {
  const [sessionId] = useState(getOrCreateSessionId());

  return (
    <div className="space-y-6">
      <div className="container mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pre-Departure Approval Form</CardTitle>
            <CardDescription>
              Create a new PDA. Your form will be saved and you'll receive a tracking link to share.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <NewPDAWizard isPublic sessionId={sessionId} />
      </div>
    </div>
  );
}
