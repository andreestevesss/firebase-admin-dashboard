'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataService, DashboardStats, Branch, User } from '@/lib/data-service';

export default function DashboardPage() {
  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    stats: true,
    branches: true,
    users: true
  });

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
      const result = await DataService.getBranches();
      setBranches(result);
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
    loadStats();
    loadBranches();
    loadUsers();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-sky-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
              <p className="text-sky-100">Welcome to your Firebase Admin Dashboard</p>
            </div>
            <Button 
              onClick={() => {
                loadStats();
                loadBranches();
                loadUsers();
              }} 
              disabled={loading.stats || loading.branches || loading.users}
              className="bg-white text-sky-600 hover:bg-sky-50"
            >
              {loading.stats || loading.branches || loading.users ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {loading.stats ? '...' : stats?.totalUsers || 0}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Active now: {loading.stats ? '...' : stats?.activeUsersToday || 0}
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {loading.stats ? '...' : stats?.newUsersThisWeek || 0}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    This week
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-user-plus text-green-500"></i>
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-car text-blue-500"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Daily Cleans</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage vehicle cleaning records</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                View Cleans
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-clipboard-list text-purple-500"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Sales Prep</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Track sales preparation</p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                View Sales
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-map-marker-alt text-green-500"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Branches</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage branch locations</p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                View Branches
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-users text-orange-500"></i>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Users</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage user accounts</p>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                View Users
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
