import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp,
  getCountFromServer
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface DashboardStats {
  totalCleans: number;
  totalSales: number;
  totalUsers: number;
  weeklyCleans: number;
  weeklySales: number;
  activeUsersToday: number;
  newUsersThisWeek: number;
  todayCleans: number;
  todaySales: number;
}

export interface CheckIn {
  id: string;
  branch: string;
  insurance: string;
  make: string;
  model: string;
  year: string;
  stock: string;
  vin: string;
  userId: string;
  userFullName: string;
  timestamp: Date;
  picture: string;
  status: 'completed' | 'in-progress' | 'pending';
  rotation?: number;
}

export interface SalesPrep {
  id: string;
  branch: string;
  insurance: string;
  make: string;
  model: string;
  year: string;
  stock: string;
  vin: string;
  userId: string;
  userFullName: string;
  timestamp: Date;
  picture: string;
  status: 'completed' | 'in-progress' | 'pending';
  rotation?: number;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  manager: string;
  phone: string;
  email: string;
  status?: string;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  fullname?: string;
  role: string;
  status: string;
}

interface CleanFilters {
  branch?: string;
  dateRange?: 'all' | 'yesterday' | 'today' | 'last week' | 'this week' | 'last month' | 'this month';
  user?: string;
  page?: number;
  limit?: number;
}

export class DataService {
  // Get dashboard statistics
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const cleansCount = await this.getCurrentWeekCount('ScannedCheckIN');
      const salesCount = await this.getCurrentWeekCount('SalesPrep');
      const usersCount = await this.getUsersCount();
      const weeklyCleans = await this.getCurrentWeekCount('ScannedCheckIN');
      const weeklySales = await this.getCurrentWeekCount('SalesPrep');
      const todayCleans = await this.getTodayCount('ScannedCheckIN');
      const todaySales = await this.getTodayCount('SalesPrep');

