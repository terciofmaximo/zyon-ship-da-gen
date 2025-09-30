import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function InviteDisabled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserX className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>Invitations Disabled</CardTitle>
          <CardDescription>
            The invitation system has been disabled. Please sign up directly to access the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={() => navigate("/auth?mode=signup")} className="w-full">
            Go to Sign Up
          </Button>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full">
            Go to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
