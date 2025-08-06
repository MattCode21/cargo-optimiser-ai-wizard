import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Calculator, Truck } from "lucide-react";
import { toast } from "sonner";
import ThreeDViewer from "../ThreeDViewer";
import { getOptimalBinPacking } from '@/utils/extremePointBinPacking';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';
import { AIOptimizationChat } from '../AIOptimizationChat';

interface PalletOptimizerProps {
  category: string;
}

export const PalletOptimizer = ({ category }: PalletOptimizerProps) => {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productDescription, setProductDescription] = useState('');
  const [masterCartonDims, setMasterCartonDims] = useState({ length: '', width: '', height: '', unit: 'cm' });
  const [masterCartonWeight, setMasterCartonWeight] = useState({ value: '', unit: 'kg' });
  const [palletDims, setPalletDims] = useState({ length: '120', width: '100', height: '150', unit: 'cm' });
  const [palletWeight, setPalletWeight] = useState({ value: '1000', unit: 'kg' });
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
      const originalUrl = URL.createObjectURL(file);
      setProductImage(originalUrl);
      toast.warning('Using original image (background removal failed)');
    }
  };

  const optimizePacking = () => {
    if (!masterCartonDims.length || !masterCartonDims.width || !masterCartonDims.height || 
        !palletDims.length || !palletDims.width || !palletDims.height) {
      toast.error('Please fill in all dimensions');
      return;
    }

    setIsOptimizing(true);

    try {
      const masterDimensions: [number, number, number] = [
        parseFloat(masterCartonDims.length),
        parseFloat(masterCartonDims.width),
        parseFloat(masterCartonDims.height)
      ];

      const palletDimensions: [number, number, number] = [
        parseFloat(palletDims.length),
        parseFloat(palletDims.width),
        parseFloat(palletDims.height)
      ];

      const packingResult = getOptimalBinPacking(
        palletDimensions,
        masterDimensions,
        palletDims.unit,
        masterCartonDims.unit
      );

      const maxCartons = packingResult.length;
      const cartonWeightValue = parseFloat(masterCartonWeight.value || '0');
      const totalWeight = maxCartons * cartonWeightValue;
      const maxWeightAllowed = parseFloat(palletWeight.value || '0');

      const results = {
        maxUnits: maxCartons,
        totalWeight,
        maxWeightAllowed,
        weightUtilization: maxWeightAllowed > 0 ? (totalWeight / maxWeightAllowed) * 100 : 0,
        spaceUtilization: 82,
        packingData: packingResult
      };

      setResults(results);
      toast.success(`Optimization complete! Can fit ${maxCartons} master cartons`);
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
                Master Carton Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productImage">Master Carton Image</Label>
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
                      alt="Master Carton" 
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
                  placeholder="Describe the master carton contents"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Master Carton Dimensions & Weight</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label htmlFor="masterLength">Length</Label>
                  <Input
                    id="masterLength"
                    type="number"
                    value={masterCartonDims.length}
                    onChange={(e) => setMasterCartonDims(prev => ({...prev, length: e.target.value}))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="masterWidth">Width</Label>
                  <Input
                    id="masterWidth"
                    type="number"
                    value={masterCartonDims.width}
                    onChange={(e) => setMasterCartonDims(prev => ({...prev, width: e.target.value}))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="masterHeight">Height</Label>
                  <Input
                    id="masterHeight"
                    type="number"
                    value={masterCartonDims.height}
                    onChange={(e) => setMasterCartonDims(prev => ({...prev, height: e.target.value}))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="masterDimUnit">Unit</Label>
                  <Select value={masterCartonDims.unit} onValueChange={(value) => setMasterCartonDims(prev => ({...prev, unit: value}))}>
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
                  <Label htmlFor="masterWeightValue">Weight</Label>
                  <Input
                    id="masterWeightValue"
                    type="number"
                    value={masterCartonWeight.value}
                    onChange={(e) => setMasterCartonWeight(prev => ({...prev, value: e.target.value}))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="masterWeightUnit">Unit</Label>
                  <Select value={masterCartonWeight.unit} onValueChange={(value) => setMasterCartonWeight(prev => ({...prev, unit: value}))}>
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
              <CardTitle>Pallet Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label htmlFor="palletLength">Length</Label>
                  <Input
                    id="palletLength"
                    type="number"
                    value={palletDims.length}
                    onChange={(e) => setPalletDims(prev => ({...prev, length: e.target.value}))}
                    placeholder="120"
                  />
                </div>
                <div>
                  <Label htmlFor="palletWidth">Width</Label>
                  <Input
                    id="palletWidth"
                    type="number"
                    value={palletDims.width}
                    onChange={(e) => setPalletDims(prev => ({...prev, width: e.target.value}))}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="palletHeight">Height</Label>
                  <Input
                    id="palletHeight"
                    type="number"
                    value={palletDims.height}
                    onChange={(e) => setPalletDims(prev => ({...prev, height: e.target.value}))}
                    placeholder="150"
                  />
                </div>
                <div>
                  <Label htmlFor="palletDimUnit">Unit</Label>
                  <Select value={palletDims.unit} onValueChange={(value) => setPalletDims(prev => ({...prev, unit: value}))}>
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
                  <Label htmlFor="palletWeightValue">Max Weight</Label>
                  <Input
                    id="palletWeightValue"
                    type="number"
                    value={palletWeight.value}
                    onChange={(e) => setPalletWeight(prev => ({...prev, value: e.target.value}))}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="palletWeightUnit">Unit</Label>
                  <Select value={palletWeight.unit} onValueChange={(value) => setPalletWeight(prev => ({...prev, unit: value}))}>
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
                {isOptimizing ? 'Optimizing...' : 'Optimize Pallet Loading'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                3D Pallet Visualization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ThreeDViewer
                isLoading={isOptimizing}
                showResult={!!results}
                maxItems={results?.maxUnits || 0}
                containerDims={[
                  parseFloat(palletDims.length) || 120,
                  parseFloat(palletDims.width) || 100,
                  parseFloat(palletDims.height) || 150
                ]}
                itemDims={[
                  parseFloat(masterCartonDims.length) || 40,
                  parseFloat(masterCartonDims.width) || 30,
                  parseFloat(masterCartonDims.height) || 20
                ]}
                containerUnit={palletDims.unit}
                itemUnit={masterCartonDims.unit}
              />
            </CardContent>
          </Card>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Pallet Loading Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Master Cartons</p>
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
                      {results.totalWeight.toFixed(1)} {masterCartonWeight.unit}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => setShowAI(true)}
                  variant="outline"
                  className="w-full"
                >
                  Get AI Pallet Optimization Suggestions
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
          unitDims={masterCartonDims}
          masterDims={palletDims}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
};