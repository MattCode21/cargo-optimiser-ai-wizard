import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getOptimalBinPacking } from '@/utils/extremePointBinPacking';

interface ExcelUploaderProps {
  category: 'tiles' | 'striking-tools';
  onBack: () => void;
}

interface ExcelRow {
  'SKU Code': string;
  'Product name': string;
  'Tile dimensions': string;
  'Tile weight': number;
  'Master carton dimensions': string;
  'Master carton weight': number;
  'Pallet dimensions': string;
  'Pallet weight': number;
  'Maximum number of tiles in master carton'?: number;
  'Maximum number of packs in a pallet'?: number;
  'Maximum number of pallets in 20 foot container'?: number;
  'Maximum number of pallets in 40 foot container'?: number;
}

const CONTAINER_20FT_DIMS = [589, 235, 239]; // cm
const CONTAINER_40FT_DIMS = [1203, 235, 239]; // cm

export const ExcelUploader = ({ category, onBack }: ExcelUploaderProps) => {
  const [data, setData] = useState<ExcelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseDimensions = (dimStr: string): [number, number, number] => {
    const dims = dimStr.split('x').map(d => parseFloat(d.trim()));
    if (dims.length !== 3) throw new Error(`Invalid dimension format: ${dimStr}`);
    return [dims[0], dims[1], dims[2]];
  };

  const processExcelData = async (rawData: any[]) => {
    setLoading(true);
    const processedData: ExcelRow[] = [];

    for (const row of rawData) {
      try {
        const tileDims = parseDimensions(row['Tile dimensions']);
        const masterCartonDims = parseDimensions(row['Master carton dimensions']);
        const palletDims = parseDimensions(row['Pallet dimensions']);

        // Calculate max tiles in master carton
        const tilePackingResult = getOptimalBinPacking(masterCartonDims, tileDims);
        const maxTilesInMaster = tilePackingResult.length;

        // Calculate max master cartons in pallet
        const masterPackingResult = getOptimalBinPacking(palletDims, masterCartonDims);
        const maxMasterInPallet = masterPackingResult.length;

        // Calculate max pallets in containers
        const palletPacking20ft = getOptimalBinPacking(CONTAINER_20FT_DIMS as [number, number, number], palletDims as [number, number, number]);
        const maxPalletsIn20ft = palletPacking20ft.length;

        const palletPacking40ft = getOptimalBinPacking(CONTAINER_40FT_DIMS as [number, number, number], palletDims as [number, number, number]);
        const maxPalletsIn40ft = palletPacking40ft.length;

        processedData.push({
          ...row,
          'Maximum number of tiles in master carton': maxTilesInMaster,
          'Maximum number of packs in a pallet': maxMasterInPallet,
          'Maximum number of pallets in 20 foot container': maxPalletsIn20ft,
          'Maximum number of pallets in 40 foot container': maxPalletsIn40ft,
        });
      } catch (error) {
        console.error(`Error processing row:`, error);
        toast.error(`Error processing row: ${row['Product name']}`);
      }
    }

    setData(processedData);
    setLoading(false);
    toast.success(`Processed ${processedData.length} products successfully`);
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        processExcelData(jsonData);
      } catch (error) {
        toast.error('Error reading Excel file');
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadProcessedFile = () => {
    if (data.length === 0) {
      toast.error('No data to download');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Optimized Data');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${category}_optimized_packing.xlsx`);
  };

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
          <h1 className="text-3xl font-bold text-foreground">Excel Upload - {category.toUpperCase()}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Excel File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Upload Excel File</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload your Excel file with the required format
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Choose File'}
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Required Excel Format:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• SKU Code</li>
                  <li>• Product name</li>
                  <li>• Tile dimensions (LxWxH format)</li>
                  <li>• Tile weight</li>
                  <li>• Master carton dimensions (LxWxH format)</li>
                  <li>• Master carton weight</li>
                  <li>• Pallet dimensions (LxWxH format)</li>
                  <li>• Pallet weight</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      Processing Complete!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {data.length} products processed with optimization calculations
                    </p>
                  </div>
                  
                  <Button 
                    onClick={downloadProcessedFile}
                    className="w-full"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Optimized Excel
                  </Button>

                  <div className="max-h-96 overflow-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left">Product</th>
                          <th className="p-2 text-left">Max in Master</th>
                          <th className="p-2 text-left">Max in Pallet</th>
                          <th className="p-2 text-left">20ft Container</th>
                          <th className="p-2 text-left">40ft Container</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{row['Product name']}</td>
                            <td className="p-2">{row['Maximum number of tiles in master carton']}</td>
                            <td className="p-2">{row['Maximum number of packs in a pallet']}</td>
                            <td className="p-2">{row['Maximum number of pallets in 20 foot container']}</td>
                            <td className="p-2">{row['Maximum number of pallets in 40 foot container']}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileSpreadsheet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Upload an Excel file to see optimization results
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