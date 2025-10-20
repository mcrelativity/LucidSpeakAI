# 🎙️ Intone (Ex LucidSpeakAI)

<div align="center">

![Intone Banner](https://img.shields.io/badge/Intone-AI%20Speech%20Analysis-0ea5e9?style=for-the-badge)

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-intone.app-00C7B7?style=for-the-badge)](https://intone.app)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

**AI-Powered Speech Analysis Platform for Communication Excellence**

[🇺🇸 English](#english) | [🇪🇸 Español](#español)

</div>

---

<a name="english"></a>

## 🇺🇸 English

### 📖 Overview

**Intone** is an advanced speech analysis platform that leverages artificial intelligence to help users improve their communication skills. By combining acoustic analysis, transcription, and AI-powered insights, Intone provides detailed feedback on speech patterns, clarity, pace, and more.

### ✨ Key Features

#### 🎯 **Core Functionality**
- 🎤 **Real-time Audio Recording** - Record directly in your browser
- 📝 **AI Transcription** - Powered by Google Cloud Speech-to-Text
- 📊 **Acoustic Analysis** - Analyze pitch, volume, pace, and pauses
- 🤖 **AI Insights** - Get personalized feedback using OpenAI GPT-4
- 🌍 **Bilingual Support** - Full Spanish and English interface

#### 💎 **Advanced Features**
- 📈 **Speech Metrics Dashboard** - Visualize your progress over time
- 🎭 **Filler Word Detection** - Identify "um", "uh", and other fillers
- ⏱️ **Pace Analysis** - Speaking rate and rhythm evaluation
- 🔊 **Volume Consistency** - Track vocal projection
- 📑 **Session History** - Review past recordings and improvements

#### 🔐 **Security & Performance**
- 🛡️ **Rate Limiting** - Protection against brute force attacks
- ✅ **Input Validation** - Sanitized inputs prevent XSS attacks
- 🔒 **JWT Authentication** - Secure 7-day session tokens
- 📁 **File Security** - Strict audio file validation (50MB max, 10min max)
- 🚀 **Fast Processing** - Optimized backend with Python 3.11

### 🏗️ Tech Stack

#### **Frontend**
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Audio**: Web Audio API, MediaRecorder
- **Charts**: Recharts
- **Payments**: PayPal SDK
- **i18n**: next-intl (ES/EN)

#### **Backend**
- **Framework**: FastAPI (Python 3.11)
- **Database**: Supabase (PostgreSQL)
- **AI/ML**:
  - Google Cloud Speech-to-Text
  - OpenAI GPT-4
- **Audio Processing**:
  - librosa (acoustic analysis)
  - pydub (audio manipulation)
  - scipy (signal processing)
- **Security**:
  - slowapi (rate limiting)
  - bcrypt (password hashing)
  - python-jose (JWT)

#### **Infrastructure**
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render
- **Database**: Supabase Cloud
- **Storage**: Google Cloud Storage
- **CDN**: Vercel Edge Network

### 📦 Installation

#### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Google Cloud account (for Speech API)
- Supabase account
- OpenAI API key (optional, for AI insights)

#### 1. Clone the Repository
```bash
git clone https://github.com/mcrelativity/LucidSpeakAI.git
cd LucidSpeakAI
```

#### 2. Frontend Setup
```bash
cd frontend
npm install

# Create .env.local
cp .env.example .env.local
# Edit .env.local with your credentials
```

**Frontend Environment Variables**:
```env
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
NEXT_PUBLIC_PAYPAL_PLAN_ID=your_plan_id
NEXT_PUBLIC_API_BASE=http://localhost:8001
```

#### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env
cp .env.example .env
# Edit .env with your credentials
```

**Backend Environment Variables**:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
SECRET_KEY=your_jwt_secret
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
FRONTEND_URL=http://localhost:3000
```

#### 4. Database Setup

Run the SQL schema in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  minutes INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'free',
  paypal_subscription_id TEXT,
  subscription_status TEXT,
  subscription_plan_id TEXT,
  subscription_start_time BIGINT,
  subscription_next_billing_time BIGINT
);

-- Sessions table
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  created_at BIGINT NOT NULL,
  duration REAL,
  transcript TEXT,
  insights TEXT,
  acoustics JSONB,
  locale TEXT DEFAULT 'es'
);
```

#### 5. Run Development Servers

**Terminal 1 - Backend**:
```bash
cd backend
uvicorn main:app --reload --port 8001
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

Open http://localhost:3000 🚀

### 🚀 Deployment

#### Deploy to Vercel (Frontend)
```bash
cd frontend
vercel
```

#### Deploy to Render (Backend)
1. Create new Web Service
2. Connect GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `bash render-build.sh`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Add all backend env vars

### 📊 Project Structure

