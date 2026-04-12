'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/animated-table-rows';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataService, User } from '@/lib/data-service';
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Edit, Plus, Users, Shield, Crown } from "lucide-react";

export default function UsersPage() {
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [dateRange, setDateRange] = useState<'yesterday' | 'today' | 'last week' | 'this week' | 'last month' | 'this month'>('today');
  const [loading, setLoading] = useState({
    users: false
  });

  // Load data
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
    loadUsers();
  }, [selectedBranch, dateRange]);

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'manager':
        return <Shield className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  // Get role color matching standard tokens
  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-primary/20 text-primary border-transparent';
      case 'manager':
        return 'bg-blue-500/20 text-blue-500 border-transparent';
      default:
        return 'bg-muted text-muted-foreground border-transparent';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Simple Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground dark:text-white">Users Management</h1>
            <p className="text-muted-foreground dark:text-gray-300">Manage user accounts and permissions</p>
          </div>
          <Button 
            onClick={() => loadUsers()} 
            disabled={loading.users}
            className="bg-background border border-border text-foreground hover:bg-muted"
          >
            {loading.users ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Simple Filters */}
        <Card className="border border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-48 bg-background border-border text-foreground">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="branch1">Branch 1</SelectItem>
                  <SelectItem value="branch2">Branch 2</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger className="w-48 bg-background border-border text-foreground">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last week">Last Week</SelectItem>
                  <SelectItem value="this week">This Week</SelectItem>
                  <SelectItem value="last month">Last Month</SelectItem>
                  <SelectItem value="this month">This Month</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">User Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                    <TableHead className="text-sm font-medium text-muted-foreground">ID</TableHead>
                    <TableHead className="text-sm font-medium text-muted-foreground">Name</TableHead>
                    <TableHead className="text-sm font-medium text-muted-foreground">Email</TableHead>
                    <TableHead className="text-sm font-medium text-muted-foreground">Role</TableHead>
                    <TableHead className="text-sm font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="text-sm font-medium text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {loading.users ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                          <p className="text-sm text-muted-foreground mt-2">Loading users...</p>
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <p className="text-sm text-muted-foreground">No users found</p>
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
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="p-4">
                            <span className="text-muted-foreground text-xs">{user.id}</span>
                          </TableCell>
                          <TableCell className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-foreground">
                                  {(user.fullName || user.fullname || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {user.fullName || user.fullname || 'Unknown User'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="p-4">
                            <span className="text-muted-foreground">{user.email}</span>
                          </TableCell>
                          <TableCell className="p-4">
                            <Badge className={getRoleColor(user.role || 'user')}>
                              <div className="flex items-center space-x-1">
                                {getRoleIcon(user.role || 'user')}
                                <span>{user.role || 'user'}</span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="p-4">
                            <Badge className="bg-green-500/20 text-green-500 border-none hover:bg-green-500/20">
                              {user.status || 'active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-4">
                            <div className="flex items-center justify-end space-x-2">
                              <Button variant="ghost" size="sm" className="h-8 w-8 hover:bg-muted text-muted-foreground">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 hover:bg-muted text-muted-foreground">
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
