# Vishwasini - MediAI - Health Triage Assistant

## Overview
Vishwasini - MediAI is a multimodal health triage and education assistant powered by Google's Gemini 3 Pro model. It helps users understand their symptoms by analyzing text descriptions, voice recordings, images of visible symptoms, and medical lab reports. It also offers optional Ayurvedic insights for a holistic wellness perspective.

## Key Features
- **Multimodal Input**: Supports text, images (JPG/PNG), voice recordings (MP3/WAV/WebM), and medical reports (PDF/Images).
- **Intelligent Triage**: Categorizes symptoms into "Emergency", "See a Doctor Soon", or "Likely Mild".
- **Report Analysis**: Extracts and interprets lab values from uploaded medical reports.
- **Ayurvedic Integration**: Provides Dosha-based insights (Vata/Pitta/Kapha) and lifestyle tendencies.
- **Multilingual Support**: Automatically detects and responds in 10+ Indian languages (Hindi, Kannada, Telugu, Tamil, Malayalam, Marathi, Gujarati, Bengali, Odia).
- **PDF Report Generation**: Users can download a structured summary of their triage assessment.
- **Doctor Handover**: Generates a concise summary specifically for medical professionals.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite.
- **Styling**: Tailwind CSS.
- **Icons**: Lucide React.
- **AI SDK**: `@google/genai` (Google Generative AI SDK).
- **PDF Generation**: `jspdf`.
- **Animations**: `motion` (Framer Motion).

## AI Models Used
- **Primary Model**: `gemini-3.1-pro-preview` (Gemini 3 Pro).
  - Used for symptom analysis, report interpretation, and Ayurvedic mapping.
- **Multimodal Capabilities**:
  - **Vision**: Analyzes symptom images and lab reports.
  - **Audio**: Transcribes and analyzes voice recordings.
  - **Text**: Processes complex medical queries and provides structured responses.

## Environment Variables & Keys
The application requires the following environment variable to function:
- `GEMINI_API_KEY`: Your Google AI Studio API Key.

## Project Structure
- `/App.tsx`: Main application logic and state management.
- `/components/`: Reusable UI components (Header, Footer, AnalysisResult, etc.).
- `/services/geminiService.ts`: Integration logic for the Gemini API.
- `/utils/pdfGenerator.ts`: Logic for generating downloadable PDF reports.
- `/types.ts`: TypeScript interfaces and enums shared across the app.

## Deployment (Vercel)
1. Push the code to a GitHub repository.
2. Connect the repository to Vercel.
3. Add `GEMINI_API_KEY` in the Vercel Environment Variables settings.
4. Deploy.

## Safety & Disclaimer
Vishwasini - MediAI is an AI-driven informational tool. It is **NOT** a substitute for professional medical advice, diagnosis, or treatment. It does not prescribe medications or perform clinical procedures.

## Credits
- **Founder**: Basavprasad Sajjanshetty
- **Co-Founder**: Dr. Priya Sajjanshetty
- **Site Developed & Maintained by**: [www.tedmuf.com](https://www.tedmuf.com)
- **Special Thanks**: JSV Sajjan and team
