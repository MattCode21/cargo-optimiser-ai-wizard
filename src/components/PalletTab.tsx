import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ThreeDViewer from "./ThreeDViewer";
import OptimizationResults from "./OptimizationResults";
import { ProductDescriptionInput } from "./ProductDescriptionInput";

interface CartonType {
  id: string;
  name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
  unit: string;
}

interface PalletData {
  length: number;
  width: number;
  height: number;
  maxWeight: number;
  unit: string;
}

const PalletTab = () => {
  const [cartonTypes, setCartonTypes] = useState<CartonType[]>([
    {
      id: '1',
      name: 'Carton Type A',
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      quantity: 0,
      unit: 'cm'
    }
  ]);
  const [palletData, setPalletData] = useState<PalletData>({
    length: 120,
    width: 80,
    height: 200,
    maxWeight: 1000,
    unit: 'cm'
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const [productDescription, setProductDescription] = useState('');
  const { toast } = useToast();

  const addCartonType = () => {
    const newCarton: CartonType = {
      id: Date.now().toString(),
      name: `Carton Type ${String.fromCharCode(65 + cartonTypes.length)}`,
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      quantity: 0,
      unit: 'cm'
    };
    setCartonTypes([...cartonTypes, newCarton]);
  };

  const removeCartonType = (id: string) => {
    if (cartonTypes.length > 1) {
      setCartonTypes(cartonTypes.filter(carton => carton.id !== id));
    }
  };

  const updateCartonType = (id: string, field: keyof CartonType, value: any) => {
    setCartonTypes(cartonTypes.map(carton =>
      carton.id === id ? { ...carton, [field]: value } : carton
    ));
  };

  const convertUnits = (value: number, fromUnit: string, toUnit: string) => {
    const conversions: { [key: string]: number } = {
      'mm': 0.1,
      'cm': 1,
      'in': 2.54,
      'ft': 30.48
    };
    return (value * conversions[fromUnit]) / conversions[toUnit];
  };

  const calculateOptimalArrangement = () => {
    // Convert all dimensions to same unit (cm) for calculation
    const convertToStandardUnit = (value: number, fromUnit: string): number => {
      const conversions: { [key: string]: number } = {
        'mm': 0.1,
        'cm': 1,
        'in': 2.54,
        'ft': 30.48,
        'm': 100
      };
      return value * (conversions[fromUnit] || 1);
    };

    let totalCartons = 0;
    let totalWeight = 0;
    let totalVolume = 0;
    
    cartonTypes.forEach(carton => {
      if (carton.quantity > 0 && carton.length > 0 && carton.width > 0 && carton.height > 0) {
        const convertedVolume = convertToStandardUnit(carton.length, carton.unit) * 
                               convertToStandardUnit(carton.width, carton.unit) * 
                               convertToStandardUnit(carton.height, carton.unit);
        
        totalCartons += carton.quantity;
        totalWeight += carton.weight * carton.quantity;
        totalVolume += convertedVolume * carton.quantity;
      }
    });

    const palletVolumeConverted = convertToStandardUnit(palletData.length, palletData.unit) * 
                                  convertToStandardUnit(palletData.width, palletData.unit) * 
                                  convertToStandardUnit(palletData.height, palletData.unit);
    
    const spaceUtilization = totalVolume > 0 ? Math.min((totalVolume / palletVolumeConverted) * 100, 100) : 0;
    const weightUtilization = palletData.maxWeight > 0 ? Math.min((totalWeight / palletData.maxWeight) * 100, 100) : 0;

    return { totalCartons, spaceUtilization, weightUtilization };
  };

  const generateSmartRecommendations = () => {
    const results = calculateOptimalArrangement();
    const recommendations: string[] = [];

    // Calculate potential improvements
    const currentCarton = cartonTypes[0];
    if (currentCarton && currentCarton.length > 0) {
      const convertToStandardUnit = (value: number, fromUnit: string): number => {
        const conversions: { [key: string]: number } = {
          'mm': 0.1, 'cm': 1, 'in': 2.54, 'ft': 30.48, 'm': 100
        };
        return value * (conversions[fromUnit] || 1);
      };

      const cartonLength = convertToStandardUnit(currentCarton.length, currentCarton.unit);
      const cartonWidth = convertToStandardUnit(currentCarton.width, currentCarton.unit);
      const cartonHeight = convertToStandardUnit(currentCarton.height, currentCarton.unit);
      
      const palletLength = convertToStandardUnit(palletData.length, palletData.unit);
      const palletWidth = convertToStandardUnit(palletData.width, palletData.unit);
      const palletHeight = convertToStandardUnit(palletData.height, palletData.unit);

      // Calculate how many cartons can fit
      const cartonsPerRow = Math.floor(palletLength / cartonLength);
      const cartonsPerColumn = Math.floor(palletWidth / cartonWidth);
      const cartonsPerLayer = Math.floor(palletHeight / cartonHeight);
      const maxCartons = cartonsPerRow * cartonsPerColumn * cartonsPerLayer;

      if (results.totalCartons < maxCartons) {
        const additionalCartons = maxCartons - results.totalCartons;
        recommendations.push(`You can fit ${additionalCartons} more cartons by optimizing arrangement`);
      }

      // Dimension optimization suggestions
      const lengthWaste = palletLength - (cartonsPerRow * cartonLength);
      const widthWaste = palletWidth - (cartonsPerColumn * cartonWidth);
      const heightWaste = palletHeight - (cartonsPerLayer * cartonHeight);

      if (lengthWaste > 5) {
        const newLength = cartonLength + (lengthWaste / cartonsPerRow);
        recommendations.push(`Increase carton length to ${newLength.toFixed(0)}cm to utilize ${lengthWaste.toFixed(0)}cm of wasted space`);
      }

      if (widthWaste > 5) {
        const newWidth = cartonWidth + (widthWaste / cartonsPerColumn);
        recommendations.push(`Increase carton width to ${newWidth.toFixed(0)}cm to utilize ${widthWaste.toFixed(0)}cm of wasted space`);
      }

      if (heightWaste > 5) {
        const newHeight = cartonHeight + (heightWaste / cartonsPerLayer);
        recommendations.push(`Increase carton height to ${newHeight.toFixed(0)}cm to utilize ${heightWaste.toFixed(0)}cm of wasted space`);
      }

      // Weight optimization
      const remainingWeight = palletData.maxWeight - results.totalCartons * currentCarton.weight;
      if (remainingWeight > 100) {
        const additionalCartonsByWeight = Math.floor(remainingWeight / currentCarton.weight);
        recommendations.push(`Pallet can handle ${remainingWeight.toFixed(0)}kg more weight (approximately ${additionalCartonsByWeight} more cartons)`);
      }

      // Product-specific recommendations
      if (productDescription.toLowerCase().includes('fragile') || productDescription.toLowerCase().includes('glass')) {
        recommendations.push('For fragile items: Reduce stacking height and add extra cushioning between layers');
      }
      if (productDescription.toLowerCase().includes('liquid') || productDescription.toLowerCase().includes('bottle')) {
        recommendations.push('For liquids: Keep cartons upright and use dividers to prevent movement');
      }
    }

    return recommendations;
  };

  const handleOptimize = async () => {
    const hasValidCartons = cartonTypes.some(carton => 
      carton.length > 0 && carton.width > 0 && carton.height > 0 && carton.quantity > 0
    );

    if (!hasValidCartons) {
      toast({
        title: "Missing Information",
        description: "Please add at least one carton type with valid dimensions and quantity.",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);
    
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizationComplete(true);
      toast({
        title: "Pallet Optimization Complete",
        description: "Loading arrangement has been optimized successfully."
      });
    }, 3000);
  };

  const results = calculateOptimalArrangement();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pallet Specifications</CardTitle>
          <CardDescription>
            Standard pallet dimensions are pre-filled. Modify if needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="pallet-length">Length</Label>
              <Input
                id="pallet-length"
                type="number"
                value={palletData.length || ''}
                onChange={(e) => setPalletData(prev => ({ ...prev, length: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="pallet-width">Width</Label>
              <Input
                id="pallet-width"
                type="number"
                value={palletData.width || ''}
                onChange={(e) => setPalletData(prev => ({ ...prev, width: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="pallet-height">Max Height</Label>
              <Input
                id="pallet-height"
                type="number"
                value={palletData.height || ''}
                onChange={(e) => setPalletData(prev => ({ ...prev, height: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="pallet-unit">Unit</Label>
              <Select value={palletData.unit} onValueChange={(value) => setPalletData(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger>
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
          </div>
          
          <div>
            <Label htmlFor="pallet-max-weight">Maximum Weight Capacity (kg)</Label>
            <Input
              id="pallet-max-weight"
              type="number"
              value={palletData.maxWeight || ''}
              onChange={(e) => setPalletData(prev => ({ ...prev, maxWeight: Number(e.target.value) }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Master Carton Types
            <Button variant="outline" size="sm" onClick={addCartonType}>
              <Plus size={16} className="mr-1" />
              Add Type
            </Button>
          </CardTitle>
          <CardDescription>
            Define different master carton types and quantities for mixed pallet loading.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {cartonTypes.map((carton, index) => (
            <Card key={carton.id} className="p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">{carton.name}</h4>
                {cartonTypes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCartonType(carton.id)}
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
                    value={carton.length || ''}
                    onChange={(e) => updateCartonType(carton.id, 'length', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Width</Label>
                  <Input
                    type="number"
                    value={carton.width || ''}
                    onChange={(e) => updateCartonType(carton.id, 'width', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input
                    type="number"
                    value={carton.height || ''}
                    onChange={(e) => updateCartonType(carton.id, 'height', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    value={carton.weight || ''}
                    onChange={(e) => updateCartonType(carton.id, 'weight', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={carton.quantity || ''}
                    onChange={(e) => updateCartonType(carton.id, 'quantity', Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Label>Unit</Label>
                <Select 
                  value={carton.unit} 
                  onValueChange={(value) => updateCartonType(carton.id, 'unit', value)}
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
          <CardTitle className="flex items-center gap-2">
            <Calculator size={24} />
            Pallet Loading Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button 
              onClick={handleOptimize} 
              disabled={isOptimizing}
              className="w-full"
            >
              {isOptimizing ? "Optimizing..." : "Optimize Pallet Loading"}
            </Button>
          </div>
          
          <ThreeDViewer 
            isLoading={isOptimizing}
            showResult={optimizationComplete}
            maxItems={results.totalCartons}
            containerDims={[palletData.length, palletData.width, palletData.height]}
            itemDims={cartonTypes.length > 0 ? [cartonTypes[0].length || 1, cartonTypes[0].width || 1, cartonTypes[0].height || 1] : [1, 1, 1]}
            containerUnit={palletData.unit}
            itemUnit={cartonTypes.length > 0 ? cartonTypes[0].unit : 'cm'}
          />
        </CardContent>
      </Card>

      {optimizationComplete && (
        <OptimizationResults 
          maxItems={results.totalCartons}
          spaceUtilization={results.spaceUtilization}
          weightUtilization={results.weightUtilization}
          recommendations={generateSmartRecommendations()}
        />
      )}
    </div>
  );
};

export default PalletTab;