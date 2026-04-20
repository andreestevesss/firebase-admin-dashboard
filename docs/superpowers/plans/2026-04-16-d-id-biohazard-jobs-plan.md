# D-ID and Biohazard Jobs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add D-ID and Biohazard job management menus to admin dashboard. Admin can create jobs with stock number + type, assign to users, and view job list.

**Architecture:** Single `jobs` Firestore collection with type field. Two new pages (d-id, biohazard) using same table pattern as daily-cleans. New data service methods following existing patterns.

**Tech Stack:** Next.js, Firestore, React, Tailwind, shadcn/ui

---

## File Structure

```
Created:
- src/app/dashboard/d-id/page.tsx
- src/app/dashboard/biohazard/page.tsx
- src/components/job-modal.tsx
- src/components/create-job-modal.tsx

Modified:
- src/components/dashboard-layout.tsx (add menu items)
- src/lib/data-service.ts (add Job interface and methods)
- src/app/api/jobs/route.ts
```

---

### Task 1: Add Job interface and data service methods

**Files:**
- Modify: `src/lib/data-service.ts`

Add Job interface after existing interfaces:

```typescript
export interface Job {
  id: string;
  type: 'd-id' | 'biohazard';
  branch?: string;
  insurance?: string;
  make?: string;
  model?: string;
  year?: string;
  stockNumber: string;
  vin?: string;
  picture?: string;
  status: 'pending' | 'active' | 'completed';
  assignedUserId: string | null;
  assignedUserName: string;
  createdAt: Date;
  createdBy: string;
  beforeUrl1?: string;
  beforeUrl2?: string;
  beforeUrl3?: string;
  beforeUrl4?: string;
  afterUrl1?: string;
  afterUrl2?: string;
  afterUrl3?: string;
  afterUrl4?: string;
}
```

Add methods to DataService class:

```typescript
static async getJobs(filters: {
  type: 'd-id' | 'biohazard';
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: Job[]; total: number; page: number; totalPages: number }> {
  try {
    const jobsRef = collection(db, 'jobs');
    const qConstraints: any[] = [where('type', '==', filters.type), orderBy('createdAt', 'desc')];
    
    if (filters.status && filters.status !== 'all') {
      qConstraints.push(where('status', '==', filters.status));
    }
    
    const baseQuery = query(jobsRef, ...qConstraints);
    const countSnapshot = await getCountFromServer(baseQuery);
    const total = countSnapshot.data().count;
    
    const page = filters.page || 1;
    const limitCount = filters.limit || 15;
    const fetchQuery = query(baseQuery, limit(limitCount * page));
    const snapshot = await getDocs(fetchQuery);
    
    const jobs: Job[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      jobs.push({
        id: doc.id,
        type: data.type,
        branch: data.branch || '',
        insurance: data.insurance || '',
        make: data.make || '',
        model: data.model || '',
        year: data.year || '',
        stockNumber: data.stockNumber || '',
        vin: data.vin || '',
        picture: data.picture || '',
        status: data.status || 'pending',
        assignedUserId: data.assignedUserId || null,
        assignedUserName: data.assignedUserName || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        createdBy: data.createdBy || '',
        beforeUrl1: data.beforeUrl1 || '',
        beforeUrl2: data.beforeUrl2 || '',
        beforeUrl3: data.beforeUrl3 || '',
        beforeUrl4: data.beforeUrl4 || '',
        afterUrl1: data.afterUrl1 || '',
        afterUrl2: data.afterUrl2 || '',
        afterUrl3: data.afterUrl3 || '',
        afterUrl4: data.afterUrl4 || '',
      });
    });
    
    const startIndex = (page - 1) * limitCount;
    const pageData = jobs.slice(startIndex, startIndex + limitCount);
    
    return {
      data: pageData,
      total,
      page,
      totalPages: Math.ceil(total / limitCount)
    };
  } catch (error) {
    console.error('Error loading jobs:', error);
    throw error;
  }
}

static async createJob(data: {
  type: 'd-id' | 'biohazard';
  stockNumber: string;
  branch?: string;
  insurance?: string;
  make?: string;
  model?: string;
  year?: string;
  vin?: string;
  picture?: string;
  createdBy: string;
}): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'jobs'), {
      ...data,
      status: 'pending',
      assignedUserId: null,
      assignedUserName: '',
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
}

static async assignJob(jobId: string, userId: string, userName: string): Promise<void> {
  try {
    const docRef = doc(db, 'jobs', jobId);
    await updateDoc(docRef, {
      assignedUserId: userId,
      assignedUserName: userName,
      status: 'active',
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error assigning job:', error);
    throw error;
  }
}

static async updateJobStatus(jobId: string, status: 'pending' | 'active' | 'completed'): Promise<void> {
  try {
    const docRef = doc(db, 'jobs', jobId);
    await updateDoc(docRef, { status, updatedAt: Timestamp.now() });
  } catch (error) {
    console.error('Error updating job status:', error);
    throw error;
  }
}
```

