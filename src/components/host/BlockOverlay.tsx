
import { useBlocks } from "@/hooks/useBlocks";
import { format } from "date-fns";
import { Ban } from "lucide-react";

interface BlockOverlayProps {
  selectedDate: Date;
  venueHours: { start_time: string; end_time: string } | null;
  tableId: number;
}

export const BlockOverlay = ({ selectedDate, venueHours, tableId }: BlockOverlayProps) => {
  const { blocks } = useBlocks(format(selectedDate, 'yyyy-MM-dd'));

  if (!venueHours) return null;

  const calculateLeftPixels = (blockStartTime: string) => {
    // Generate the same time slots as in OptimizedTimeGrid using venue hours
    const timeSlots: string[] = [];
    const [startHour, startMin] = venueHours.start_time.split(':').map(Number);
    const [endHour, endMin] = venueHours.end_time.split(':').map(Number);
    
    // Generate time slots in 15-minute intervals
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin <= endMin)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
      
      currentMin += 15;
      if (currentMin >= 60) {
        currentHour++;
        currentMin = 0;
      }
    }

    const startIndex = timeSlots.findIndex(slot => slot === blockStartTime);
    return startIndex * 60; // 60px per slot (matching OptimizedTimeGrid)
  };

  const calculateWidthPixels = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    const durationMin = endTotalMin - startTotalMin;
    
    // Each 15-minute slot is 60px wide (matching OptimizedTimeGrid)
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