```
LucidSpeakAI/
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── context/       # Context providers
│   │   ├── services/      # API services
│   │   └── translations/  # i18n files
│   ├── public/            # Static assets
│   └── package.json
│
├── backend/               # FastAPI backend
│   ├── main.py           # Main application
│   ├── requirements.txt  # Python dependencies
│   └── render-build.sh   # Build script
│
├── docs/                 # Documentation
└── README.md
```

### 🔑 API Endpoints

#### Authentication
- `POST /register` - User registration
- `POST /token` - Login (JWT)
- `GET /users/me` - Get current user

#### Audio Analysis
- `POST /upload-audio/` - Upload and analyze audio
- `GET /sessions` - Get user sessions
- `GET /sessions/{session_id}` - Get session details
- `DELETE /sessions/{session_id}` - Delete session

#### Payments
- `POST /paypal-webhook` - PayPal webhook handler

#### Health
- `GET /health` - Health check

### 📈 Roadmap

- [ ] Multi-language support (add more languages)
- [ ] Real-time speech analysis
- [ ] Team collaboration features
- [ ] Speech comparison with reference speakers
- [ ] Mobile apps (iOS/Android)
- [ ] Video recording support
- [ ] Custom AI models for specific industries

### 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 👥 Authors

- **[@mcrelativity](https://github.com/mcrelativity)** - Creator & Maintainer

### 🙏 Acknowledgments

- Google Cloud Speech-to-Text for transcription
- OpenAI for AI insights
- Supabase for database infrastructure
- Vercel for frontend hosting
- Render for backend hosting

### 📧 Contact

- **Website**: [lucid-speak-ai.vercel.app](https://lucid-speak-ai.vercel.app)
- **Issues**: [GitHub Issues](https://github.com/mcrelativity/LucidSpeakAI/issues)

---

<a name="español"></a>

## 🇪🇸 Español

### 📖 Descripción

**LucidSpeak AI** es una plataforma avanzada de análisis del habla que aprovecha la inteligencia artificial para ayudar a los usuarios a mejorar sus habilidades de comunicación. Al combinar análisis acústico, transcripción e insights impulsados por IA, LucidSpeak proporciona retroalimentación detallada sobre patrones de habla, claridad, ritmo y más.

### ✨ Características Principales

#### 🎯 **Funcionalidad Principal**
- 🎤 **Grabación de Audio en Tiempo Real** - Graba directamente en tu navegador
- 📝 **Transcripción con IA** - Impulsado por Google Cloud Speech-to-Text
- 📊 **Análisis Acústico** - Analiza tono, volumen, ritmo y pausas
- 🤖 **Insights de IA** - Obtén retroalimentación personalizada usando OpenAI GPT-4
- 🌍 **Soporte Bilingüe** - Interfaz completa en español e inglés

#### 💎 **Características Avanzadas**
- 📈 **Dashboard de Métricas** - Visualiza tu progreso a lo largo del tiempo
- 🎭 **Detección de Muletillas** - Identifica "eh", "um" y otros rellenos
- ⏱️ **Análisis de Ritmo** - Evaluación de velocidad y cadencia al hablar
- 🔊 **Consistencia de Volumen** - Seguimiento de proyección vocal
- 📑 **Historial de Sesiones** - Revisa grabaciones pasadas y mejoras

#### 🔐 **Seguridad y Rendimiento**
- 🛡️ **Rate Limiting** - Protección contra ataques de fuerza bruta
- ✅ **Validación de Inputs** - Inputs sanitizados previenen ataques XSS
- 🔒 **Autenticación JWT** - Tokens de sesión seguros de 7 días
- 📁 **Seguridad de Archivos** - Validación estricta de audio (máx 50MB, 10min)
- 🚀 **Procesamiento Rápido** - Backend optimizado con Python 3.11

### 🏗️ Stack Tecnológico

#### **Frontend**
- **Framework**: Next.js 14 (React 18)
- **Estilos**: Tailwind CSS
- **Gestión de Estado**: React Context API
- **Audio**: Web Audio API, MediaRecorder
- **Gráficos**: Recharts
- **Pagos**: PayPal SDK
- **i18n**: next-intl (ES/EN)

#### **Backend**
- **Framework**: FastAPI (Python 3.11)
- **Base de Datos**: Supabase (PostgreSQL)
- **IA/ML**:
  - Google Cloud Speech-to-Text
  - OpenAI GPT-4
- **Procesamiento de Audio**:
  - librosa (análisis acústico)
  - pydub (manipulación de audio)
  - scipy (procesamiento de señales)
- **Seguridad**:
  - slowapi (rate limiting)
  - bcrypt (hashing de contraseñas)
  - python-jose (JWT)

#### **Infraestructura**
- **Hosting Frontend**: Vercel
- **Hosting Backend**: Render
- **Base de Datos**: Supabase Cloud
- **Almacenamiento**: Google Cloud Storage
- **CDN**: Vercel Edge Network

### 📦 Instalación

#### Requisitos Previos
- Node.js 18+ y npm
- Python 3.11+
- Cuenta de Google Cloud (para Speech API)
- Cuenta de Supabase
- API key de OpenAI (opcional, para insights de IA)

#### 1. Clonar el Repositorio
```bash
git clone https://github.com/mcrelativity/LucidSpeakAI.git
cd LucidSpeakAI
```

#### 2. Configuración del Frontend
```bash
cd frontend
npm install

# Crear .env.local
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

**Variables de Entorno del Frontend**:
```env
NEXT_PUBLIC_PAYPAL_CLIENT_ID=tu_paypal_client_id
NEXT_PUBLIC_PAYPAL_PLAN_ID=tu_plan_id
NEXT_PUBLIC_API_BASE=http://localhost:8001
```

#### 3. Configuración del Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt

# Crear .env
cp .env.example .env
# Editar .env con tus credenciales
```

**Variables de Entorno del Backend**:
```env
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_KEY=tu_service_key
SECRET_KEY=tu_jwt_secret
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
FRONTEND_URL=http://localhost:3000
```

#### 4. Configuración de Base de Datos

Ejecuta el esquema SQL en tu editor SQL de Supabase:

```sql
-- Tabla de usuarios
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  minutes INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'free',
  paypal_subscription_id TEXT,
  subscription_status TEXT,
  subscription_plan_id TEXT,
  subscription_start_time BIGINT,
  subscription_next_billing_time BIGINT
);

-- Tabla de sesiones
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  created_at BIGINT NOT NULL,
  duration REAL,
  transcript TEXT,
  insights TEXT,
  acoustics JSONB,
  locale TEXT DEFAULT 'es'
);
```

#### 5. Ejecutar Servidores de Desarrollo

**Terminal 1 - Backend**:
```bash
cd backend
uvicorn main:app --reload --port 8001
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

Abre http://localhost:3000 🚀

### 🚀 Despliegue

#### Desplegar en Vercel (Frontend)
```bash
cd frontend
vercel
```

#### Desplegar en Render (Backend)
1. Crear nuevo Web Service
2. Conectar repositorio de GitHub
3. Configurar:
   - **Root Directory**: `backend`
   - **Build Command**: `bash render-build.sh`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Agregar todas las variables de entorno del backend

### 📊 Estructura del Proyecto

```
LucidSpeakAI/
├── frontend/               # Frontend Next.js
│   ├── src/
│   │   ├── app/           # Páginas del app router
│   │   ├── components/    # Componentes React
│   │   ├── context/       # Proveedores de contexto
│   │   ├── services/      # Servicios de API
│   │   └── translations/  # Archivos i18n
│   ├── public/            # Assets estáticos
│   └── package.json
│
├── backend/               # Backend FastAPI
│   ├── main.py           # Aplicación principal
│   ├── requirements.txt  # Dependencias Python
│   └── render-build.sh   # Script de build
│
├── docs/                 # Documentación
└── README.md
```

### 🔑 Endpoints de la API

#### Autenticación
- `POST /register` - Registro de usuario
- `POST /token` - Login (JWT)
- `GET /users/me` - Obtener usuario actual

#### Análisis de Audio
- `POST /upload-audio/` - Subir y analizar audio
- `GET /sessions` - Obtener sesiones del usuario
- `GET /sessions/{session_id}` - Obtener detalles de sesión
- `DELETE /sessions/{session_id}` - Eliminar sesión

#### Pagos
- `POST /paypal-webhook` - Manejador de webhook de PayPal

#### Salud
- `GET /health` - Verificación de salud

### 📈 Hoja de Ruta

- [ ] Soporte multi-idioma (agregar más idiomas)
- [ ] Análisis de habla en tiempo real
- [ ] Funciones de colaboración en equipo
- [ ] Comparación de habla con oradores de referencia
- [ ] Apps móviles (iOS/Android)
- [ ] Soporte de grabación de video
- [ ] Modelos de IA personalizados para industrias específicas

### 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor sigue estos pasos:

1. Haz fork del repositorio
2. Crea una rama de feature (`git checkout -b feature/CaracteristicaIncreible`)
3. Commit tus cambios (`git commit -m 'Agregar alguna CaracteristicaIncreible'`)
4. Push a la rama (`git push origin feature/CaracteristicaIncreible`)
5. Abre un Pull Request

### 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

### 👥 Autores

- **[@mcrelativity](https://github.com/mcrelativity)** - Creador y Mantenedor

### 🙏 Agradecimientos

- Google Cloud Speech-to-Text por la transcripción
- OpenAI por los insights de IA
- Supabase por la infraestructura de base de datos
- Vercel por el hosting del frontend
- Render por el hosting del backend

### 📧 Contacto

- **Sitio Web**: [lucid-speak-ai.vercel.app](https://lucid-speak-ai.vercel.app)
- **Issues**: [GitHub Issues](https://github.com/mcrelativity/LucidSpeakAI/issues)

---

<div align="center">



⭐ Star this repo if you find it useful!

</div>
