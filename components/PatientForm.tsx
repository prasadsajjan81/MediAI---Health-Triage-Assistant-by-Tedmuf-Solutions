import React from 'react';
import { PatientData, Gender, Language } from '../types';

interface PatientFormProps {
  data: PatientData;
  onChange: (field: keyof PatientData, value: any) => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ data, onChange }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center">
        <span className="w-1 h-6 bg-teal-500 rounded-full mr-3"></span>
        Patient Details
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Preference */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Language</label>
           <select
            value={data.language}
            onChange={(e) => onChange('language', e.target.value as Language)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all bg-white"
          >
            {Object.values(Language).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">The analysis will be generated in this language.</p>
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
          <input
            type="number"
            value={data.age}
            onChange={(e) => onChange('age', e.target.value)}
            placeholder="e.g. 35"
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
          />
        </div>

        {/* Sex */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sex</label>
          <select
            value={data.sex}
            onChange={(e) => onChange('sex', e.target.value as Gender)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all bg-white"
          >
            {Object.values(Gender).map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Duration */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Duration of Problem</label>
          <input
            type="text"
            value={data.duration}
            onChange={(e) => onChange('duration', e.target.value)}
            placeholder="e.g. 2 days, 1 week, sudden onset"
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
          />
        </div>

        {/* Existing Conditions */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Existing Medical Conditions</label>
          <input
            type="text"
            value={data.conditions}
            onChange={(e) => onChange('conditions', e.target.value)}
            placeholder="e.g. Diabetes, Hypertension, Asthma"
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
          />
        </div>

        {/* Medications */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Current Medications</label>
          <input
            type="text"
            value={data.medications}
            onChange={(e) => onChange('medications', e.target.value)}
            placeholder="e.g. Metformin 500mg, Ibuprofen"
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default PatientForm;