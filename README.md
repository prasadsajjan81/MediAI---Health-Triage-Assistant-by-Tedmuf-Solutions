<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1sEL8FLy7-PuVxgs_hKDk1zSZf0YOmPQ8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`




Built with Gemini 3 Pro · Voice · Images · PDFs · Multilingual · Doctor Dashboard

MediAI is an advanced health triage assistant that uses Gemini 3 Pro’s multimodal reasoning to interpret:

Text symptoms

Voice recordings

Images (rashes, wounds, burns, eye redness, etc.)

Medical PDFs or lab reports

It produces a structured medical-style triage:

🚦 Triage Level (Emergency / See doctor soon / Mild)

🩺 Clinical Explanation

🧪 Lab Interpretation

🌿 Ayurvedic Perspective

📌 Next Actions

👨‍⚕️ Doctor Handover Summary

The system is optimized for rural users, elderly, low-literacy individuals, and clinic workflows.

🌟 Features
🧠 Multimodal Analysis

Gemini 3 Pro processes:

Text

Voice input

Uploaded images

PDF medical reports

All in one request.

🎙️ Voice Input (Speech-to-Text)

Record symptoms in natural language.
Perfect for users who cannot type.

🔊 Listen to Summary (Text-to-Speech)

Reads the triage summary aloud in:

English

Hindi

Kannada

Telugu

Marathi

Great for low-literacy accessibility.

🌐 Multilingual Output

Responds in the same language as user input (if supported).

🧾 PDF Report Generator

Generates a doctor-friendly PDF containing:

Triage

Symptoms

Findings

Recommendations

📊 Doctor Dashboard

Stores previous triage sessions locally.

Doctors can:

View all past cases

Filter by urgency

Download PDF for any record

🚀 Tech Stack
Component	Technology
AI Engine	Gemini 3 Pro Preview
Framework	Google AI Studio Build
Frontend	React + TypeScript
Voice Output	Web Speech API
PDF Export	jsPDF
Storage	LocalStorage
Deployment	Cloud Run
