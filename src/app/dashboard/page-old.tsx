'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/animated-table-rows';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataService, DashboardStats, CheckIn, SalesPrep, Branch, User } from '@/lib/data-service';
import { EditCleanModal } from '@/components/edit-clean-modal';
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Eye, Edit } from "lucide-react";

export default function DashboardPage() {
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [dateRange, setDateRange] = useState<'yesterday' | 'today' | 'week' | 'month' | 'all'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [usersMap, setUsersMap] = useState<Map<string, User>>(new Map());
  
  // Loading states
  const [loading, setLoading] = useState({
    stats: true,
    branches: true,
    users: true
  });

  // Pagination states
  const [pagination, setPagination] = useState({
    cleans: { page: 1, total: 0, totalPages: 0 },
    sales: { page: 1, total: 0, totalPages: 0 }
  });

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClean, setSelectedClean] = useState<CheckIn | null>(null);

  // Load dashboard stats
  const loadStats = async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      const dashboardStats = await DataService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  // Load branches
  const loadBranches = async () => {
    try {
      setLoading(prev => ({ ...prev, branches: true }));
      const branchesData = await DataService.getBranches();
      setBranches(branchesData);
      
      // Create users map for quick lookups
      const usersData = await DataService.getUsers();
      const usersMapData = new Map<string, User>();
      usersData.forEach((user: User) => {
        usersMapData.set(user.id, user);
      });
      setUsersMap(usersMapData);
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(prev => ({ ...prev, branches: false }));
    }
  };

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      const usersData = await DataService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  // Load cleans with pagination and filtering
  const loadCleans = async (page: number = 1) => {
    try {
      setLoading(prev => ({ ...prev, cleans: true }));
      const result = await DataService.getCleans(page, 10, selectedBranch, dateRange, searchTerm);
      setCleans(result.data);
      setPagination(prev => ({
        ...prev,
        cleans: {
          page: result.page,
          total: result.total,
          totalPages: result.totalPages
        }
      }));
    } catch (error) {
      console.error('Error loading cleans:', error);
    } finally {
      setLoading(prev => ({ ...prev, cleans: false }));
    }
  };

  // Load sales with pagination and filtering
  const loadSales = async (page: number = 1) => {
    try {
      setLoading(prev => ({ ...prev, sales: true }));
      const result = await DataService.getSalesPrep(page, 10, selectedBranch, dateRange, searchTerm);
      setSales(result.data);
      setPagination(prev => ({
        ...prev,
        sales: {
          page: result.page,
          total: result.total,
          totalPages: result.totalPages
        }
      }));
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(prev => ({ ...prev, sales: false }));
    }
  };

  // Get user name by ID
  const getUserName = (userId: string, userFullName?: string): string => {
    // If we have userFullName directly from the document, use it
    if (userFullName && userFullName !== 'Unknown User') {
      return userFullName;
    }
    // Fallback to usersMap lookup
    const user = usersMap.get(userId);
    return user?.fullName || user?.fullname || user?.email || 'Unknown User';
  };

  // Edit handlers
  const handleEditClean = (clean: CheckIn) => {
    console.log('Edit button clicked - clean data:', clean); // Debug log
    console.log('Clean picture:', clean.picture); // Debug log
    console.log('Clean userFullName:', clean.userFullName); // Debug log
    setSelectedClean(clean);
    setEditModalOpen(true);
  };

  const handleSaveClean = async (updatedClean: CheckIn) => {
    try {
      await DataService.updateClean(updatedClean.id, updatedClean);
      
      // Refresh the cleans data
      await loadCleans(pagination.cleans.page);
      
      // Show success message (you could add a toast notification here)
      console.log('Clean updated successfully');
    } catch (error) {
      console.error('Error updating clean:', error);
      // Show error message (you could add a toast notification here)
    }
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedClean(null);
  };

  // Get branch names for dropdown
  const getBranchNames = (): string[] => {
    console.log('getBranchNames called - branches state:', branches); // Debug log
    
    // If branches haven't loaded yet, return common branch names as fallback
    if (!branches || branches.length === 0) {
      console.log('No branches loaded, returning fallback'); // Debug log
      return ['Branch A', 'Branch B', 'Branch C', 'Main Branch'];
    }
    
    // Extract branch names, handle different field names
    const branchNames = branches.map(branch => {
      console.log('Processing branch:', branch); // Debug log
      // If branch is a string, return it directly
      if (typeof branch === 'string') {
        return branch;
      }
      // If branch is an object, use the name property
      const name = branch.name || 'Unknown Branch';
      console.log('Extracted name:', name); // Debug log
      return name;
    });
    
    console.log('Final branch names for dropdown:', branchNames); // Debug log
    return branchNames;
  };

  // Initial data loading
  useEffect(() => {
    loadStats();
    loadBranches();
    loadUsers();
  }, []);

  // Load data when section changes
  useEffect(() => {
    if (activeSection === 'daily-cleans') {
      loadCleans(pagination.cleans.page);
    } else if (activeSection === 'sales-prep') {
      loadSales(pagination.sales.page);
    }
  }, [activeSection, selectedBranch, dateRange, searchTerm]);

  // Filter cleans when filters change
  useEffect(() => {
    if (activeSection === 'daily-cleans') {
      loadCleans(pagination.cleans.page);
    } else if (activeSection === 'sales-prep') {
      loadSales(pagination.sales.page);
    }
  }, [selectedBranch, dateRange, searchTerm]);

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard Overview</h1>
                <p className="text-gray-600 dark:text-gray-400">Welcome to your admin dashboard</p>
              </div>
              <Button onClick={loadStats} disabled={loading.stats}>
                {loading.stats ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Daily Cleans</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {loading.stats ? '...' : stats?.todayCleans || 0}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        This week: {loading.stats ? '...' : stats?.weeklyCleans || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-broom text-blue-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sales Prep</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {loading.stats ? '...' : stats?.todaySales || 0}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        This week: {loading.stats ? '...' : stats?.weeklySales || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-clipboard-list text-purple-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Branches</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {loading.stats ? '...' : branches.length}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        All locations
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-building text-orange-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {loading.stats ? '...' : stats?.totalUsers || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Registered accounts
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-users text-orange-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle>Weekly Performance</CardTitle>
                  <CardDescription>Cleans and sales overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <i className="fas fa-chart-line text-4xl mb-4"></i>
                      <p>Charts coming soon</p>
                      <p className="text-sm mt-2">Cleans: {stats?.weeklyCleans || 0} | Sales: {stats?.weeklySales || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle>Branch Distribution</CardTitle>
                  <CardDescription>Cleans by branch location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <i className="fas fa-chart-bar text-4xl mb-4"></i>
                      <p>Charts coming soon</p>
                      <p className="text-sm mt-2">{branches.length} branches active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'daily-cleans':
        return (
          <div className="space-y-6">
            <div className="bg-sky-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">Daily Cleans Management</h1>
                  <p className="text-sky-100">Manage and track daily vehicle cleans</p>
                </div>
                <Button 
                  onClick={() => loadCleans(pagination.cleans.page)} 
                  disabled={loading.cleans}
                  className="bg-white text-sky-600 hover:bg-sky-50"
                >
                  {loading.cleans ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  {loading.branches ? (
                    <div className="w-48 h-10 border border-gray-300 bg-gray-50 rounded flex items-center px-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                      Loading branches...
                    </div>
                  ) : (
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {getBranchNames().map((branchName, index) => (
                          <SelectItem key={`${branchName}-${index}`} value={branchName}>
                            {branchName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex-1"></div>
                  
                  <Input
                    type="text"
                    placeholder="Search cleans..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-sm font-medium text-gray-700">Date</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Branch</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Insurance</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Make</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Model</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Year</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Stock</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">User</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">VIN</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {loading.cleans ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                              <p className="text-sm text-gray-500 mt-2">Loading cleans...</p>
                            </TableCell>
                          </TableRow>
                        ) : cleans.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center py-8">
                              <p className="text-sm text-gray-500">No daily cleans found</p>
                              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or date range</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          cleans.slice(0, 10).map((clean, index) => (
                            <motion.tr
                              key={clean.id}
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -100 }}
                              transition={{ duration: 0.4, delay: index * 0.1 }}
                              className="border-b transition-colors hover:bg-muted/50"
                            >
                              <TableCell className="p-4 align-middle">{clean.timestamp.toLocaleDateString()}</TableCell>
                              <TableCell className="p-4 align-middle">{clean.branch}</TableCell>
                              <TableCell className="p-4 align-middle">{clean.insurance}</TableCell>
                              <TableCell className="p-4 align-middle">{clean.make}</TableCell>
                              <TableCell className="p-4 align-middle">{clean.model}</TableCell>
                              <TableCell className="p-4 align-middle">{clean.year}</TableCell>
                              <TableCell className="p-4 align-middle">{clean.stock}</TableCell>
                              <TableCell className="p-4 align-middle font-medium">{getUserName(clean.userId, clean.userFullName)}</TableCell>
                              <TableCell className="p-4 align-middle font-mono text-xs">{clean.vin}</TableCell>
                              <TableCell className="p-4 align-middle">
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditClean(clean)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
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

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {Math.min(10, cleans.length)} of {cleans.length} cleans
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadCleans(pagination.cleans.page - 1)}
                  disabled={pagination.cleans.page <= 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm">
                  Page {pagination.cleans.page} of {pagination.cleans.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadCleans(pagination.cleans.page + 1)}
                  disabled={pagination.cleans.page >= pagination.cleans.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        );

      case 'sales-prep':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Sales Preparation</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage vehicle sales preparation</p>
              </div>
              <Button onClick={() => loadSales(pagination.sales.page)} disabled={loading.sales}>
                {loading.sales ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            {/* Filters */}
            <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  {loading.branches ? (
                    <div className="w-48 h-10 border border-gray-300 bg-gray-50 rounded flex items-center px-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                      Loading branches...
                    </div>
                  ) : (
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {getBranchNames().map((branchName, index) => (
                          <SelectItem key={`${branchName}-${index}`} value={branchName}>
                            {branchName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex-1"></div>
                  
                  <Input
                    type="text"
                    placeholder="Search sales..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {loading.stats ? '...' : stats?.totalSales || 0}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        This week: {loading.stats ? '...' : stats?.weeklySales || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-clipboard-list text-purple-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Branches</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {loading.stats ? '...' : branches.length}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        All locations
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-building text-green-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {loading.stats ? '...' : stats?.totalUsers || 0}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Registered accounts
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-users text-orange-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-sm font-medium text-gray-700">Date</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Branch</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Insurance</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Make</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Model</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Year</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Stock</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">User</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">VIN</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {loading.sales ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                              <p className="text-sm text-gray-500 mt-2">Loading sales...</p>
                            </TableCell>
                          </TableRow>
                        ) : sales.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center py-8">
                              <p className="text-sm text-gray-500">No sales prep records found</p>
                              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or date range</p>
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
                              transition={{ duration: 0.4, delay: index * 0.1 }}
                              className="border-b transition-colors hover:bg-muted/50"
                            >
                              <TableCell className="p-4 align-middle">{sale.timestamp.toLocaleDateString()}</TableCell>
                              <TableCell className="p-4 align-middle">{sale.branch}</TableCell>
                              <TableCell className="p-4 align-middle">{sale.insurance}</TableCell>
                              <TableCell className="p-4 align-middle">{sale.make}</TableCell>
                              <TableCell className="p-4 align-middle">{sale.model}</TableCell>
                              <TableCell className="p-4 align-middle">{sale.year}</TableCell>
                              <TableCell className="p-4 align-middle">{sale.stock}</TableCell>
                              <TableCell className="p-4 align-middle font-medium">{getUserName(sale.userId, sale.userFullName)}</TableCell>
                              <TableCell className="p-4 align-middle font-mono text-xs">{sale.vin}</TableCell>
                              <TableCell className="p-4 align-middle">
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
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

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {sales.length} of {pagination.sales.total} sales
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadSales(pagination.sales.page - 1)}
                  disabled={pagination.sales.page <= 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-1 text-sm">
                  Page {pagination.sales.page} of {pagination.sales.totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadSales(pagination.sales.page + 1)}
                  disabled={pagination.sales.page >= pagination.sales.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        );

      case 'branches':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Branches Management</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage branch locations and information</p>
              </div>
              <Button onClick={loadBranches} disabled={loading.branches}>
                {loading.branches ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Branches</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {loading.branches ? '...' : branches.length}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Active locations
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-building text-green-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {loading.stats ? '...' : stats?.totalUsers || 0}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Registered accounts
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-users text-orange-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Branches Table */}
            <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-sm font-medium text-gray-700">Number</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Location</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Manager</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Phone</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Email</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {loading.branches ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                              <p className="text-sm text-gray-500 mt-2">Loading branches...</p>
                            </TableCell>
                          </TableRow>
                        ) : branches.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <p className="text-sm text-gray-500">No branches found</p>
                              <p className="text-sm text-gray-400 mt-1">Add your first branch to get started</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          branches.map((branch, index) => (
                            <motion.tr
                              key={branch.id}
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -100 }}
                              transition={{ duration: 0.4, delay: index * 0.1 }}
                              className="border-b transition-colors hover:bg-muted/50"
                            >
                              <TableCell className="p-4 align-middle font-medium">{branch.name}</TableCell>
                              <TableCell className="p-4 align-middle">{branch.location}</TableCell>
                              <TableCell className="p-4 align-middle">{branch.manager}</TableCell>
                              <TableCell className="p-4 align-middle">{branch.phone}</TableCell>
                              <TableCell className="p-4 align-middle">{branch.email}</TableCell>
                              <TableCell className="p-4 align-middle">
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
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
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Users Management</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage user accounts and permissions</p>
              </div>
              <Button onClick={loadUsers} disabled={loading.users}>
                {loading.users ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {loading.users ? '...' : users.length}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Active accounts
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-users text-orange-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Today</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {loading.stats ? '...' : stats?.activeUsersToday || 0}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Logged in now
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-user-check text-blue-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New This Week</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {loading.stats ? '...' : stats?.newUsersThisWeek || 0}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Registered
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-user-plus text-purple-500"></i>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Users Table */}
            <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-sm font-medium text-gray-700">Email</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Full Name</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Role</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Status</TableHead>
                        <TableHead className="text-sm font-medium text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {loading.users ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                              <p className="text-sm text-gray-500 mt-2">Loading users...</p>
                            </TableCell>
                          </TableRow>
                        ) : users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <p className="text-sm text-gray-500">No users found</p>
                              <p className="text-sm text-gray-400 mt-1">Add your first user to get started</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user, index) => (
                            <motion.tr
                              key={user.id}
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -100 }}
                              transition={{ duration: 0.4, delay: index * 0.1 }}
                              className="border-b transition-colors hover:bg-muted/50"
                            >
                              <TableCell className="p-4 align-middle font-medium">{user.email}</TableCell>
                              <TableCell className="p-4 align-middle">{user.fullName || user.fullname || 'N/A'}</TableCell>
                              <TableCell className="p-4 align-middle">
                                <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="p-4 align-middle">
                                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                  {user.status || 'Unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell className="p-4 align-middle">
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
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
          </div>
        );

      case 'search':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Advanced Search</h1>
                <p className="text-gray-600 dark:text-gray-400">Search across all records and data</p>
              </div>
            </div>

            {/* Search Interface */}
            <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Select value="all" onValueChange={() => {}}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select search type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Records</SelectItem>
                        <SelectItem value="cleans">Daily Cleans</SelectItem>
                        <SelectItem value="sales">Sales Prep</SelectItem>
                        <SelectItem value="branches">Branches</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Select value="today" onValueChange={() => {}}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Select value="all" onValueChange={() => {}}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {getBranchNames().map((branchName, index) => (
                          <SelectItem key={`${branchName}-${index}`} value={branchName}>
                            {branchName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Keywords
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter keywords to search..."
                      className="w-full"
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button className="w-full">
                      <i className="fas fa-search mr-2"></i>
                      Search Records
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            <div className="mt-6">
              <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle>Search Results</CardTitle>
                  <CardDescription>Advanced search functionality coming soon</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <i className="fas fa-search text-4xl text-gray-400 mb-4"></i>
                    <p className="text-sm text-gray-500">Advanced search features will be available in the next update</p>
                    <p className="text-xs text-gray-400 mt-2">This will include cross-table searching, filters, and export capabilities</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <i className="fas fa-cog text-6xl text-gray-400 mb-4 animate-spin"></i>
              <p className="text-lg text-gray-600">This section is under development</p>
              <p className="text-sm text-gray-400">Check back soon for updates</p>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderContent()}
      
      {/* Edit Clean Modal */}
      <EditCleanModal
        clean={selectedClean}
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveClean}
        branches={getBranchNames()}
      />
    </DashboardLayout>
  );
}
