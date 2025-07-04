
import React from "react";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface CSVProgressProps {
  isProcessing: boolean;
  progress: number;
}

export const CSVProgress = ({ isProcessing, progress }: CSVProgressProps) => {
  if (!isProcessing) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label>Processing import...</Label>
      <Progress value={progress} className="w-full" />
    </div>
  );
};
