'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/animated-table-rows';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { DataService, Job } from '@/lib/data-service';
import { DashboardLayout } from '@/components/dashboard-layout';
import SlidingPagination from '@/components/ui/sliding-pagination';
import { CreateJobModal } from '@/components/create-job-modal';
import { Plus, Clipboard } from 'lucide-react';

function BiohazardJobsContent() {
  const searchParams = useSearchParams();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [allBranchNames, setAllBranchNames] = useState<string[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadJobs = async (page = 1) => {
    if (loading) return;
    try {
      setLoading(true);
      const result = await DataService.getJobs({
        type: 'biohazard',
        status: statusFilter !== 'all' ? statusFilter : undefined,
        branch: branchFilter !== 'all' ? branchFilter : undefined,
        page,
        limit: 15
      });
      setJobs(result.data);
      setPagination({ page: result.page, total: result.total, totalPages: result.totalPages });
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [statusFilter, branchFilter]);

  const getBranchNames = (): string[] => {
    if (allBranchNames.length === 0) {
      return ['Main Branch', 'Branch A', 'Branch B', 'Branch C'];
    }
    return allBranchNames;
  };

  const loadAllBranches = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const snapshot = await getDocs(collection(db, 'ScannedCheckIN'));
      const branchSet = new Set<string>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.branch && data.branch !== 'N/A') {
          branchSet.add(data.branch);
        }
      });
      const branchNames = Array.from(branchSet).sort();
      setAllBranchNames(branchNames);
    } catch (error) {
      console.error('Error loading all branches:', error);
      setAllBranchNames(['Main Branch', 'Branch A', 'Branch B', 'Branch C']);
    }
  };

  useEffect(() => {
    loadAllBranches();
  }, []);

  const handleCreateJob = async (jobData: any) => {
    try {
      await DataService.createJob(jobData);
      await loadJobs(pagination.page);
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <Card className="border border-gray-200 dark:border-[#262626]">
          <CardContent className="p-1">
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-8 bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#262626] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#262626]">
                  <SelectItem value="all" className="text-gray-700 dark:text-[#a1a1a1] text-xs">All</SelectItem>
                  <SelectItem value="pending" className="text-gray-700 dark:text-[#a1a1a1] text-xs">Pending</SelectItem>
                  <SelectItem value="active" className="text-gray-700 dark:text-[#a1a1a1] text-xs">Active</SelectItem>
                  <SelectItem value="completed" className="text-gray-700 dark:text-[#a1a1a1] text-xs">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-36 h-8 bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#262626] text-xs">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#262626]">
                  <SelectItem value="all" className="text-gray-700 dark:text-[#a1a1a1] text-xs">All</SelectItem>
                  {getBranchNames().map((name) => (
                    <SelectItem key={name} value={name} className="text-gray-700 dark:text-[#a1a1a1] text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                onClick={() => loadJobs()}
                disabled={loading}
                className="bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-[#262626] text-gray-700 dark:text-[#a1a1a1] hover:bg-gray-50 dark:hover:bg-[#262626] h-8 text-sm"
              >
                {loading ? '...' : '↻'}
              </Button>
              
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white h-8 text-sm ml-auto"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Job
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-[#262626]">
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-[#262626]">
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Stock #</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Make</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Model</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Year</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">User</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Status</TableHead>
                    <TableHead className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1] px-2">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 dark:border-[#525252] mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : jobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">No Biohazard jobs found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      jobs.map((job, index) => (
                        <motion.tr
                          key={job.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b border-gray-200 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#262626]"
                        >
                          <TableCell className="py-1 px-2">
                            <span className="text-xs font-mono text-gray-700 dark:text-[#a1a1a1]">{job.stockNumber}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{job.make || 'N/A'}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{job.model || 'N/A'}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{job.year || 'N/A'}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{job.assignedUserName || 'Unassigned'}</span>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <Badge 
                              variant="secondary" 
                              className={
                                job.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                job.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                              }
                            >
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1 px-2">
                            <span className="text-xs text-gray-700 dark:text-[#a1a1a1]">{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}</span>
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

        <div className="flex items-center justify-center py-2">
          <div className="flex flex-col items-center space-y-2">
            <SlidingPagination
              totalPages={pagination.totalPages}
              currentPage={pagination.page}
              onPageChange={loadJobs}
              maxVisiblePages={7}
              className="text-xs"
            />
            <p className="text-xs text-gray-600 dark:text-[#a1a1a1]">
              Showing {jobs.length} of {pagination.total} records
            </p>
          </div>
        </div>
      </div>

      {createModalOpen && (
        <CreateJobModal
          jobType="biohazard"
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreateJob}
        />
      )}
    </>
  );
}

export default function BiohazardPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground w-full flex justify-center items-center h-full"><div className="animate-spin mr-2 h-5 w-5 border-b-2 border-foreground rounded-full" />Loading...</div>}>
        <BiohazardJobsContent />
      </Suspense>
    </DashboardLayout>
  );
}