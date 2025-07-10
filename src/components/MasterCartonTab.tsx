
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Calculator, Play, Image as ImageIcon } from "lucide-react";
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
  length: number;
  width: number;
  height: number;
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
    
    const volumeConstraint = Math.max(1, Math.floor(
      (cartonData.length / productData.length) *
      (cartonData.width / productData.width) *
      (cartonData.height / productData.height)
    ));
    
    const weightConstraint = productData.weight > 0 ? Math.floor(cartonData.maxWeight / productData.weight) : 1;
    
    return Math.min(volumeConstraint, weightConstraint);
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
            <CardTitle>Step 3: Master Carton Specifications</CardTitle>
            <CardDescription>
              Enter the dimensions and maximum weight capacity of the master carton.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                Based on volume and weight constraints
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={!cartonData.length || !cartonData.maxWeight}>
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
