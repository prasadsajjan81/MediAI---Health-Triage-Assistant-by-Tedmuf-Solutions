import React, { useState } from 'react';
import Header from './components/Header';
import PatientForm from './components/PatientForm';
import FileUpload from './components/FileUpload';
import AudioRecorder from './components/AudioRecorder';
import AnalysisResult from './components/AnalysisResult';
import { PatientData, Gender, FileData, AnalysisState, Language, AudioData } from './types';
import { analyzeHealthData } from './services/geminiService';
import { AlertTriangle, Leaf, Loader2, Sparkles } from 'lucide-react';

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
  const [patientData, setPatientData] = useState<PatientData>(INITIAL_PATIENT_DATA);
  const [symptomFiles, setSymptomFiles] = useState<FileData[]>([]);
  const [reportFile, setReportFile] = useState<FileData | null>(null);
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  
  const [analysis, setAnalysis] = useState<AnalysisState>({
    loading: false,
    result: null,
    error: null
  });

  const handleDataChange = (field: keyof PatientData, value: any) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = async () => {
    // Basic Validation: Needs at least Age and (Symptoms OR Audio)
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
      // Scroll to result
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

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
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

        {/* Input Form Section */}
        <div className={`transition-all duration-500 space-y-8 ${analysis.result ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          
          <PatientForm data={patientData} onChange={handleDataChange} />

          {/* Audio Input */}
          <AudioRecorder audioData={audioData} setAudioData={setAudioData} />

          {/* Symptoms Text Input */}
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

          {/* Ayurvedic Toggle */}
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

          {/* Error Message */}
          {analysis.error && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium flex items-center">
              <AlertTriangle className="mr-2" size={18} />
              {analysis.error}
            </div>
          )}

          {/* CTA Button */}
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

        {/* Results Section */}
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

      </main>
    </div>
  );
}