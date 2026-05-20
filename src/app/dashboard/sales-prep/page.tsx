'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/animated-table-rows';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DataService, SalesPrep, Branch, User } from '@/lib/data-service';
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Eye, Edit, Car, Search } from "lucide-react";
import { EditCleanModal } from '@/components/edit-clean-modal';
import SlidingPagination from '@/components/ui/sliding-pagination';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function SalesPrepContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlUser = searchParams.get('user');

  const [selectedBranch, setSelectedBranch] = useState('all');
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'last week' | 'this week' | 'last month' | 'this month' | 'all'>('today');

  // Support jumping from User chart metric -> filtered list
  const [userFilter, setUserFilter] = useState<string | null>(urlUser);

  useEffect(() => {
    setUserFilter(urlUser);
  }, [urlUser]);

  // Data states
  const [sales, setSales] = useState<SalesPrep[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allBranchNames, setAllBranchNames] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState({
    sales: false,
    branches: false,
    users: false
  });
  const [pagination, setPagination] = useState({
    sales: { page: 1, total: 0, totalPages: 0 }
  });

  // Edit State
  const [selectedSale, setSelectedSale] = useState<SalesPrep | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<'first' | 'last' | null>(null);

  // Load data
  const loadSales = async (page = 1) => {
    try {
      setLoading(prev => ({ ...prev, sales: true }));
      const result = await DataService.getSalesPrepData({
        branch: selectedBranch !== 'all' ? selectedBranch : undefined,
        dateRange: dateRange,
        user: userFilter || undefined,
        page,
        limit: 15
      });
      setSales(result.data);
      setPagination(prev => ({ ...prev, sales: { page: result.page, total: result.total, totalPages: result.totalPages } }));
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(prev => ({ ...prev, sales: false }));
    }
  };

  const loadBranches = async () => {
    try {
      setLoading(prev => ({ ...prev, branches: true }));
      const result = await DataService.getBranches();
      setBranches(result);
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(prev => ({ ...prev, branches: false }));
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      const result = await DataService.getUsers();
      setUsers(result);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  // Get user name helper
  const getUserName = (userId: string, fullName: string) => {
    if (fullName && fullName !== 'Unknown User') return fullName;
    const user = users.find(u => u.id === userId);
    return user?.fullName || user?.fullname || 'Unknown User';
  };

  // Edit handlers
  const handleEditSale = (sale: SalesPrep) => {
    setSelectedSale(sale);
    setEditModalOpen(true);
  };

  const handleSaveSale = async (updatedSale: any) => {
    // DataService.updateSalesPrep is already handled by modal if using its internal update logic,
    // but here we just need to refresh local state
    await loadSales(pagination.sales.page);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedSale(null);
  };

  // Effects
  useEffect(() => {
    loadSales();
    loadBranches();
    loadUsers();
  }, [selectedBranch, dateRange, userFilter]);

  // Handle cross-page navigation once sales load
  useEffect(() => {
    if (pendingNavigation && !loading.sales && sales.length > 0) {
      if (pendingNavigation === 'first') {
        setSelectedSale(sales[0]);
      } else if (pendingNavigation === 'last') {
        setSelectedSale(sales[sales.length - 1]);
      }
      setPendingNavigation(null);
    }
  }, [sales, pendingNavigation, loading.sales]);

  // Load initial data
  useEffect(() => {
    loadBranches();
    loadUsers();
    loadAllBranches();
  }, []);

  // Load all branches directly from SalesPrep collection (real branch names)
  const loadAllBranches = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const snapshot = await getDocs(collection(db, 'SalesPrep'));
      const branchSet = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.branch && data.branch !== 'N/A') {
          branchSet.add(data.branch);
        }
      });
      setAllBranchNames(Array.from(branchSet).sort());
    } catch (error) {
      console.error('Error loading all branches:', error);
    }
  };

  // Get branch names for dropdown
  const getBranchNames = (): string[] => {
    if (!branches || branches.length === 0) {
      return ['Branch A', 'Branch B', 'Branch C', 'Main Branch'];
    }

    const branchNames = branches.map(branch => {
      if (typeof branch === 'string') {
        return branch;
      }
      const name = branch.name || 'Unknown Branch';
      return name;
    });

    return branchNames;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Simple Filters - Aligned with Daily Cleans */}
        <Card className="border border-gray-200 dark:border-[#262626]">
          <CardContent className="p-1">
            <div className="flex items-center gap-1">
              {loading.branches ? (
                <div className="w-32 h-7 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626] rounded flex items-center px-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-2"></div>
                  <span className="text-[10px] text-gray-500">Loading...</span>
                </div>
              ) : (
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-32 h-7 bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#262626] text-xs">
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#262626]">
                    <SelectItem value="all" className="text-gray-700 dark:text-[#a1a1a1] text-xs">All</SelectItem>
                    {allBranchNames.length > 0 ? (
                      allBranchNames.map((name) => (
                        <SelectItem key={name} value={name} className="text-gray-700 dark:text-[#a1a1a1] text-xs">{name}</SelectItem>
                      ))
                    ) : (
                      branches.filter(b => b.status !== 'inactive').map((b) => (
                        <SelectItem key={b.name} value={b.name} className="text-gray-700 dark:text-[#a1a1a1] text-xs">
                          {b.name} - {b.location}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}

              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger className="w-36 h-7 bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#262626] text-xs">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#262626]">
                  <SelectItem value="today" className="text-gray-700 dark:text-[#a1a1a1] text-sm">Today</SelectItem>
                  <SelectItem value="yesterday" className="text-gray-700 dark:text-[#a1a1a1] text-sm">Yesterday</SelectItem>
                  <SelectItem value="last week" className="text-gray-700 dark:text-[#a1a1a1] text-sm">Last Week</SelectItem>
                  <SelectItem value="this week" className="text-gray-700 dark:text-[#a1a1a1] text-sm">This Week</SelectItem>
                  <SelectItem value="last month" className="text-gray-700 dark:text-[#a1a1a1] text-sm">Last Month</SelectItem>
                  <SelectItem value="this month" className="text-gray-700 dark:text-[#a1a1a1] text-sm">This Month</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => loadSales()}
                disabled={loading.sales}
                className="bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-[#262626] text-gray-700 dark:text-[#a1a1a1] hover:bg-gray-50 dark:hover:bg-[#262626] h-7 px-2 text-sm"
              >
                {loading.sales ? '...' : '↻'}
              </Button>
            </div>

            {userFilter && (
              <div className="flex items-center gap-2 mt-4 px-2">
                <span className="text-xs text-gray-500 dark:text-[#a1a1a1]">Filtering by User:</span>
                <Badge variant="secondary" className="px-3 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {userFilter}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUserFilter(null);
                    router.replace('/dashboard/sales-prep');
                  }}
                  className="h-5 text-[10px] text-gray-500 hover:text-red-500"
                >
                  Clear Filter
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table - Aligned with Daily Cleans */}
        <Card className="border border-gray-200 dark:border-[#262626]">
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-[#262626]">
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-3">Branch</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Picture</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Insurance</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Make</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Model</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Year</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Stock</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">User</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">VIN</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Day Added</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {loading.sales ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 dark:border-[#525252] mx-auto"></div>
                          <p className="text-sm text-gray-500 dark:text-[#a1a1a1] mt-2">Loading sales...</p>
                        </TableCell>
                      </TableRow>
                    ) : sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8">
                          <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">No sales prep records found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.map((sale, index) => (
                        <motion.tr
                          key={sale.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors"
                        >
                          <TableCell className="py-1 px-3">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{sale.branch}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <div
                              className="w-8 h-8 bg-gray-200 dark:bg-[#262626] rounded flex items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-[#404040] transition-all duration-300 overflow-hidden"
                              onClick={() => sale.picture && sale.picture !== 'N/A' && window.open(sale.picture, '_blank')}
                            >
                              <Car className="w-4 h-4 text-gray-400" />
                            </div>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{sale.insurance}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{sale.make}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{sale.model}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{sale.year}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{sale.stock}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{getUserName(sale.userId, sale.userFullName)}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1] font-mono">{sale.vin}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{sale.timestamp ? sale.timestamp.toLocaleDateString() : 'N/A'}</span>
                          </TableCell>
                          <TableCell className="py-1 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-[#404040]"
                                onClick={() => handleEditSale(sale)}
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5 text-gray-400" />
                              </Button>
                              <a
                                href={`https://www.iaai.com/Search?Keyword=${sale.stock}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 hover:text-accent-foreground dark:hover:bg-[#404040] h-6 w-6"
                                title="Search on IAAI"
                              >
                                <Search className="h-3.5 w-3.5 text-gray-400" />
                              </a>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination - Aligned with Daily Cleans */}
        <div className="flex items-center justify-center py-2">
          <div className="flex flex-col items-center space-y-2">
            <SlidingPagination
              totalPages={pagination.sales.totalPages}
              currentPage={pagination.sales.page}
              onPageChange={loadSales}
              maxVisiblePages={7}
              className="text-xs"
            />
            <p className="text-xs text-gray-600 dark:text-[#a1a1a1]">
              Showing {sales.length} of {pagination.sales.total} records
            </p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && selectedSale && (
        <EditCleanModal
          clean={selectedSale}
          branches={getBranchNames()}
          isOpen={editModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveSale}
          type="sales-prep"
          isNavigating={loading.sales || !!pendingNavigation}
          hasNext={(() => {
            const currentIndex = sales.findIndex(s => s.id === selectedSale.id);
            const isLastOnPage = currentIndex === sales.length - 1;
            const hasMorePages = pagination.sales.page < pagination.sales.totalPages;
            return !isLastOnPage || hasMorePages;
          })()}
          hasPrevious={(() => {
            const currentIndex = sales.findIndex(s => s.id === selectedSale.id);
            const isFirstOnPage = currentIndex === 0;
            const hasPrevPages = pagination.sales.page > 1;
            return !isFirstOnPage || hasPrevPages;
          })()}
          onNext={() => {
            const currentIndex = sales.findIndex(s => s.id === selectedSale.id);
            if (currentIndex < sales.length - 1) {
              setSelectedSale(sales[currentIndex + 1]);
            } else if (pagination.sales.page < pagination.sales.totalPages) {
              setPendingNavigation('first');
              loadSales(pagination.sales.page + 1);
            }
          }}
          onPrevious={() => {
            const currentIndex = sales.findIndex(s => s.id === selectedSale.id);
            if (currentIndex > 0) {
              setSelectedSale(sales[currentIndex - 1]);
            } else if (pagination.sales.page > 1) {
              setPendingNavigation('last');
              loadSales(pagination.sales.page - 1);
            }
          }}
        />
      )}
    </>
  );
}

export default function SalesPrepPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground w-full flex justify-center items-center h-full"><div className="animate-spin mr-2 h-5 w-5 border-b-2 border-foreground rounded-full" />Loading records...</div>}>
        <SalesPrepContent />
      </Suspense>
    </DashboardLayout>
  );
}
