
import { useRef, useEffect, useState, useCallback } from "react";
import { Table } from "@/hooks/useTables";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FloorPlanCanvasProps {
  tables: Table[];
  onUpdateTablePosition: (tableId: number, x: number, y: number) => void;
  onTableSelect: (table: Table | null) => void;
  selectedTable: Table | null;
  sectionId?: number;
}

interface CanvasTable extends Table {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const FloorPlanCanvas = ({
  tables,
  onUpdateTablePosition,
  onTableSelect,
  selectedTable,
  sectionId
}: FloorPlanCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedTable, setDraggedTable] = useState<CanvasTable | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const GRID_SIZE = 20;
  const TABLE_MIN_SIZE = 40;

  // Convert tables to canvas tables with proper positioning
  const canvasTables: CanvasTable[] = tables
    .filter(table => !sectionId || table.section_id === sectionId)
    .map(table => ({
      ...table,
      x: table.position_x || 100,
      y: table.position_y || 100,
      width: Math.max(TABLE_MIN_SIZE, table.seats * 8),
      height: Math.max(TABLE_MIN_SIZE, table.seats * 6)
    }));

  const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  const getTableShape = (table: CanvasTable) => {
    // Different shapes based on seating capacity
    if (table.seats <= 2) return 'circle';
    if (table.seats <= 4) return 'square';
    return 'rectangle';
  };

  const getTableColor = (table: CanvasTable) => {
    if (selectedTable?.id === table.id) return '#3B82F6';
    if (!table.online_bookable) return '#6B7280';
    return '#10B981';
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.5;
    
    const startX = -panOffset.x % (GRID_SIZE * zoom);
    const startY = -panOffset.y % (GRID_SIZE * zoom);
    
    for (let x = startX; x < canvas.width; x += GRID_SIZE * zoom) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = startY; y < canvas.height; y += GRID_SIZE * zoom) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const drawTable = (ctx: CanvasRenderingContext2D, table: CanvasTable) => {
    const x = (table.x * zoom) + panOffset.x;
    const y = (table.y * zoom) + panOffset.y;
    const width = table.width * zoom;
    const height = table.height * zoom;
    
    ctx.fillStyle = getTableColor(table);
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 2;
    
    const shape = getTableShape(table);
    
    if (shape === 'circle') {
      const radius = Math.min(width, height) / 2;
      ctx.beginPath();
      ctx.arc(x + width/2, y + height/2, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    } else if (shape === 'square') {
      const size = Math.min(width, height);
      ctx.fillRect(x, y, size, size);
      ctx.strokeRect(x, y, size, size);
    } else {
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
    }
    
    // Draw table label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.max(12, 10 * zoom)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(table.label, x + width/2, y + height/2);
    
    // Draw seat count
    ctx.fillStyle = '#1F2937';
    ctx.font = `${Math.max(10, 8 * zoom)}px sans-serif`;
    ctx.fillText(`${table.seats} seats`, x + width/2, y + height + 15);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx, canvas);
    
    // Draw tables
    canvasTables.forEach(table => drawTable(ctx, table));
  }, [canvasTables, zoom, panOffset, selectedTable]);

  const getTableAtPosition = (x: number, y: number): CanvasTable | null => {
    const adjustedX = (x - panOffset.x) / zoom;
    const adjustedY = (y - panOffset.y) / zoom;
    
    for (const table of canvasTables) {
      if (adjustedX >= table.x && adjustedX <= table.x + table.width &&
          adjustedY >= table.y && adjustedY <= table.y + table.height) {
        return table;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const table = getTableAtPosition(x, y);
    
    if (table && !e.shiftKey) {
      setDraggedTable(table);
      setIsDragging(true);
      setDragStart({ x: x - (table.x * zoom + panOffset.x), y: y - (table.y * zoom + panOffset.y) });
      onTableSelect(table);
    } else {
      setIsPanning(true);
      setDragStart({ x, y });
      onTableSelect(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isDragging && draggedTable) {
      const newX = snapToGrid((x - dragStart.x - panOffset.x) / zoom);
      const newY = snapToGrid((y - dragStart.y - panOffset.y) / zoom);
      
      // Update table position locally for smooth dragging
      const updatedTables = canvasTables.map(t => 
        t.id === draggedTable.id ? { ...t, x: Math.max(0, newX), y: Math.max(0, newY) } : t
      );
      
      // Force re-render
      draw();
    } else if (isPanning) {
      setPanOffset({
        x: panOffset.x + (x - dragStart.x),
        y: panOffset.y + (y - dragStart.y)
      });
      setDragStart({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && draggedTable) {
      // Save the final position
      onUpdateTablePosition(draggedTable.id, draggedTable.x, draggedTable.y);
      toast({ title: "Table position updated", description: `${draggedTable.label} moved successfully.` });
    }
    
    setIsDragging(false);
    setDraggedTable(null);
    setIsPanning(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b bg-background">
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleResetView}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <div className="text-sm text-muted-foreground ml-2">
          Zoom: {Math.round(zoom * 100)}%
        </div>
        <div className="text-xs text-muted-foreground ml-auto">
          Drag tables to move • Shift+click to pan • Scroll to zoom
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gray-50">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};
