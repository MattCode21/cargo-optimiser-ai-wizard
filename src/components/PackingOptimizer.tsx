import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MasterCartonOptimizer } from "./optimizers/MasterCartonOptimizer";
import { PalletOptimizer } from "./optimizers/PalletOptimizer";
import { ContainerOptimizer } from "./optimizers/ContainerOptimizer";

interface PackingOptimizerProps {
  category: 'tiles' | 'striking-tools';
  onBack: () => void;
}

export const PackingOptimizer = ({ category, onBack }: PackingOptimizerProps) => {
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
          <h1 className="text-3xl font-bold text-foreground">Packing Optimizer - {category.toUpperCase()}</h1>
        </div>

        <Tabs defaultValue="master-carton" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="master-carton">Master Carton Loading</TabsTrigger>
            <TabsTrigger value="pallet">Pallet Loading</TabsTrigger>
            <TabsTrigger value="container">Container Loading</TabsTrigger>
          </TabsList>

          <TabsContent value="master-carton">
            <MasterCartonOptimizer category={category} />
          </TabsContent>

          <TabsContent value="pallet">
            <PalletOptimizer category={category} />
          </TabsContent>

          <TabsContent value="container">
            <ContainerOptimizer category={category} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};