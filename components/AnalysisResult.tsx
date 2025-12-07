import React, { useState, useEffect } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { Language, PatientData, AnalysisRecord } from '../types';
import { generatePDF } from '../utils/pdfGenerator';

interface AnalysisResultProps {
  markdown: string;
  language?: Language;
  patientData?: PatientData;
  recordId?: string; // If viewing a historical record
  onBack?: () => void; // Function to go back if viewing history
}

interface Section {
  title: string;
  content: string[];
  icon: React.ReactNode;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ markdown, language, patientData, recordId, onBack }) => {
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setCanSpeak(true);
      window.speechSynthesis.getVoices();
    }
    
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const parseMarkdown = (text: string): Section[] => {
    const lines = text.split('\n');
    const sections: Section[] = [];
    let currentSection: Section | null = null;

    const getIconForTitle = (title: string) => {
      const lower = title.toLowerCase();
      if (lower.includes('safety')) return <AlertCircle className="text-red-500" />;
      if (lower.includes('summary')) return <ClipboardList className="text-blue-500" />;
      if (lower.includes('triage')) return <AlertTriangle className="text-orange-500" />;
      if (lower.includes('explanation') || lower.includes('differential')) return <Stethoscope className="text-teal-500" />;
      if (lower.includes('report') || lower.includes('lab')) return <FileText className="text-purple-500" />;
      if (lower.includes('ayurveda') || lower.includes('ayurvedic')) return <Leaf className="text-green-500" />;
      if (lower.includes('next') || lower.includes('can do')) return <Navigation className="text-indigo-500" />;
      if (lower.includes('doctor') || lower.includes('handover')) return <ClipboardCheck className="text-slate-600" />;
      return <Activity className="text-slate-500" />;
    };

    lines.forEach((line) => {
      const headerMatch = line.match(/^((#+\s)|(\d+\.\s))?(\*\*)?(.+?)(\*\*)?(:)?$/);
      const isHeaderCandidate = (line.startsWith('#') || line.match(/^\d+\.\s/)) && line.length < 100;
      const isBoldTitle = line.startsWith('**') && line.endsWith('**') && line.length < 80;

      if ((isHeaderCandidate || isBoldTitle) && line.trim().length > 3) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        let title = line
          .replace(/^[#\d\.\s\*]+/, '')
          .replace(/[\*:]+$/g, '')
          .trim();
        
        title = title.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, '').trim();

        currentSection = {
          title: title,
          content: [],
          icon: getIconForTitle(title)
        };
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }
    
    if (sections.length === 0) {
       sections.push({ title: "Analysis Output", content: lines, icon: <Sparkles className="text-teal-500" /> });
    }

    return sections;
  };

  const sections = parseMarkdown(markdown);

  const getTriageLevel = () => {
    const triageSection = sections.find(s => s.title.toLowerCase().includes('triage'));
    if (!triageSection) return 'unknown';
    
    const text = triageSection.content.join(' ').toLowerCase();
    if (text.includes('emergency')) return 'emergency';
    if (text.includes('doctor soon') || text.includes('see a doctor') || text.includes('urgent')) return 'urgent';
    if (text.includes('mild') || text.includes('self-care')) return 'mild';
    return 'unknown';
  };

  const triageLevel = getTriageLevel();

  const summarySection = sections.find(s => s.title.toLowerCase().includes('summary') && !s.title.toLowerCase().includes('handover'));
  const nextStepsSection = sections.find(s => s.title.toLowerCase().includes('next') || s.title.toLowerCase().includes('can do'));
  
  const accordionSections = sections.filter(s => {
      const t = s.title.toLowerCase();
      return !t.includes('triage') && !t.includes('safety');
  });

  const getQuickActions = () => {
      if (!nextStepsSection) return [];
      return nextStepsSection.content
        .filter(line => line.trim().match(/^[-*]|\d+\./))
        .slice(0, 3)
        .map(line => line.replace(/^[-*]|\d+\.\s*/, '').replace(/\*\*/g, '').trim());
  };
  const quickActions = getQuickActions();

  const getSummarySnippet = () => {
      if (!summarySection) return null;
      const line = summarySection.content.find(l => l.trim().length > 0 && !l.trim().startsWith('-'));
      return line ? line.replace(/\*\*/g, '') : "Review the full summary below.";
  };
  const summarySnippet = getSummarySnippet();

  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const cleanText = (text: string) => text
    .replace(/\*\*/g, '')           
    .replace(/__/g, '')             
    .replace(/\[.*?\]\(.*?\)/g, '') 
    .replace(/^\s*[-*•]\s+/gm, '')  
    .trim();

  const renderContent = (lines: string[]) => {
    return lines.map((line, i) => {
      if (line.trim() === '') return <div key={i} className="h-2"></div>;
      
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const parsedLine = parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={i} className="flex items-start ml-2 mb-1.5">
            <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0"></span>
            <span className="text-slate-700 leading-relaxed">{parsedLine}</span>
          </div>
        );
      }
      
      if (line.match(/^\d+\.\s/)) {
         return <p key={i} className="text-slate-700 leading-relaxed mb-1.5 ml-2 font-medium">{parsedLine}</p>;
      }
      
      return <p key={i} className="text-slate-700 leading-relaxed mb-2">{parsedLine}</p>;
    });
  };

  const mapLanguageToBCP47 = (lang: string | undefined): string => {
    switch (lang) {
      case 'Hindi': return 'hi-IN';
      case 'Kannada': return 'kn-IN';
      case 'Telugu': return 'te-IN';
      case 'Tamil': return 'ta-IN';
      case 'Marathi': return 'mr-IN';
      case 'Bengali': return 'bn-IN';
      case 'Gujarati': return 'gu-IN';
      case 'Malayalam': return 'ml-IN';
      case 'Odia': return 'or-IN';
      case 'English': return 'en-US';
      default: return 'auto';
    }
  };

  const extractSpeakableText = (): string => {
    let textParts: string[] = [];
    if (triageLevel === 'emergency') textParts.push("Emergency Recommendation. Immediate medical care is recommended.");
    else if (triageLevel === 'urgent') textParts.push("Medical Attention Advised. You should plan to see a doctor soon.");
    else if (triageLevel === 'mild') textParts.push("Likely Mild Condition. Self-care may be sufficient.");

    if (summarySection) {
      const summaryText = summarySection.content.join('. ');
      textParts.push("Summary: " + cleanText(summaryText));
    }

    if (nextStepsSection) {
      textParts.push("Next steps: ");
      const bullets = nextStepsSection.content.filter(line => line.trim().match(/^[-*]|\d+\./));
      if (bullets.length > 0) {
        textParts.push(cleanText(bullets.join('. ')));
      } else {
        textParts.push(cleanText(nextStepsSection.content.join('. ')));
      }
    }

    return textParts.join('. ').replace(/\.\./g, '.');
  };

  const handleSpeak = () => {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    const speakableText = extractSpeakableText();
    const utterance = new SpeechSynthesisUtterance(speakableText);
    const langCode = mapLanguageToBCP47(language?.toString());
    if (langCode !== 'auto') utterance.lang = langCode;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleDownloadPDF = () => {
    // Construct record-like object for PDF generator
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
    generatePDF(record);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Back Button (Only for History Mode) */}
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <ArrowLeft size={18} className="mr-1" /> Back to Dashboard
        </button>
      )}

      {/* QUICK VIEW CARD */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden transition-all duration-500
        ${triageLevel === 'emergency' ? 'bg-red-50 border-red-200' : 
          triageLevel === 'urgent' ? 'bg-orange-50 border-orange-200' :
          triageLevel === 'mild' ? 'bg-green-50 border-green-200' :
          'bg-white border-slate-200'}`}>
        
        {/* Header / Banner */}
        <div className={`p-5 flex items-start justify-between gap-4 border-b 
            ${triageLevel === 'emergency' ? 'border-red-100/50' : 
              triageLevel === 'urgent' ? 'border-orange-100/50' :
              triageLevel === 'mild' ? 'border-green-100/50' :
              'border-slate-100'}`}>
          
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full flex-shrink-0 
              ${triageLevel === 'emergency' ? 'bg-red-200 text-red-700' : 
                triageLevel === 'urgent' ? 'bg-orange-200 text-orange-700' :
                triageLevel === 'mild' ? 'bg-green-200 text-green-700' :
                'bg-slate-100 text-slate-600'}`}>
              {triageLevel === 'emergency' ? <AlertCircle size={28} /> :
               triageLevel === 'urgent' ? <AlertTriangle size={28} /> :
               triageLevel === 'mild' ? <CheckCircle size={28} /> :
               <Activity size={28} />}
            </div>
            
            <div>
              <h2 className={`text-xl font-bold capitalize tracking-tight
                  ${triageLevel === 'emergency' ? 'text-red-900' : 
                    triageLevel === 'urgent' ? 'text-orange-900' :
                    triageLevel === 'mild' ? 'text-green-900' :
                    'text-slate-900'}`}>
                {triageLevel === 'emergency' ? 'Emergency Recommendation' :
                 triageLevel === 'urgent' ? 'Medical Attention Advised' :
                 triageLevel === 'mild' ? 'Likely Mild Condition' :
                 'Analysis Complete'}
              </h2>
              <p className={`text-sm font-medium mt-1 opacity-90
                  ${triageLevel === 'emergency' ? 'text-red-800' : 
                    triageLevel === 'urgent' ? 'text-orange-800' :
                    triageLevel === 'mild' ? 'text-green-800' :
                    'text-slate-600'}`}>
                 {triageLevel === 'emergency' ? 'Based on the analysis, immediate medical care is recommended.' :
                 triageLevel === 'urgent' ? 'You should plan to see a doctor soon for evaluation.' :
                 triageLevel === 'mild' ? 'Self-care may be sufficient, but monitor symptoms.' :
                 'Review the detailed breakdown below.'}
              </p>
            </div>
          </div>

          {/* TTS Controls */}
          {canSpeak && (
            <div className="flex-shrink-0">
               {isSpeaking ? (
                 <button 
                   onClick={handleStop}
                   className="flex items-center space-x-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                 >
                   <StopCircle size={16} />
                   <span>Stop</span>
                 </button>
               ) : (
                 <button 
                   onClick={handleSpeak}
                   className="flex items-center space-x-2 px-3 py-1.5 bg-white/50 text-slate-700 rounded-lg text-sm font-medium hover:bg-white/80 border border-slate-200/50 transition-colors"
                 >
                   <Volume2 size={16} />
                   <span>Listen to Summary</span>
                 </button>
               )}
            </div>
          )}
        </div>

        {/* Quick Summary Body */}
        <div className="p-5 bg-white/60">
             {summarySnippet && (
                <div className="mb-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center">
                        <Sparkles size={14} className="mr-1.5" /> Quick Summary
                    </h3>
                    <p className="text-slate-800 text-sm leading-relaxed font-medium">
                        {summarySnippet}
                    </p>
                </div>
             )}

             {quickActions.length > 0 && (
                 <div className="bg-white/80 rounded-xl p-4 border border-black/5 shadow-sm">
                     <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center">
                         <ArrowRight size={14} className="mr-1.5" /> Recommended Actions
                     </h4>
                     <ul className="space-y-2">
                         {quickActions.map((action, i) => (
                             <li key={i} className="flex items-start text-sm text-slate-700">
                                 <span className={`mt-1.5 mr-2 w-1.5 h-1.5 rounded-full flex-shrink-0 
                                     ${triageLevel === 'emergency' ? 'bg-red-400' : 
                                       triageLevel === 'urgent' ? 'bg-orange-400' : 
                                       'bg-green-400'}`}></span>
                                 {action}
                             </li>
                         ))}
                     </ul>
                 </div>
             )}
        </div>
      </div>

      <button 
        onClick={handleDownloadPDF}
        className="w-full flex items-center justify-center space-x-2 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl shadow-sm hover:bg-slate-50 hover:text-teal-600 hover:border-teal-200 transition-all group"
      >
        <FileDown size={18} className="group-hover:scale-110 transition-transform" />
        <span className="font-semibold text-sm">Download Full Report (PDF)</span>
      </button>

      <div className="space-y-3">
        {accordionSections.map((section, idx) => {
          const isExpanded = expandedSections[idx] === true; 
          return (
            <div key={idx} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
              <button 
                onClick={() => toggleSection(idx)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-slate-100 text-teal-600' : 'bg-white text-slate-400 border border-slate-100'}`}>
                    {section.icon}
                  </div>
                  <h3 className="font-semibold text-base text-slate-800 text-left">{section.title}</h3>
                </div>
                <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                  <ChevronDown className="text-slate-400 w-5 h-5" />
                </div>
              </button>
              
              <div 
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 pt-0 border-t border-slate-50 mt-1">
                     <div className="prose prose-sm prose-slate max-w-none mt-4">
                       {renderContent(section.content)}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-start p-4 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-200 mt-2">
         <AlertCircle className="mr-2 flex-shrink-0 text-slate-400" size={16} />
         <p>Disclaimer: This analysis is generated by AI (Gemini 3 Pro) and may contain errors. Do not rely on it for medical decisions. Always consult a qualified healthcare professional.</p>
      </div>
    </div>
  );
};

export default AnalysisResult;