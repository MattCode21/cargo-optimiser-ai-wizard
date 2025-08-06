import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

interface AIOptimizationChatProps {
  category: string;
  productDescription: string;
  results: any;
  unitDims: any;
  masterDims: any;
  onClose: () => void;
}

export const AIOptimizationChat = ({ 
  category, 
  productDescription, 
  results, 
  unitDims, 
  masterDims, 
  onClose 
}: AIOptimizationChatProps) => {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    {
      role: 'assistant',
      content: `Based on your ${category} optimization results, here are my suggestions:\n\n` +
        `✓ Current Configuration: ${results.maxUnits} units packed\n` +
        `✓ Space Utilization: ${results.spaceUtilization?.toFixed(1)}%\n` +
        `✓ Weight Utilization: ${results.weightUtilization?.toFixed(1)}%\n\n` +
        `To improve packing efficiency:\n` +
        `• Consider adjusting outer dimensions by 5-10%\n` +
        `• Optimize product arrangement with better stacking\n` +
        `• Use appropriate protective materials for ${productDescription || category}\n\n` +
        `What specific aspect would you like to optimize further?`
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = currentMessage;
    setCurrentMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = `Thank you for your question about "${userMessage}". Based on the current optimization data, I recommend consulting with packaging engineers for detailed adjustments. The current configuration shows good utilization rates.`;
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    }, 1000);

    toast.success('Message sent');
  };

  return (
    <Card className="fixed inset-4 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          AI Optimization Assistant
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="h-[calc(100vh-200px)] flex flex-col">
        <div className="flex-1 overflow-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-12'
                  : 'bg-muted mr-12'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <Textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Ask about optimization strategies..."
            rows={2}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
          />
          <Button onClick={sendMessage} disabled={!currentMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};