- [ ] **Step 1: Add Job interface and getJobs method to data-service.ts**

- [ ] **Step 2: Add createJob and assignJob methods**

- [ ] **Step 3: Commit**

---

### Task 2: Add menu items to dashboard layout

**Files:**
- Modify: `src/components/dashboard-layout.tsx:4` (import)
- Modify: `src/components/dashboard-layout.tsx:19-27` (menuItems array)

Add Clipboard import:

```typescript
import { Menu, X, LayoutDashboard, Car, Clipboard, Building, Users, Search, Download } from 'lucide-react';
```

Add to menuItems array:

```typescript
{ id: 'd-id', label: 'D-ID', icon: Clipboard, href: '/dashboard/d-id' },
{ id: 'biohazard', label: 'Biohazard', icon: Clipboard, href: '/dashboard/biohazard' },
```

- [ ] **Step 1: Update imports and menu items**

- [ ] **Step 2: Commit**

---

### Task 3: Create D-ID page component

**Files:**
- Create: `src/app/dashboard/d-id/page.tsx`

```typescript
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/animated-table-rows';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { DataService, Job } from '@/lib/data-service';
import { DashboardLayout } from '@/components/dashboard-layout';
import SlidingPagination from '@/components/ui/sliding-pagination';
import { CreateJobModal } from '@/components/create-job-modal';
import { Plus, Clipboard } from 'lucide-react';

function DIdJobsContent() {
  const searchParams = useSearchParams();
  const urlUser = searchParams.get('user');
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadJobs = async (page = 1) => {
    if (loading) return;
    try {
      setLoading(true);
      const result = await DataService.getJobs({
        type: 'd-id',
        status: statusFilter !== 'all' ? statusFilter : undefined,
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
  }, [statusFilter]);

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
                <SelectTrigger className="w-40 h-8 bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#262626] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#262626]">
                  <SelectItem value="all" className="text-gray-700 dark:text-[#a1a1a1] text-xs">All</SelectItem>
                  <SelectItem value="pending" className="text-gray-700 dark:text-[#a1a1a1] text-xs">Pending</SelectItem>
                  <SelectItem value="active" className="text-gray-700 dark:text-[#a1a1a1] text-xs">Active</SelectItem>
                  <SelectItem value="completed" className="text-gray-700 dark:text-[#a1a1a1] text-xs">Completed</SelectItem>
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
                          <p className="text-sm text-gray-500 dark:text-[#a1a1a1]">No D-ID jobs found</p>
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
                            <Badge variant={job.status === 'completed' ? 'default' : 'secondary'} className={job.status === 'active' ? 'bg-green-100 text-green-700' : job.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
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
          jobType="d-id"
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreateJob}
        />
      )}
    </>
  );
}

export default function DIdPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground w-full flex justify-center items-center h-full"><div className="animate-spin mr-2 h-5 w-5 border-b-2 border-foreground rounded-full" />Loading...</div>}>
        <DIdJobsContent />
      </Suspense>
    </DashboardLayout>
  );
}
```

- [ ] **Step 1: Create D-ID page component**

- [ ] **Step 2: Test page loads**

- [ ] **Step 3: Commit**

---

### Task 4: Create Biohazard page component

**Files:**
- Create: `src/app/dashboard/biohazard/page.tsx`

