import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, GripVertical, Smartphone, Tablet, Monitor } from "lucide-react";

interface ImagePreviewWithSafeAreasProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  onDelete?: () => void;
  isDeleting?: boolean;
}

type DeviceType = 'mobile' | 'tablet' | 'desktop';

const DEVICE_ASPECTS = {
  mobile: { ratio: 9/16, label: 'Mobile', icon: Smartphone },
  tablet: { ratio: 4/3, label: 'Tablet', icon: Tablet },
  desktop: { ratio: 16/9, label: 'Desktop', icon: Monitor }
};

interface CropZone {
  type: 'horizontal' | 'vertical';
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
}

function calculateCropZone(
  imageWidth: number,
  imageHeight: number,
  targetAspect: number
): CropZone {
  const imageAspect = imageWidth / imageHeight;
  
  if (Math.abs(imageAspect - targetAspect) < 0.01) {
    return {
      type: 'horizontal',
      cropTop: 0,
      cropBottom: 0,
      cropLeft: 0,
      cropRight: 0
    };
  }
  
  if (imageAspect > targetAspect) {
    const visibleWidth = imageHeight * targetAspect;
    const cropX = (imageWidth - visibleWidth) / 2;
    return {
      type: 'horizontal',
      cropTop: 0,
      cropBottom: 0,
      cropLeft: cropX,
      cropRight: cropX
    };
  } else {
    const visibleHeight = imageWidth / targetAspect;
    const cropY = (imageHeight - visibleHeight) / 2;
    return {
      type: 'vertical',
      cropTop: cropY,
      cropBottom: cropY,
      cropLeft: 0,
      cropRight: 0
    };
  }
}

export function ImagePreviewWithSafeAreas({
  imageUrl,
  imageWidth,
  imageHeight,
  onDelete,
  isDeleting
}: ImagePreviewWithSafeAreasProps) {
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('desktop');

  const cropZone = calculateCropZone(
    imageWidth,
    imageHeight,
    DEVICE_ASPECTS[selectedDevice].ratio
  );

  const hasCropping = cropZone.cropTop > 0 || cropZone.cropLeft > 0;

  return (
    <Card className="relative overflow-hidden">
      {/* Device Selector */}
      <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
        <div className="flex gap-1">
          {(Object.keys(DEVICE_ASPECTS) as DeviceType[]).map((device) => {
            const { label, icon: Icon } = DEVICE_ASPECTS[device];
            return (
              <Button
                key={device}
                variant={selectedDevice === device ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDevice(device)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            );
          })}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="cursor-move">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Image Preview with Overlays */}
      <div className="relative bg-muted">
        <div 
          className="relative w-full mx-auto"
          style={{ 
            maxWidth: '800px',
            aspectRatio: `${DEVICE_ASPECTS[selectedDevice].ratio}`
          }}
        >
          {/* Background Image */}
          <img
            src={imageUrl}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Crop Overlays */}
          {hasCropping && (
            <>
              {cropZone.type === 'vertical' && (
                <>
                  {/* Top crop */}
                  <div 
                    className="absolute top-0 left-0 right-0 bg-black/60"
                    style={{ height: `${(cropZone.cropTop / imageHeight) * 100}%` }}
                  />
                  {/* Bottom crop */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-black/60"
                    style={{ height: `${(cropZone.cropBottom / imageHeight) * 100}%` }}
                  />
                </>
              )}
              
              {cropZone.type === 'horizontal' && cropZone.cropLeft > 0 && (
                <>
                  {/* Left crop */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-black/60"
                    style={{ width: `${(cropZone.cropLeft / imageWidth) * 100}%` }}
                  />
                  {/* Right crop */}
                  <div 
                    className="absolute top-0 bottom-0 right-0 bg-black/60"
                    style={{ width: `${(cropZone.cropRight / imageWidth) * 100}%` }}
                  />
                </>
              )}

              {/* Safe Area Border */}
              <div 
                className="absolute border-2 border-blue-400 border-dashed pointer-events-none z-10"
                style={{
                  top: `${(cropZone.cropTop / imageHeight) * 100}%`,
                  left: `${(cropZone.cropLeft / imageWidth) * 100}%`,
                  right: `${(cropZone.cropRight / imageWidth) * 100}%`,
                  bottom: `${(cropZone.cropBottom / imageHeight) * 100}%`
                }}
              >
                <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded shadow-lg">
                  Safe Area
                </span>
              </div>
            </>
          )}

          {!hasCropping && (
            <div className="absolute inset-2 border-2 border-green-400 border-dashed pointer-events-none z-10">
              <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded shadow-lg">
                Full Image Visible
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="p-3 bg-muted/30 border-t">
        {hasCropping ? (
          <div className="flex flex-col sm:flex-row gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-blue-400 border-dashed rounded-sm" />
              <span className="text-muted-foreground">
                Content inside blue box is visible on <strong>{DEVICE_ASPECTS[selectedDevice].label}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-black/60 rounded-sm" />
              <span className="text-muted-foreground">
                Gray areas may be cropped on smaller screens
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 border-2 border-green-400 border-dashed rounded-sm" />
            <span className="text-muted-foreground">
              Full image visible on <strong>{DEVICE_ASPECTS[selectedDevice].label}</strong> - perfect aspect ratio!
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
