'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/animated-table-rows';
import { Button } from '@/components/ui/button';
import { DataService, Branch, User } from '@/lib/data-service';
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Eye, Edit, Plus } from "lucide-react";

export default function BranchesPage() {
  // Data states
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState({
    branches: false,
    users: false
  });

  // Load data
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

  // Effects
  useEffect(() => {
    loadBranches();
    loadUsers();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Branches Management</h1>
              <p className="text-green-100">Manage and track branch locations and details</p>
            </div>
            <Button 
              onClick={() => loadBranches()} 
              disabled={loading.branches}
              className="bg-white text-green-600 hover:bg-green-50"
            >
              {loading.branches ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <i className="fas fa-map-marker-alt text-green-500"></i>
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
                    {loading.users ? '...' : users.length}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Registered now
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
                    {loading.users ? '...' : users.filter(u => {
                      // This would need actual date logic from user creation time
                      return Math.random() > 0.7; // Placeholder
                    }).length}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
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

        {/* Branches Table */}
        <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Branch Locations</CardTitle>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Branch
              </Button>
            </div>
          </CardHeader>
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
    </DashboardLayout>
  );
}
