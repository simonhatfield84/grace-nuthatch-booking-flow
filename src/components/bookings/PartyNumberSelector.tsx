// 🚨 DEPRECATED: This component is not used by the canonical NuthatchBookingWidget
// NuthatchBookingWidget uses its own PartyDateStep component
// This file will be removed in a future cleanup

console.warn('⚠️ DEPRECATED: PartyNumberSelector is not used by NuthatchBookingWidget.');

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Users } from "lucide-react";

interface PartyNumberSelectorProps {
  selectedSize: number;
  onSizeSelect: (size: number) => void;
  minSize?: number;
  maxSize?: number;
}

export const PartyNumberSelector = ({ 
  selectedSize, 
  onSizeSelect, 
  minSize = 1, 
  maxSize = 20 
}: PartyNumberSelectorProps) => {
  const [inputValue, setInputValue] = useState(selectedSize.toString());

  const handleIncrement = () => {
    const newSize = Math.min(selectedSize + 1, maxSize);
    onSizeSelect(newSize);
    setInputValue(newSize.toString());
  };

  const handleDecrement = () => {
    const newSize = Math.max(selectedSize - 1, minSize);
    onSizeSelect(newSize);
    setInputValue(newSize.toString());
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= minSize && numValue <= maxSize) {
      onSizeSelect(numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue);
    if (isNaN(numValue) || numValue < minSize || numValue > maxSize) {
      setInputValue(selectedSize.toString());
    }
  };

  const commonSizes = [2, 4, 6, 8];

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Users className="h-5 w-5" />
          Party Size
        </CardTitle>
        <CardDescription>
          How many people will be dining?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick selection buttons */}
        <div className="grid grid-cols-4 gap-2">
          {commonSizes.map((size) => (
            <Button
              key={size}
              variant={selectedSize === size ? "default" : "outline"}
              onClick={() => {
                onSizeSelect(size);
                setInputValue(size.toString());
              }}
              className="h-12"
            >
              {size}
            </Button>
          ))}
        </div>

        {/* Custom input with +/- controls */}
        <div className="flex items-center justify-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDecrement}
            disabled={selectedSize <= minSize}
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min={minSize}
              max={maxSize}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              className="w-16 text-center"
            />
            <span className="text-sm text-muted-foreground">guests</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleIncrement}
            disabled={selectedSize >= maxSize}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          onClick={() => onSizeSelect(selectedSize)} 
          className="w-full"
          disabled={selectedSize < minSize || selectedSize > maxSize}
        >
          Continue with {selectedSize} {selectedSize === 1 ? 'guest' : 'guests'}
        </Button>
      </CardContent>
    </Card>
  );
};
