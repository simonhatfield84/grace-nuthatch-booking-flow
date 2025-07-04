
import { useMemo } from "react";
import { CSVRow, ColumnMapping } from "@/types/guest";
import { validateCsvData } from "@/utils/csvValidation";

export const useCSVValidation = (csvData: CSVRow[], columnMapping: ColumnMapping) => {
  const validationResult = useMemo(() => {
    if (csvData.length === 0) {
      return { errors: [], guests: [] };
    }
    
    return validateCsvData(csvData, columnMapping);
  }, [csvData, columnMapping]);

  return validationResult;
};
