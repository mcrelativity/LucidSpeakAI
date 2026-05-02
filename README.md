# Intone (formerly LucidSpeakAI)

<div align="center">

![Intone Banner](https://img.shields.io/badge/Intone-AI%20Speech%20Analysis-0ea5e9?style=for-the-badge)

[![Live Demo](https://img.shields.io/badge/Live_Demo-intone.app-00C7B7?style=for-the-badge)](https://intone.app)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

**An AI-powered speech analysis tool for actionable communication feedback.**

[🇺🇸 English](#english) | [🇪🇸 Español](#español)

</div>

---

<a name="english"></a>

## 🇺🇸 English

### Overview

**Intone** is a speech analysis platform designed to help you improve how you communicate. By combining acoustic analysis, transcription, and LLMs, it provides detailed feedback on your speaking patterns, clarity, pace, and use of filler words. 

### Key Features

- **Real-time Recording & Uploads:** Record straight from your browser or analyze existing audio files.
- **Smart Transcription:** Highly accurate text conversion powered by Google Cloud Speech-to-Text.
- **Acoustic Metrics:** Get precise data on your pitch, volume, speaking pace, and pauses.
- **AI-Driven Insights:** GPT-4 analyzes your transcripts to provide personalized coaching and actionable advice.
- **Progress Tracking:** A dedicated dashboard to visualize your improvements over time, track filler words ("um", "uh"), and monitor vocal projection.
- **Bilingual Support:** Fully functional interface and analysis in both English and Spanish.

### Tech Stack

**Frontend**
- Next.js 14 (React 18) & Tailwind CSS
- Web Audio API / MediaRecorder
- Recharts (Data visualization)
- PayPal SDK (Payments)
- next-intl (i18n)

**Backend**
- FastAPI (Python 3.11)
- Supabase (PostgreSQL)
- AI & Processing: Google Cloud Speech-to-Text, OpenAI GPT-4, `librosa`, `pydub`, `scipy`
- Security: `slowapi` (rate limiting), `bcrypt`, `python-jose` (JWT)

**Infrastructure**
- Hosted on Vercel (Frontend) and Render (Backend)
- Supabase Cloud (Database)
- Google Cloud Storage (Audio files)

### Installation

**Prerequisites:** Node.js 18+, Python 3.11+, and accounts for Google Cloud, Supabase, and OpenAI.

**1. Clone the Repository**
```bash
git clone [https://github.com/mcrelativity/LucidSpeakAI.git](https://github.com/mcrelativity/LucidSpeakAI.git)
cd LucidSpeakAI
