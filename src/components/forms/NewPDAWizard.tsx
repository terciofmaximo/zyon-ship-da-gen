import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Ship, Calculator, FileCheck } from "lucide-react";
import { ShipDataForm } from "./ShipDataForm";
import { CostEntryForm } from "./CostEntryForm";
import { ReviewForm } from "./ReviewForm";

const steps = [
  { id: 1, title: "Ship Data", icon: Ship, description: "Enter vessel information" },
  { id: 2, title: "Cost Entry", icon: Calculator, description: "Input costs and fees" },
  { id: 3, title: "Review & Export", icon: FileCheck, description: "Generate PDA document" },
];

export function NewPDAWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [shipData, setShipData] = useState<any>({});
  const [costData, setCostData] = useState<any>({});

  const handleNext = (data: any) => {
    if (currentStep === 1) {
      setShipData(data);
    } else if (currentStep === 2) {
      setCostData(data);
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const progressValue = (currentStep / steps.length) * 100;

  return (
    <Card className="shadow-medium">
      <CardHeader className="bg-gradient-secondary">
        <CardTitle className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            {(() => {
              const IconComponent = steps[currentStep - 1].icon;
              return <IconComponent className="h-4 w-4 text-primary-foreground" />;
            })()}
          </div>
          Create New PDA
        </CardTitle>
        <div className="space-y-4">
          <Progress value={progressValue} className="h-2" />
          <div className="flex justify-between">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center text-center ${
                  step.id === currentStep
                    ? "text-primary"
                    : step.id < currentStep
                    ? "text-success"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    step.id === currentStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : step.id < currentStep
                      ? "border-success bg-success text-success-foreground"
                      : "border-muted"
                  }`}
                >
                  {step.id}
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {currentStep === 1 && (
          <ShipDataForm onNext={handleNext} initialData={shipData} />
        )}
        {currentStep === 2 && (
          <CostEntryForm 
            onNext={handleNext} 
            onBack={handleBack}
            shipData={shipData}
            initialData={costData}
          />
        )}
        {currentStep === 3 && (
          <ReviewForm 
            onBack={handleBack}
            shipData={shipData}
            costData={costData}
          />
        )}
      </CardContent>
    </Card>
  );
}