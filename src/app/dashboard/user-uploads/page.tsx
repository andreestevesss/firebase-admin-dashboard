'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataService } from '@/lib/data-service';
import { Users, BarChart3, Car } from 'lucide-react';
import { Bar, BarChart, XAxis, LabelList } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/bar-chart";

const chartConfig = {
  dailyCleans: {
    label: "Daily Cleans",
    color: "#3b82f6",
  },
  salesPrep: {
    label: "Sales Prep",
    color: "#22c55e",
  },
} satisfies ChartConfig;

export default function UserUploadsPage() {
  const router = useRouter();
  const [allCleans, setAllCleans] = useState<any[]>([]);
  const [allSales, setAllSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userChartData, setUserChartData] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cleansRes, salesRes] = await Promise.all([
        DataService.getDailyCleans({ limit: 1000 }),
        DataService.getSalesPrepData({ limit: 1000, dateRange: 'all' })
      ]);
      setAllCleans(cleansRes.data);
      setAllSales(salesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (allCleans.length === 0 && allSales.length === 0) return;

    const userCounts: Record<string, { user: string; dailyCleans: number; salesPrep: number; total: number }> = {};

    const getDateObj = (timestamp: any) => {
      if (!timestamp) return null;
      if (timestamp.toDate) return timestamp.toDate();
      if (timestamp instanceof Date) return timestamp;
      if (typeof timestamp === 'string') return new Date(timestamp);
      return null;
    };

    allCleans.forEach(c => {
      const date = getDateObj(c.timestamp);
      if (!date) return;
      let uName = c.userFullName || 'Unknown User';
      if (uName.indexOf('@') > -1) uName = uName.split('@')[0];
      if (!userCounts[uName]) userCounts[uName] = { user: uName, dailyCleans: 0, salesPrep: 0, total: 0 };
      userCounts[uName].dailyCleans++;
      userCounts[uName].total++;
    });

    allSales.forEach(s => {
      const date = getDateObj(s.timestamp);
      if (!date) return;
      let uName = s.userFullName || s.fullName || s.fullname || 'Unknown User';
      if (uName.indexOf('@') > -1) uName = uName.split('@')[0];
      if (!userCounts[uName]) userCounts[uName] = { user: uName, dailyCleans: 0, salesPrep: 0, total: 0 };
      userCounts[uName].salesPrep++;
      userCounts[uName].total++;
    });

    const userData = Object.values(userCounts)
      .filter(u => u.total > 0)
      .sort((a, b) => b.total - a.total);
    
    setUserChartData(userData);
  }, [allCleans, allSales]);

  const totalUploads = userChartData.reduce((sum, u) => sum + u.total, 0);

  const handleShowAll = (userName: string) => {
    router.push(`/dashboard/daily-cleans?user=${encodeURIComponent(userName)}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground dark:text-white">User Uploads</h1>
            <p className="text-muted-foreground dark:text-gray-300">View all user upload activity</p>
          </div>
          <Button onClick={loadData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Users</span>
              </div>
              <p className="text-2xl font-semibold mt-1">{userChartData.length}</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Users with Uploads</span>
              </div>
              <p className="text-2xl font-semibold mt-1">{userChartData.filter(u => u.total > 0).length}</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Uploads</span>
              </div>
              <p className="text-2xl font-semibold mt-1">{totalUploads}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border">
          <CardHeader className="py-4 border-b border-border">
            <CardTitle className="text-base font-semibold text-foreground">All User Uploads</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {loading ? (
              <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : userChartData.length === 0 ? (
              <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">
                No upload data available
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <BarChart accessibilityLayer data={userChartData} margin={{ top: 20, right: 10, left: 40, bottom: 80 }}>
                  <XAxis
                    dataKey="user"
                    tickLine={false}
                    tickFormatter={(value) => value.split(' ')[0]}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    dx={-5}
                    dy={5}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                  <Bar 
                    dataKey="dailyCleans" 
                    fill="var(--color-dailyCleans)" 
                    radius={4}
                  >
                    <LabelList dataKey="dailyCleans" position="top" fill="currentColor" className="fill-foreground font-semibold text-[10px]" formatter={(value: any) => value > 0 ? value : ''} />
                  </Bar>
                  <Bar 
                    dataKey="salesPrep" 
                    fill="var(--color-salesPrep)" 
                    radius={4}
                  >
                    <LabelList dataKey="salesPrep" position="top" fill="currentColor" className="fill-foreground font-semibold text-[10px]" formatter={(value: any) => value > 0 ? value : ''} />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="py-4 border-b border-border">
            <CardTitle className="text-base font-semibold text-foreground">User Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Daily Cleans</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Sales Prep</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Total</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userChartData.map((user, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4 font-medium">{user.user}</td>
                      <td className="p-4 text-right">{user.dailyCleans}</td>
                      <td className="p-4 text-right">{user.salesPrep}</td>
                      <td className="p-4 text-right font-semibold">{user.total}</td>
                      <td className="p-4 text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleShowAll(user.user)}
                          className="text-xs"
                        >
                          Show all
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}