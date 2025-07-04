
import { useBlocks } from "@/hooks/useBlocks";
import { format } from "date-fns";

interface BlockOverlayProps {
  selectedDate: Date;
  venueHours: { start_time: string } | null;
  tableId: number;
}

export const BlockOverlay = ({ selectedDate, venueHours, tableId }: BlockOverlayProps) => {
  const { blocks } = useBlocks(format(selectedDate, 'yyyy-MM-dd'));

  if (!venueHours) return null;

  const calculateLeftPercentage = (blockStartTime: string) => {
    const [startHour, startMin] = venueHours.start_time.split(':').map(Number);
    const [blockHour, blockMin] = blockStartTime.split(':').map(Number);
    
    const startTotalMin = startHour * 60 + startMin;
    const blockTotalMin = blockHour * 60 + blockMin;
    const diffMin = Math.max(0, blockTotalMin - startTotalMin);
    
    const totalMinutesInGrid = 12 * 60;
    return (diffMin / totalMinutesInGrid) * 100;
  };

  const calculateWidth = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    const durationMin = endTotalMin - startTotalMin;
    
    const totalMinutesInGrid = 12 * 60;
    return (durationMin / totalMinutesInGrid) * 100;
  };

  const relevantBlocks = blocks.filter(block => 
    block.table_ids.length === 0 || block.table_ids.includes(tableId)
  );

  return (
    <>
      {relevantBlocks.map((block) => {
        const leftPercentage = calculateLeftPercentage(block.start_time);
        const widthPercentage = calculateWidth(block.start_time, block.end_time);

        return (
          <div
            key={block.id}
            className="absolute bg-gray-400/50 border border-gray-500 rounded-sm"
            style={{
              left: `${leftPercentage}%`,
              width: `${widthPercentage}%`,
              top: '0px',
              height: '44px',
              zIndex: 5
            }}
            title={`Blocked: ${block.reason || 'No reason specified'}`}
          />
        );
      })}
    </>
  );
};
