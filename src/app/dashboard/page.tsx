'use client';
// Build version: 1.0.1 - Force fresh deployment
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataService, DashboardStats, Branch, User } from '@/lib/data-service';
import { TrendingUp, Car, ClipboardList, MapPin, Users, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, XAxis, LabelList, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/bar-chart";

const chartConfig = {
  dailyCleans: {
    label: "Daily Cleans",
    color: "#3b82f6", // tailwind blue-500
  },
  salesPrep: {
    label: "Sales Prep",
    color: "#22c55e", // tailwind green-500
  },
} satisfies ChartConfig;

const CustomHatchedBar = (
  props: React.SVGProps<SVGRectElement> & {
    dataKey?: string;
    isHatched?: boolean;
  }
) => {
  const { fill, x, y, width, height, dataKey } = props;

  const isHatched = props.isHatched ?? true;

  if (x === undefined || y === undefined || width === undefined || height === undefined) return null;

  return (
    <>
      <rect
        rx={4}
        x={x}
        y={y}
        width={Math.max(0, width as number)}
        height={Math.max(0, height as number)}
        stroke="none"
        fill={isHatched ? `url(#hatched-bar-pattern-${dataKey})` : fill}
      />
      <defs>
        <pattern
          key={dataKey}
          id={`hatched-bar-pattern-${dataKey}`}
          x="0"
          y="0"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <rect width="10" height="10" opacity={0.5} fill={fill}></rect>
          <rect width="1" height="10" fill={fill}></rect>
        </pattern>
      </defs>
    </>
  );
};

const DottedBackgroundPattern = () => {
  return (
    <pattern
      id="default-multiple-pattern-dots"
      x="0"
      y="0"
      width="10"
      height="10"
      patternUnits="userSpaceOnUse"
    >
      <circle
        className="dark:text-muted/40 text-muted"
        cx="2"
        cy="2"
        r="1"
        fill="currentColor"
      />
    </pattern>
  );
};

export default function DashboardPage() {
  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [userChartData, setUserChartData] = useState<any[]>([]); // New user analytics state
  const router = useRouter();
  
  const [allCleans, setAllCleans] = useState<any[]>([]);
  const [allSales, setAllSales] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('This-Week');
  
  // Loading states
  const [loading, setLoading] = useState({
    stats: true,
    branches: true,
    chart: true
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

  // Load baseline chart data
  const loadChartData = async () => {
    try {
      setLoading(prev => ({ ...prev, chart: true }));
      const [cleansRes, salesRes] = await Promise.all([
        DataService.getDailyCleans({ limit: 1000 }), 
        DataService.getSalesPrepData({ limit: 1000, dateRange: 'all' })
      ]);
      setAllCleans(cleansRes.data);
      setAllSales(salesRes.data);
    } catch (error) {
      console.error('Error loading chart data:', error);
      setLoading(prev => ({ ...prev, chart: false }));
    }
  };

  // Process data for the chart whenever baseline data or selected form changes
  useEffect(() => {
    if (!branches || branches.length === 0) return;
    if (allCleans.length === 0 && allSales.length === 0 && loading.chart) return;

    const counts: Record<string, { branch: string; dailyCleans: number; salesPrep: number }> = {};
    const branchMap: Record<string, string> = {};
    
    // Map branch names/numbers to actual location names to avoid showing "1, 2, 3"
    // Many records use "b.branch" = "1", which maps to b.name="1", b.location="Location"
    branches.filter(b => b.status !== 'inactive').forEach(b => {
      let realName = b.location && b.location.trim() !== '' && b.location !== 'N/A' && b.location !== 'N/A - No Data' 
          ? b.location 
          : b.name;
      
      // Handle known numeric edge cases just in case location is empty
      const knownLocations: Record<string,string> = { '1': 'Shady Spring', '2': 'Birmingham', '3': 'Akron-Canton', '4': 'Buckhannon', '5': 'Dayton', '6': 'Beckley' };
      if (!isNaN(Number(realName)) && knownLocations[b.name]) {
         realName = knownLocations[b.name];
      }
      
      branchMap[b.name] = realName;
      counts[realName] = { branch: realName, dailyCleans: 0, salesPrep: 0 };
    });
    
    counts['Other'] = { branch: 'Other', dailyCleans: 0, salesPrep: 0 };

    // Date ranges
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay()); // Sunday
    currentWeekStart.setHours(0,0,0,0);
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
    lastWeekEnd.setHours(23,59,59,999);

    const getDateObj = (timestamp: any) => {
      if (!timestamp) return null;
      if (timestamp.toDate) return timestamp.toDate();
      if (timestamp instanceof Date) return timestamp;
      if (typeof timestamp === 'string') return new Date(timestamp);
      return null;
    }

    const isRecordIncluded = (date: Date | null) => {
       if (!date) return true; // defaults to included if no date exist
       const dStr = date.getDay().toString();
       
       if (selectedDay === 'This-Week') {
          return date >= currentWeekStart && date <= now;
       }
       if (selectedDay === 'Last-Week') {
          return date >= lastWeekStart && date <= lastWeekEnd;
       }
       // Day of the week specific queries (1-5) must only belong to THIS week up to 'now'
       if (dStr === selectedDay) {
          return date >= currentWeekStart && date <= now;
       }
       
       return false;
    }

    // Filter and count daily cleans
    allCleans.forEach(c => {
      const date = getDateObj(c.timestamp);
      if (!isRecordIncluded(date)) return;
      
      let bCode = c.branch || 'Other';
      let bName = branchMap[bCode] || (branchMap['4'] && bCode === '4' ? 'Buckhannon' : bCode);
      if (!counts[bName]) counts[bName] = { branch: bName, dailyCleans: 0, salesPrep: 0 };
      counts[bName].dailyCleans++;
    });
    
    // Filter and count sales prep
    allSales.forEach(s => {
      const date = getDateObj(s.timestamp);
      if (!isRecordIncluded(date)) return;
      
      let bCode = s.branch || 'Other';
      let bName = branchMap[bCode] || (branchMap['4'] && bCode === '4' ? 'Buckhannon' : bCode);
      if (!counts[bName]) counts[bName] = { branch: bName, dailyCleans: 0, salesPrep: 0 };
      counts[bName].salesPrep++;
    });
    
    // Remove empty categories if desired and omit pure numbers that weren't mapped
    const data = Object.values(counts).filter(c => {
      if (c.branch === 'Other' && c.dailyCleans === 0 && c.salesPrep === 0) return false;
      // Also filter out any pure numbers that sneaked in
      if (!isNaN(Number(c.branch)) && c.dailyCleans === 0 && c.salesPrep === 0) return false;
      return true;
    });

    // Build user uploads data
    const userCounts: Record<string, { user: string; dailyCleans: number; salesPrep: number; total: number }> = {};
    
    allCleans.forEach(c => {
      const date = getDateObj(c.timestamp);
      if (!isRecordIncluded(date)) return;
      let uName = c.userFullName || 'Unknown User';
      if (uName.indexOf('@') > -1) uName = uName.split('@')[0];
      if (!userCounts[uName]) userCounts[uName] = { user: uName, dailyCleans: 0, salesPrep: 0, total: 0 };
      userCounts[uName].dailyCleans++;
      userCounts[uName].total++;
    });

    allSales.forEach(s => {
      const date = getDateObj(s.timestamp);
      if (!isRecordIncluded(date)) return;
      let uName = s.userFullName || s.fullName || s.fullname || 'Unknown User';
      if (uName.indexOf('@') > -1) uName = uName.split('@')[0];
      if (!userCounts[uName]) userCounts[uName] = { user: uName, dailyCleans: 0, salesPrep: 0, total: 0 };
      userCounts[uName].salesPrep++;
      userCounts[uName].total++;
    });

    const userData = Object.values(userCounts)
      .filter(u => u.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 12); // Limit to top 12 users for compact view
    
    setChartData(data);
    setUserChartData(userData);
    setLoading(prev => ({ ...prev, chart: false }));
  }, [allCleans, allSales, selectedDay, branches]);

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

  // Effects
  useEffect(() => {
    loadStats();
    loadBranches();
    loadChartData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Simple Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground dark:text-white">Dashboard Overview</h1>
            <p className="text-muted-foreground dark:text-gray-300">Welcome to your Firebase Admin Dashboard</p>
          </div>
          <Button 
            onClick={() => {
              loadStats();
              loadBranches();
              loadChartData();
            }} 
            disabled={loading.stats || loading.branches || loading.chart}
            className="bg-background border border-border text-foreground hover:bg-muted"
          >
            {loading.stats || loading.branches || loading.chart ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Car className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Today's Daily Cleans</p>
                <p className="text-3xl font-bold text-foreground">
                  {loading.stats ? '...' : stats?.todayCleans || 0}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{loading.stats ? '...' : stats?.weeklyCleans || 0}</span> cleans this week
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Today's Sales Prep</p>
                <p className="text-3xl font-bold text-foreground">
                  {loading.stats ? '...' : stats?.todaySales || 0}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{loading.stats ? '...' : stats?.weeklySales || 0}</span> prep this week
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground dark:text-white">Activity Analytics</h2>
              <p className="text-sm text-muted-foreground dark:text-gray-300">Compare performance across branches and system users</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="w-[180px] h-9 bg-background border-border text-foreground">
                  <SelectValue placeholder="Select Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="This-Week">This Week</SelectItem>
                  <SelectItem value="Last-Week">Last Week</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Branch Chart Card */}
            <Card className="border border-border">
              <CardHeader className="py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-foreground">Activity per Branch</CardTitle>
                  <Badge variant="outline" className="text-blue-500 bg-blue-500/10 border-none hidden sm:inline-flex">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>{chartData.length} Branches</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="aspect-auto h-[350px] w-full">
                  {loading.chart ? (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      Loading chart data...
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      No data available for the selected day.
                    </div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 10, left: 40, bottom: 40 }}>
                        <rect x="0" y="0" width="100%" height="85%" fill="url(#default-multiple-pattern-dots)" />
                        <XAxis
                          dataKey="branch"
                          tickLine={false}
                          tickFormatter={(value) => value.length > 25 ? value.slice(0, 22) + '...' : value}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          dx={-5}
                          dy={5}
                          tick={{ fontSize: 11 }}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                        <Bar dataKey="dailyCleans" fill="var(--color-dailyCleans)" shape={<CustomHatchedBar isHatched={false} />} radius={4}>
                          <LabelList dataKey="dailyCleans" position="top" fill="currentColor" className="fill-foreground font-semibold text-[10px]" formatter={(value: any) => value > 0 ? value : ''} />
                        </Bar>
                        <Bar dataKey="salesPrep" fill="var(--color-salesPrep)" shape={<CustomHatchedBar />} radius={4}>
                          <LabelList dataKey="salesPrep" position="top" fill="currentColor" className="fill-foreground font-semibold text-[10px]" formatter={(value: any) => value > 0 ? value : ''} />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Chart Card */}
            <Card className="border border-border">
              <CardHeader className="py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-foreground">Uploads per User</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-500 bg-green-500/10 border-none hidden sm:inline-flex">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{userChartData.length} Users</span>
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/user-uploads')}>
                      Show all
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="aspect-auto h-[350px] w-full">
                  {loading.chart ? (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      Loading chart data...
                    </div>
                  ) : userChartData.length === 0 ? (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      No data available for the selected day.
                    </div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <BarChart accessibilityLayer data={userChartData} margin={{ top: 20, right: 10, left: 40, bottom: 40 }}>
                        <rect x="0" y="0" width="100%" height="85%" fill="url(#default-multiple-pattern-dots)" />
                        <XAxis
                          dataKey="user"
                          tickLine={false}
                          tickFormatter={(value) => value.split(' ')[0]}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          dx={-5}
                          dy={5}
                          tick={{ fontSize: 11 }}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                        <Bar 
                           dataKey="dailyCleans" 
                           fill="var(--color-dailyCleans)" 
                           shape={<CustomHatchedBar isHatched={false} />} 
                           radius={4}
                           className="cursor-pointer"
                           onClick={(data: any) => {
                             const user = data?.payload?.user || data?.user;
                             if (user) router.push(`/dashboard/daily-cleans?user=${encodeURIComponent(user)}`);
                           }}
                        >
                          <LabelList dataKey="dailyCleans" position="top" fill="currentColor" className="fill-foreground font-semibold text-[10px]" formatter={(value: any) => value > 0 ? value : ''} />
                        </Bar>
                        <Bar 
                           dataKey="salesPrep" 
                           fill="var(--color-salesPrep)" 
                           shape={<CustomHatchedBar />} 
                           radius={4}
                           className="cursor-pointer"
                           onClick={(data: any) => {
                             const user = data?.payload?.user || data?.user;
                             if (user) router.push(`/dashboard/sales-prep?user=${encodeURIComponent(user)}`);
                           }}
                        >
                          <LabelList dataKey="salesPrep" position="top" fill="currentColor" className="fill-foreground font-semibold text-[10px]" formatter={(value: any) => value > 0 ? value : ''} />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        </div>
    </DashboardLayout>
  );
}
