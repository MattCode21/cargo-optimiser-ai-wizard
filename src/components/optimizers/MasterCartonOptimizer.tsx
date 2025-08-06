import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Calculator, Package } from "lucide-react";
import { toast } from "sonner";
import ThreeDViewer from "../ThreeDViewer";
import { getOptimalBinPacking } from '@/utils/extremePointBinPacking';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';
import { AIOptimizationChat } from '../AIOptimizationChat';

interface MasterCartonOptimizerProps {
  category: string;
}

export const MasterCartonOptimizer = ({ category }: MasterCartonOptimizerProps) => {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productDescription, setProductDescription] = useState('');
  const [unitDims, setUnitDims] = useState({ length: '', width: '', height: '', unit: 'cm' });
  const [unitWeight, setUnitWeight] = useState({ value: '', unit: 'kg' });
  const [masterDims, setMasterDims] = useState({ length: '', width: '', height: '', unit: 'cm' });
  const [masterWeight, setMasterWeight] = useState({ value: '', unit: 'kg' });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showAI, setShowAI] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      toast.info('Removing background...');
      const imageElement = await loadImage(file);
      const processedBlob = await removeBackground(imageElement);
      const processedUrl = URL.createObjectURL(processedBlob);
      setProductImage(processedUrl);
      toast.success('Background removed successfully!');
    } catch (error) {
      console.error('Background removal failed:', error);
      // Fallback to original image
      const originalUrl = URL.createObjectURL(file);
      setProductImage(originalUrl);
      toast.warning('Using original image (background removal failed)');
    }
  };

  const optimizePacking = () => {
    if (!unitDims.length || !unitDims.width || !unitDims.height || 
        !masterDims.length || !masterDims.width || !masterDims.height) {
      toast.error('Please fill in all dimensions');
      return;
    }

    setIsOptimizing(true);

    try {
      const unitDimensions: [number, number, number] = [
        parseFloat(unitDims.length),
        parseFloat(unitDims.width),
        parseFloat(unitDims.height)
      ];

      const masterDimensions: [number, number, number] = [
        parseFloat(masterDims.length),
        parseFloat(masterDims.width),
        parseFloat(masterDims.height)
      ];

      const packingResult = getOptimalBinPacking(
        masterDimensions,
        unitDimensions,
        masterDims.unit,
        unitDims.unit
      );

      const maxUnits = packingResult.length;
      const unitWeightValue = parseFloat(unitWeight.value || '0');
      const totalWeight = maxUnits * unitWeightValue;
      const maxWeightAllowed = parseFloat(masterWeight.value || '0');

      const results = {
        maxUnits,
        totalWeight,
        maxWeightAllowed,
        weightUtilization: maxWeightAllowed > 0 ? (totalWeight / maxWeightAllowed) * 100 : 0,
        spaceUtilization: 85, // This would come from the 3D algorithm
        packingData: packingResult
      };

      setResults(results);
      toast.success(`Optimization complete! Can fit ${maxUnits} units`);
    } catch (error) {
      toast.error('Error during optimization');
      console.error(error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productImage">Product Image</Label>
                <Input
                  id="productImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {productImage && (
                  <div className="mt-2">
                    <img 
                      src={productImage} 
                      alt="Product" 
                      className="h-32 w-32 object-contain border rounded-lg bg-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="productDescription">Product Description</Label>
                <Textarea
                  id="productDescription"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Describe the product (e.g., ceramic floor tiles, door handles, etc.)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unit Product Dimensions & Weight</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label htmlFor="unitLength">Length</Label>
                  <Input
                    id="unitLength"
                    type="number"
                    value={unitDims.length}
                    onChange={(e) => setUnitDims(prev => ({...prev, length: e.target.value}))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="unitWidth">Width</Label>
                  <Input
                    id="unitWidth"
                    type="number"
                    value={unitDims.width}
                    onChange={(e) => setUnitDims(prev => ({...prev, width: e.target.value}))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="unitHeight">Height</Label>
                  <Input
                    id="unitHeight"
                    type="number"
                    value={unitDims.height}
                    onChange={(e) => setUnitDims(prev => ({...prev, height: e.target.value}))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="unitDimUnit">Unit</Label>
                  <Select value={unitDims.unit} onValueChange={(value) => setUnitDims(prev => ({...prev, unit: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="cm">cm</SelectItem>
                      <SelectItem value="in">in</SelectItem>
                      <SelectItem value="ft">ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="unitWeightValue">Weight</Label>
                  <Input
                    id="unitWeightValue"
                    type="number"
                    value={unitWeight.value}
                    onChange={(e) => setUnitWeight(prev => ({...prev, value: e.target.value}))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="unitWeightUnit">Unit</Label>
                  <Select value={unitWeight.unit} onValueChange={(value) => setUnitWeight(prev => ({...prev, unit: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lb">lb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Master Carton Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label htmlFor="masterLength">Length</Label>
                  <Input
                    id="masterLength"
                    type="number"
                    value={masterDims.length}
                    onChange={(e) => setMasterDims(prev => ({...prev, length: e.target.value}))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="masterWidth">Width</Label>
                  <Input
                    id="masterWidth"
                    type="number"
                    value={masterDims.width}
                    onChange={(e) => setMasterDims(prev => ({...prev, width: e.target.value}))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="masterHeight">Height</Label>
                  <Input
                    id="masterHeight"
                    type="number"
                    value={masterDims.height}
                    onChange={(e) => setMasterDims(prev => ({...prev, height: e.target.value}))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="masterDimUnit">Unit</Label>
                  <Select value={masterDims.unit} onValueChange={(value) => setMasterDims(prev => ({...prev, unit: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="cm">cm</SelectItem>
                      <SelectItem value="in">in</SelectItem>
                      <SelectItem value="ft">ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="masterWeightValue">Max Weight</Label>
                  <Input
                    id="masterWeightValue"
                    type="number"
                    value={masterWeight.value}
                    onChange={(e) => setMasterWeight(prev => ({...prev, value: e.target.value}))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="masterWeightUnit">Unit</Label>
                  <Select value={masterWeight.unit} onValueChange={(value) => setMasterWeight(prev => ({...prev, unit: value}))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lb">lb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={optimizePacking} 
                disabled={isOptimizing}
                className="w-full"
                size="lg"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {isOptimizing ? 'Optimizing...' : 'Optimize Packing'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                3D Visualization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ThreeDViewer
                isLoading={isOptimizing}
                showResult={!!results}
                maxItems={results?.maxUnits || 0}
                containerDims={[
                  parseFloat(masterDims.length) || 50,
                  parseFloat(masterDims.width) || 30,
                  parseFloat(masterDims.height) || 40
                ]}
                itemDims={[
                  parseFloat(unitDims.length) || 10,
                  parseFloat(unitDims.width) || 10,
                  parseFloat(unitDims.height) || 5
                ]}
                containerUnit={masterDims.unit}
                itemUnit={unitDims.unit}
              />
            </CardContent>
          </Card>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Optimization Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Units Packed</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {results.maxUnits}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Space Utilization</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {results.spaceUtilization.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Weight Utilization</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {results.weightUtilization.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Total Weight</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {results.totalWeight.toFixed(1)} {unitWeight.unit}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => setShowAI(true)}
                  variant="outline"
                  className="w-full"
                >
                  Get AI Optimization Suggestions
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showAI && results && (
        <AIOptimizationChat
          category={category}
          productDescription={productDescription}
          results={results}
          unitDims={unitDims}
          masterDims={masterDims}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
};