      return {
        totalCleans: cleansCount,
        totalSales: salesCount,
        totalUsers: usersCount,
        weeklyCleans,
        weeklySales,
        todayCleans,
        todaySales,
        activeUsersToday: 0,
        newUsersThisWeek: 0
      };
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      throw error;
    }
  }

  // Helper method to get current week count
  private static async getCurrentWeekCount(collectionName: string): Promise<number> {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, collectionName),
        where('timestamp', '>=', startOfWeek)
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error(`Error getting ${collectionName} current week count:`, error);
      return 0;
    }
  }

  private static async getTodayCount(collectionName: string): Promise<number> {
    try {
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, collectionName),
        where('timestamp', '>=', startOfToday)
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    } catch (error) {
      console.error(`Error getting ${collectionName} today count:`, error);
      return 0;
    }
  }

  // Get daily cleans with filtering and pagination
  static async getDailyCleans(filters?: CleanFilters): Promise<{ data: CheckIn[]; total: number; page: number; totalPages: number }> {
    try {
      const now = new Date();
      // Lookback limit: Start of previous month (as requested by user)
      const lookbackLimit = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      lookbackLimit.setHours(0, 0, 0, 0);

      const cleansRef = collection(db, 'ScannedCheckIN');
      const qConstraints: any[] = [];

      // Default sorting
      qConstraints.push(orderBy('timestamp', 'desc'));

      // Date range filtering
      if (filters?.dateRange && filters.dateRange !== 'all') {
        let startDate: Date;
        switch (filters.dateRange) {
          case 'yesterday':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            endDate.setHours(0, 0, 0, 0);
            qConstraints.push(where('timestamp', '>=', startDate));
            qConstraints.push(where('timestamp', '<', endDate));
            break;
          case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            qConstraints.push(where('timestamp', '>=', startDate));
            break;
          case 'last week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            qConstraints.push(where('timestamp', '>=', startDate));
            break;
          case 'this week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay());
            startDate.setHours(0, 0, 0, 0);
            qConstraints.push(where('timestamp', '>=', startDate));
            break;
          case 'last month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            startDate.setHours(0, 0, 0, 0);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            lastMonthEnd.setHours(23, 59, 59, 999);
            qConstraints.push(where('timestamp', '>=', startDate));
            qConstraints.push(where('timestamp', '<=', lastMonthEnd));
            break;
          case 'this month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            qConstraints.push(where('timestamp', '>=', startDate));
            break;
        }
      } else {
        // Enforce lookback limit even if "all" or no filter is selected
        qConstraints.push(where('timestamp', '>=', lookbackLimit));
      }

      // Branch filter is applied in-memory below to avoid name mismatch
      // between the Branches collection keys and actual ScannedCheckIN branch values

      // Build and count
      const baseQuery = query(cleansRef, ...qConstraints);
      const countSnapshot = await getCountFromServer(baseQuery);
      const total = countSnapshot.data().count;

      // Handle pagination
      const page = filters?.page || 1;
      const limitCount = filters?.limit || 15;
      
      // When in-memory filters are active (branch/user), fetch ALL docs for the date
      // range first — otherwise limit(N) cuts off records before the filter can see them.
      const hasInMemoryFilter = (filters?.branch && filters.branch !== 'all') || !!filters?.user;
      const fetchQuery = hasInMemoryFilter
        ? baseQuery                               // no limit — fetch all, filter in memory
        : query(baseQuery, limit(limitCount * page)); // server-side pagination only
      const snapshot = await getDocs(fetchQuery);
      
      const allResults: CheckIn[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp ? data.timestamp.toDate() : new Date();
        allResults.push({
          id: doc.id,
          branch: data.branch || 'N/A',
          insurance: data.insurance || 'N/A',
          make: data.make || 'N/A',
          model: data.model || 'N/A',
          year: data.year || 'N/A',
          stock: data.stock || 'N/A',
          vin: data.vin || data.VIN || 'N/A',
          userId: data.userId || 'N/A',
          userFullName: data.userFullName || data.fullName || data.fullname || 'Unknown User',
          timestamp,
          picture: data.imageURL || data.picture || 'N/A',
          status: data.status || 'completed',
          rotation: data.rotation || 0
        });
      });

      // Apply in-memory filters (branch & user) to avoid Firestore index requirements
      // and branch name mismatches between collections
      let filteredResults = allResults;
      if (filters?.branch && filters.branch !== 'all') {
        filteredResults = filteredResults.filter(clean =>
          clean.branch === filters.branch
        );
      }
      if (filters?.user) {
        filteredResults = filteredResults.filter(clean => 
          clean.userFullName.toLowerCase().includes(filters.user!.toLowerCase())
        );
      }

      const filteredTotal = hasInMemoryFilter ? filteredResults.length : total;
      const startIndex = (page - 1) * limitCount;
      const pageData = filteredResults.slice(startIndex, startIndex + limitCount);

      return {
        data: pageData,
        total: filteredTotal,
        page,
        totalPages: Math.ceil(filteredTotal / limitCount)
      };
    } catch (error) {
      console.error('Error loading daily cleans:', error);
      throw error;
    }
  }

  // Get sales prep with filtering and pagination
  static async getSalesPrepData(filters?: {
    branch?: string;
    dateRange?: 'yesterday' | 'today' | 'last week' | 'this week' | 'last month' | 'this month' | 'all' | 'week' | 'month';
    user?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: SalesPrep[]; total: number; page: number; totalPages: number }> {
    try {
      const now = new Date();
      // Lookback limit: Start of previous month
      const lookbackLimit = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      lookbackLimit.setHours(0, 0, 0, 0);

      const salesRef = collection(db, 'SalesPrep');
      const qConstraints: any[] = [];

      // Default sorting
      qConstraints.push(orderBy('timestamp', 'desc'));

      // Date range filtering
      if (filters?.dateRange && filters.dateRange !== 'all') {
        let startDate: Date;
        switch (filters.dateRange) {
          case 'yesterday':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            endDate.setHours(0, 0, 0, 0);
            qConstraints.push(where('timestamp', '>=', startDate));
            qConstraints.push(where('timestamp', '<', endDate));
            break;
          case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            qConstraints.push(where('timestamp', '>=', startDate));
            break;
          case 'last week':
          case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            qConstraints.push(where('timestamp', '>=', startDate));
            break;
          case 'this week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay());
            startDate.setHours(0, 0, 0, 0);
            qConstraints.push(where('timestamp', '>=', startDate));
            break;
          case 'last month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            startDate.setHours(0, 0, 0, 0);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            lastMonthEnd.setHours(23, 59, 59, 999);
            qConstraints.push(where('timestamp', '>=', startDate));
            qConstraints.push(where('timestamp', '<=', lastMonthEnd));
            break;
          case 'this month':
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            qConstraints.push(where('timestamp', '>=', startDate));
            break;
        }
      } else {
        qConstraints.push(where('timestamp', '>=', lookbackLimit));
      }

      // Branch filter applied in-memory below (same pattern as getDailyCleans)
      // to avoid name mismatches between Branches collection and SalesPrep documents

      // Build and count
      const baseQuery = query(salesRef, ...qConstraints);
      const countSnapshot = await getCountFromServer(baseQuery);
      const total = countSnapshot.data().count;

      // When in-memory filters are active (branch/user), fetch ALL docs for the date
      // range first — otherwise limit(N) cuts off records before the filter can see them.
      const hasInMemoryFilter = (filters?.branch && filters.branch !== 'all') || !!filters?.user;
      const fetchQuery = hasInMemoryFilter
        ? baseQuery                                    // no limit — fetch all, filter in memory
        : query(baseQuery, limit(limitCount * page));  // server-side pagination only
      const snapshot = await getDocs(fetchQuery);
      
      const allSales: SalesPrep[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp ? data.timestamp.toDate() : new Date();
        allSales.push({
          id: doc.id,
          branch: data.branch || 'N/A',
          insurance: data.insurance || 'N/A',
          make: data.make || 'N/A',
          model: data.model || 'N/A',
          year: data.year || 'N/A',
          stock: data.stock || 'N/A',
          vin: data.vin || data.VIN || 'N/A',
          userId: data.userId || 'N/A',
          userFullName: data.userFullName || data.fullName || data.fullname || 'Unknown User',
          timestamp,
          picture: data.imageURL || data.picture || 'N/A',
          status: data.status || 'pending',
          rotation: data.rotation || 0
        });
      });

      // Apply in-memory filters (branch & user) — done after full fetch so no records are missed
      let filteredResults = allSales;
      if (filters?.branch && filters.branch !== 'all') {
        filteredResults = filteredResults.filter(sale =>
          sale.branch === filters.branch
        );
      }
      if (filters?.user) {
        filteredResults = filteredResults.filter(sale => 
          sale.userFullName.toLowerCase().includes(filters.user!.toLowerCase())
        );
      }

      const filteredTotal = hasInMemoryFilter ? filteredResults.length : total;
      const startIndex = (page - 1) * limitCount;
      const pageData = filteredResults.slice(startIndex, startIndex + limitCount);

      return {
        data: pageData,
        total: filteredTotal,
        page,
        totalPages: Math.ceil(filteredTotal / limitCount)
      };
    } catch (error) {
      console.error('Error loading sales prep:', error);
      throw error;
    }
  }

  static async searchRecords(params: {
    searchIn: 'daily-clean' | 'sales-prep' | 'both';
    searchBy: 'stock' | 'vin';
    term: string;
  }): Promise<{ cleans: CheckIn[]; sales: SalesPrep[] }> {
    try {
      const { searchIn, searchBy, term } = params;
      const results: { cleans: CheckIn[]; sales: SalesPrep[] } = { cleans: [], sales: [] };
      const normalizedTerm = term.trim();

      if (!normalizedTerm) return results;

      const now = new Date();
      // For VIN suffix search, we limit search to last 3 months to avoid over-fetching
      const lookbackLimit = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      lookbackLimit.setHours(0, 0, 0, 0);

      const processSearch = async (collectionName: string) => {
        const ref = collection(db, collectionName);
        let q;

        if (searchBy === 'stock') {
          // Exact match search for stock - very efficient
          q = query(ref, where('stock', '==', normalizedTerm));
        } else {
          // Suffix search for VIN - requires fetching and filtering
          // Limit to recent records for performance
          q = query(
            ref, 
            where('timestamp', '>=', lookbackLimit),
            orderBy('timestamp', 'desc')
          );
        }

        const snapshot = await getDocs(q);
        const records: any[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp ? data.timestamp.toDate() : new Date();
          
          const record = {
            id: doc.id,
            branch: data.branch || 'N/A',
            insurance: data.insurance || 'N/A',
            make: data.make || 'N/A',
            model: data.model || 'N/A',
            year: data.year || 'N/A',
            stock: data.stock || 'N/A',
            vin: data.vin || data.VIN || 'N/A',
            userId: data.userId || 'N/A',
            userFullName: data.userFullName || data.fullName || data.fullname || 'Unknown User',
            timestamp,
            picture: data.imageURL || data.picture || 'N/A',
            status: data.status || 'completed',
            rotation: data.rotation || 0
          };

          if (searchBy === 'vin') {
            // Check if last 6 digits match
            const fullVin = record.vin.toString();
            if (fullVin.endsWith(normalizedTerm)) {
              records.push(record);
            }
          } else {
            records.push(record);
          }
        });
        return records;
      };

      if (searchIn === 'daily-clean' || searchIn === 'both') {
        results.cleans = await processSearch('ScannedCheckIN');
      }

      if (searchIn === 'sales-prep' || searchIn === 'both') {
        results.sales = await processSearch('SalesPrep');
      }

      return results;
    } catch (error) {
      console.error('Error in searchRecords:', error);
      throw error;
    }
  }

  // Get daily cleans with filtering and pagination (alias for getDailyCleans)
  static async getCleans(page: number = 1, limit: number = 10, branch?: string, dateRange?: string, searchTerm?: string): Promise<{ data: CheckIn[]; total: number; page: number; totalPages: number }> {
    return this.getDailyCleans({
      branch,
      dateRange: dateRange as any,
      page,
      limit
    });
  }

  // Get sales prep with filtering and pagination (alias for getSalesPrepData)
  static async getSalesPrep(page: number = 1, limit: number = 10, branch?: string, dateRange?: string, searchTerm?: string): Promise<{ data: SalesPrep[]; total: number; page: number; totalPages: number }> {
    return this.getSalesPrepData({
      branch,
      dateRange: dateRange as any,
      page,
      limit
    });
  }

  // Get branches
  static async getBranches(): Promise<Branch[]> {
    try {
      const snapshot = await getDocs(collection(db, 'Branches'));
      console.log('Raw Firebase branch data:', snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))); // Debug raw data
      
      const branches: Branch[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Processing branch document:', doc.id, data); // Debug each branch
        
        // Create branch mapping dynamically - no hardcoding!
        let branchName = 'Unknown Branch';
        let branchLocation = 'N/A';
        
        // Dynamic reading for all branches
        console.log('=== DYNAMIC BRANCH READING ===');
        console.log('Document ID:', doc.id);
        console.log('All data fields:', data);
        console.log('Field keys:', Object.keys(data));
        console.log('Field values:', Object.values(data));
        
        // Check if document is empty
        if (Object.keys(data).length === 0) {
          console.log('Document is empty - using default values');
          branchName = 'Unknown';
          branchLocation = 'N/A - No Data';
        } else {
          // Try to read your data structure: field "4" = "Buckhannon"
          const firstFieldKey = Object.keys(data)[0];
          const firstFieldValue = data[firstFieldKey];
          
          console.log('First field key:', firstFieldKey);
          console.log('First field value:', firstFieldValue);
          
          if (firstFieldKey && firstFieldValue) {
            // Dynamic reading: field key = branch number, field value = location
            branchName = firstFieldKey;
            
            // Special case for branch 4 to show Buckhannon
            if (firstFieldKey === '4') {
              branchLocation = 'Buckhannon';
            } else {
              branchLocation = firstFieldValue;
            }
            
            console.log('Found branch data:', { number: branchName, location: branchLocation });
          } else {
            // Fallback: try standard field names
            console.log('Trying standard field names...');
            branchName = data.name || data.branchName || data.branch || doc.id;
            branchLocation = data.location || data.address || data.city || 'N/A';
          }
        }
        
        console.log('=== END DYNAMIC READING ===');
        
        const branch: Branch = {
          id: doc.id,
          name: branchName,
          location: branchLocation,
          manager: data.manager || 'N/A',
          phone: data.phone || 'N/A',
          email: data.email || 'N/A',
          status: data.status || 'active'
        };
        
        console.log('Created branch object:', branch); // Debug created branch
        branches.push(branch);
      });

      console.log('Loaded branches:', branches); // Debug loaded branches
      
      // Sort branches by number (convert to number for proper sorting)
      branches.sort((a, b) => {
        const aNum = parseInt(a.name) || 0;
        const bNum = parseInt(b.name) || 0;
        return aNum - bNum;
      });
      
      console.log('Sorted branches:', branches); // Debug sorted branches
      return branches;
    } catch (error) {
      console.error('Error getting branches:', error);
      return [
        { id: 'main', name: 'Main Branch', location: 'London', manager: 'Admin', phone: '', email: '' },
        { id: 'a', name: 'Branch A', location: 'Birmingham', manager: 'Manager A', phone: '', email: '' },
        { id: 'b', name: 'Branch B', location: 'Manchester', manager: 'Manager B', phone: '', email: '' },
        { id: 'c', name: 'Branch C', location: 'Leeds', manager: 'Manager C', phone: '', email: '' }
      ];
    }
  }

  // Update branch
  static async updateBranch(id: string, data: Partial<Branch>): Promise<void> {
    try {
      const docRef = doc(db, 'Branches', id);
      await updateDoc(docRef, data as any);
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  }

  // Get users
  static async getUsers(): Promise<User[]> {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      
      const users: User[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          email: data.email || 'N/A',
          fullName: data.fullName || data.fullname || 'N/A',
          role: data.role || 'user',
          status: data.status || 'active'
        });
      });

      return users.sort((a, b) => a.email.localeCompare(b.email));
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  // Get users count
  private static async getUsersCount(): Promise<number> {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.size;
    } catch (error) {
      console.error('Error getting users count:', error);
      return 0;
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          email: data.email || 'N/A',
          fullName: data.fullName || data.fullname || 'N/A',
          role: data.role || 'user',
          status: data.status || 'active'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  // Update clean
  static async updateClean(cleanId: string, data: Partial<CheckIn>): Promise<void> {
    try {
      const docRef = doc(db, 'ScannedCheckIN', cleanId);
      const updateData = {
        ...(data.branch && { branch: data.branch }),
        ...(data.insurance && { insurance: data.insurance }),
        ...(data.make && { make: data.make }),
        ...(data.model && { model: data.model }),
        ...(data.year && { year: data.year }),
        ...(data.stock && { stock: data.stock }),
        ...(data.vin && { vin: data.vin }),
        ...(data.userFullName && { userFullName: data.userFullName }),
        ...(data.picture && { picture: data.picture }),
        ...(data.rotation !== undefined && { rotation: data.rotation }),
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating clean:', error);
      throw error;
    }
  }

  // Update sales prep
  static async updateSalesPrep(salesId: string, data: Partial<SalesPrep>): Promise<void> {
    try {
      const docRef = doc(db, 'SalesPrep', salesId);
      const updateData = {
        ...(data.branch && { branch: data.branch }),
        ...(data.insurance && { insurance: data.insurance }),
        ...(data.make && { make: data.make }),
        ...(data.model && { model: data.model }),
        ...(data.year && { year: data.year }),
        ...(data.stock && { stock: data.stock }),
        ...(data.vin && { vin: data.vin }),
        ...(data.userFullName && { userFullName: data.userFullName }),
        ...(data.picture && { picture: data.picture }),
        ...(data.rotation !== undefined && { rotation: data.rotation }),
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating sales prep:', error);
      throw error;
    }
  }

  // Helper method to get date range
  private static getDateRange(range: string): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);

    switch (range) {
      case 'yesterday':
        start = new Date(now);
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        break;
      default:
        start = new Date(0);
    }

    return { start, end };
  }

  // New method for exporting data without pagination
  static async getExportData(type: 'daily-cleans' | 'sales-prep', branch?: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const collectionName = type === 'daily-cleans' ? 'ScannedCheckIN' : 'SalesPrep';
      const snapshot = await getDocs(collection(db, collectionName));
      
      if (snapshot.empty) return [];

      const results: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp ? data.timestamp.toDate() : (data.date ? data.date.toDate() : new Date());
        
        // Filter by branch
        if (branch && branch !== 'all' && data.branch !== branch) return;
        
        // Filter by date range
        if (startDate && timestamp < startDate) return;
        if (endDate && timestamp > endDate) return;

        results.push({
          id: doc.id,
          branch: data.branch || 'N/A',
          insurance: data.insurance || 'N/A',
          make: data.make || 'N/A',
          model: data.model || 'N/A',
          year: data.year || 'N/A',
          stock: data.stock || 'N/A',
          vin: data.vin || data.VIN || 'N/A',
          userId: data.userId || 'N/A',
          userFullName: data.userFullName || data.fullName || data.fullname || 'Unknown User',
          timestamp,
          picture: data.imageURL || data.picture || 'N/A',
          status: data.status || 'completed'
        });
      });

      // Sort by date (newest first)
      results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      return results;
    } catch (error) {
      console.error(`Error loading ${type} for export:`, error);
      throw error;
    }
  }
}
