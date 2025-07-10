
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, TrendingUp, Package, Weight } from "lucide-react";

interface OptimizationResultsProps {
  maxItems: number;
  spaceUtilization: number;
  weightUtilization: number;
  recommendations: string[];
}

const OptimizationResults = ({ 
  maxItems, 
  spaceUtilization, 
  weightUtilization, 
  recommendations 
}: OptimizationResultsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} />
            Loading Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-blue-600" />
              <span className="font-medium">Items Loaded</span>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {maxItems}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Space Utilization</span>
              <span className="text-sm text-gray-600">{spaceUtilization.toFixed(1)}%</span>
            </div>
            <Progress value={spaceUtilization} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Weight Utilization</span>
              <span className="text-sm text-gray-600">{weightUtilization.toFixed(1)}%</span>
            </div>
            <Progress value={weightUtilization} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {Math.max(spaceUtilization, weightUtilization) > 85 ? '✓' : '○'}
              </div>
              <div className="text-xs text-green-600 font-medium">
                {Math.max(spaceUtilization, weightUtilization) > 85 ? 'Optimized' : 'Can Improve'}
              </div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {((spaceUtilization + weightUtilization) / 2).toFixed(0)}%
              </div>
              <div className="text-xs text-blue-600 font-medium">Overall Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb size={20} />
            AI Optimization Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-amber-800">{recommendation}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <h4 className="font-semibold text-gray-900 mb-2">💡 Pro Tip</h4>
            <p className="text-sm text-gray-700">
              For maximum efficiency, consider the weight distribution and center of gravity 
              when implementing these suggestions. Always prioritize safety over space optimization.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizationResults;
