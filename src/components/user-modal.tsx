'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, DataService } from '@/lib/data-service';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface UserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  mode: 'edit' | 'add';
}

export function UserModal({ user, isOpen, onClose, onSave, mode }: UserModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({
    fullName: '',
    email: '',
    role: 'user',
    status: 'active',
    branch: ''
  });
  const [loading, setLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [branches, setBranches] = useState<string[]>([]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const result = await DataService.getBranches();
        const branchNames = result
          .filter(b => b.status === 'active')
          .map(b => b.name)
          .sort();
        setBranches(branchNames);
      } catch (error) {
        console.error('Error loading branches:', error);
      }
    };
    loadBranches();
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setFormData({
          fullName: user.fullName || '',
          email: user.email || '',
          role: user.role || 'user',
          status: user.status || 'active',
          branch: user.branch || ''
        });
      } else {
        setFormData({
          fullName: '',
          email: '',
          role: 'user',
          status: 'active',
          branch: ''
        });
      }
      setResetMessage('');
    }
  }, [isOpen, user, mode]);

  const handleChange = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const branchValue = formData.branch === '__none__' ? '' : formData.branch || '';
        
        if (mode === 'edit' && user) {
          const docRef = doc(db, 'users', user.id);
          await updateDoc(docRef, {
            fullname: formData.fullName,
            email: formData.email,
            role: formData.role,
            isDisabled: formData.status === 'inactive',
            branch: branchValue,
            updatedAt: serverTimestamp()
          });
          onSave({ ...user, ...formData } as User);
        } else {
          const docRef = await addDoc(collection(db, 'users'), {
            fullname: formData.fullName,
            email: formData.email,
            role: formData.role || 'user',
            isDisabled: formData.status === 'inactive',
            branch: branchValue,
            createdAt: serverTimestamp()
          });
          onSave({ ...formData, id: docRef.id } as User);
        }
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) return;
    setResettingPassword(true);
    setResetMessage('');
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setResetMessage('Password reset email sent successfully.');
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      setResetMessage(error.message || 'Failed to send reset email.');
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Update user information below.' : 'Fill in the details to create a new user.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName || ''}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
              {mode === 'edit' && (
                <div className="flex flex-col gap-2 mt-1">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePasswordReset}
                    disabled={resettingPassword || !formData.email}
                    className="w-fit"
                  >
                    {resettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Password Reset Email
                  </Button>
                  {resetMessage && (
                    <span className={`text-xs ${resetMessage.includes('sent') ? 'text-green-500' : 'text-red-500'}`}>
                      {resetMessage}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={formData.role || 'user'} 
                onValueChange={(value) => handleChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status || 'active'} 
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="branch">Branch</Label>
              <Select 
                value={formData.branch || ''} 
                onValueChange={(value) => handleChange('branch', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Branch</SelectItem>
                  {branches.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}