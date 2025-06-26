
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import MasterCartonTab from "@/components/MasterCartonTab";
import PalletTab from "@/components/PalletTab";
import ContainerTab from "@/components/ContainerTab";
import { Package, Truck, Container, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Smart Loading Optimizer
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Maximize space utilization with AI-powered 3D visualization and advanced bin packing algorithms
            </p>
          </div>
          <div className="ml-4">
            <ThemeToggle />
          </div>
        </div>

        <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 shadow-xl border-0 dark:border dark:border-gray-800">
          <CardContent className="p-6">
            <Tabs defaultValue="master-carton" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="master-carton" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  <Package size={20} />
                  Master Carton Loading
                </TabsTrigger>
                <TabsTrigger value="pallet" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  <Truck size={20} />
                  Pallet Loading
                </TabsTrigger>
                <TabsTrigger value="container" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  <Container size={20} />
                  Container Loading
                </TabsTrigger>
              </TabsList>

              <TabsContent value="master-carton">
                <MasterCartonTab />
              </TabsContent>

              <TabsContent value="pallet">
                <PalletTab />
              </TabsContent>

              <TabsContent value="container">
                <ContainerTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
