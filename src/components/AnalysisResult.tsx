import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  AlertCircle, 
  Sparkles, 
  ChevronDown, 
  AlertTriangle, 
  CheckCircle,
  Stethoscope,
  Activity,
  FileText,
  Leaf,
  Navigation,
  ClipboardList,
  ClipboardCheck,
  ArrowRight,
  Volume2,
  StopCircle,
  FileDown,
  ArrowLeft,
  GraduationCap,
  BriefcaseMedical,
  Microscope
} from 'lucide-react';
import { Language, PatientData, AnalysisRecord } from '../types';
import { generatePDF } from '../utils/pdfGenerator';

interface AnalysisResultProps {
  markdown: string;
  language?: Language;
  patientData?: PatientData;
  recordId?: string;
  onBack?: () => void;
}

interface Section {
  title: string;
  content: string;
  icon: React.ReactNode;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ markdown, language, patientData, recordId, onBack }) => {
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setCanSpeak(true);
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const parseSections = (text: string): Section[] => {
    const sections: Section[] = [];
    const lines = text.split('\n');
    let currentSection: Section | null = null;

    const getIconForTitle = (title: string) => {
      const lower = title.toLowerCase();
      if (lower.includes('safety')) return <AlertCircle className="text-red-500" />;
      if (lower.includes('triage') || lower.includes('analysis')) return <Stethoscope className="text-teal-500" />;
      if (lower.includes('professional') || lower.includes('insight') || lower.includes('clinical') || lower.includes('academic')) return <Microscope className="text-purple-500" />;
      if (lower.includes('wellness') || lower.includes('guidance') || lower.includes('ayurveda')) return <Leaf className="text-green-500" />;
      if (lower.includes('doctor') || lower.includes('handover')) return <ClipboardCheck className="text-slate-600" />;
      return <Activity className="text-slate-500" />;
    };

    lines.forEach((line) => {
      if (line.match(/^(#+|\*\*|⚠️|🩺|🔬|🌿|📋)/) && line.length < 100 && line.trim().length > 3) {
        if (currentSection) sections.push(currentSection);
        
        const title = line.replace(/^[#\d\.\s\*⚠️🩺🔬🌿📋]+/, '').replace(/[\*:]+$/g, '').trim();
        currentSection = {
          title: title || "Section",
          content: "",
          icon: getIconForTitle(title)
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    });

    if (currentSection) sections.push(currentSection);
    if (sections.length === 0) {
      sections.push({ title: "Analysis Result", content: text, icon: <Sparkles className="text-teal-500" /> });
    }
    return sections;
  };

  const sections = parseSections(markdown);
  const triageLevel = markdown.toLowerCase().includes('emergency') ? 'emergency' : 
                     (markdown.toLowerCase().includes('soon') ? 'urgent' : 'mild');

  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSpeak = () => {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(markdown.replace(/[#\*_]/g, ''));
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    const record: AnalysisRecord = {
      id: recordId || 'live',
      createdAt: new Date().toISOString(),
      patientAge: patientData?.age,
      patientSex: patientData?.sex?.toString(),
      duration: patientData?.duration,
      conditions: patientData?.conditions,
      medications: patientData?.medications,
      triageLevel: triageLevel,
      markdown: markdown
    };
    await generatePDF(record);
    setIsGeneratingPDF(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {onBack && (
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
          <ArrowLeft size={18} className="mr-1" /> Back to Dashboard
        </button>
      )}

      <div className={`rounded-3xl border shadow-xl overflow-hidden transition-all duration-500 ${
        triageLevel === 'emergency' ? 'bg-red-50 border-red-200' : 
        triageLevel === 'urgent' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
      }`}>
        <div className="p-6 flex items-center justify-between border-b border-black/5">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-2xl ${
              triageLevel === 'emergency' ? 'bg-red-500 text-white' : 
              triageLevel === 'urgent' ? 'bg-orange-500 text-white' : 'bg-teal-500 text-white'
            }`}>
              {triageLevel === 'emergency' ? <AlertCircle size={24} /> : triageLevel === 'urgent' ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {triageLevel === 'emergency' ? 'Emergency' : triageLevel === 'urgent' ? 'Urgent Care' : 'Mild / Self-Care'}
              </h2>
              <p className="text-sm text-slate-600 font-medium">AI-powered health assessment</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleDownloadPDF} 
              disabled={isGeneratingPDF}
              className={`p-2 rounded-xl border shadow-sm transition-all ${isGeneratingPDF ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer'}`}
            >
              <FileDown size={20} className={isGeneratingPDF ? 'animate-bounce' : ''} />
            </button>
            <button onClick={isSpeaking ? () => window.speechSynthesis.cancel() : handleSpeak} className={`p-2 rounded-xl border shadow-sm transition-all ${isSpeaking ? 'bg-red-500 text-white border-red-400 cursor-pointer' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer'}`}>
              {isSpeaking ? <StopCircle size={20} /> : <Volume2 size={20} />}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <button onClick={() => toggleSection(idx)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-slate-50 rounded-xl text-teal-600 border border-slate-100">
                  {section.icon}
                </div>
                <h3 className="font-bold text-slate-800 text-lg">{section.title}</h3>
              </div>
              <ChevronDown className={`text-slate-400 transition-transform duration-300 ${expandedSections[idx] ? 'rotate-180' : ''}`} />
            </button>
            
            {expandedSections[idx] && (
              <div className="px-6 pb-6 pt-2 border-t border-slate-50">
                <div className="markdown-body prose prose-slate max-w-none">
                  <Markdown>{section.content}</Markdown>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start space-x-3">
        <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Disclaimer:</strong> This triage assessment is generated by an AI model and is for educational purposes only. It does not constitute medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
        </p>
      </div>
    </div>
  );
};

export default AnalysisResult;
