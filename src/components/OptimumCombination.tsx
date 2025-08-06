import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, Calculator } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface OptimumCombinationProps {
  category: 'tiles' | 'striking-tools';
  onBack: () => void;
}

interface Product {
  'Product name': string;
  'Unit weight': number;
  'Unit carton dimensions': string;
}

interface OptimizedProduct extends Product {
  quantity: number;
  totalWeight: number;
  totalVolume: number;
}

export const OptimumCombination = ({ category, onBack }: OptimumCombinationProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [masterCartonDims, setMasterCartonDims] = useState('');
  const [masterCartonWeight, setMasterCartonWeight] = useState('');
  const [optimizedCombination, setOptimizedCombination] = useState<OptimizedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseDimensions = (dimStr: string): [number, number, number] => {
    const dims = dimStr.split('x').map(d => parseFloat(d.trim()));
    if (dims.length !== 3) throw new Error(`Invalid dimension format: ${dimStr}`);
    return [dims[0], dims[1], dims[2]];
  };

  const calculateVolume = (dims: [number, number, number]): number => {
    return dims[0] * dims[1] * dims[2];
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Product[];
        
        setProducts(jsonData);
        toast.success(`Loaded ${jsonData.length} products`);
      } catch (error) {
        toast.error('Error reading Excel file');
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const optimizeCombination = () => {
    if (products.length === 0 || !masterCartonDims || !masterCartonWeight) {
      toast.error('Please upload products file and enter master carton specifications');
      return;
    }

    setLoading(true);

    try {
      const masterDims = parseDimensions(masterCartonDims);
      const masterVolume = calculateVolume(masterDims);
      const maxWeight = parseFloat(masterCartonWeight);

      // Initialize with at least 1 of each product
      const result: OptimizedProduct[] = products.map(product => {
        const unitDims = parseDimensions(product['Unit carton dimensions']);
        const unitVolume = calculateVolume(unitDims);
        
        return {
          ...product,
          quantity: 1,
          totalWeight: product['Unit weight'],
          totalVolume: unitVolume
        };
      });

      let totalWeight = result.reduce((sum, p) => sum + p.totalWeight, 0);
      let totalVolume = result.reduce((sum, p) => sum + p.totalVolume, 0);

      // Greedily add more products based on efficiency (weight/volume ratio)
      const efficiencyScores = products.map((product, index) => {
        const unitDims = parseDimensions(product['Unit carton dimensions']);
        const unitVolume = calculateVolume(unitDims);
        return {
          index,
          efficiency: product['Unit weight'] / unitVolume,
          unitWeight: product['Unit weight'],
          unitVolume
        };
      });

      // Sort by efficiency (higher weight per volume is better)
      efficiencyScores.sort((a, b) => b.efficiency - a.efficiency);

      let improved = true;
      while (improved) {
        improved = false;
        
        for (const { index, unitWeight, unitVolume } of efficiencyScores) {
          if (totalWeight + unitWeight <= maxWeight && 
              totalVolume + unitVolume <= masterVolume) {
            result[index].quantity++;
            result[index].totalWeight += unitWeight;
            result[index].totalVolume += unitVolume;
            totalWeight += unitWeight;
            totalVolume += unitVolume;
            improved = true;
          }
        }
      }

      setOptimizedCombination(result);
      toast.success('Optimization complete!');
    } catch (error) {
      toast.error('Error during optimization');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const utilizationPercentage = optimizedCombination.length > 0 ? {
    weight: (optimizedCombination.reduce((sum, p) => sum + p.totalWeight, 0) / parseFloat(masterCartonWeight || '1')) * 100,
    volume: (optimizedCombination.reduce((sum, p) => sum + p.totalVolume, 0) / 
             (masterCartonDims ? calculateVolume(parseDimensions(masterCartonDims)) : 1)) * 100
  } : { weight: 0, volume: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Optimum Combination - {category.toUpperCase()}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Product List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                  />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">Required format:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Product name</li>
                      <li>• Unit weight</li>
                      <li>• Unit carton dimensions (LxWxH)</li>
                    </ul>
                  </div>
                  {products.length > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        ✓ {products.length} products loaded
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Master Carton Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="masterDims">Master Carton Dimensions (LxWxH)</Label>
                  <Input
                    id="masterDims"
                    value={masterCartonDims}
                    onChange={(e) => setMasterCartonDims(e.target.value)}
                    placeholder="e.g., 50x30x40"
                  />
                </div>
                <div>
                  <Label htmlFor="masterWeight">Maximum Weight</Label>
                  <Input
                    id="masterWeight"
                    type="number"
                    value={masterCartonWeight}
                    onChange={(e) => setMasterCartonWeight(e.target.value)}
                    placeholder="e.g., 25"
                  />
                </div>
                <Button 
                  onClick={optimizeCombination}
                  disabled={loading || products.length === 0}
                  className="w-full"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  {loading ? 'Optimizing...' : 'Optimize Combination'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Optimized Combination</CardTitle>
            </CardHeader>
            <CardContent>
              {optimizedCombination.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Weight Utilization</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {utilizationPercentage.weight.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">Volume Utilization</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {utilizationPercentage.volume.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Product Combination:</h3>
                    <div className="max-h-96 overflow-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-2 text-left">Product</th>
                            <th className="p-2 text-left">Quantity</th>
                            <th className="p-2 text-left">Total Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {optimizedCombination.map((product, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">{product['Product name']}</td>
                              <td className="p-2">{product.quantity}</td>
                              <td className="p-2">{product.totalWeight.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Upload products and specify master carton details to see optimization results
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};