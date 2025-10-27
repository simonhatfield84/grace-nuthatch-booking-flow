import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

interface ContrastCheckerProps {
  foreground: string;
  background: string;
  label?: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const sVal = val / 255;
    return sVal <= 0.03928 ? sVal / 12.92 : Math.pow((sVal + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(fg: string, bg: string): number {
  const lum1 = getLuminance(fg);
  const lum2 = getLuminance(bg);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function ContrastChecker({ foreground, background, label = "Text on background" }: ContrastCheckerProps) {
  const ratio = getContrastRatio(foreground, background);
  const passesAA = ratio >= 4.5;
  const passesAAA = ratio >= 7;

  return (
    <Alert variant={passesAA ? "default" : "destructive"} className="mt-2">
      {passesAA ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <AlertDescription>
        {label}: Contrast ratio {ratio.toFixed(2)}:1
        {passesAAA && " (AAA ✓)"}
        {passesAA && !passesAAA && " (AA ✓)"}
        {!passesAA && " - Below WCAG AA standard (needs 4.5:1)"}
      </AlertDescription>
    </Alert>
  );
}
