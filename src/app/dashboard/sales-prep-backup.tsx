'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/animated-table-rows';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataService, SalesPrep, Branch, User } from '@/lib/data-service';
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Eye, Edit } from "lucide-react";

export default function SalesPrepPage() {
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [dateRange, setDateRange] = useState<'yesterday' | 'today' | 'week' | 'month' | 'all'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data states
  const [sales, setSales] = useState<SalesPrep[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState({
    sales: false,
    branches: false,
    users: false
  });
  const [pagination, setPagination] = useState({
    sales: { page: 1, total: 0, totalPages: 0 }
  });

  // Load data
  const loadSales = async (page = 1) => {
    try {
      setLoading(prev => ({ ...prev, sales: true }));
      const result = await DataService.getSalesPrep({
        branch: selectedBranch !== 'all' ? selectedBranch : undefined,
        dateRange,
        page,
        limit: 10
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

  // Effects
  useEffect(() => {
    loadSales();
    loadBranches();
    loadUsers();
  }, [selectedBranch, dateRange]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = sales.filter(sale => 
        sale.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.vin.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSales(filtered);
    } else {
      loadSales();
    }
  }, [searchTerm]);

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
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Sales Prep Management</h1>
              <p className="text-purple-100">Manage and track sales preparation activities</p>
            </div>
            <Button 
              onClick={() => loadSales(pagination.sales.page)} 
              disabled={loading.sales}
              className="bg-white text-purple-600 hover:bg-purple-50"
            >
              {loading.sales ? 'Loading...' : 'Refresh'}
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
                    {getBranchNames().map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search by make, model, or VIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
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
    </DashboardLayout>
  );
}
