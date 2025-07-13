
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from 'lucide-react';

interface PartyNumberSelectorProps {
  selectedPartySize: number;
  onPartySizeSelect: (size: number) => void;
}

export const PartyNumberSelector = ({ selectedPartySize, onPartySizeSelect }: PartyNumberSelectorProps) => {
  const partySizes = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-900">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b">
        <CardTitle className="text-2xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Users className="h-6 w-6" />
          How many people?
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Select the number of people for your reservation
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-white dark:bg-gray-900">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {partySizes.map((size) => (
            <Button
              key={size}
              variant={selectedPartySize === size ? "default" : "outline"}
              className={`h-16 text-lg font-medium transition-all duration-200 ${
                selectedPartySize === size
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => onPartySizeSelect(size)}
            >
              <div className="flex flex-col items-center">
                <span className="font-bold">{size}</span>
                <span className="text-xs opacity-75">
                  {size === 1 ? 'person' : 'people'}
                </span>
              </div>
            </Button>
          ))}
        </div>
        
        {selectedPartySize >= 8 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              <strong>Large Party:</strong> For groups of 8 or more, we recommend calling ahead to ensure we can accommodate your reservation perfectly.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
