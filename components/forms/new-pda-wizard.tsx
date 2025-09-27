'use client'

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Ship, Calculator, FileText } from "lucide-react";
import { ShipDataForm } from "./ship-data-form";
import { CostEntryForm } from "./cost-entry-form";
import { ReviewForm } from "./review-form";
import type { ShipData, CostData } from "@/types";

const steps = [
  { id: 1, title: "Dados do Navio", icon: Ship, description: "Informações básicas do vessel" },
  { id: 2, title: "Custos", icon: Calculator, description: "Breakdown detalhado de custos" },
  { id: 3, title: "Revisão", icon: FileText, description: "Conferência e exportação" },
];

export function NewPDAWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [shipData, setShipData] = useState<Partial<ShipData>>({});
  const [costData, setCostData] = useState<Partial<CostData>>({});

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleShipDataSubmit = (data: ShipData) => {
    setShipData(data);
    handleNext();
  };

  const handleCostDataSubmit = (data: CostData) => {
    setCostData(data);
    handleNext();
  };

  const currentStepData = steps[currentStep - 1];
  const progress = (currentStep / steps.length) * 100;

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <currentStepData.icon className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
            <p className="text-muted-foreground">{currentStepData.description}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progresso</span>
            <span>{currentStep} de {steps.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-center gap-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                currentStep === step.id 
                  ? "bg-primary text-primary-foreground" 
                  : currentStep > step.id
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
              }`}>
                {currentStep > step.id ? "✓" : step.id}
              </div>
              
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 transition-colors ${
                  currentStep > step.id ? "bg-success" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {currentStep === 1 && (
          <ShipDataForm 
            onNext={handleShipDataSubmit}
            initialData={shipData}
          />
        )}

        {currentStep === 2 && (
          <CostEntryForm
            onNext={handleCostDataSubmit}
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