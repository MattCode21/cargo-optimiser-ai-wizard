
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <p className="text-lg text-muted-foreground">
            Optimize your container loading with AI-powered 3D visualization and smart packaging recommendations
          </p>
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-6">
            <Tabs defaultValue="master-carton" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="master-carton" className="flex items-center gap-2">
                  <Package size={20} />
                  Master Carton Loading
                </TabsTrigger>
                <TabsTrigger value="pallet" className="flex items-center gap-2">
                  <Truck size={20} />
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
