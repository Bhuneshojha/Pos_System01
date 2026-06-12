import * as XLSX from 'xlsx';

// Export data to CSV
export const exportToCSV = (data, fileName = 'export.csv') => {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${fileName}-${new Date().toISOString().split('T')[0]}.csv`);
};

// Export data to Excel (.xlsx)
export const exportToExcel = (data, fileName = 'export', sheetName = 'Sheet1') => {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map(() => 15);
  worksheet['!cols'] = colWidths.map((w) => ({ wch: w }));
  
  XLSX.writeFile(workbook, `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Export multiple sheets to Excel
export const exportMultiSheetExcel = (sheetsData, fileName = 'report') => {
  const workbook = XLSX.utils.book_new();
  
  sheetsData.forEach(({ name, data }) => {
    if (Array.isArray(data) && data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(data);
      worksheet['!cols'] = Object.keys(data[0]).map(() => ({ wch: 15 }));
      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    }
  });
  
  XLSX.writeFile(workbook, `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Download file from API
export const downloadFile = (url, fileName) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Download JSON as file
export const downloadJSON = (data, fileName = 'data.json') => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  downloadFile(url, `${fileName}-${new Date().toISOString().split('T')[0]}.json`);
};
