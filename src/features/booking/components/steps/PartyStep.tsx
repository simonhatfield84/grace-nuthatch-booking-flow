
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Users } from "lucide-react";

interface PartyStepProps {
  initialSize: number;
  onContinue: (partySize: number) => void;
  minSize?: number;
  maxSize?: number;
}

export function PartyStep({ 
  initialSize, 
  onContinue, 
  minSize = 1, 
  maxSize = 20 
}: PartyStepProps) {
  const [partySize, setPartySize] = useState(initialSize);
  const [inputValue, setInputValue] = useState(initialSize.toString());

  const handleIncrement = () => {
    const newSize = Math.min(partySize + 1, maxSize);
    setPartySize(newSize);
    setInputValue(newSize.toString());
  };

  const handleDecrement = () => {
    const newSize = Math.max(partySize - 1, minSize);
    setPartySize(newSize);
    setInputValue(newSize.toString());
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= minSize && numValue <= maxSize) {
      setPartySize(numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseInt(inputValue);
    if (isNaN(numValue) || numValue < minSize || numValue > maxSize) {
      setInputValue(partySize.toString());
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
              variant={partySize === size ? "default" : "outline"}
              onClick={() => {
                setPartySize(size);
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
            disabled={partySize <= minSize}
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
            disabled={partySize >= maxSize}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          onClick={() => onContinue(partySize)} 
          className="w-full"
          disabled={partySize < minSize || partySize > maxSize}
        >
          Continue with {partySize} {partySize === 1 ? 'guest' : 'guests'}
        </Button>
      </CardContent>
    </Card>
  );
}
