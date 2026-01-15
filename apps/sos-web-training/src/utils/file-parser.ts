import { read, utils } from 'xlsx';

export interface ParsedFileData {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Parse Excel file (xlsx, xls) and extract headers and rows
 */
export const parseExcel = (file: File): Promise<ParsedFileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('File is empty'));
          return;
        }
        const workbook = read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('Excel file has no sheets'));
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false,
        }) as string[][];
        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }
        const headers = (jsonData[0] as string[])
          .map((h) =>
            String(h ?? '')
              .toLowerCase()
              .trim(),
          )
          .filter(Boolean);
        if (headers.length === 0) {
          reject(new Error('Excel file has no headers'));
          return;
        }
        const rows: Record<string, string>[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const rowData = jsonData[i] as string[];
          const row: Record<string, string> = {};
          headers.forEach((header, idx) => {
            row[header] = String(rowData[idx] ?? '').trim();
          });
          if (Object.values(row).some((val) => String(val).trim().length > 0)) {
            rows.push(row);
          }
        }
        resolve({ headers, rows });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to parse Excel file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read Excel file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse CSV line handling quoted values
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let val = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        val += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(val.trim());
      val = '';
    } else {
      val += char;
    }
  }
  result.push(val.trim());
  return result;
};

/**
 * Parse CSV file and extract headers and rows
 */
export const parseCSV = (text: string): ParsedFileData => {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });
    if (Object.values(row).some((x) => String(x).trim().length > 0)) {
      rows.push(row);
    }
  }
  return { headers, rows };
};

/**
 * Process file (CSV or Excel) and return parsed data
 */
export const processFileData = async (file: File): Promise<ParsedFileData> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls';

  if (isExcel) {
    return parseExcel(file);
  } else {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text) {
            reject(new Error('File is empty or invalid.'));
            return;
          }
          const result = parseCSV(text);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  }
};
