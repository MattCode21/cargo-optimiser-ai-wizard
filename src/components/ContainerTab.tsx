
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThreeDViewer from "./ThreeDViewer";
import OptimizationResults from "./OptimizationResults";

interface PalletType {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
  unit: string;
}

interface ContainerSpecs {
  length: number;
  width: number;
  height: number;
  maxWeight: number;
  type: '20ft' | '40ft';
}

const CONTAINER_SPECS: { [key: string]: ContainerSpecs } = {
  '20ft': {
    length: 589,
    width: 235,
    height: 239,
    maxWeight: 28230,
    type: '20ft'
  },
  '40ft': {
    length: 1203,
    width: 235,
    height: 239,
    maxWeight: 28790,
    type: '40ft'
  }
};

const ContainerTab = () => {
  const [containerType, setContainerType] = useState<'20ft' | '40ft'>('20ft');
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([
    {
      id: '1',
      name: 'Standard Pallet',
      length: 120,
      width: 80,
      height: 150,
      weight: 500,
      quantity: 0,
      unit: 'cm'
    }
  ]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const [productDescription, setProductDescription] = useState('');
  const { toast } = useToast();

  const addPalletType = () => {
    const newPallet: PalletType = {
      id: Date.now().toString(),
      name: `Pallet Type ${palletTypes.length + 1}`,
      length: 120,
      width: 80,
      height: 150,
      weight: 500,
      quantity: 0,
      unit: 'cm'
    };
    setPalletTypes([...palletTypes, newPallet]);
  };

  const removePalletType = (id: string) => {
    if (palletTypes.length > 1) {
      setPalletTypes(palletTypes.filter(pallet => pallet.id !== id));
    }
  };

  const updatePalletType = (id: string, field: keyof PalletType, value: any) => {
    setPalletTypes(palletTypes.map(pallet =>
      pallet.id === id ? { ...pallet, [field]: value } : pallet
    ));
  };

  const getCurrentContainer = () => CONTAINER_SPECS[containerType];

  const convertToContainerUnits = (value: number, fromUnit: string) => {
    const conversions: { [key: string]: number } = {
      'mm': 0.1,
      'cm': 1,
      'in': 2.54,
      'ft': 30.48
    };
    return value * conversions[fromUnit]; // Convert to cm
  };

  const calculateOptimalArrangement = () => {
    const container = getCurrentContainer();
    let totalPallets = 0;
    let totalWeight = 0;
    let totalVolume = 0;
    
    palletTypes.forEach(pallet => {
      const convertedLength = convertToContainerUnits(pallet.length, pallet.unit);
      const convertedWidth = convertToContainerUnits(pallet.width, pallet.unit);
      const convertedHeight = convertToContainerUnits(pallet.height, pallet.unit);
      
      totalPallets += pallet.quantity;
      totalWeight += pallet.weight * pallet.quantity;
      totalVolume += (convertedLength * convertedWidth * convertedHeight) * pallet.quantity;
    });

    const containerVolume = container.length * container.width * container.height;
    const spaceUtilization = Math.min((totalVolume / containerVolume) * 100, 100);
    const weightUtilization = Math.min((totalWeight / container.maxWeight) * 100, 100);

    return { totalPallets, spaceUtilization, weightUtilization };
  };

  const handleOptimize = async () => {
    const hasValidPallets = palletTypes.some(pallet => 
      pallet.length > 0 && pallet.width > 0 && pallet.height > 0 && pallet.quantity > 0
    );

    if (!hasValidPallets) {
      toast({
        title: "Missing Information",
        description: "Please add at least one pallet type with valid dimensions and quantity.",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);
    
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizationComplete(true);
      toast({
        title: "Container Optimization Complete",
        description: "Loading arrangement has been optimized successfully."
      });
    }, 3000);
  };

  const results = calculateOptimalArrangement();
  const container = getCurrentContainer();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck size={24} />
            Container Specifications
          </CardTitle>
          <CardDescription>
            Select container type. Standard dimensions and weight limits are automatically applied.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Container Type</Label>
            <Select 
              value={containerType} 
              onValueChange={(value: '20ft' | '40ft') => setContainerType(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20ft">20ft Container</SelectItem>
                <SelectItem value="40ft">40ft Container</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Label className="text-sm text-blue-600">Length</Label>
              <p className="text-lg font-semibold text-blue-900">{container.length} cm</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <Label className="text-sm text-blue-600">Width</Label>
              <p className="text-lg font-semibold text-blue-900">{container.width} cm</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <Label className="text-sm text-blue-600">Height</Label>
              <p className="text-lg font-semibold text-blue-900">{container.height} cm</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <Label className="text-sm text-blue-600">Max Weight</Label>
              <p className="text-lg font-semibold text-blue-900">{container.maxWeight.toLocaleString()} kg</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Pallet Types
            <Button variant="outline" size="sm" onClick={addPalletType}>
              <Plus size={16} className="mr-1" />
              Add Type
            </Button>
          </CardTitle>
          <CardDescription>
            Define different pallet types and quantities for mixed container loading.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {palletTypes.map((pallet, index) => (
            <Card key={pallet.id} className="p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">{pallet.name}</h4>
                {palletTypes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePalletType(pallet.id)}
                  >
                    <Minus size={16} />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <Label>Length</Label>
                  <Input
                    type="number"
                    value={pallet.length || ''}
                    onChange={(e) => updatePalletType(pallet.id, 'length', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Width</Label>
                  <Input
                    type="number"
                    value={pallet.width || ''}
                    onChange={(e) => updatePalletType(pallet.id, 'width', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input
                    type="number"
                    value={pallet.height || ''}
                    onChange={(e) => updatePalletType(pallet.id, 'height', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    value={pallet.weight || ''}
                    onChange={(e) => updatePalletType(pallet.id, 'weight', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={pallet.quantity || ''}
                    onChange={(e) => updatePalletType(pallet.id, 'quantity', Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Label>Unit</Label>
                <Select 
                  value={pallet.unit} 
                  onValueChange={(value) => updatePalletType(pallet.id, 'unit', value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">Millimeters</SelectItem>
                    <SelectItem value="cm">Centimeters</SelectItem>
                    <SelectItem value="in">Inches</SelectItem>
                    <SelectItem value="ft">Feet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductDescriptionInput 
            value={productDescription}
            onChange={setProductDescription}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Container Loading Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button 
              onClick={handleOptimize} 
              disabled={isOptimizing}
              className="w-full"
            >
              {isOptimizing ? "Optimizing..." : "Optimize Container Loading"}
            </Button>
          </div>
          
          <ThreeDViewer 
            isLoading={isOptimizing}
            showResult={optimizationComplete}
            maxItems={results.totalPallets}
            containerDims={[
              container.length,
              container.width,
              container.height
            ]}
            itemDims={[
              palletTypes[0]?.length || 100,
              palletTypes[0]?.width || 120,
              palletTypes[0]?.height || 150
            ]}
            containerUnit="cm"
            itemUnit={palletTypes[0]?.unit || "cm"}
          />
        </CardContent>
      </Card>

      {optimizationComplete && (
        <OptimizationResults 
          maxItems={results.totalPallets}
          spaceUtilization={results.spaceUtilization}
          weightUtilization={results.weightUtilization}
          recommendations={getDimensionOptimizationTips(
            [container.length, container.width, container.height],
            [palletTypes[0]?.length || 100, palletTypes[0]?.width || 120, palletTypes[0]?.height || 150],
            results.spaceUtilization,
            results.totalPallets
          )}
        />
      )}
    </div>
  );
};

export default ContainerTab;
