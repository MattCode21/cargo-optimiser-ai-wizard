import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileSpreadsheet, Settings, Calculator } from "lucide-react";
import { ExcelUploader } from "./ExcelUploader";
import { OptimumCombination } from "./OptimumCombination";
import { PackingOptimizer } from "./PackingOptimizer";

interface ProductCategoryPageProps {
  category: 'tiles' | 'striking-tools';
  onBack: () => void;
}

type OptionType = 'excel' | 'combination' | 'packing' | null;

export const ProductCategoryPage = ({ category, onBack }: ProductCategoryPageProps) => {
  const [selectedOption, setSelectedOption] = useState<OptionType>(null);

  const categoryTitle = category === 'tiles' ? 'TILES' : 'STRIKING TOOLS';

  if (selectedOption === 'excel') {
    return <ExcelUploader category={category} onBack={() => setSelectedOption(null)} />;
  }

  if (selectedOption === 'combination') {
    return <OptimumCombination category={category} onBack={() => setSelectedOption(null)} />;
  }

  if (selectedOption === 'packing') {
    return <PackingOptimizer category={category} onBack={() => setSelectedOption(null)} />;
  }

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
            Back to Categories
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{categoryTitle}</h1>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Choose Optimization Method
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the optimization approach that best fits your requirements
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
            onClick={() => setSelectedOption('excel')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <FileSpreadsheet className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">Upload Excel Sheet</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Upload an Excel sheet with product data and get optimized packing calculations for each item
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
            onClick={() => setSelectedOption('combination')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Settings className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">Choose Optimum Combination</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Find the best combination of products to fit in a master carton within weight and space limits
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
            onClick={() => setSelectedOption('packing')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Calculator className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">Optimum Packing Algorithm</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Use advanced 3D bin packing algorithms with visualization for single product optimization
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};