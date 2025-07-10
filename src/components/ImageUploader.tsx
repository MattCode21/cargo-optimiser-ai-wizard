import { useState, useRef } from 'react'
import { Upload, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { removeBackground, loadImage } from '@/utils/backgroundRemoval'
import { useToast } from '@/hooks/use-toast'

export function ImageUploader() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setProcessedImage(null) // Reset processed image when new image is uploaded
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveBackground = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    try {
      // Convert data URL to blob
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      
      // Load image
      const imageElement = await loadImage(blob);
      
      // Remove background
      const processedBlob = await removeBackground(imageElement);
      
      // Convert back to data URL for display
      const processedDataUrl = URL.createObjectURL(processedBlob);
      setProcessedImage(processedDataUrl);
      
      toast({
        title: "Success",
        description: "Background removed successfully!"
      });
    } catch (error) {
      console.error('Background removal failed:', error);
      toast({
        title: "Error",
        description: "Failed to remove background. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setProcessedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadImage = () => {
    const imageToDownload = processedImage || selectedImage;
    if (imageToDownload) {
      const link = document.createElement('a')
      link.href = imageToDownload
      link.download = processedImage ? 'no-background-image.png' : 'original-image.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <Card className="border-dashed border-2 border-gray-300 hover:border-primary transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">Upload Product Image</p>
          <p className="text-sm text-muted-foreground">Click to select an image file</p>
          <Button className="mt-4">Choose File</Button>
        </CardContent>
      </Card>

      {selectedImage && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <h4 className="text-sm font-medium mb-2">Original Image</h4>
              <img
                src={selectedImage}
                alt="Original"
                className="w-full h-64 object-contain rounded-lg border"
              />
            </div>
            {processedImage && (
              <div className="relative">
                <h4 className="text-sm font-medium mb-2">Background Removed</h4>
                <img
                  src={processedImage}
                  alt="Processed"
                  className="w-full h-64 object-contain rounded-lg border"
                  style={{
                    background: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                  }}
                />
              </div>
            )}
          </div>
          <Button
            onClick={removeImage}
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            {!processedImage && (
              <Button
                onClick={handleRemoveBackground}
                disabled={isProcessing}
                variant="outline"
                className="flex-1"
              >
                {isProcessing ? "Processing..." : "Remove Background"}
              </Button>
            )}
            <Button
              onClick={downloadImage}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download {processedImage ? "Processed" : "Original"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}