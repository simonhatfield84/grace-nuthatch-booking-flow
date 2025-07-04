
import { Table } from "@/hooks/useTables";

interface TableShapeProps {
  table: Table;
  isSelected?: boolean;
  isBooking?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const TableShape = ({ 
  table, 
  isSelected = false, 
  isBooking = false,
  size = 'md',
  onClick 
}: TableShapeProps) => {
  const getShapeType = () => {
    if (table.seats <= 2) return 'circle';
    if (table.seats <= 4) return 'square';
    return 'rectangle';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-8 h-8';
      case 'lg': return 'w-16 h-12';
      default: return 'w-12 h-10';
    }
  };

  const getStatusColor = () => {
    if (isSelected) return 'bg-primary border-primary text-primary-foreground';
    if (isBooking) return 'bg-amber-500 border-amber-600 text-white';
    if (!table.online_bookable) return 'bg-gray-400 border-gray-500 text-white';
    return 'bg-green-500 border-green-600 text-white hover:bg-green-600';
  };

  const shape = getShapeType();
  const sizeClasses = getSizeClasses();
  const colorClasses = getStatusColor();

  const baseClasses = `
    ${sizeClasses} 
    ${colorClasses}
    border-2 
    flex items-center justify-center 
    text-xs font-medium 
    transition-all duration-200 
    cursor-pointer
    shadow-sm hover:shadow-md
  `.trim();

  if (shape === 'circle') {
    return (
      <div 
        className={`${baseClasses} rounded-full`}
        onClick={onClick}
        title={`${table.label} - ${table.seats} seats`}
      >
        {table.label}
      </div>
    );
  }

  if (shape === 'square') {
    return (
      <div 
        className={`${baseClasses} rounded-md aspect-square`}
        onClick={onClick}
        title={`${table.label} - ${table.seats} seats`}
      >
        {table.label}
      </div>
    );
  }

  return (
    <div 
      className={`${baseClasses} rounded-md`}
      onClick={onClick}
      title={`${table.label} - ${table.seats} seats`}
    >
      {table.label}
    </div>
  );
};
