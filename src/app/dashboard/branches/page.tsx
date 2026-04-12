'use client';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataService, Branch } from '@/lib/data-service';
import { MapPin } from "lucide-react";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const result = await DataService.getBranches();
      setBranches(result);
    } catch (error) {
      console.error('Error loading branches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const toggleBranchStatus = async (branch: Branch) => {
    const newStatus = branch.status === 'inactive' ? 'active' : 'inactive';
    try {
      // Optimistic update
      setBranches(branches.map(b => b.id === branch.id ? { ...b, status: newStatus } : b));
      await DataService.updateBranch(branch.id, { status: newStatus });
    } catch (error) {
      console.error('Error changing branch status:', error);
      // Revert if error
      setBranches(branches.map(b => b.id === branch.id ? { ...b, status: branch.status } : b));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Simple Header matching the Dashboard styling */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground dark:text-white">Branch Locations</h1>
            <p className="text-muted-foreground dark:text-gray-300">View and manage all branch locations</p>
          </div>
          <Button 
            onClick={() => loadBranches()} 
            disabled={loading}
            className="bg-background border border-border text-foreground hover:bg-muted"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {/* Simplified Locations List with Status & Actions */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Locations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading locations...</div>
            ) : branches.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No branches found.</div>
            ) : (
              <div className="divide-y divide-border">
                {branches.map(branch => {
                  // Ensure we show the best available readable name
                  let locationName = branch.location && branch.location.trim() !== '' && branch.location !== 'N/A' && branch.location !== 'N/A - No Data' 
                      ? branch.location 
                      : branch.name;
                      
                  const knownLocations: Record<string,string> = { 
                    '1': 'Shady Spring', 
                    '2': 'Birmingham', 
                    '3': 'Akron-Canton', 
                    '4': 'Buckhannon', 
                    '5': 'Dayton', 
                    '6': 'Beckley' 
                  };
                  
                  if (!isNaN(Number(locationName)) && knownLocations[branch.name]) {
                     locationName = knownLocations[branch.name];
                  }

                  const isActive = branch.status !== 'inactive';

                  return (
                    <div key={branch.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-4">
                      
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-blue-500" />
                        </div>
                        <p className={`font-medium ${!isActive ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {locationName}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4 ml-14 sm:ml-0">
                        <Badge className={`px-2 py-1 ${isActive ? 'bg-green-500/20 text-green-500 border-none' : 'bg-muted text-muted-foreground border-transparent'}`}>
                           {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => toggleBranchStatus(branch)}
                          className={isActive ? 'border-border text-foreground hover:bg-muted' : 'border-green-500 text-green-500 hover:bg-green-500/10'}
                        >
                           {isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                      
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
