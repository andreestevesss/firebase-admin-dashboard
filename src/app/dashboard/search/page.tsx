'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Car,
  Edit,
  Eye,
  Database,
  Filter,
  FileSpreadsheet,
  LayoutDashboard,
  AlertCircle,
  Search as SearchIcon
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataService, CheckIn, SalesPrep, Branch } from '@/lib/data-service';
import { EditCleanModal } from '@/components/edit-clean-modal';
import { motion, AnimatePresence } from "framer-motion";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchIn, setSearchIn] = useState<'daily-clean' | 'sales-prep' | 'both'>('both');
  const [searchBy, setSearchBy] = useState<'stock' | 'vin'>('stock');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ cleans: CheckIn[]; sales: SalesPrep[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CheckIn | null>(null);
  const [selectedType, setSelectedType] = useState<'daily-clean' | 'sales-prep'>('daily-clean');
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const result = await DataService.getBranches();
      setBranches(result);
    } catch (err) {
      console.error('Error loading branches:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await DataService.searchRecords({
        searchIn,
        searchBy,
        term: searchTerm.trim()
      });
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: any, type: 'daily-clean' | 'sales-prep') => {
    setSelectedRecord(record);
    setSelectedType(type);
    setEditModalOpen(true);
  };

  const handleSave = async (updatedRecord: CheckIn) => {
    // Record was updated in Firebase via the modal's internal logic
    // We just need to refresh the search to show the changes
    await handleSearch();
  };

  const getBranchNames = () => {
    return branches.map(b => b.location || b.name);
  };

  const renderTable = (data: (CheckIn | SalesPrep)[], title: string, type: 'daily-clean' | 'sales-prep') => {
    if (data.length === 0) return null;

    return (
      <div className="space-y-3 pt-2">
        <div className="flex items-center space-x-2 px-1">
          <Database className="w-4 h-4 text-blue-500" />
          <h2 className="text-[11px] font-bold text-gray-700 dark:text-[#a1a1a1] uppercase tracking-widest">{title}</h2>
          <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
            {data.length} {data.length === 1 ? 'RECORD' : 'RECORDS'}
          </span>
        </div>

        <Card className="border border-gray-200 dark:border-[#262626] overflow-hidden shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full min-w-[1000px]">
                <TableHeader>
                  <TableRow className="bg-gray-50/80 dark:bg-[#1a1a1a] hover:bg-transparent border-b dark:border-[#262626]">
                    <TableHead className="w-[12%] text-[10px] font-bold text-gray-500 dark:text-[#737373] uppercase px-3 h-9">Branch</TableHead>
                    <TableHead className="w-[5%] text-[10px] font-bold text-gray-500 dark:text-[#737373] uppercase px-2 h-9">Pic</TableHead>
                    <TableHead className="w-[18%] text-[10px] font-bold text-gray-500 dark:text-[#737373] uppercase px-2 h-9">Vehicle</TableHead>
                    <TableHead className="w-[8%] text-[10px] font-bold text-gray-500 dark:text-[#737373] uppercase px-2 h-9">Year</TableHead>
                    <TableHead className="w-[12%] text-[10px] font-bold text-gray-500 dark:text-[#737373] uppercase px-2 h-9">Stock #</TableHead>
                    <TableHead className="w-[12%] text-[10px] font-bold text-gray-500 dark:text-[#737373] uppercase px-2 h-9">VIN</TableHead>
                    <TableHead className="w-[18%] text-[10px] font-bold text-gray-500 dark:text-[#737373] uppercase px-2 h-9">User</TableHead>
                    <TableHead className="w-[10%] text-[10px] font-bold text-gray-500 dark:text-[#737373] uppercase px-2 h-9">Date</TableHead>
                    <TableHead className="w-[5%] text-[10px] font-bold text-gray-500 dark:text-[#737373] uppercase px-3 h-9 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-b border-gray-100 dark:border-[#262626] hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a] transition-colors"
                    >
                      <TableCell className="py-2 px-3 focus-within:bg-gray-50 dark:focus-within:bg-[#1a1a1a]">
                        <span className="text-xs text-gray-500 dark:text-[#a1a1a1]">{item.branch}</span>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <div
                          className="w-7 h-7 bg-gray-100 dark:bg-[#262626] rounded flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-[#404040] transition-all duration-300 overflow-hidden"
                          onClick={() => item.picture && item.picture !== 'N/A' && window.open(item.picture, '_blank')}
                        >
                          <Car className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-2 overflow-hidden">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase leading-tight truncate">{item.make}</span>
                          <span className="text-[10px] text-gray-500 dark:text-[#a1a1a1] truncate">{item.model}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <span className="text-xs text-gray-600 dark:text-[#a1a1a1]">{item.year || 'N/A'}</span>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded leading-none truncate">
                          {item.stock}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-2 overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-[10px] font-mono text-gray-500 dark:text-[#737373] tracking-tight">{item.vin}</span>
                      </TableCell>
                      <TableCell className="py-2 px-2 overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-xs text-gray-600 dark:text-[#a1a1a1]">{item.userFullName}</span>
                      </TableCell>
                      <TableCell className="py-2 px-2 whitespace-nowrap">
                        <span className="text-xs text-gray-500 dark:text-[#737373] font-medium">{item.timestamp?.toLocaleDateString()}</span>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-[#404040]"
                            onClick={() => handleEdit(item, type)}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </Button>
                          <a
                            href={`https://www.iaai.com/Search?Keyword=${item.stock}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 hover:text-accent-foreground dark:hover:bg-[#404040] h-7 w-7"
                            title="Search on IAAI"
                          >
                            <SearchIcon size={14} />
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" />
              Global Search
            </h1>
            <p className="text-xs text-gray-500 dark:text-[#a1a1a1]">Locate any vehicle record instantly by Stock or VIN</p>
          </div>
        </div>

        {/* Search Controls */}
        <Card className="border border-gray-200 dark:border-[#262626] bg-white dark:bg-[#111111] shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">

              {/* Search In Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 dark:text-[#737373] uppercase flex items-center gap-1 ml-1">
                  <LayoutDashboard className="w-3 h-3" />
                  Search In
                </label>
                <Select value={searchIn} onValueChange={(v: any) => setSearchIn(v)}>
                  <SelectTrigger className="h-9 text-xs border-gray-200 dark:border-[#262626] bg-transparent focus:ring-blue-500/20">
                    <SelectValue placeholder="Select collection" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#1a1a1a] dark:border-[#262626]">
                    <SelectItem value="daily-clean" className="text-xs">Daily Cleans</SelectItem>
                    <SelectItem value="sales-prep" className="text-xs">Sales Prep</SelectItem>
                    <SelectItem value="both" className="text-xs">All Records</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search By Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 dark:text-[#737373] uppercase flex items-center gap-1 ml-1">
                  <Filter className="w-3 h-3" />
                  Search By
                </label>
                <Select value={searchBy} onValueChange={(v: any) => setSearchBy(v)}>
                  <SelectTrigger className="h-9 text-xs border-gray-200 dark:border-[#262626] bg-transparent focus:ring-blue-500/20">
                    <SelectValue placeholder="Filter field" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#1a1a1a] dark:border-[#262626]">
                    <SelectItem value="stock" className="text-xs">Stock Number</SelectItem>
                    <SelectItem value="vin" className="text-xs">Last 6 of VIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Input Field */}
              <div className="md:col-span-2 lg:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 dark:text-[#737373] uppercase flex items-center gap-1 ml-1">
                  <Search className="w-3 h-3" />
                  Search Term
                </label>
                <div className="relative group">
                  <Input
                    placeholder={searchBy === 'stock' ? "e.g. 1F12345" : "Enter last 6 digits..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="h-9 text-xs pl-3 border-gray-200 dark:border-[#262626] bg-transparent focus-visible:ring-blue-500/20 group-hover:border-gray-300 dark:group-hover:border-[#404040] transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-[#525252] dark:hover:text-[#a1a1a1] transition-colors"
                    >
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                disabled={loading || !searchTerm.trim()}
                className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5 mr-2" />
                    SEARCH
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-3 rounded flex items-center space-x-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {/* Results Area */}
        <div className="space-y-8 pt-2">
          {loading && !results && (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-12 h-12 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-xs text-gray-500 dark:text-[#a1a1a1] mt-4 font-medium uppercase tracking-widest">Searching records...</p>
            </div>
          )}

          {!loading && results && (results.cleans.length > 0 || results.sales.length > 0) && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {renderTable(results.cleans, "Daily Cleans Data", 'daily-clean')}
              {renderTable(results.sales, "Sales Prep Data", 'sales-prep')}
            </div>
          )}

          {!loading && results && results.cleans.length === 0 && results.sales.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 bg-gray-50/50 dark:bg-[#111111]/50 rounded-xl border-2 border-dashed border-gray-100 dark:border-[#262626]">
              <div className="w-16 h-16 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-300 dark:text-[#404040]" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">No Matches Found</h3>
              <p className="text-xs text-gray-500 dark:text-[#a1a1a1] mt-1 text-center max-w-[250px]">
                We couldn't find any vehicle matching "{searchTerm}" in the selected collections.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="mt-6 h-8 text-xs border-gray-200 dark:border-[#262626] dark:hover:bg-[#1a1a1a]"
              >
                Clear Search
              </Button>
            </div>
          )}

          {!loading && !results && (
            <div className="flex flex-col items-center justify-center py-32 opacity-30 select-none pointer-events-none">
              <LayoutDashboard className="w-20 h-20 text-gray-200 dark:text-[#262626] mb-4" />
              <p className="text-xs font-bold text-gray-300 dark:text-[#262626] uppercase tracking-[0.2em]">Enter details to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && selectedRecord && results && (
        <EditCleanModal
          clean={selectedRecord}
          branches={getBranchNames()}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSave}
          type={selectedType}
          hasNext={(() => {
            const list = selectedType === 'daily-clean' ? results.cleans : results.sales;
            const index = list.findIndex(r => r.id === selectedRecord.id);
            return index < list.length - 1;
          })()}
          hasPrevious={(() => {
            const list = selectedType === 'daily-clean' ? results.cleans : results.sales;
            const index = list.findIndex(r => r.id === selectedRecord.id);
            return index > 0;
          })()}
          onNext={() => {
            const list = selectedType === 'daily-clean' ? results.cleans : results.sales;
            const index = list.findIndex(r => r.id === selectedRecord.id);
            if (index < list.length - 1) {
              setSelectedRecord(list[index + 1]);
            }
          }}
          onPrevious={() => {
            const list = selectedType === 'daily-clean' ? results.cleans : results.sales;
            const index = list.findIndex(r => r.id === selectedRecord.id);
            if (index > 0) {
              setSelectedRecord(list[index - 1]);
            }
          }}
        />
      )}
    </DashboardLayout>
  );
}
