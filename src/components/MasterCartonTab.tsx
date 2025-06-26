import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Calculator, Play, Image as ImageIcon, Box } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from "./ImageUploader";
import ThreeDViewer from "./ThreeDViewer";
import OptimizationResults from "./OptimizationResults";

interface ProductData {
  image: string | null;
  length: number;
  width: number;
  height: number;
  weight: number;
  unit: string;
}

interface CartonData {
  shape: string;
  length: number;
  width: number;
  height: number;
  diameter?: number;
  maxWeight: number;
  unit: string;
}

const MasterCartonTab = () => {
  const [step, setStep] = useState(1);
  const [productData, setProductData] = useState<ProductData>({
    image: null,
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    unit: 'cm'
  });
  const [cartonData, setCartonData] = useState<CartonData>({
    shape: 'rectangular',
    length: 0,
    width: 0,
    height: 0,
    maxWeight: 0,
    unit: 'cm'
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationComplete, setOptimizationComplete] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = (imageUrl: string) => {
    setProductData(prev => ({ ...prev, image: imageUrl }));
    toast({
      title: "Image uploaded successfully",
      description: "Product image has been processed and background removed."
    });
  };

  const handleOptimize = async () => {
    if (!productData.image || !productData.length || !cartonData.length) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields before optimizing.",
        variant: "destructive"
      });
      return;
    }

    setIsOptimizing(true);
    
    // Simulate optimization process
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizationComplete(true);
      toast({
        title: "Optimization Complete",
        description: "Loading arrangement has been optimized successfully."
      });
    }, 3000);
  };

  const calculateMaxItems = () => {
    if (!productData.length || !cartonData.length) return 0;
    
    let containerVolume = 0;
    
    if (cartonData.shape === 'rectangular') {
      containerVolume = cartonData.length * cartonData.width * cartonData.height;
    } else if (cartonData.shape === 'cylindrical' && cartonData.diameter) {
      const radius = cartonData.diameter / 2;
      containerVolume = Math.PI * radius * radius * cartonData.height;
    } else if (cartonData.shape === 'cubic') {
      containerVolume = cartonData.length * cartonData.length * cartonData.length;
    }
    
    const productVolume = productData.length * productData.width * productData.height;
    const volumeConstraint = Math.floor(containerVolume / productVolume);
    const weightConstraint = Math.floor(cartonData.maxWeight / productData.weight);
    
    return Math.min(volumeConstraint, weightConstraint);
  };

  const renderCartonDimensionInputs = () => {
    switch (cartonData.shape) {
      case 'rectangular':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="carton-length">Length</Label>
              <Input
                id="carton-length"
                type="number"
                value={cartonData.length || ''}
                onChange={(e) => setCartonData(prev => ({ ...prev, length: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="carton-width">Width</Label>
              <Input
                id="carton-width"
                type="number"
                value={cartonData.width || ''}
                onChange={(e) => setCartonData(prev => ({ ...prev, width: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="carton-height">Height</Label>
              <Input
                id="carton-height"
                type="number"
                value={cartonData.height || ''}
                onChange={(e) => setCartonData(prev => ({ ...prev, height: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="carton-unit">Unit</Label>
              <Select value={cartonData.unit} onValueChange={(value) => setCartonData(prev => ({ ...prev, unit: value }))}>
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
        );
      
      case 'cubic':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="carton-side">Side Length</Label>
              <Input
                id="carton-side"
                type="number"
                value={cartonData.length || ''}
                onChange={(e) => setCartonData(prev => ({ ...prev, length: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="carton-unit">Unit</Label>
              <Select value={cartonData.unit} onValueChange={(value) => setCartonData(prev => ({ ...prev, unit: value }))}>
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
        );
      
      case 'cylindrical':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="carton-diameter">Diameter</Label>
              <Input
                id="carton-diameter"
                type="number"
                value={cartonData.diameter || ''}
                onChange={(e) => setCartonData(prev => ({ ...prev, diameter: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="carton-height">Height</Label>
              <Input
                id="carton-height"
                type="number"
                value={cartonData.height || ''}
                onChange={(e) => setCartonData(prev => ({ ...prev, height: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="carton-unit">Unit</Label>
              <Select value={cartonData.unit} onValueChange={(value) => setCartonData(prev => ({ ...prev, unit: value }))}>
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
        );
      
      default:
        return null;
    }
  };

  const isCartonDataValid = () => {
    if (cartonData.shape === 'rectangular') {
      return cartonData.length && cartonData.width && cartonData.height && cartonData.maxWeight;
    } else if (cartonData.shape === 'cubic') {
      return cartonData.length && cartonData.maxWeight;
    } else if (cartonData.shape === 'cylindrical') {
      return cartonData.diameter && cartonData.height && cartonData.maxWeight;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon size={24} />
              Step 1: Upload Product Image
            </CardTitle>
            <CardDescription>
              Upload an image of your product. The background will be automatically removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUploader onImageUpload={handleImageUpload} />
            {productData.image && (
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setStep(2)}>
                  Next: Product Dimensions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Product Specifications</CardTitle>
            <CardDescription>
              Enter the dimensions and weight of a single product.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="product-length">Length</Label>
                <Input
                  id="product-length"
                  type="number"
                  value={productData.length || ''}
                  onChange={(e) => setProductData(prev => ({ ...prev, length: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="product-width">Width</Label>
                <Input
                  id="product-width"
                  type="number"
                  value={productData.width || ''}
                  onChange={(e) => setProductData(prev => ({ ...prev, width: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="product-height">Height</Label>
                <Input
                  id="product-height"
                  type="number"
                  value={productData.height || ''}
                  onChange={(e) => setProductData(prev => ({ ...prev, height: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="product-unit">Unit</Label>
                <Select value={productData.unit} onValueChange={(value) => setProductData(prev => ({ ...prev, unit: value }))}>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-weight">Weight per Product</Label>
                <Input
                  id="product-weight"
                  type="number"
                  value={productData.weight || ''}
                  onChange={(e) => setProductData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="weight-unit">Weight Unit</Label>
                <Select defaultValue="kg">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g">Grams</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="lb">Pounds</SelectItem>
                    <SelectItem value="oz">Ounces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!productData.length || !productData.weight}>
                Next: Carton Specifications
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box size={24} />
              Step 3: Master Carton Specifications
            </CardTitle>
            <CardDescription>
              Select the shape and enter the dimensions of the master carton.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="carton-shape">Master Carton Shape</Label>
              <Select 
                value={cartonData.shape} 
                onValueChange={(value) => setCartonData(prev => ({ 
                  ...prev, 
                  shape: value,
                  // Reset dimensions when shape changes
                  length: 0,
                  width: 0,
                  height: 0,
                  diameter: undefined
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rectangular">Rectangular Box</SelectItem>
                  <SelectItem value="cubic">Cubic Box</SelectItem>
                  <SelectItem value="cylindrical">Cylindrical Container</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {renderCartonDimensionInputs()}
            
            <div>
              <Label htmlFor="max-weight">Maximum Weight Capacity</Label>
              <Input
                id="max-weight"
                type="number"
                value={cartonData.maxWeight || ''}
                onChange={(e) => setCartonData(prev => ({ ...prev, maxWeight: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Calculated Maximum Items:</h4>
              <p className="text-2xl font-bold text-blue-700">{calculateMaxItems()} products</p>
              <p className="text-sm text-blue-600 mt-1">
                Based on {cartonData.shape} container volume and weight constraints
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={!isCartonDataValid()}>
                Generate 3D Visualization
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play size={24} />
                3D Loading Optimization
              </CardTitle>
              <CardDescription>
                Watch the optimized loading process and view the final arrangement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button 
                  onClick={handleOptimize} 
                  disabled={isOptimizing}
                  className="w-full"
                >
                  {isOptimizing ? "Optimizing..." : "Start Optimization"}
                </Button>
              </div>
              
              <ThreeDViewer 
                isLoading={isOptimizing}
                showResult={optimizationComplete}
                maxItems={calculateMaxItems()}
              />
            </CardContent>
          </Card>

          {optimizationComplete && (
            <OptimizationResults 
              maxItems={calculateMaxItems()}
              spaceUtilization={85}
              weightUtilization={92}
              recommendations={[
                "Consider rotating products 90° to fit 2 more items",
                "Current arrangement achieves optimal weight distribution",
                "Space utilization could be improved by 5% with custom packaging"
              ]}
            />
          )}

          <div className="flex justify-start">
            <Button variant="outline" onClick={() => setStep(3)}>
              Back to Specifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterCartonTab;
