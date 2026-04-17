'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataService, User } from '@/lib/data-service';
import { Plus } from 'lucide-react';

interface CreateJobModalProps {
  jobType: 'd-id' | 'biohazard';
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    type: 'd-id' | 'biohazard';
    stockNumber: string;
    branch?: string;
    insurance?: string;
    make?: string;
    model?: string;
    year?: string;
    vin?: string;
    assignedUserId?: string;
    assignedUserName?: string;
    createdBy: string;
  }) => Promise<void>;
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
      resetForm();
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