import { jsPDF } from 'jspdf';
import { AnalysisRecord } from '../types';

// Helper to clean markdown text
const stripMarkdown = (text: string): string => {
  return text
    .replace(/[\p{S}\p{C}]/gu, "") // remove emojis and symbols
    .replace(/^#{1,6}\s*/gm, "") // remove headings
    .replace(/^>\s?/gm, "") // remove blockquotes
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // remove links
    .replace(/[*_`~]/g, "") // remove bold/italic
    .replace(/^\s*[-+*]\s+/gm, "• ") // normalize bullets
    .replace(/\n{3,}/g, "\n\n") // collapse newlines
    .replace(/[ \t]{2,}/g, " ") // trim spaces
    .trim();
};

const cleanText = (text: string) => text.replace(/\*\*/g, '').replace(/__/g, '').trim();

// Extract sections from Markdown
const parseSectionsForPDF = (markdown: string) => {
  const lines = markdown.split('\n');
  let triageContent: string[] = [];
  let summaryContent: string[] = [];
  let handoverContent: string[] = [];
  let ayurvedaContent: string[] = [];
  let nextStepsContent: string[] = [];

  let currentSection = '';

  lines.forEach(line => {
    const lower = line.toLowerCase();
    
    // Detect Section Headers
    if (line.match(/^(#+|\*\*|🚨|📋|👨‍⚕️|🌿|✅)/)) {
        if (lower.includes('triage') || lower.includes('urgency')) currentSection = 'triage';
        else if (lower.includes('summary') && !lower.includes('handover')) currentSection = 'summary';
        else if (lower.includes('handover') || lower.includes('doctor')) currentSection = 'handover';
        else if (lower.includes('ayurveda')) currentSection = 'ayurveda';
        else if (lower.includes('next') || lower.includes('can do')) currentSection = 'nextsteps';
        else if (lower.includes('safety') || lower.includes('disclaimer')) currentSection = 'safety'; // Ignore
        else currentSection = 'other';
    } else if (currentSection && line.trim().length > 0) {
        if (currentSection === 'triage') triageContent.push(line);
        if (currentSection === 'summary') summaryContent.push(line);
        if (currentSection === 'handover') handoverContent.push(line);
        if (currentSection === 'ayurveda') ayurvedaContent.push(line);
        if (currentSection === 'nextsteps') nextStepsContent.push(line);
    }
  });

  return { triageContent, summaryContent, handoverContent, ayurvedaContent, nextStepsContent };
};

export const generatePDF = (record: AnalysisRecord) => {
  try {
    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
    });

    let y = 40;
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);

    // Helpers
    const checkPageBreak = (needed: number) => {
      if (y + needed > 800) {
        doc.addPage();
        y = 40;
      }
    };

    const drawSeparator = () => {
      y += 10;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 20;
    };

    // 1. Header
    doc.setFontSize(18);
    doc.setTextColor(13, 148, 136); // Teal
    doc.setFont("helvetica", "bold");
    doc.text("MediAI – Health Triage Report", margin, y);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date(record.createdAt).toLocaleString()}`, pageWidth - margin, y, { align: 'right' });
    y += 25;

    // 2. Safety Disclaimer
    doc.setFontSize(9);
    doc.setTextColor(220, 38, 38); // Red
    doc.setFont("helvetica", "bold");
    const disclaimer = "MediAI is an AI assistant, not a doctor. This report is for informational purposes only and is not a medical diagnosis or treatment plan. Always consult a professional.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, contentWidth);
    doc.text(splitDisclaimer, margin, y);
    y += (splitDisclaimer.length * 10) + 10;

    drawSeparator();

    // 3. Patient Basics
    checkPageBreak(80);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Basics", margin, y);
    y += 15;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const basics = [
      `Age/Sex: ${record.patientAge || 'N/A'} / ${record.patientSex || 'N/A'}`,
      `Duration: ${record.duration || 'N/A'}`,
      `Conditions: ${record.conditions || 'None'}`,
      `Medications: ${record.medications || 'None'}`
    ];
    
    basics.forEach(line => {
      doc.text(`• ${line}`, margin + 10, y);
      y += 12;
    });

    drawSeparator();

    // Parse Sections
    const { triageContent, summaryContent, handoverContent, ayurvedaContent, nextStepsContent } = parseSectionsForPDF(record.markdown);

    // 4. Triage Level
    if (record.triageLevel) {
        checkPageBreak(50);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        
        const level = record.triageLevel.toLowerCase();
        if (level.includes('emergency')) doc.setTextColor(220, 38, 38);
        else if (level.includes('soon')) doc.setTextColor(234, 88, 12);
        else if (level.includes('mild')) doc.setTextColor(22, 163, 74);
        else doc.setTextColor(0);

        doc.text(`Triage Level: ${record.triageLevel}`, margin, y);
        y += 20;

        // Content
        if (triageContent.length > 0) {
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.setFont("helvetica", "normal");
            const text = stripMarkdown(triageContent.join('\n'));
            const split = doc.splitTextToSize(text, contentWidth);
            doc.text(split, margin, y);
            y += (split.length * 12) + 10;
        }
        drawSeparator();
    }

    // 5. Quick Summary
    if (summaryContent.length > 0) {
        checkPageBreak(60);
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("Quick Summary", margin, y);
        y += 15;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const text = stripMarkdown(summaryContent.join('\n'));
        const split = doc.splitTextToSize(text, contentWidth);
        doc.text(split, margin, y);
        y += (split.length * 12) + 10;
    }

    // 6. Doctor Handover
    if (handoverContent.length > 0) {
        drawSeparator();
        checkPageBreak(60);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Doctor Handover Summary", margin, y);
        y += 15;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const text = stripMarkdown(handoverContent.join('\n'));
        const split = doc.splitTextToSize(text, contentWidth);
        doc.text(split, margin, y);
        y += (split.length * 12) + 10;
    }
    
    // 7. Recommended Actions
    if (nextStepsContent.length > 0) {
        drawSeparator();
        checkPageBreak(60);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Recommended Actions", margin, y);
        y += 15;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const text = stripMarkdown(nextStepsContent.join('\n'));
        const split = doc.splitTextToSize(text, contentWidth);
        doc.text(split, margin, y);
        y += (split.length * 12) + 10;
    }

    // 8. Ayurvedic (Optional)
    if (ayurvedaContent.length > 0) {
        drawSeparator();
        checkPageBreak(60);
        doc.setFontSize(12);
        doc.setTextColor(21, 128, 61); // Green
        doc.setFont("helvetica", "bold");
        doc.text("Ayurvedic Overview", margin, y);
        y += 15;

        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        const text = stripMarkdown(ayurvedaContent.join('\n'));
        const split = doc.splitTextToSize(text, contentWidth);
        doc.text(split, margin, y);
    }

    doc.save(`MediAI-Report-${record.id.slice(0, 8)}.pdf`);

  } catch (error) {
    console.error("PDF Generation failed", error);
    alert("Failed to generate PDF");
  }
};