import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, AlertTriangle, Lightbulb } from 'lucide-react'
import { getPackagingRecommendations, PackagingRecommendation } from '@/utils/packagingRecommendations'

interface ProductDescriptionInputProps {
  value: string
  onChange: (value: string) => void
}

export function ProductDescriptionInput({ value, onChange }: ProductDescriptionInputProps) {
  const [recommendations, setRecommendations] = useState<PackagingRecommendation | null>(null)

  const handleDescriptionChange = (newValue: string) => {
    onChange(newValue)
    if (newValue.trim()) {
      setRecommendations(getPackagingRecommendations(newValue))
    } else {
      setRecommendations(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="product-description">Product Description</Label>
        <Textarea
          id="product-description"
          placeholder="e.g., Door handle, Ceramic tiles, Electronic device..."
          value={value}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          className="mt-1"
          rows={3}
        />
      </div>

      {recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Smart Packaging Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Package className="h-4 w-4" />
                Recommended Materials
              </h4>
              <div className="flex flex-wrap gap-2">
                {recommendations.materials.map((material, index) => (
                  <Badge key={index} variant="secondary">
                    {material}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4" />
                Packing Instructions
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {recommendations.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                Special Considerations
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {recommendations.considerations.map((consideration, index) => (
                  <li key={index}>{consideration}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}