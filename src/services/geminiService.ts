import { GoogleGenAI } from "@google/genai";
// Gemini Health Analysis Service
import { PatientData, FileData, AudioData } from "../types";

const SYSTEM_INSTRUCTION = `
You are **Vishwasini - MediAI**, an advanced AI health triage and information assistant. 
Your goal is to analyze patient symptoms, details, and optional visual data (images/reports) to provide a structured, safe, and informative summary.

**CRITICAL SAFETY RULES:**
1.  **NOT A DOCTOR:** You MUST start with a clear, bold disclaimer that this is NOT a medical diagnosis and the user should consult a professional.
2.  **EMERGENCY:** If symptoms suggest a life-threatening emergency (chest pain, stroke signs, severe breathing difficulty, profuse bleeding), advise the user to call emergency services immediately.
3.  **PRIVACY:** Do not mention PII (Personally Identifiable Information) found in reports unless relevant to the clinical picture.

**LANGUAGE SUPPORT:**
- You MUST output the analysis in the user's **preferredLanguage**.
- If "Auto" is selected, detect the language from the symptoms text/audio.
- Supported languages include: English, Hindi, Kannada, Telugu, Tamil, Marathi, Bengali, Gujarati, Malayalam, Odia.
- **Example:** If preferredLanguage is "Hindi", the entire response (headers, content, advice) must be in Hindi.

**VOICE/AUDIO PROCESSING:**
- If audio is provided, you **MUST** transcribe the relevant medical/symptom information from it first.
- Integrate the transcribed information into the "Summary of Understanding" section.

**OUTPUT STRUCTURE (Markdown):**
1.  **⚠️ Safety Disclaimer**: Standard non-medical advice disclaimer.
2.  **🩺 Triage & Analysis**: 
    - **Summary**: Brief recap of patient details and complaints.
    - **Urgency**: Assessment using EXACTLY one of: "Emergency", "See a doctor soon", or "Likely mild".
    - **Possible Explanations**: Differential breakdown of suspected causes.
3.  **🔬 Professional Insights**: 
    - **Lab/Report Interpretation**: (If provided) Explain findings simply.
    - **Role-Specific Data**: (For Students/Doctors) Academic pathophysiology or clinical decision support.
4.  **🌿 Wellness & Guidance**: 
    - **Ayurvedic Lens**: (If requested) Dosha interpretation and holistic tips.
    - **Actionable Steps**: What the user can do next (hydrate, monitor, etc.).
5.  **📋 Doctor Handover**: A concise, professional summary for medical professionals.

**TONE:** Professional, empathetic, clear, and calm.
`;

export const analyzeHealthData = async (
  patientData: PatientData,
  symptomFiles: FileData[],
  reportFile: FileData | null,
  audioData: AudioData | null,
  userRole: string = 'user'
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key is missing. Please check your environment configuration.");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Role-specific instructions
    let roleInstruction = "";
    if (userRole === 'student') {
      roleInstruction = `
      **STUDENT MODE ENABLED:**
      In the **🔬 Professional Insights** section, you MUST include:
      - **Pathophysiology**: Explain the mechanism of the top 2 suspected conditions.
      - **Anatomical Context**: Mention systems/structures involved.
      - **Pharmacological Concepts**: Explain drug classes commonly used (mechanisms only).
      - **Learning Points**: 2-3 professional medical insights.
      `;
    } else if (userRole === 'doctor' || userRole === 'hospital') {
      roleInstruction = `
      **DOCTOR MODE ENABLED:**
      In the **🔬 Professional Insights** section, you MUST include:
      - **Clinical Decision Support**: Suggested Diagnostic Tests (Labs/Imaging).
      - **Management Protocols**: Standard-of-care therapeutic classes.
      - **ICD-10 Codes**: Suggested codes for primary concerns.
      - **Clinical Red Flags**: Specific warnings for this patient profile.
      `;
    }

    // Construct the text prompt
    let promptText = `
    **Analysis Configuration:**
    - preferredLanguage: ${patientData.language}
    - Include Ayurveda: ${patientData.includeAyurveda ? "YES" : "NO"}
    - User Role: ${userRole}

    ${roleInstruction}

    **Patient Details:**
    - Age: ${patientData.age}
    - Sex: ${patientData.sex}
    - Duration of Symptoms: ${patientData.duration}
    - Existing Conditions: ${patientData.conditions || "None"}
    - Current Medications: ${patientData.medications || "None"}
    
    **Patient's Description of Symptoms (Text):**
    ${patientData.symptoms}

    **Analysis Request:**
    - Analyze all inputs (Text, Images, Audio, Reports).
    - If Audio is present, transcribe and analyze it for symptom details.
    - Provide a structured markdown response as per system instructions.
    - Ensure the Output is in ${patientData.language}.
    `;

    // Build parts array
    const parts: any[] = [{ text: promptText }];

    // Add Symptom Images
    symptomFiles.forEach((file) => {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.base64,
        },
      });
    });

    // Add Report File
    if (reportFile) {
      parts.push({
        text: "\n\n**Attached Medical Report:** A document has been uploaded below. Please OCR and interpret relevant values."
      });
      parts.push({
        inlineData: {
          mimeType: reportFile.mimeType,
          data: reportFile.base64,
        },
      });
    }

    // Add Audio Data
    if (audioData) {
      parts.push({
        text: "\n\n**Attached Voice Recording:** The user has recorded the following audio description of their symptoms. Please transcribe and analyze."
      });
      parts.push({
        inlineData: {
          mimeType: audioData.mimeType,
          data: audioData.base64,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Using the requested powerful model for multimodal reasoning
      contents: {
        role: "user",
        parts: parts,
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4, 
      },
    });

    if (!response.text) {
      throw new Error("No response generated from the model.");
    }

    return response.text;

  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw new Error(error.message || "An error occurred during analysis.");
  }
};