import React, { useRef } from 'react';
import { Camera, FileText, X, Upload, Image as ImageIcon } from 'lucide-react';
import { FileData } from '../types';
import { processFile, isValidImage, isValidDocument } from '../utils/fileHelpers';

interface FileUploadProps {
  symptomFiles: FileData[];
  setSymptomFiles: React.Dispatch<React.SetStateAction<FileData[]>>;
  reportFile: FileData | null;
  setReportFile: React.Dispatch<React.SetStateAction<FileData | null>>;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  symptomFiles, 
  setSymptomFiles, 
  reportFile, 
  setReportFile 
}) => {
  const symptomInputRef = useRef<HTMLInputElement>(null);
  const reportInputRef = useRef<HTMLInputElement>(null);

  const handleSymptomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(isValidImage).slice(0, 3 - symptomFiles.length); // Limit to 3
      
      const processedFiles = await Promise.all(validFiles.map(processFile));
      setSymptomFiles(prev => [...prev, ...processedFiles]);
    }
  };

  const handleReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isValidDocument(file)) {
        const processed = await processFile(file);
        setReportFile(processed);
      } else {
        alert("Please upload a valid image or PDF.");
      }
    }
  };

  const removeSymptomFile = (index: number) => {
    setSymptomFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeReportFile = () => {
    setReportFile(null);
    if (reportInputRef.current) reportInputRef.current.value = '';
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center">
        <span className="w-1 h-6 bg-teal-500 rounded-full mr-3"></span>
        Attachments
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Symptom Images */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Symptom Images (Max 3)
            <span className="block text-xs text-slate-500 font-normal mt-0.5">Skin issues, wounds, visible signs.</span>
          </label>
          
          {/* Horizontal Scroll Container */}
          <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {/* Add Button */}
            {symptomFiles.length < 3 && (
              <button 
                onClick={() => symptomInputRef.current?.click()}
                className="flex-shrink-0 w-28 h-28 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-teal-500 hover:text-teal-500 hover:bg-teal-50/50 transition-all group"
              >
                <div className="bg-slate-100 p-2 rounded-full mb-2 group-hover:bg-white transition-colors">
                  <Camera size={20} />
                </div>
                <span className="text-xs font-medium">Add Photo</span>
              </button>
            )}

            {/* Image Previews */}
            {symptomFiles.map((file, idx) => (
              <div key={idx} className="relative group flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                <img src={file.previewUrl} alt={`symptom-${idx}`} className="w-full h-full object-cover" />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                
                {/* Remove Button */}
                <button 
                  onClick={() => removeSymptomFile(idx)}
                  className="absolute top-1 right-1 bg-white/90 text-slate-600 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white transform hover:scale-105"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            
            {/* Placeholder to show empty state clearly if no images */}
            {symptomFiles.length === 0 && (
               <div className="flex flex-col justify-center h-28 px-4 text-slate-400 text-xs italic">
                 No images selected
               </div>
            )}
          </div>

          <input 
            type="file" 
            ref={symptomInputRef} 
            onChange={handleSymptomUpload} 
            accept="image/*" 
            multiple 
            className="hidden" 
          />
        </div>

        {/* Lab Report */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Medical Report / Lab (Max 1)
            <span className="block text-xs text-slate-500 font-normal mt-0.5">PDF or Image of results/prescription.</span>
          </label>
          
          <div className="mt-1">
            {!reportFile ? (
              <button 
                onClick={() => reportInputRef.current?.click()}
                className="w-full h-28 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:border-teal-500 hover:text-teal-500 hover:bg-teal-50/50 transition-all bg-slate-50/50"
              >
                <FileText size={24} className="mb-2 opacity-70" />
                <span className="text-sm font-medium">Upload Report</span>
                <span className="text-xs opacity-60 mt-1">PDF or Image</span>
              </button>
            ) : (
              <div className="relative w-full h-28 rounded-xl border border-teal-200 bg-teal-50/50 flex flex-col items-center justify-center p-4 group">
                <FileText size={32} className="text-teal-600 mb-2" />
                <span className="text-sm text-teal-800 font-medium truncate w-full text-center px-2">
                  {reportFile.file.name}
                </span>
                <span className="text-xs text-teal-600 uppercase tracking-wider mt-1">
                  {reportFile.file.name.split('.').pop()}
                </span>

                <button 
                  onClick={removeReportFile} 
                  className="absolute top-2 right-2 p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-lg shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={reportInputRef} 
              onChange={handleReportUpload} 
              accept="image/*,application/pdf" 
              className="hidden" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;