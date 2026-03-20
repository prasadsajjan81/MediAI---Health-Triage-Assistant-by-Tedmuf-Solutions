import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, SubscriptionPlan } from '../types';
import { Users, Trash2, Shield, UserPlus, Search, X, Check, Crown, CreditCard } from 'lucide-react';

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    displayName: '',
    role: 'user' as 'admin' | 'user',
    subscriptionPlan: SubscriptionPlan.Free
  });

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      if (error.code !== 'permission-denied') {
        console.error('Admin users listener error:', error);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteUser = async (uid: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user.');
      }
    }
  };

  const handleUpdateRole = async (uid: string, newRole: 'admin' | 'user' | 'student' | 'doctor' | 'hospital') => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleUpdatePlan = async (uid: string, newPlan: SubscriptionPlan) => {
    try {
      const updates: any = { 
        subscriptionPlan: newPlan,
        subscriptionStatus: newPlan === SubscriptionPlan.Free ? 'free' : 'active'
      };
      
      // Sync role with plan if not admin
      const user = users.find(u => u.uid === uid);
      if (user && user.role !== 'admin') {
        if (newPlan === SubscriptionPlan.Student) updates.role = 'student';
        else if (newPlan === SubscriptionPlan.Doctor) updates.role = 'doctor';
        else if (newPlan === SubscriptionPlan.Hospital) updates.role = 'hospital';
        else updates.role = 'user';
      }

      await updateDoc(doc(db, 'users', uid), updates);
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd also need to create the auth user via Firebase Admin SDK
    // For this demo, we'll just create the firestore document
    const uid = `manual_${Date.now()}`;
    try {
      await setDoc(doc(db, 'users', uid), {
        uid,
        ...newUser,
        subscriptionStatus: newUser.subscriptionPlan === SubscriptionPlan.Free ? 'free' : 'active',
        subscriptionEndDate: null,
        freeTestsRemaining: 5,
        reportCount: 0,
        lastReportReset: new Date().toISOString()
      });
      setIsAddingUser(false);
      setNewUser({ email: '', displayName: '', role: 'user', subscriptionPlan: SubscriptionPlan.Free });
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-600 rounded-lg text-white">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Admin Control Center</h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Manage Users & Subscriptions</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsAddingUser(true)}
              className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              <UserPlus size={18} />
              <span>Add User</span>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
              <X size={20} className="text-slate-600" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-white border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-4 pl-2">User</th>
                    <th className="pb-4">Role</th>
                    <th className="pb-4">Plan</th>
                    <th className="pb-4">Usage</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pl-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                            {user.displayName?.[0] || user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{user.displayName || 'Unnamed User'}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <select 
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.uid, e.target.value as any)}
                          className="text-xs font-bold bg-slate-100 border-none rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-500/20 table-select cursor-pointer"
                        >
                          <option value="user">User</option>
                          <option value="student">Student</option>
                          <option value="doctor">Doctor</option>
                          <option value="hospital">Hospital</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-4">
                        <select 
                          value={user.subscriptionPlan}
                          onChange={(e) => handleUpdatePlan(user.uid, e.target.value as SubscriptionPlan)}
                          className="text-xs font-bold bg-slate-100 border-none rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-500/20 table-select cursor-pointer"
                        >
                          <option value={SubscriptionPlan.Free}>Free</option>
                          <option value={SubscriptionPlan.Patient}>Patient</option>
                          <option value={SubscriptionPlan.Student}>Student</option>
                          <option value={SubscriptionPlan.Doctor}>Doctor</option>
                          <option value={SubscriptionPlan.Hospital}>Hospital</option>
                        </select>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-mono text-slate-500">
                          {user.subscriptionStatus === 'free' ? `${user.freeTestsRemaining || 0} left` : (user.reportCount || 0)}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                          user.subscriptionStatus === 'active' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {user.subscriptionStatus}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <button 
                          onClick={() => handleDeleteUser(user.uid)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isAddingUser && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Add New User</h3>
                <button onClick={() => setIsAddingUser(false)} className="p-2 hover:bg-slate-100 rounded-full cursor-pointer">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Name</label>
                  <input 
                    type="text" 
                    required
                    value={newUser.displayName}
                    onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'user'})}
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 form-select cursor-pointer"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plan</label>
                    <select 
                      value={newUser.subscriptionPlan}
                      onChange={(e) => setNewUser({...newUser, subscriptionPlan: e.target.value as SubscriptionPlan})}
                      className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 form-select cursor-pointer"
                    >
                      <option value={SubscriptionPlan.Free}>Free</option>
                      <option value={SubscriptionPlan.Patient}>Patient</option>
                      <option value={SubscriptionPlan.Student}>Student</option>
                      <option value={SubscriptionPlan.Doctor}>Doctor</option>
                      <option value={SubscriptionPlan.Hospital}>Hospital</option>
                    </select>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition-all mt-4 cursor-pointer"
                >
                  Create User Profile
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
