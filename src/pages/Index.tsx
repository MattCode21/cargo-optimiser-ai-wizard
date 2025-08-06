import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Layers, Hammer } from "lucide-react";
import { ProductCategoryPage } from "@/components/ProductCategoryPage";

type ProductCategory = 'tiles' | 'striking-tools' | null;

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(null);

  if (selectedCategory) {
    return (
      <ProductCategoryPage 
        category={selectedCategory}
        onBack={() => setSelectedCategory(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Product Categories
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select a product category to optimize loading and packing configurations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
            onClick={() => setSelectedCategory('tiles')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Layers className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">TILES</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Optimize tile loading configurations for master cartons, pallets, and containers
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
            onClick={() => setSelectedCategory('striking-tools')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                <Hammer className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">STRIKING TOOLS</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Optimize striking tools loading configurations for efficient packaging
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 hover:border-primary border-dashed">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 flex items-center justify-center">
                <Plus className="h-10 w-10 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl font-bold text-muted-foreground">ADD NEW CATEGORY</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                Create a new product category for custom optimization requirements
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;