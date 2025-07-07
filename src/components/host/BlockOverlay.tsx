
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
    // Generate the same time slots as in NewTimeGrid
    const timeSlots: string[] = [];
    const startHour = 12;
    const endHour = 23;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        timeSlots.push(timeString);
      }
    }

    const startIndex = timeSlots.findIndex(slot => slot === blockStartTime);
    return startIndex * 40; // 40px per slot
  };

  const calculateWidthPixels = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    const durationMin = endTotalMin - startTotalMin;
    
    // Each 15-minute slot is 40px wide
    return (durationMin / 15) * 40;
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
            className="absolute bg-red-400/30 border border-red-400 rounded flex items-center justify-center z-15"
            style={{
              left: `${leftPixels}px`,
              width: `${widthPixels}px`,
              top: '2px',
              height: '44px'
            }}
            title={`Blocked: ${block.reason || 'No reason specified'}`}
          >
            <Ban className="h-3 w-3 text-red-600" strokeWidth={2} />
          </div>
        );
      })}
    </>
  );
};