Same structure as D-ID page, but:
- type: 'biohazard' in getJobs call
- Title: "Biohazard Jobs"
- jobType="biohazard" in modal

```typescript
// Replace 'd-id' with 'biohazard' in:
// - DataService.getJobs({ type: 'biohazard', ... })
// - <CreateJobModal jobType="biohazard" />
// - Page title text
```

- [ ] **Step 1: Copy D-ID page and update type references**

- [ ] **Step 2: Test page loads**

- [ ] **Step 3: Commit**

---

### Task 5: Create CreateJobModal component

**Files:**
- Create: `src/components/create-job-modal.tsx`

```typescript
'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataService, User } from '@/lib/data-service';
import { Plus, X } from 'lucide-react';

interface CreateJobModalProps {
  jobType: 'd-id' | 'biohazard';
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}

export function CreateJobModal({ jobType, isOpen, onClose, onCreate }: CreateJobModalProps) {
  const [stockNumber, setStockNumber] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [branch, setBranch] = useState('');
  const [insurance, setInsurance] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const result = await DataService.getUsers();
      setUsers(result);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async () => {
    if (!stockNumber.trim()) return;
    
    setLoading(true);
    try {
      const selectedUser = users.find(u => u.id === selectedUserId);
      await onCreate({
        type: jobType,
        stockNumber: stockNumber.trim(),
        branch: branch || undefined,
        insurance: insurance || undefined,
        make: make || undefined,
        model: model || undefined,
        year: year || undefined,
        vin: vin || undefined,
        assignedUserId: selectedUserId || undefined,
        assignedUserName: selectedUser?.fullName || selectedUser?.fullname || '',
        createdBy: 'admin'
      });
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStockNumber('');
    setSelectedUserId('');
    setBranch('');
    setInsurance('');
    setMake('');
    setModel('');
    setYear('');
    setVin('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626]">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-[#fafafa]">
            Create {jobType === 'd-id' ? 'D-ID' : 'Biohazard'} Job
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-[#a1a1a1]">
              Stock Number *
            </label>
            <Input
              value={stockNumber}
              onChange={(e) => setStockNumber(e.target.value)}
              placeholder="Enter stock number"
              className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#262626]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-[#a1a1a1]">
              Assign User (Optional)
            </label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#262626]">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#262626]">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="text-gray-700 dark:text-[#a1a1a1]">
                    {user.fullName || user.fullname || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-green-600 hover:text-green-700"
            >
              {showAdvanced ? '- Hide' : '+ Show'} Vehicle Details
            </button>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-[#262626] rounded-lg">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1]">Branch</label>
                <Input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Branch"
                  className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1]">Insurance</label>
                <Input
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value)}
                  placeholder="Insurance"
                  className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1]">Make</label>
                <Input
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="Make"
                  className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1]">Model</label>
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Model"
                  className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1]">Year</label>
                <Input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Year"
                  className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1]">VIN</label>
                <Input
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  placeholder="VIN"
                  className="bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-[#262626]"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-200 dark:border-[#262626]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!stockNumber.trim() || loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Creating...' : 'Create Job'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 1: Create CreateJobModal component**

- [ ] **Step 2: Test modal opens from page**

- [ ] **Step 3: Commit**

---

### Task 6: Test full flow

**Files:**
- Test in browser

- [ ] **Step 1: Navigate to /dashboard/d-id**
- [ ] **Step 2: Click "New Job" button**
- [ ] **Step 3: Enter stock number, select user**
- [ ] **Step 4: Submit and verify job appears in table**
- [ ] **Step 5: Repeat for /dashboard/biohazard**

---

## Acceptance Criteria

- [ ] Sidebar shows D-ID and Biohazard menu items
- [ ] D-ID page loads with empty job list
- [ ] Biohazard page loads with empty job list
- [ ] Create job modal opens
- [ ] Can create job with stock number only
- [ ] Job appears in list after creation
- [ ] Can assign user to job
- [ ] Status filter works
- [ ] Pagination works

---

## Next Steps (Future)

- User notification menu (Phase B)
- Photo upload interface
- QR scanning (Phase C)