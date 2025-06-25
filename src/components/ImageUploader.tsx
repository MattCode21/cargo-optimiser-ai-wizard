
import { useState, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void;
}

const ImageUploader = ({ onImageUpload }: ImageUploaderProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Show original image
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    
    // Simulate background removal process
    setIsProcessing(true);
    
    setTimeout(() => {
      // For demo purposes, we'll use the same image
      // In a real implementation, you'd use the background removal utility
      setProcessedImage(imageUrl);
      setIsProcessing(false);
      onImageUpload(imageUrl);
      
      toast({
        title: "Background Removed",
        description: "Product image has been processed successfully."
      });
    }, 2000);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {!selectedImage && (
        <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors cursor-pointer" onClick={handleUploadClick}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload size={48} className="text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">Upload Product Image</p>
            <p className="text-sm text-gray-500">Click to select an image file</p>
            <Button className="mt-4">Choose File</Button>
          </CardContent>
        </Card>
      )}

      {selectedImage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Original Image</h3>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={selectedImage} 
                  alt="Original product" 
                  className="w-full h-full object-contain"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Background Removed</h3>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                {isProcessing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <p className="text-sm text-gray-600">Processing...</p>
                  </div>
                ) : processedImage ? (
                  <img 
                    src={processedImage} 
                    alt="Processed product" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon size={48} className="text-gray-400" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedImage && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleUploadClick}>
            Upload Different Image
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
