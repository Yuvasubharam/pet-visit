import React, { useState, useRef } from 'react';
import { BulkImportResult, BulkImportError } from '../types';
import { adminProductService } from '../services/adminApi';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'result';

interface ParsedProduct {
  name: string;
  description?: string;
  category: string;
  base_price: number;
  stock_quantity: number;
  sku?: string;
}

const AdminBulkImport: React.FC<Props> = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [fileName, setFileName] = useState('');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<BulkImportError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const systemFields = [
    { key: 'name', label: 'Product Name', required: true },
    { key: 'description', label: 'Description', required: false },
    { key: 'category', label: 'Category', required: true },
    { key: 'base_price', label: 'Price', required: true },
    { key: 'stock_quantity', label: 'Stock Quantity', required: true },
    { key: 'sku', label: 'SKU', required: false },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('CSV file must have a header row and at least one data row');
      return;
    }

    // Parse headers
    const headerLine = lines[0];
    const parsedHeaders = parseCSVLine(headerLine);
    setHeaders(parsedHeaders);

    // Parse data rows
    const dataRows = lines.slice(1).map(line => parseCSVLine(line));
    setCsvData(dataRows);

    // Auto-map fields
    const mapping: Record<string, string> = {};
    parsedHeaders.forEach(header => {
      const lowerHeader = header.toLowerCase().trim();
      if (lowerHeader.includes('name') && !lowerHeader.includes('sku')) {
        mapping[header] = 'name';
      } else if (lowerHeader.includes('desc')) {
        mapping[header] = 'description';
      } else if (lowerHeader.includes('categ')) {
        mapping[header] = 'category';
      } else if (lowerHeader.includes('price')) {
        mapping[header] = 'base_price';
      } else if (lowerHeader.includes('stock') || lowerHeader.includes('quantity') || lowerHeader.includes('qty')) {
        mapping[header] = 'stock_quantity';
      } else if (lowerHeader.includes('sku')) {
        mapping[header] = 'sku';
      }
    });
    setFieldMapping(mapping);

    setStep('mapping');
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleMappingChange = (csvHeader: string, systemField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvHeader]: systemField,
    }));
  };

  const handleAutoMap = () => {
    const mapping: Record<string, string> = {};
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase().trim();
      if (lowerHeader.includes('name') && !lowerHeader.includes('sku')) {
        mapping[header] = 'name';
      } else if (lowerHeader.includes('desc')) {
        mapping[header] = 'description';
      } else if (lowerHeader.includes('categ')) {
        mapping[header] = 'category';
      } else if (lowerHeader.includes('price')) {
        mapping[header] = 'base_price';
      } else if (lowerHeader.includes('stock') || lowerHeader.includes('quantity') || lowerHeader.includes('qty')) {
        mapping[header] = 'stock_quantity';
      } else if (lowerHeader.includes('sku')) {
        mapping[header] = 'sku';
      }
    });
    setFieldMapping(mapping);
  };

  const validateAndPreview = () => {
    const requiredFields = systemFields.filter(f => f.required).map(f => f.key);
    const mappedFields = Object.values(fieldMapping);

    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f));
    if (missingRequired.length > 0) {
      alert(`Missing required field mappings: ${missingRequired.join(', ')}`);
      return;
    }

    // Create reverse mapping (system field -> csv header index)
    const reverseMapping: Record<string, number> = {};
    Object.entries(fieldMapping).forEach(([csvHeader, systemField]) => {
      if (systemField) {
        reverseMapping[systemField] = headers.indexOf(csvHeader);
      }
    });

    // Parse products
    const products: ParsedProduct[] = [];
    const newErrors: BulkImportError[] = [];

    csvData.forEach((row, index) => {
      const rowNum = index + 2; // +2 for header and 0-index

      const name = reverseMapping.name !== undefined ? row[reverseMapping.name] : '';
      const category = reverseMapping.category !== undefined ? row[reverseMapping.category] : '';
      const priceStr = reverseMapping.base_price !== undefined ? row[reverseMapping.base_price] : '';
      const stockStr = reverseMapping.stock_quantity !== undefined ? row[reverseMapping.stock_quantity] : '';

      // Validate
      if (!name) {
        newErrors.push({ row: rowNum, field: 'name', value: '', error: 'Product name is required' });
        return;
      }
      if (!category) {
        newErrors.push({ row: rowNum, field: 'category', value: '', error: 'Category is required' });
        return;
      }

      const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
      if (isNaN(price) || price <= 0) {
        newErrors.push({ row: rowNum, field: 'base_price', value: priceStr, error: 'Invalid price' });
        return;
      }

      const stock = parseInt(stockStr.replace(/[^0-9]/g, ''));
      if (isNaN(stock) || stock < 0) {
        newErrors.push({ row: rowNum, field: 'stock_quantity', value: stockStr, error: 'Invalid stock quantity' });
        return;
      }

      products.push({
        name,
        description: reverseMapping.description !== undefined ? row[reverseMapping.description] : undefined,
        category,
        base_price: price,
        stock_quantity: stock,
        sku: reverseMapping.sku !== undefined ? row[reverseMapping.sku] : undefined,
      });
    });

    setParsedProducts(products);
    setErrors(newErrors);
    setStep('preview');
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      setStep('importing');

      const result = await adminProductService.bulkImportProducts(parsedProducts);
      setImportResult(result);
      setStep('result');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = 'Product Name,Description,Category,Price,Stock Quantity,SKU\n"Sample Product","A great product description","Pet Food",29.99,100,"SKU-001"\n"Another Product","Another description","Toys",15.50,50,"SKU-002"';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderUploadStep = () => (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4">
      {/* Instructions */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full">
            <span className="material-symbols-outlined text-primary dark:text-sky-400 text-[20px]">info</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Import Instructions</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Upload your inventory using a CSV file. Ensure all required fields (Name, Category, Price, Stock) are filled correctly.
            </p>
          </div>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-primary dark:text-sky-400 font-bold text-sm border border-slate-200 dark:border-slate-600 border-dashed hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          Download CSV Template
        </button>
      </section>

      {/* File Upload Area */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">upload_file</span>
          Upload File
        </h3>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center cursor-pointer hover:border-primary dark:hover:border-sky-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <span className="material-symbols-outlined text-5xl text-slate-400 mb-3">cloud_upload</span>
          <p className="text-slate-900 dark:text-white font-semibold mb-1">
            {fileName || 'Click to upload or drag and drop'}
          </p>
          <p className="text-sm text-slate-500">CSV files only (max 10MB)</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </section>
    </div>
  );

  const renderMappingStep = () => (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-32">
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">swap_horiz</span>
            Field Mapping
          </h3>
          <button
            onClick={handleAutoMap}
            className="px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
          >
            Auto-Map
          </button>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Map your CSV columns to the system fields. Required fields are marked with *.
        </p>

        <div className="space-y-3">
          {headers.map((header) => (
            <div key={header} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{header}</p>
                <p className="text-xs text-slate-500 truncate">
                  Sample: {csvData[0]?.[headers.indexOf(header)] || '—'}
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
              <select
                value={fieldMapping[header] || ''}
                onChange={(e) => handleMappingChange(header, e.target.value)}
                className="w-32 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— Skip —</option>
                {systemFields.map((field) => (
                  <option key={field.key} value={field.key}>
                    {field.label} {field.required ? '*' : ''}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* Continue Button */}
      <button
        onClick={validateAndPreview}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-base py-4 px-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined">preview</span>
        Preview Import
      </button>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-32">
      {/* Summary */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">summarize</span>
          Import Summary
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valid Products</p>
            <p className="text-2xl font-bold text-green-600">{parsedProducts.length}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Errors</p>
            <p className="text-2xl font-bold text-red-600">{errors.length}</p>
          </div>
        </div>
      </section>

      {/* Errors */}
      {errors.length > 0 && (
        <section className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800 mb-4">
          <h3 className="font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            Validation Errors ({errors.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {errors.map((err, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-2 text-sm">
                <span className="font-semibold text-red-600">Row {err.row}:</span>{' '}
                <span className="text-slate-700 dark:text-slate-300">{err.error}</span>
                {err.value && (
                  <span className="text-slate-500"> (value: "{err.value}")</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Preview Table */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">table_rows</span>
            Products Preview
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-2 text-left text-slate-600 dark:text-slate-400 font-semibold">Name</th>
                <th className="px-4 py-2 text-left text-slate-600 dark:text-slate-400 font-semibold">Category</th>
                <th className="px-4 py-2 text-right text-slate-600 dark:text-slate-400 font-semibold">Price</th>
                <th className="px-4 py-2 text-right text-slate-600 dark:text-slate-400 font-semibold">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {parsedProducts.slice(0, 10).map((product, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-slate-900 dark:text-white truncate max-w-[150px]">{product.name}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{product.category}</td>
                  <td className="px-4 py-2 text-right text-slate-900 dark:text-white">₹{product.base_price.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-400">{product.stock_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {parsedProducts.length > 10 && (
            <p className="text-center text-sm text-slate-500 py-3">
              ...and {parsedProducts.length - 10} more products
            </p>
          )}
        </div>
      </section>

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={parsedProducts.length === 0}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-base py-4 px-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined">cloud_upload</span>
        Import {parsedProducts.length} Products
      </button>
    </div>
  );

  const renderImportingStep = () => (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Importing Products...</h3>
        <p className="text-sm text-slate-500">Please wait while we process your data</p>
      </div>
    </div>
  );

  const renderResultStep = () => (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-green-50/80 to-transparent dark:from-green-900/20 pointer-events-none"></div>
        <div className="relative z-10 p-6 pt-10 flex flex-col items-center text-center">
          <div className="mb-6 rounded-full bg-green-100 dark:bg-green-500/20 p-5 ring-8 ring-green-50 dark:ring-green-500/10 shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-green-600 dark:text-green-400">check_circle</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
            Import {importResult?.failed === 0 ? 'Successful!' : 'Complete'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto mb-8">
            {importResult?.failed === 0
              ? 'Your bulk product import has been processed successfully without any errors.'
              : `Import completed with ${importResult?.failed} errors.`}
          </p>
          <div className="w-full grid grid-cols-2 gap-3 mb-8">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Imported</span>
              <span className="text-2xl font-bold text-green-600">{importResult?.successful || 0}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Errors</span>
              <span className="text-2xl font-bold text-red-600">{importResult?.failed || 0}</span>
            </div>
          </div>
          <div className="w-full space-y-3">
            <button
              onClick={onSuccess}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-base py-3.5 px-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>View Products</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
            <button
              onClick={onBack}
              className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-bold text-sm py-3.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all"
            >
              Back to Management
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark max-w-md mx-auto shadow-xl overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="flex size-10 shrink-0 items-center justify-center rounded-full active:bg-slate-200 dark:active:bg-slate-800 cursor-pointer"
        >
          <span className="material-symbols-outlined text-slate-800 dark:text-slate-100 text-[24px]">arrow_back</span>
        </button>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
          Bulk Product Import
        </h2>
      </header>

      {/* Progress Steps */}
      {step !== 'result' && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            {['upload', 'mapping', 'preview'].map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step === s
                        ? 'bg-primary text-white'
                        : ['mapping', 'preview', 'importing'].indexOf(step) > i
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {['mapping', 'preview', 'importing', 'result'].indexOf(step) > i ? (
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="text-[10px] mt-1 text-slate-500 capitalize">{s}</span>
                </div>
                {i < 2 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      ['mapping', 'preview', 'importing', 'result'].indexOf(step) > i
                        ? 'bg-green-500'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {step === 'upload' && renderUploadStep()}
      {step === 'mapping' && renderMappingStep()}
      {step === 'preview' && renderPreviewStep()}
      {step === 'importing' && renderImportingStep()}
      {step === 'result' && renderResultStep()}

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default AdminBulkImport;
