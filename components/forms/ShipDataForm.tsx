import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ship, MapPin, Package, Calendar } from "lucide-react";
import type { ShipData } from "@/types";

interface ShipDataFormProps {
  onNext: (data: ShipData) => void;
  initialData: Partial<ShipData>;
}

export function ShipDataForm({ onNext, initialData }: ShipDataFormProps) {
  const [formData, setFormData] = useState({
    vesselName: initialData.vesselName || "",
    imoNumber: initialData.imoNumber || "",
    dwt: initialData.dwt || "",
    loa: initialData.loa || "",
    port: initialData.port || "",
    terminal: initialData.terminal || "",
    cargoType: initialData.cargoType || "",
    arrivalDate: initialData.arrivalDate || "",
    departureDate: initialData.departureDate || "",
    agent: initialData.agent || "",
    exchangeRate: initialData.exchangeRate || "5.25",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Ship className="h-5 w-5 text-primary" />
              Vessel Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="vesselName">Vessel Name *</Label>
              <Input
                id="vesselName"
                value={formData.vesselName}
                onChange={(e) => handleChange("vesselName", e.target.value)}
                placeholder="e.g. MSC MAYA"
                required
              />
            </div>
            <div>
              <Label htmlFor="imoNumber">IMO Number</Label>
              <Input
                id="imoNumber"
                value={formData.imoNumber}
                onChange={(e) => handleChange("imoNumber", e.target.value)}
                placeholder="e.g. 9876543"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dwt">DWT (tons) *</Label>
                <Input
                  id="dwt"
                  type="number"
                  value={formData.dwt}
                  onChange={(e) => handleChange("dwt", e.target.value)}
                  placeholder="25000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="loa">LOA (meters) *</Label>
                <Input
                  id="loa"
                  type="number"
                  step="0.01"
                  value={formData.loa}
                  onChange={(e) => handleChange("loa", e.target.value)}
                  placeholder="180.50"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Port & Cargo Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="port">Port *</Label>
              <Select value={formData.port} onValueChange={(value) => handleChange("port", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select port" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="santos">Port of Santos</SelectItem>
                  <SelectItem value="paranagua">Port of Paranaguá</SelectItem>
                  <SelectItem value="rio">Port of Rio de Janeiro</SelectItem>
                  <SelectItem value="suape">Port of Suape</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="terminal">Terminal</Label>
              <Input
                id="terminal"
                value={formData.terminal}
                onChange={(e) => handleChange("terminal", e.target.value)}
                placeholder="e.g. Terminal 37"
              />
            </div>
            <div>
              <Label htmlFor="cargoType">Cargo Type</Label>
              <Select value={formData.cargoType} onValueChange={(value) => handleChange("cargoType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cargo type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="container">Container</SelectItem>
                  <SelectItem value="bulk">Bulk Cargo</SelectItem>
                  <SelectItem value="grain">Grain</SelectItem>
                  <SelectItem value="general">General Cargo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Schedule & Financial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="arrivalDate">Arrival Date *</Label>
              <Input
                id="arrivalDate"
                type="date"
                value={formData.arrivalDate}
                onChange={(e) => handleChange("arrivalDate", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="departureDate">Expected Departure</Label>
              <Input
                id="departureDate"
                type="date"
                value={formData.departureDate}
                onChange={(e) => handleChange("departureDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="exchangeRate">Exchange Rate (USD/BRL) *</Label>
              <Input
                id="exchangeRate"
                type="number"
                step="0.01"
                value={formData.exchangeRate}
                onChange={(e) => handleChange("exchangeRate", e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="px-8">
          Next: Cost Entry
        </Button>
      </div>
    </form>
  );
}