
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MasterCartonTab from "@/components/MasterCartonTab";
import PalletTab from "@/components/PalletTab";
import ContainerTab from "@/components/ContainerTab";
import { Package, Pallet, Container } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Smart Loading Optimizer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Optimize your loading efficiency with AI-powered 3D visualization for master cartons, pallets, and containers
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 shadow-xl border-0">
          <CardContent className="p-6">
            <Tabs defaultValue="master-carton" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="master-carton" className="flex items-center gap-2">
                  <Package size={20} />
                  Master Carton Loading
                </TabsTrigger>
                <TabsTrigger value="pallet" className="flex items-center gap-2">
                  <Pallet size={20} />
                  Pallet Loading
                </TabsTrigger>
                <TabsTrigger value="container" className="flex items-center gap-2">
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
