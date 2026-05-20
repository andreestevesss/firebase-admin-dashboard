'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/animated-table-rows';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Eye, Edit, Car, Calendar, MapPin, RefreshCw, Activity, Search } from "lucide-react";
import { DataService, CheckIn, Branch, User } from '@/lib/data-service';
import { EditCleanModal } from '@/components/edit-clean-modal';
import { DashboardLayout } from '@/components/dashboard-layout';
import SlidingPagination from '@/components/ui/sliding-pagination';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function DailyCleansContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlUser = searchParams.get('user');

  const [selectedBranch, setSelectedBranch] = useState('all');
  const [dateRange, setDateRange] = useState<'yesterday' | 'today' | 'last week' | 'this week' | 'last month' | 'this month'>('today');

  const [userFilter, setUserFilter] = useState<string | null>(urlUser);

  useEffect(() => {
    setUserFilter(urlUser);
  }, [urlUser]);

  // Data states
  const [cleans, setCleans] = useState<CheckIn[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allBranchNames, setAllBranchNames] = useState<string[]>([]); // New state for all branches
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState({
    cleans: false,
    branches: false,
    users: false
  });
  const [pagination, setPagination] = useState({
    cleans: { page: 1, total: 0, totalPages: 0 }
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClean, setSelectedClean] = useState<CheckIn | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<'first' | 'last' | null>(null);

  // Load data
  const loadCleans = async (page = 1) => {
    if (loading.cleans) return; // Prevent multiple simultaneous requests

    try {
      setLoading(prev => ({ ...prev, cleans: true }));
      const result = await DataService.getDailyCleans({
        branch: selectedBranch !== 'all' ? selectedBranch : undefined,
        dateRange,
        user: userFilter || undefined,
        page,
        limit: 15
      });
      setCleans(result.data);
      setPagination(prev => ({ ...prev, cleans: { page: result.page, total: result.total, totalPages: result.totalPages } }));
    } catch (error) {
      console.error('Error loading cleans:', error);
      setCleans([]); // Clear data on error
    } finally {
      setLoading(prev => ({ ...prev, cleans: false }));
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

  // Edit clean handlers
  const handleEditClean = (clean: CheckIn) => {
    console.log('Edit button clicked - clean data:', clean);
    setSelectedClean(clean);
    setEditModalOpen(true);
  };

  const handleSaveClean = async (updatedClean: CheckIn) => {
    try {
      await DataService.updateClean(updatedClean.id, updatedClean);
      await loadCleans(pagination.cleans.page);
      console.log('Clean updated successfully');
    } catch (error) {
      console.error('Error updating clean:', error);
    }
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedClean(null);
  };

  // Effects
  useEffect(() => {
    loadCleans();
    loadBranches();
    loadUsers();
    loadAllBranches(); // Load all branches from database
  }, []); // Remove dependencies to prevent infinite loop

  // Handle cross-page navigation once cleans load
  useEffect(() => {
    if (pendingNavigation && !loading.cleans && cleans.length > 0) {
      if (pendingNavigation === 'first') {
        setSelectedClean(cleans[0]);
      } else if (pendingNavigation === 'last') {
        setSelectedClean(cleans[cleans.length - 1]);
      }
      setPendingNavigation(null);
    }
  }, [cleans, pendingNavigation, loading.cleans]);

  // Separate effect for filter changes - with loading guard to prevent infinite loops
  useEffect(() => {
    if (!loading.cleans) {
      loadCleans();
    }
  }, [selectedBranch, dateRange, userFilter]);

  // Load all branches from database (without filters) - Direct Firebase approach
  const loadAllBranches = async () => {
    try {
      console.log('Loading all branches directly from Firebase...');

      // Import and use Firebase directly to avoid any filtering
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const snapshot = await getDocs(collection(db, 'ScannedCheckIN'));
      console.log('Total documents in Firebase:', snapshot.size);

      const branchSet = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.branch && data.branch !== 'N/A') {
          branchSet.add(data.branch);
        }
      });

      const branchNames = Array.from(branchSet).sort();
      console.log('All branches found directly from Firebase:', branchNames);
      console.log('Number of unique branches:', branchNames.length);
      setAllBranchNames(branchNames);
    } catch (error) {
      console.error('Error loading all branches directly:', error);
      setAllBranchNames(['Main Branch', 'Branch A', 'Branch B', 'Branch C']);
    }
  };

  // Get branch names for dropdown from all branches data
  const getBranchNames = (): string[] => {
    console.log('getBranchNames called, allBranchNames:', allBranchNames);
    console.log('Number of branches in state:', allBranchNames.length);

    if (allBranchNames.length === 0) {
      console.log('No branches in state, returning defaults');
      return ['Main Branch', 'Branch A', 'Branch B', 'Branch C'];
    }

    console.log('Returning allBranchNames:', allBranchNames);
    return allBranchNames;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Simple Filters */}
        <Card className="border border-gray-200 dark:border-[#262626]">
          <CardContent className="p-1">
            <div className="flex items-center gap-1">
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
                    getBranchNames().map((name) => (
                      <SelectItem key={name} value={name} className="text-gray-700 dark:text-[#a1a1a1] text-xs">{name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={(value) => setDateRange(value as any)}>
                <SelectTrigger className="w-36 h-8 bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#262626] text-xs">
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
                onClick={() => loadCleans()}
                disabled={loading.cleans}
                className="bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-[#262626] text-gray-700 dark:text-[#a1a1a1] hover:bg-gray-50 dark:hover:bg-[#262626] h-8 text-sm"
              >
                {loading.cleans ? '...' : '↻'}
              </Button>
            </div>

            {userFilter && (
              <div className="flex items-center gap-2 mt-4 px-2">
                <span className="text-sm text-gray-500 dark:text-[#a1a1a1]">Filtering by User:</span>
                <Badge variant="secondary" className="px-3 py-1 font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {userFilter}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUserFilter(null);
                    router.replace('/dashboard/daily-cleans');
                  }}
                  className="h-6 text-xs text-gray-500 hover:text-red-500"
                >
                  Clear Filter
                </Button>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Cleans Table */}
        <Card className="border border-gray-200 dark:border-[#262626]">
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-[#262626]">
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-4">Branch</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Picture</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Insurance</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Make</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Model</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Year</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Stock</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">User</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">VIN</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Day Added</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {loading.cleans ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 dark:border-[#525252] mx-auto"></div>
                          <p className="text-sm text-gray-500 dark:text-[#a1a1a1] mt-2">Loading cleans...</p>
                        </TableCell>
                      </TableRow>
                    ) : cleans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">No cleans found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      cleans.map((clean, index) => (
                        <motion.tr
                          key={clean.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#262626] transition-colors"
                        >
                          <TableCell className="py-1 px-4">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{clean.branch}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2 text-center">
                            <div
                              className="w-8 h-8 bg-gray-200 dark:bg-[#262626] rounded flex items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-[#404040] transition-all duration-300 overflow-hidden"
                              onClick={() => clean.picture && clean.picture !== 'N/A' && window.open(clean.picture, '_blank')}
                            >
                              <Car className="w-4 h-4 text-gray-400" />
                            </div>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{clean.insurance}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{clean.make}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{clean.model}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{clean.year}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{clean.stock}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{clean.userFullName || 'Unknown User'}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1] font-mono">{clean.vin}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{clean.timestamp ? new Date(clean.timestamp).toLocaleDateString() : 'N/A'}</span>
                          </TableCell>
                          <TableCell className="py-1 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClean(clean)}
                                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-[#404040]"
                                title="Edit"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <a
                                href={`https://www.iaai.com/Search?Keyword=${clean.stock}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 hover:text-accent-foreground dark:hover:bg-[#404040] h-6 w-6"
                                title="Search on IAAI"
                              >
                                <Search className="h-3 w-3" />
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

        {/* Enhanced Sliding Pagination */}
        <div className="flex items-center justify-center py-2">
          <div className="flex flex-col items-center space-y-2">
            {/* Sliding Pagination Component */}
            <SlidingPagination
              totalPages={pagination.cleans.totalPages}
              currentPage={pagination.cleans.page}
              onPageChange={loadCleans}
              maxVisiblePages={7}
              className="text-xs"
            />

            {/* Records Count */}
            <p className="text-xs text-gray-600 dark:text-[#a1a1a1]">
              Showing {cleans.length} of {pagination.cleans.total} records
            </p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && selectedClean && (
        <EditCleanModal
          clean={selectedClean}
          branches={getBranchNames()}
          isOpen={editModalOpen}
          onClose={handleCloseEditModal}
          onSave={() => {
            handleCloseEditModal();
            loadCleans(pagination.cleans.page);
          }}
          isNavigating={loading.cleans || !!pendingNavigation}
          hasNext={(() => {
            const currentIndex = cleans.findIndex(c => c.id === selectedClean.id);
            const isLastOnPage = currentIndex === cleans.length - 1;
            const hasMorePages = pagination.cleans.page < pagination.cleans.totalPages;
            return !isLastOnPage || hasMorePages;
          })()}
          hasPrevious={(() => {
            const currentIndex = cleans.findIndex(c => c.id === selectedClean.id);
            const isFirstOnPage = currentIndex === 0;
            const hasPrevPages = pagination.cleans.page > 1;
            return !isFirstOnPage || hasPrevPages;
          })()}
          onNext={() => {
            const currentIndex = cleans.findIndex(c => c.id === selectedClean.id);
            if (currentIndex < cleans.length - 1) {
              setSelectedClean(cleans[currentIndex + 1]);
            } else if (pagination.cleans.page < pagination.cleans.totalPages) {
              setPendingNavigation('first');
              loadCleans(pagination.cleans.page + 1);
            }
          }}
          onPrevious={() => {
            const currentIndex = cleans.findIndex(c => c.id === selectedClean.id);
            if (currentIndex > 0) {
              setSelectedClean(cleans[currentIndex - 1]);
            } else if (pagination.cleans.page > 1) {
              setPendingNavigation('last');
              loadCleans(pagination.cleans.page - 1);
            }
          }}
        />
      )}
    </>
  );
}

export default function DailyCleansPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground w-full flex justify-center items-center h-full"><div className="animate-spin mr-2 h-5 w-5 border-b-2 border-foreground rounded-full" />Loading records...</div>}>
        <DailyCleansContent />
      </Suspense>
    </DashboardLayout>
  );
}
