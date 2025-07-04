
import { useState, useCallback } from "react";
import { CSVRow, ColumnMapping } from "@/types/guest";
import { parseCsvWithMultipleDelimiters, autoMapColumns } from "@/utils/csvHelpers";

export const useCSVParser = () => {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: 'none',
    email: 'none',
    phone: 'none',
    opt_in_marketing: 'none',
    notes: 'none',
    import_visit_count: 'none',
    import_last_visit_date: 'none'
  });
  const [errors, setErrors] = useState<string[]>([]);

  const parseFile = useCallback(async (file: File) => {
    try {
      const result = await parseCsvWithMultipleDelimiters(file);
      
      if (result) {
        setCsvData(result.data);
        setCsvHeaders(result.headers);
        setErrors([]);
        
        // Auto-map columns
        const autoMapping = autoMapColumns(result.headers);
        setColumnMapping(autoMapping);
      } else {
        setErrors(['Unable to parse CSV file. Please ensure it is properly formatted with headers.']);
      }
    } catch (error) {
      setErrors(['Failed to read CSV file. Please try again.']);
    }
  }, []);

  const resetParser = useCallback(() => {
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMapping({
      name: 'none',
      email: 'none',
      phone: 'none',
      opt_in_marketing: 'none',
      notes: 'none',
      import_visit_count: 'none',
      import_last_visit_date: 'none'
    });
    setErrors([]);
  }, []);

  return {
    csvData,
    csvHeaders,
    columnMapping,
    setColumnMapping,
    errors,
    parseFile,
    resetParser
  };
};
