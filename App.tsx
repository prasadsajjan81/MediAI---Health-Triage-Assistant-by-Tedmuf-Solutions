import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PatientForm from './components/PatientForm';
import FileUpload from './components/FileUpload';
import AudioRecorder from './components/AudioRecorder';
import AnalysisResult from './components/AnalysisResult';
import DoctorDashboard from './components/DoctorDashboard';
import { PatientData, Gender, FileData, AnalysisState, Language, AudioData, AnalysisRecord } from './types';
import { analyzeHealthData } from './services/geminiService';
import { AlertTriangle, Leaf, Loader2, Sparkles, User, Stethoscope } from 'lucide-react';
import { generatePDF } from './utils/pdfGenerator';

const INITIAL_PATIENT_DATA: PatientData = {
  age: '',
  sex: Gender.Male,
  language: Language.Auto,
  duration: '',
  conditions: '',
  medications: '',
  symptoms: '',
  includeAyurveda: false,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor'>('patient');
  const [patientData, setPatientData] = useState<PatientData>(INITIAL_PATIENT_DATA);
  const [symptomFiles, setSymptomFiles] = useState<FileData[]>([]);
  const [reportFile, setReportFile] = useState<FileData | null>(null);
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  
  const [analysis, setAnalysis] = useState<AnalysisState>({
    loading: false,
    result: null,
    error: null
  });

  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);

  // Load history from local storage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('mediAI-history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  const handleDataChange = (field: keyof PatientData, value: any) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  const saveAnalysisRecord = (markdownResult: string) => {
    try {
      // 1. Extract Triage Level
      let triageLevel = "Unknown";
      const lowerMD = markdownResult.toLowerCase();
      if (lowerMD.includes("emergency") || lowerMD.includes("seek immediate care")) {
        triageLevel = "Emergency – Seek Immediate Care";
      } else if (lowerMD.includes("see a doctor soon") || lowerMD.includes("medical attention advised")) {
        triageLevel = "See a Doctor Soon";
      } else if (lowerMD.includes("likely mild") || lowerMD.includes("self-care")) {
        triageLevel = "Likely Mild – Self-care";
      }

      // 2. Extract Quick Summary
      let summaryQuick = "";
      const lines = markdownResult.split('\n');
      let captureSummary = false;
      for (const line of lines) {
        if (line.match(/^(#+|\*\*|📋).*Summary.*Understanding/i) || line.match(/^(#+|\*\*|🔎).*Quick Summary/i)) {
          captureSummary = true;
          continue;
        }
        if (captureSummary) {
          if (line.match(/^(#+|\*\*|🚨|🚦|🔍|🎯|📄|🌿|✅|🧭|👨‍⚕️)/)) {
            break; 
          }
          if (line.trim().length > 0) {
            summaryQuick += line.replace(/\*\*/g, '').trim() + " ";
          }
        }
      }

      const newRecord: AnalysisRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        patientAge: patientData.age,
        patientSex: patientData.sex,
        duration: patientData.duration,
        conditions: patientData.conditions,
        medications: patientData.medications,
        triageLevel: triageLevel,
        summaryQuick: summaryQuick.trim().substring(0, 150) + (summaryQuick.length > 150 ? '...' : ''),
        markdown: markdownResult
      };

      const updatedHistory = [newRecord, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('mediAI-history', JSON.stringify(updatedHistory));
      
    } catch (e) {
      console.error("Error saving analysis record", e);
    }
  };

  const handleAnalyze = async () => {
    if (!patientData.age) {
      setAnalysis({ ...analysis, error: "Please provide your Age." });
      return;
    }
    if (!patientData.symptoms && !audioData) {
      setAnalysis({ ...analysis, error: "Please describe your symptoms in text or record audio." });
      return;
    }

    setAnalysis({ loading: true, result: null, error: null });

    try {
      const result = await analyzeHealthData(patientData, symptomFiles, reportFile, audioData);
      setAnalysis({ loading: false, result, error: null });
      
      saveAnalysisRecord(result);

      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setAnalysis({ 
        loading: false, 
        result: null, 
        error: err.message || "Something went wrong. Please try again." 
      });
    }
  };

  const handleDoctorViewRecord = (record: AnalysisRecord) => {
    setSelectedRecord(record);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Tab Switcher */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
            <button 
              onClick={() => setActiveTab('patient')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'patient' ? 'bg-teal-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <User size={16} className="mr-2" /> Patient View
            </button>
            <button 
              onClick={() => setActiveTab('doctor')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'doctor' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Stethoscope size={16} className="mr-2" /> Doctor Panel
            </button>
          </div>
        </div>

        {/* --- PATIENT TAB --- */}
        {activeTab === 'patient' && (
          <>
            {/* Safety Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-amber-800 text-sm">Medical Disclaimer</h3>
                <p className="text-amber-700 text-sm mt-1">
                  MediAI is an AI tool for informational purposes only. It is <strong>not a doctor</strong>. 
                  If you are experiencing a medical emergency, call emergency services immediately.
                </p>
              </div>
            </div>

            <div className={`transition-all duration-500 space-y-8 ${analysis.result ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <PatientForm data={patientData} onChange={handleDataChange} />
              <AudioRecorder audioData={audioData} setAudioData={setAudioData} />
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <span className="w-1 h-6 bg-teal-500 rounded-full mr-3"></span>
                  Describe Symptoms (Text)
                </h2>
                <textarea
                  value={patientData.symptoms}
                  onChange={(e) => handleDataChange('symptoms', e.target.value)}
                  placeholder="Describe what you are feeling in your own words. Include when it started, pain levels (1-10), and location..."
                  className="w-full h-40 p-4 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none resize-none text-slate-700 leading-relaxed"
                ></textarea>
              </div>

              <FileUpload 
                symptomFiles={symptomFiles}
                setSymptomFiles={setSymptomFiles}
                reportFile={reportFile}
                setReportFile={setReportFile}
              />

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group"
                  onClick={() => handleDataChange('includeAyurveda', !patientData.includeAyurveda)}>
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl transition-colors ${patientData.includeAyurveda ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                    <Leaf size={24} />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-lg ${patientData.includeAyurveda ? 'text-teal-900' : 'text-slate-700'}`}>Ayurvedic Interpretation</h3>
                    <p className="text-sm text-slate-500">Get Dosha-based insights and holistic wellness tips</p>
                  </div>
                </div>
                <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${patientData.includeAyurveda ? 'bg-teal-500' : 'bg-slate-300'}`}>
                  <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${patientData.includeAyurveda ? 'translate-x-6' : ''}`}></div>
                </div>
              </div>

              {analysis.error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium flex items-center">
                  <AlertTriangle className="mr-2" size={18} />
                  {analysis.error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={analysis.loading}
                className={`w-full py-5 px-6 rounded-2xl font-bold text-xl text-white shadow-xl shadow-teal-500/20 flex items-center justify-center space-x-3 transition-all transform hover:-translate-y-1 active:translate-y-0
                  ${analysis.loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600'}`}
              >
                {analysis.loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Analyzing inputs...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={24} />
                    <span>Analyze with MediAI</span>
                  </>
                )}
              </button>
            </div>

            {analysis.result && (
              <div id="results-section" className="mt-12">
                <AnalysisResult 
                    markdown={analysis.result} 
                    language={patientData.language}
                    patientData={patientData}
                />
                
                <button 
                  onClick={() => {
                    setAnalysis({ loading: false, result: null, error: null });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="mt-8 w-full py-4 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Start New Analysis
                </button>
              </div>
            )}
          </>
        )}

        {/* --- DOCTOR TAB --- */}
        {activeTab === 'doctor' && (
          <div className="animate-in fade-in duration-500">
            {selectedRecord ? (
              <AnalysisResult 
                markdown={selectedRecord.markdown}
                language={Language.English} // History view defaults to what's in text or assume English/Auto for now
                patientData={{
                  age: selectedRecord.patientAge || '',
                  sex: (selectedRecord.patientSex as Gender) || Gender.Other,
                  language: Language.Auto,
                  duration: selectedRecord.duration || '',
                  conditions: selectedRecord.conditions || '',
                  medications: selectedRecord.medications || '',
                  symptoms: '',
                  includeAyurveda: false
                }}
                recordId={selectedRecord.id}
                onBack={() => setSelectedRecord(null)}
              />
            ) : (
              <DoctorDashboard 
                history={history}
                onSelectRecord={handleDoctorViewRecord}
                onDownloadPdf={(record) => generatePDF(record)}
              />
            )}
          </div>
        )}

      </main>
    </div>
  );
}