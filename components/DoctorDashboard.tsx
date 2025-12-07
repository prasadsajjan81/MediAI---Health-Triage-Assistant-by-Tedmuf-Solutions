import React, { useState } from 'react';
import { AnalysisRecord } from '../types';
import { Search, FileDown, Eye, Filter, Calendar, User, Clock, Activity } from 'lucide-react';

interface DoctorDashboardProps {
  history: AnalysisRecord[];
  onSelectRecord: (record: AnalysisRecord) => void;
  onDownloadPdf: (record: AnalysisRecord) => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ history, onSelectRecord, onDownloadPdf }) => {
  const [filterTriage, setFilterTriage] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredHistory = history.filter(record => {
    // Triage Filter
    if (filterTriage !== 'All') {
      const level = (record.triageLevel || '').toLowerCase();
      if (filterTriage === 'Emergency' && !level.includes('emergency')) return false;
      if (filterTriage === 'Urgent' && !level.includes('soon')) return false;
      if (filterTriage === 'Mild' && !level.includes('mild')) return false;
    }
    
    // Search Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match = 
        (record.conditions || '').toLowerCase().includes(term) ||
        (record.summaryQuick || '').toLowerCase().includes(term) ||
        (record.patientAge || '').includes(term);
      if (!match) return false;
    }

    return true;
  });

  const getTriageBadge = (triage: string | undefined) => {
    const t = (triage || '').toLowerCase();
    if (t.includes('emergency')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Emergency</span>;
    }
    if (t.includes('soon')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Urgent</span>;
    }
    if (t.includes('mild')) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Mild</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Unknown</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center">
           <Activity className="mr-2 text-teal-600" /> Doctor Dashboard
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
            {/* Filter */}
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                   value={filterTriage}
                   onChange={(e) => setFilterTriage(e.target.value)}
                   className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none appearance-none bg-white"
                >
                    <option value="All">All Levels</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Urgent">See Doctor Soon</option>
                    <option value="Mild">Likely Mild</option>
                </select>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search conditions, age..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-500 outline-none w-full sm:w-64"
                />
            </div>
        </div>
      </div>

      {/* Table/Card Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
         {filteredHistory.length === 0 ? (
             <div className="p-12 text-center text-slate-500">
                 <p>No records found matching your criteria.</p>
             </div>
         ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-900">
                        <tr>
                            <th className="px-6 py-4">Date / Time</th>
                            <th className="px-6 py-4">Patient</th>
                            <th className="px-6 py-4">Condition / Summary</th>
                            <th className="px-6 py-4">Triage</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredHistory.map((record) => (
                            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        {new Date(record.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                        <Clock size={12} />
                                        {new Date(record.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900 flex items-center gap-2">
                                        <User size={14} className="text-teal-600" />
                                        {record.patientAge} yrs, {record.patientSex}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        Dur: {record.duration}
                                    </div>
                                </td>
                                <td className="px-6 py-4 max-w-xs">
                                    <div className="truncate font-medium text-slate-900">{record.conditions || "No conditions"}</div>
                                    <div className="truncate text-xs text-slate-500 mt-0.5">{record.summaryQuick || "No summary available"}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {getTriageBadge(record.triageLevel)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                          onClick={() => onSelectRecord(record)}
                                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                          title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button 
                                          onClick={() => onDownloadPdf(record)}
                                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                          title="Download PDF"
                                        >
                                            <FileDown size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         )}
      </div>
    </div>
  );
};

export default DoctorDashboard;