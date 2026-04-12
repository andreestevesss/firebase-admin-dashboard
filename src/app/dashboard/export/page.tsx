'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DataService, Branch } from '@/lib/data-service';
import { Download, Calendar, Filter, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  // Filters
  const [fileType, setFileType] = useState<'daily-cleans' | 'sales-prep'>('daily-cleans');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [dateType, setDateType] = useState<'single' | 'range'>('range');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const result = await DataService.getBranches();
      setBranches(result);
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Fetch all data for the range
      const data = await DataService.getExportData(fileType, selectedBranch, start, end);
      
      if (data.length === 0) {
        alert('No data found for the selected filters.');
        setExporting(false);
        return;
      }

      // Group data by date for multi-tab export
      const dataByDate: Record<string, any[]> = {};
      
      data.forEach(item => {
        const dateStr = item.timestamp.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-');
        
        if (!dataByDate[dateStr]) {
          dataByDate[dateStr] = [];
        }
        
        // Convert string values to numbers where appropriate to ensure consistent Excel alignment (numbers=right, strings=left)
        const yearValue = item.year && !isNaN(Number(item.year)) ? Number(item.year) : item.year;
        const stockValue = item.stock && !isNaN(Number(item.stock)) ? Number(item.stock) : item.stock;

        dataByDate[dateStr].push({
          'Stock': stockValue,
          'VIN': item.vin,
          'Year': yearValue,
          'Make': item.make,
          'Model': item.model,
          'Insurance': item.insurance,
          'User': item.userFullName,
          'Time': item.timestamp.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
          }),
          'Image URL': item.picture !== 'N/A' ? item.picture : ''
        });
      });

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Individual tabs for each date, sorted ascending
      const sortedDates = Object.keys(dataByDate).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
      });

      sortedDates.forEach(dateStr => {
        const ws = XLSX.utils.json_to_sheet(dataByDate[dateStr]);
        
        // Add "Open Image" labels with links
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        for (let r = range.s.r + 1; r <= range.e.r; r++) {
          const cellAddress = XLSX.utils.encode_cell({ r, c: 8 }); // Column I (Image URL)
          const cell = ws[cellAddress];
          if (cell && cell.v) {
            cell.l = { Target: cell.v, Tooltip: 'Open Image' };
            cell.v = 'Open Image';
          }
        }

        XLSX.utils.book_append_sheet(wb, ws, dateStr);
      });

      // Generate filename
      const branchName = selectedBranch === 'all' ? 'All_Branches' : selectedBranch.replace(/\s+/g, '_');
      const filename = `${fileType === 'daily-cleans' ? 'DailyCleans' : 'SalesPrep'}_${branchName}_${startDate}_to_${endDate}.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);

    } catch (error) {
      console.error('Export failed:', error);
      alert('An error occurred during export.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Download className="w-8 h-8 text-green-500" />
              Export Records
            </h1>
            <p className="text-gray-500 dark:text-[#a1a1a1] mt-1">
              Generate detailed Excel reports for cleans and sales activities.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Config Card */}
          <Card className="md:col-span-2 border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#0a0a0a] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-500" />
                Export Configuration
              </CardTitle>
              <CardDescription>Select filters for your export file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fileType">File Type</Label>
                  <Select value={fileType} onValueChange={(val: any) => setFileType(val)}>
                    <SelectTrigger id="fileType" className="dark:bg-[#111111] dark:border-[#262626]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily-cleans">Daily Cleans</SelectItem>
                      <SelectItem value="sales-prep">Sales Prep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger id="branch" className="dark:bg-[#111111] dark:border-[#262626]">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.filter(b => b.status !== 'inactive').map((b) => (
                        <SelectItem key={b.id} value={b.name}>
                          {b.name} - {b.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    Date Range
                  </Label>
                  <div className="flex gap-2">
                    <Button 
                      variant={dateType === 'single' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setDateType('single')}
                      className="h-7 text-xs"
                    >
                      Single Day
                    </Button>
                    <Button 
                      variant={dateType === 'range' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setDateType('range')}
                      className="h-7 text-xs"
                    >
                      Range
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">{dateType === 'single' ? 'Date' : 'Start Date'}</Label>
                    <Input 
                      type="date" 
                      id="startDate" 
                      value={startDate} 
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (dateType === 'single') setEndDate(e.target.value);
                      }}
                      className="dark:bg-[#111111] dark:border-[#262626]"
                    />
                  </div>
                  {dateType === 'range' && (
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input 
                        type="date" 
                        id="endDate" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="dark:bg-[#111111] dark:border-[#262626]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Card */}
          <Card className="border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#0a0a0a] shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-green-600">
                <FileSpreadsheet className="w-5 h-5" />
                Ready to Export
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="bg-gray-50 dark:bg-[#111111] p-4 rounded-lg border border-gray-100 dark:border-[#262626] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium dark:text-gray-300 capitalize">{fileType.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Branch:</span>
                  <span className="font-medium dark:text-gray-300">{selectedBranch === 'all' ? 'All' : selectedBranch}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Dates:</span>
                  <span className="font-medium dark:text-gray-300">
                    {dateType === 'single' ? startDate : `${startDate} to ${endDate}`}
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={handleExport} 
                disabled={exporting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 h-auto transition-all transform active:scale-95"
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Download .xlsx
                  </>
                )}
              </Button>
              
              <p className="text-[10px] text-center text-gray-400">
                The file will contain separate tabs for each date in the range. 
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg h-fit">
            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-300">Export Tips</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Select a date range to generate a workbook with multiple daily sheets. 
              The "Image URL" column in the Excel file will be converted to clickable links labeled "Open Image".
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
