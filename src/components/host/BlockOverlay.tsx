
import { useBlocks } from "@/hooks/useBlocks";
import { format } from "date-fns";
import { Ban } from "lucide-react";

interface BlockOverlayProps {
  selectedDate: Date;
  venueHours: { start_time: string } | null;
  tableId: number;
}

export const BlockOverlay = ({ selectedDate, venueHours, tableId }: BlockOverlayProps) => {
  const { blocks } = useBlocks(format(selectedDate, 'yyyy-MM-dd'));

  if (!venueHours) return null;

  const calculateLeftPixels = (blockStartTime: string) => {
    const [startHour, startMin] = venueHours.start_time.split(':').map(Number);
    const [blockHour, blockMin] = blockStartTime.split(':').map(Number);
    
    const startTotalMin = startHour * 60 + startMin;
    const blockTotalMin = blockHour * 60 + blockMin;
    const diffMin = Math.max(0, blockTotalMin - startTotalMin);
    
    // Each 15-minute slot is 60px wide
    return (diffMin / 15) * 60;
  };

  const calculateWidthPixels = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    const durationMin = endTotalMin - startTotalMin;
    
    // Each 15-minute slot is 60px wide
    return (durationMin / 15) * 60;
  };

  const relevantBlocks = blocks.filter(block => 
    block.table_ids.length === 0 || block.table_ids.includes(tableId)
  );

  return (
    <>
      {relevantBlocks.map((block) => {
        const leftPixels = calculateLeftPixels(block.start_time);
        const widthPixels = calculateWidthPixels(block.start_time, block.end_time);

        return (
          <div
            key={block.id}
            className="absolute bg-red-500/30 border-2 border-red-500 rounded-sm flex items-center justify-center"
            style={{
              left: `${leftPixels}px`,
              width: `${widthPixels}px`,
              top: '0px',
              height: '44px',
              zIndex: 5
            }}
            title={`Blocked: ${block.reason || 'No reason specified'}`}
          >
            <Ban className="h-4 w-4 text-red-600" strokeWidth={3} />
          </div>
        );
      })}
    </>
  );
};
