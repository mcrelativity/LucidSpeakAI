# ==============================================================================
# STEP 1: Install required packages
# pip install supabase
# ==============================================================================

# ==============================================================================
# IMPORTS Y CONFIGURACIÓN INICIAL
# ==============================================================================
from typing import Optional, List
from fastapi import FastAPI, File, UploadFile, Request, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
import shutil
from google.cloud import speech
import os
import librosa
import numpy as np
import re
import collections
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
from dotenv import load_dotenv
import traceback
import json
import secrets
import time
import random
from supabase import create_client, Client

load_dotenv()
ffmpeg_path = os.getenv("FFMPEG_PATH")
if ffmpeg_path and os.path.exists(ffmpeg_path):
    os.environ["PATH"] += os.pathsep + ffmpeg_path

app = FastAPI()

# ==============================================================================
# SUPABASE CONFIGURATION
# ==============================================================================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Use service_role for backend
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Use service_role key for backend operations (bypasses RLS)
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables")

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY
)

# ==============================================================================
# CONSTANTES Y CONFIGURACIÓN DE CORS
# ==============================================================================
FREE_TIER_MINUTES = 5

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# SEGURIDAD Y AUTENTICACIÓN
# ==============================================================================
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY must be set in environment variables for production use")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

# ==============================================================================
# PYDANTIC MODELS
# ==============================================================================
class PaymentConfirmation(BaseModel):
    orderID: str

class MetricsData(BaseModel):
    pace: float
    disfluencies_per_minute: float
    pitch_variation: float
    duration: float

class InsightsRequest(BaseModel):
    transcript: str
    metrics: MetricsData
    context: Optional[str] = "general"
    target_audience: Optional[str] = "general"
    goal: Optional[str] = "inform"

class SessionCreate(BaseModel):
    name: str
    context: str = "general"
    target_audience: str = "general"
    goal: str = "inform"

class RecordingEntry(BaseModel):
    pace: float
    pitch_variation: float
    disfluencies_per_minute: float
    hedge_count: int
    total_words: int
    duration: float
    insights_summary: Optional[str] = ""
    timestamp: int

# ==============================================================================
# FUNCIONES DE VALIDACIÓN Y SEGURIDAD
# ==============================================================================
def validate_password(password: str):
    if len(password) < 8:
        return False, "La contraseña debe tener al menos 8 caracteres."
    if not re.search(r"[A-Z]", password):
        return False, "La contraseña debe contener al menos una mayúscula."
    if not re.search(r"[0-9]", password):
        return False, "La contraseña debe contener al menos un número."
    if not re.search(r"[!@#$%^&*(),.?:{}|<>]", password):
        return False, "La contraseña debe contener al menos un símbolo."
    return True, ""

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ==============================================================================
# FUNCIONES DE ANÁLISIS DE AUDIO Y TEXTO (unchanged)
# ==============================================================================
def analyze_acoustics(audio_path: str):
    try:
        audio = AudioSegment.from_file(audio_path).set_channels(1)
        duration_seconds = audio.duration_seconds
        samples = np.array(audio.get_array_of_samples()).astype(np.float32)
        if samples.size == 0:
            return {"duration": duration_seconds, "pitch_variation": 0}
        
        y = librosa.util.buf_to_float(samples)
        sr = audio.frame_rate
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch_values = pitches[magnitudes > np.median(magnitudes)]
        pitch_std_dev = np.std(pitch_values) if len(pitch_values) > 0 else 0
        return {"duration": float(duration_seconds), "pitch_variation": round(float(pitch_std_dev), 2)}
    except Exception as e:
        print(f"Error en analyze_acoustics: {e}")
        return {"duration": 0, "pitch_variation": 0}

def analyze_conviction(transcript: str):
    lower_transcript = transcript.lower()
    words = re.findall(r'\b\w+\b', lower_transcript)
    if not words: 
        return {
            "disfluency_count": 0, 
            "hedge_count": 0, 
            "total_words": 0, 
            "details": {}, 
            "hedge_details": {}
        }
    
    # EXPANDED: Comprehensive filler words and phrases
    filler_phrases = {
        # Spanish multi-word fillers
        "o sea", "en plan", "tipo que", "es que", "como que", "la verdad", "o sea que",
        "digamos que", "por así decirlo", "de alguna manera", "en cierto modo",
        "vamos a ver", "a ver", "cómo te diría", "qué sé yo", "no sé",
        "la cosa es", "al final", "entre comillas", "por decirlo así", "si se quiere",
        "de hecho", "en realidad", "en fin", "ya sabes", "sabes qué",
        # English multi-word fillers
        "you know", "i mean", "kind of like", "sort of", "you see", "let me see",
        "how do i say", "what can i say", "you know what i mean", "basically",
        "to be honest", "at the end of the day", "if you will", "per se",
        "in a sense", "in a way", "more or less", "pretty much", "i guess",
        "i suppose", "let's say", "shall we say", "so to speak"
    }
    
    # MASSIVELY EXPANDED: 50+ English and 60+ Spanish filler words
    filler_words_all = {
        # Spanish fillers (60+)
        "eh", "em", "este", "pues", "bueno", "vale", "mmm", "ajá", "claro",
        "entonces", "mira", "oye", "fíjate", "imagínate", "entiéndeme",
        "osea", "ósea", "tipo", "nada", "vamos", "venga", "hombre", "mujer",
        "chaval", "chavala", "tío", "tía", "wey", "güey", "wei", "huevón",
        "boludo", "che", "marica", "parce", "pana", "mano", "compa",
        "onda", "rollo", "trama", "vaina", "cosa", "coso",
        "ehhh", "estooo", "pueeees", "bueeeno", "yyyyy", "aaaa",
        "literal", "literalmente", "básicamente", "obviamente", "realmente",
        "actualmente", "evidentemente", "definitivamente", "totalmente",
        # English fillers (50+)
        "uh", "um", "er", "ah", "like", "so", "well", "right", "okay",
        "actually", "basically", "literally", "seriously", "honestly",
        "totally", "absolutely", "definitely", "certainly", "clearly",
        "obviously", "evidently", "apparently", "essentially", "fundamentally",
        "yeah", "yep", "yup", "nah", "nope", "huh", "hmm", "mhm",
        "alright", "anyways", "anyhow", "whatever", "whatnot",
        "kinda", "sorta", "gonna", "wanna", "gotta",
        "umm", "uhhh", "errr", "sooo", "welll", "aaand", "orrr",
        "quite", "rather", "fairly", "pretty", "really", "very"
    }
    
    # Words that can be fillers but often aren't - need context checking
    contextual_fillers = {
        # Spanish contextual words
        "pues": ["pues bien", "pues sí", "pues no", "pues claro"],
        "entonces": ["y entonces", "pero entonces", "desde entonces"],
        "bueno": ["muy bueno", "bueno para", "es bueno", "tan bueno"],
        "claro": ["muy claro", "más claro", "está claro", "por supuesto"],
        "bien": ["muy bien", "está bien", "tan bien", "qué bien"],
        "vale": ["no vale", "vale la pena", "cuánto vale"],
        "tipo": ["este tipo", "tipo de", "qué tipo"],
        "cosa": ["una cosa", "la cosa", "otra cosa", "ninguna cosa"],
        "nada": ["nada más", "de nada", "para nada", "nada que ver"],
        # English contextual words  
        "so": ["and so", "so that", "so far", "so much", "so many"],
        "well": ["as well", "very well", "well done", "well known"],
        "right": ["right now", "right here", "all right", "that's right"],
        "like": ["looks like", "feels like", "seems like", "would like"],
        "actually": ["actually happened", "actually true", "actually is"],
        "just": ["just now", "just because", "just like", "just as"],
        "really": ["really good", "really bad", "really is", "not really"],
        "pretty": ["pretty good", "pretty bad", "pretty much", "so pretty"],
        "quite": ["quite good", "quite right", "not quite", "quite a"]
    }
    
    # IMPROVED: Smarter contextual filtering - check frequency and valid usage patterns
    filler_words = set()
    for word in filler_words_all:
        if word in contextual_fillers:
            # Check if word appears mostly in valid contexts
            valid_contexts = contextual_fillers[word]
            total_count = lower_transcript.count(f" {word} ") + lower_transcript.count(f" {word},") + lower_transcript.count(f" {word}.")
            
            if total_count == 0:
                continue  # Word not found
            
            valid_count = 0
            for context in valid_contexts:
                valid_count += lower_transcript.count(context)
            
            # If more than 60% of usage is in valid contexts, it's not a filler
            if total_count > 0 and (valid_count / total_count) > 0.6:
                continue  # Skip - mostly valid usage
            else:
                filler_words.add(word)  # Add - mostly filler usage
        else:
            # Direct fillers without context checking
            filler_words.add(word)
    
    # EXPANDED: Hedge phrases
    hedge_phrases = {
        # Spanish
        "creo que", "pienso que", "a lo mejor", "siento que", "me parece que",
        "diría que", "supongo que", "imagino que", "podría ser que", "tal vez sea",
        "puede que", "es posible que", "quizá sea", "probablemente sea",
        # English
        "i think", "i guess", "i suppose", "i believe", "i feel like",
        "it seems", "probably", "possibly", "maybe it's", "could be",
        "might be", "perhaps", "i'd say"
    }
    
    # EXPANDED: Hedge words
    hedge_words = {
        # Spanish
        "quizás", "tal vez", "posiblemente", "supongo", "parece", "algo", "medio",
        "casi", "apenas", "más o menos", "relativamente", "bastante", "cierto",
        # English
        "maybe", "perhaps", "possibly", "somewhat", "kinda", "sorta", "rather",
        "quite", "fairly", "relatively", "seemingly", "apparently"
    }

    found_filler_phrases = [p for p in filler_phrases if p in lower_transcript]
    found_hedge_phrases = [p for p in hedge_phrases if p in lower_transcript]
    found_fillers = [w for w in words if w in filler_words]
    found_hedges = [w for w in words if w in hedge_words]
    
    # Improved repetition detection - allow more natural repetitions
    allowed_repetitions = {
        # Spanish
        "no", "sí", "muy", "tan", "más", "bien", "mal", "ya", "ahora", "aquí",
        # English  
        "yes", "no", "very", "so", "more", "less", "good", "bad", "now", "here"
    }
    found_repetitions = [
        f"{words[i]} (x2)" 
        for i in range(1, len(words)) 
        if words[i] == words[i-1] and words[i] not in allowed_repetitions and len(words[i]) > 2
    ]
    
    elongation_pattern = re.compile(r'\b\w*(\w)\1{2,}\w*\b')
    found_elongations = elongation_pattern.findall(lower_transcript)
    
    all_hedges = found_hedge_phrases + found_hedges
    all_disfluencies = found_filler_phrases + found_fillers + found_repetitions + found_elongations
    
    details = {
        "Muletillas": dict(collections.Counter(found_filler_phrases + found_fillers)),
        "Repeticiones": dict(collections.Counter(found_repetitions)),
        "Alargamientos": dict(collections.Counter(found_elongations)),
    }
    details = {k: v for k, v in details.items() if v}
    
    return {
        "disfluency_count": len(all_disfluencies),
        "hedge_count": len(all_hedges),
        "total_words": len(words),
        "details": details,
        "hedge_details": dict(collections.Counter(all_hedges))
    }

def estimate_pace_from_audio(audio_path: str, duration_seconds: float, assumed_wpm: int = 150):
    try:
        seg = AudioSegment.from_file(audio_path).set_channels(1)
        nonsilent = detect_nonsilent(seg, min_silence_len=300, silence_thresh=-40)
        voiced_ms = sum((end - start) for start, end in nonsilent)
        if duration_seconds <= 0: 
            return 0
        wps = assumed_wpm / 60.0
        total_words = (voiced_ms / 1000.0) * wps
        return max(0, int(round(total_words / (duration_seconds / 60.0))))
    except Exception:
        return 0

def evaluate_metrics_and_scores(pace, pitch_variation, disfluencies_per_minute, hedges_per_minute):
    evaluations, scores = {}, {}
    
    if pace > 175: 
        evaluations["pace"] = "Rápido"
    elif pace > 0 and pace < 130: 
        evaluations["pace"] = "Lento"
    else: 
        evaluations["pace"] = "Ideal"
    scores["pace"] = max(0, 100 - abs(pace - 150))
    
    if pitch_variation > 0 and pitch_variation < 15: 
        evaluations["pitch"] = "Monótono"
    else: 
        evaluations["pitch"] = "Dinámico"
    scores["pitch"] = min(100, (pitch_variation / 40) * 100)
    
    scores["disfluencies"] = max(0, 100 - (disfluencies_per_minute * 10))
    evaluations["disfluencies"] = "Alto" if disfluencies_per_minute > 5 else "Bajo"
    
    scores["hedges"] = max(0, 100 - (hedges_per_minute * 20))
    evaluations["hedges"] = "Alto" if hedges_per_minute > 5 else "Bajo"
    
    return evaluations, scores

def generate_structured_feedback(evaluations, conviction_analysis):
    strengths, improvements = [], []
    
    if evaluations.get("pace") == "Ideal": 
        strengths.append("Tu ritmo fue ideal.")
    elif evaluations.get("pace") == "Rápido": 
        improvements.append("Tu ritmo fue muy rápido.")
    else: 
        improvements.append("Tu ritmo fue pausado.")
    
    if evaluations.get("pitch") == "Dinámico": 
        strengths.append("Excelente variación de tono.")
    else: 
        improvements.append("Tu voz tendió a ser monótona.")
    
    if evaluations.get("disfluencies") == "Bajo": 
        strengths.append("Tu fluidez fue excelente.")
    else: 
        improvements.append("El área principal de mejora son las disfluencias.")
    
    if evaluations.get("hedges") == "Bajo": 
        strengths.append("Hablaste con convicción.")
    else:
        if conviction_analysis.get('hedge_details'):
            most_common = max(
                conviction_analysis['hedge_details'], 
                key=conviction_analysis['hedge_details'].get
            )
            improvements.append(f"Usaste varias palabras de duda (como \"{most_common}\").")
    
    if not improvements and not strengths:
        strengths.append("Un buen primer análisis.")
    
    return {"strengths": strengths, "improvements": improvements}

def detect_language(text: str) -> str:
    """Detect language from transcript"""
    spanish_indicators = len(re.findall(r'\b(el|la|los|las|de|que|en|es|y|a)\b', text.lower()))
    english_indicators = len(re.findall(r'\b(the|is|are|and|of|to|in|a|that)\b', text.lower()))
    return "es" if spanish_indicators > english_indicators else "en"

def generate_smart_insights(
    metrics: dict, 
    transcript: str = "", 
    language: str = "es",  # Changed: now defaults to Spanish, but should come from frontend
    context: str = "general",
    previous_recording: dict = None  # NEW: for comparison insights
) -> dict:
    """
    Generate HIGHLY DETAILED, VARIED, and CONTEXTUAL insights
    Language parameter should come from frontend locale, not transcript detection
    """
    
    pace = metrics.get('pace', 0)
    disfluencies = metrics.get('disfluencies_per_minute', 0)
    pitch = metrics.get('pitch_variation', 0)
    duration = metrics.get('duration', 0)
    
    # Context-specific guidelines with much more detail
    context_guidelines = {
        "sales_pitch": {
            "ideal_pace": (140, 160),
            "ideal_pitch": (25, 40),
            "max_disfluencies": 2,
            "es": {
                "name": "pitch de ventas",
                "focus": "energía, urgencia y convicción",
                "key_moments": ["apertura impactante", "beneficios claros", "cierre con CTA"],
                "voice_tips": ["Varía tono en beneficios clave", "Acelera en momentos de urgencia", "Pausa antes del precio"],
                "common_mistakes": ["Hablar muy rápido por nervios", "Tono monótono en lista de features", "Demasiadas muletillas al improvisar"]
            },
            "en": {
                "name": "sales pitch",
                "focus": "energy, urgency and conviction",
                "key_moments": ["impactful opening", "clear benefits", "strong CTA close"],
                "voice_tips": ["Vary tone on key benefits", "Speed up in urgency moments", "Pause before pricing"],
                "common_mistakes": ["Speaking too fast due to nerves", "Monotone in feature lists", "Too many fillers when improvising"]
            }
        },
        "academic": {
            "ideal_pace": (120, 140),
            "ideal_pitch": (15, 30),
            "max_disfluencies": 3,
            "es": {
                "name": "presentación académica",
                "focus": "claridad, estructura y precisión",
                "key_moments": ["tesis clara", "evidencia sólida", "conclusión memorable"],
                "voice_tips": ["Ritmo constante para comprensión", "Pausa después de conceptos clave", "Énfasis en datos importantes"],
                "common_mistakes": ["Ritmo muy lento por sobreexplicar", "Falta de pausas entre secciones", "Tono monótono en datos"]
            },
            "en": {
                "name": "academic presentation",
                "focus": "clarity, structure and precision",
                "key_moments": ["clear thesis", "solid evidence", "memorable conclusion"],
                "voice_tips": ["Steady pace for comprehension", "Pause after key concepts", "Emphasize important data"],
                "common_mistakes": ["Too slow from over-explaining", "No pauses between sections", "Monotone in data points"]
            }
        },
        "interview": {
            "ideal_pace": (130, 150),
            "ideal_pitch": (20, 35),
            "max_disfluencies": 2,
            "es": {
                "name": "entrevista",
                "focus": "confianza, precisión y autenticidad",
                "key_moments": ["respuesta STAR", "logros cuantificables", "preguntas al entrevistador"],
                "voice_tips": ["Pausa para pensar antes de responder", "Tono seguro sin arrogancia", "Varía énfasis en logros"],
                "common_mistakes": ["Muletillas por nerviosismo", "Hablar muy rápido en logros", "Tono inseguro en debilidades"]
            },
            "en": {
                "name": "interview",
                "focus": "confidence, precision and authenticity",
                "key_moments": ["STAR response", "quantifiable achievements", "questions for interviewer"],
                "voice_tips": ["Pause to think before answering", "Confident tone without arrogance", "Vary emphasis on achievements"],
                "common_mistakes": ["Fillers from nervousness", "Speaking too fast in achievements", "Insecure tone in weaknesses"]
            }
        },
        "public_speech": {
            "ideal_pace": (140, 170),
            "ideal_pitch": (30, 50),
            "max_disfluencies": 1,
            "es": {
                "name": "discurso público",
                "focus": "proyección, dramatismo e inspiración",
                "key_moments": ["gancho emocional", "historia central", "llamado a la acción"],
                "voice_tips": ["Pausas dramáticas antes de punch lines", "Acelera en momentos de pasión", "Susurra para crear intimidad"],
                "common_mistakes": ["Volumen constante sin variación", "Sin pausas estratégicas", "Tono predicador sin autenticidad"]
            },
            "en": {
                "name": "public speech",
                "focus": "projection, drama and inspiration",
                "key_moments": ["emotional hook", "central story", "call to action"],
                "voice_tips": ["Dramatic pauses before punch lines", "Speed up in passion moments", "Whisper to create intimacy"],
                "common_mistakes": ["Constant volume without variation", "No strategic pauses", "Preachy tone without authenticity"]
            }
        },
        "storytelling": {
            "ideal_pace": (150, 180),
            "ideal_pitch": (35, 55),
            "max_disfluencies": 2,
            "es": {
                "name": "narrativa",
                "focus": "dinamismo, emoción y suspense",
                "key_moments": ["setup intrigante", "conflicto escalado", "resolución satisfactoria"],
                "voice_tips": ["Lento en descripciones", "Rápido en acción", "Cambio radical en plot twists"],
                "common_mistakes": ["Ritmo plano sin variación", "Spoilear el final con tono", "Apurarse en momentos emocionales"]
            },
            "en": {
                "name": "storytelling",
                "focus": "dynamism, emotion and suspense",
                "key_moments": ["intriguing setup", "escalating conflict", "satisfying resolution"],
                "voice_tips": ["Slow in descriptions", "Fast in action", "Dramatic shift in plot twists"],
                "common_mistakes": ["Flat pace without variation", "Spoiling ending with tone", "Rushing emotional moments"]
            }
        },
        "general": {
            "ideal_pace": (130, 160),
            "ideal_pitch": (20, 35),
            "max_disfluencies": 3,
            "es": {
                "name": "presentación general",
                "focus": "balance y naturalidad",
                "key_moments": ["introducción clara", "desarrollo lógico", "cierre recordable"],
                "voice_tips": ["Mantén ritmo conversacional", "Varía tono naturalmente", "Pausa en transiciones"],
                "common_mistakes": ["Sonar demasiado formal", "Perder energía a mitad", "Terminar abruptamente"]
            },
            "en": {
                "name": "general presentation",
                "focus": "balance and naturalness",
                "key_moments": ["clear intro", "logical development", "memorable close"],
                "voice_tips": ["Keep conversational pace", "Vary tone naturally", "Pause at transitions"],
                "common_mistakes": ["Sounding too formal", "Losing energy midway", "Ending abruptly"]
            }
        }
    }
    
    ctx = context_guidelines.get(context, context_guidelines["general"])
    min_pace, max_pace = ctx["ideal_pace"]
    ideal_pitch_min, ideal_pitch_max = ctx.get("ideal_pitch", (20, 35))
    max_disf = ctx.get("max_disfluencies", 3)
    ctx_lang = ctx.get(language, ctx["es"])
    
    # Calculate performance scores (0-100)
    pace_score = 100 - min(100, abs(pace - ((min_pace + max_pace) / 2)) * 2)
    pitch_score = min(100, (pitch / ideal_pitch_max) * 100) if pitch < ideal_pitch_max else 100
    disfluency_score = max(0, 100 - (disfluencies / max_disf) * 50)
    overall_score = (pace_score + pitch_score + disfluency_score) / 3
    
    # Generate VARIED summary based on performance
    if language == "es":
        # Opening varies by overall performance
        if overall_score >= 85:
            openings = [
                f"¡Excelente trabajo! En tu {ctx_lang['name']}, ",
                f"¡Impresionante! Tu {ctx_lang['name']} muestra ",
                f"¡Muy bien! Dominaste tu {ctx_lang['name']} con "
            ]
        elif overall_score >= 70:
            openings = [
                f"Buen progreso en tu {ctx_lang['name']}. ",
                f"Vas por buen camino con tu {ctx_lang['name']}. ",
                f"Sólido desempeño en tu {ctx_lang['name']}. "
            ]
        else:
            openings = [
                f"Hay oportunidad de mejora en tu {ctx_lang['name']}. ",
                f"Practiquemos más tu {ctx_lang['name']}. ",
                f"Con práctica mejorarás tu {ctx_lang['name']}. "
            ]
        
        import random
        summary = random.choice(openings)
        
        # DETAILED pace analysis with specific advice
        pace_diff = pace - ((min_pace + max_pace) / 2)
        if pace < min_pace - 20:
            summary += f"Tu ritmo de {pace} ppm es muy lento. Esto puede hacer que pierdas la atención de tu audiencia. "
            summary += f"El rango ideal para {ctx_lang['name']} es {min_pace}-{max_pace} ppm. "
            summary += "Consejo: Lee en voz alta con un metrónomo para acelerar naturalmente. "
        elif pace < min_pace:
            summary += f"Tu ritmo de {pace} ppm es pausado ({abs(pace_diff):.0f} ppm por debajo del ideal). "
            summary += "Esto puede ser bueno para claridad, pero podrías perder dinamismo. "
        elif pace > max_pace + 20:
            summary += f"Tu ritmo de {pace} ppm es muy rápido. Tu audiencia puede tener dificultad para procesarlo. "
            summary += f"Intenta reducir a {min_pace}-{max_pace} ppm. "
            summary += "Consejo: Haz pausas de 2-3 segundos después de cada punto clave. "
        elif pace > max_pace:
            summary += f"Tu ritmo de {pace} ppm es ligeramente rápido (+{pace_diff:.0f} ppm sobre el ideal). "
            summary += "Esto da energía, pero cuidado con no apresurarte en momentos críticos. "
        else:
            summary += f"Tu ritmo de {pace} ppm es perfecto para este contexto. Estás en el rango ideal de {min_pace}-{max_pace} ppm. "
        
        # DETAILED disfluency analysis with varied phrasing
        disfluency_comments = {
            "very_high": [
                f"Detectamos {disfluencies:.1f} disfluencias por minuto (más del doble del límite ideal de {max_disf}). Esto puede debilitar significativamente tu mensaje.",
                f"Nivel alto de muletillas: {disfluencies:.1f}/min cuando el ideal es máximo {max_disf}. Cada 'eh' o 'este' resta impacto a tus ideas.",
                f"Las disfluencias ({disfluencies:.1f}/min) están afectando tu credibilidad. El umbral recomendado es {max_disf}/min para {ctx_lang['name']}."
            ],
            "high": [
                f"Tienes {disfluencies:.1f} disfluencias/min (el ideal es máximo {max_disf}). Son manejables, pero cada muletilla resta credibilidad.",
                f"Detectamos {disfluencies:.1f} muletillas por minuto. Está por encima del ideal ({max_disf}/min) pero con práctica lo resolverás.",
                f"Nivel moderado-alto de disfluencias: {disfluencies:.1f}/min. Reducir a {max_disf}/min mejorará tu profesionalismo notablemente."
            ],
            "low": [
                f"Excelente control de disfluencias: solo {disfluencies:.1f} por minuto. ¡Muy pocos 'ehs' y 'umms'!",
                f"Fluidez destacada con apenas {disfluencies:.1f} muletillas/min. Tu mensaje suena pulido y confiable.",
                f"Control impresionante: {disfluencies:.1f} disfluencias/min (ideal: <{max_disf}). Tu discurso fluye naturalmente."
            ],
            "perfect": [
                "¡Fluidez perfecta! Cero disfluencias detectables. Hablaste como un profesional consumado.",
                "¡Impecable! No detectamos ni una sola muletilla. Tu mensaje fue cristalino.",
                "Fluidez nivel experto: 0 disfluencias. Cada palabra tuvo propósito e intención."
            ]
        }
        
        if disfluencies > max_disf * 2:
            summary += random.choice(disfluency_comments["very_high"]) + " "
        elif disfluencies > max_disf:
            summary += random.choice(disfluency_comments["high"]) + " "
        elif disfluencies > 0:
            summary += random.choice(disfluency_comments["low"]) + " "
        else:
            summary += random.choice(disfluency_comments["perfect"]) + " "
        
        # DETAILED pitch analysis with varied phrasing
        pitch_comments = {
            "very_low": [
                f"Tu variación de tono ({pitch:.1f}) es muy monótona. Esto es crítico en {ctx_lang['name']} donde {ctx_lang['focus']}. Tu voz suena plana.",
                f"Tono monótono detectado ({pitch:.1f}). En {ctx_lang['name']}, la falta de variación vocal puede hacer que pierdan interés rápidamente.",
                f"Tu voz carece de dinamismo ({pitch:.1f} de variación). Para {ctx_lang['name']}, necesitas modular más tu tono para mantener engagement."
            ],
            "low": [
                f"Tu tono necesita más dinamismo (actualmente {pitch:.1f}, ideal {ideal_pitch_min}+). En {ctx_lang['name']}, {ctx_lang['key_moments'][0]} requiere variación vocal.",
                f"Variación de tono limitada ({pitch:.1f}). Sube el rango a {ideal_pitch_min}+ para que {ctx_lang['name']} tenga más vida.",
                f"Tu modulación vocal ({pitch:.1f}) puede mejorar. El rango {ideal_pitch_min}-{ideal_pitch_max} es óptimo para {ctx_lang['name']}."
            ],
            "high": [
                f"¡Excelente variación de tono ({pitch:.1f})! Mantienes la atención naturalmente.",
                f"Modulación vocal destacada ({pitch:.1f}). Tu voz tiene dinamismo y mantiene el interés del oyente.",
                f"Variación de tono impresionante ({pitch:.1f}). Usas tu voz como instrumento para enfatizar ideas clave."
            ],
            "good": [
                f"Buena variación de tono ({pitch:.1f}). Tienes un rango vocal adecuado para {ctx_lang['name']}.",
                f"Modulación vocal sólida ({pitch:.1f}). Tu tono varía lo suficiente para mantener interés.",
                f"Rango de tono apropiado ({pitch:.1f}). Evitas la monotonía sin exagerar."
            ]
        }
        
        if pitch < 10:
            summary += random.choice(pitch_comments["very_low"]) + " "
        elif pitch < ideal_pitch_min:
            summary += random.choice(pitch_comments["low"]) + " "
        elif pitch > ideal_pitch_max:
            summary += random.choice(pitch_comments["high"]) + " "
        else:
            summary += random.choice(pitch_comments["good"]) + " "
        
        # Add comparison with previous if available
        if previous_recording:
            summary += "\n\n📊 Comparación con tu última práctica: "
            prev_pace = previous_recording.get('pace', 0)
            prev_disf = previous_recording.get('disfluencies_per_minute', 0)
            prev_pitch = previous_recording.get('pitch_variation', 0)
            
            if abs(pace - prev_pace) > 10:
                trend = "aumentó" if pace > prev_pace else "disminuyó"
                summary += f"Tu ritmo {trend} {abs(pace - prev_pace):.0f} ppm. "
            
            if prev_disf > 0 and disfluencies < prev_disf:
                improvement = ((prev_disf - disfluencies) / prev_disf) * 100
                summary += f"¡Redujiste disfluencias un {improvement:.0f}%! "
            elif disfluencies > prev_disf:
                summary += f"Aumentaron las disfluencias (+{disfluencies - prev_disf:.1f}/min). "
        
        # SPECIFIC, ACTIONABLE steps based on weaknesses with variety
        actions = []
        
        # Pace-specific actions with multiple options
        pace_actions = {
            "very_slow": [
                f"URGENTE: Acelera. Graba 1 minuto hoy, escúchalo, luego re-graba 10% más rápido. Repite hasta {min_pace} ppm.",
                f"Ejercicio del metrónomo: Habla siguiendo 120 bpm, luego 130, luego 140. Encuentra tu ritmo ideal en {min_pace}-{max_pace} ppm.",
                f"Lee noticias en voz alta durante 2 minutos. Meta: terminar todo el artículo. Esto te forzará a acelerar naturalmente."
            ],
            "slow": [
                f"Acelera gradualmente: Cada día, habla 5 ppm más rápido. En 1 semana estarás en {min_pace} ppm.",
                f"Técnica del cronómetro: Explica un concepto en 60 segundos (hoy), luego en 50 segundos (mañana), luego en 45 segundos.",
                f"Graba un minuto a {pace} ppm, otro a {min_pace} ppm. Escucha la diferencia. Practica el segundo ritmo."
            ],
            "fast": [
                f"Reduce velocidad: Haz pausas de 1-2 segundos después de cada frase importante. Cuenta mentalmente.",
                f"Técnica de respiración: Respira profundo cada 3 frases. Esto te obliga a pausar y reduce el ritmo naturalmente.",
                f"Graba 2 minutos. Marca con 'X' cada momento donde debiste pausar. Re-graba añadiendo esas pausas."
            ],
            "very_fast": [
                f"URGENTE: Pausa estratégica. Después de cada punto clave, silencio de 3 segundos. Tu audiencia necesita procesar.",
                f"Ejercicio de tartamudez inversa: Habla ex-tre-ma-da-men-te len-to por 30s. Luego velocidad normal. Notarás la diferencia.",
                f"Divide tu mensaje en 'chunks' de 10 palabras. Pausa 2 segundos entre chunks. Reduce a {max_pace} ppm gradualmente."
            ]
        }
        
        if pace < min_pace - 20:
            actions.append(random.choice(pace_actions["very_slow"]))
        elif pace < min_pace:
            actions.append(random.choice(pace_actions["slow"]))
        elif pace > max_pace + 20:
            actions.append(random.choice(pace_actions["very_fast"]))
        elif pace > max_pace:
            actions.append(random.choice(pace_actions["fast"]))
        
        # Disfluency-specific actions with variety
        disfluency_actions = {
            "critical": [
                "CRÍTICO: Graba 30 segundos. Escucha y cuenta tus muletillas. Re-graba reemplazando cada una con 1 segundo de silencio. Repite 5 veces.",
                "Técnica del 'censor mental': Cada vez que sientas un 'eh' o 'um' venir, muerde tu lengua (literalmente). Practica hasta que sea automático.",
                "Ejercicio extremo: Graba 1 minuto. Cada muletilla = 5 lagartijas. Notarás que tu cerebro aprende RÁPIDO a evitarlas."
            ],
            "high": [
                "Identifica tu muletilla #1. Cada vez que la uses en conversación, detente 3 segundos antes de continuar. Tu cerebro se auto-corregirá.",
                "Técnica del reemplazo: Cambia 'eh' por pausa, 'este' por respiración profunda, 'o sea' por 'es decir'. Practica activamente.",
                "Graba 2 minutos sin guion. Transcribe SOLO las muletillas. Verás el patrón. Próxima grabación: reduce un 50%."
            ],
            "moderate": [
                "Mejora fina: Antes de grabar, di en voz alta 'Voy a hablar sin muletillas'. Esto activa tu filtro mental.",
                "Practica 'hablar en puntos': Idea completa → pausa → siguiente idea. Las muletillas viven en las transiciones confusas.",
                "Lee en voz alta 2 minutos perfectamente (texto escrito no tiene muletillas). Luego improvisa 2 minutos imitando esa fluidez."
            ]
        }
        
        if disfluencies > max_disf * 2:
            actions.append(random.choice(disfluency_actions["critical"]))
        elif disfluencies > max_disf:
            actions.append(random.choice(disfluency_actions["high"]))
        elif disfluencies > max_disf * 0.5:
            actions.append(random.choice(disfluency_actions["moderate"]))
        
        # Pitch-specific actions with variety
        pitch_actions = {
            "critical": [
                f"CRÍTICO para {ctx_lang['name']}: Exagera tu tono al máximo (como narrador de película). Luego reduce 50%. Ese es tu objetivo.",
                "Técnica de imitación: Escucha a [Steve Jobs/Obama/tu speaker favorito]. Copia su modulación en 1 minuto de práctica.",
                "Ejercicio vocal: Repite la misma frase 5 veces: susurrando, normal, enfático, pregunta, exclamación. Nota la diferencia."
            ],
            "needs_work": [
                "Mejora dinámica: Marca 3 palabras clave en tu guion. Sube el tono un 30% SOLO en esas palabras. El contraste genera interés.",
                "Técnica del 'sube-baja': Primera frase tono alto, segunda bajo, tercera medio. Varía constantemente.",
                "Graba y visualiza: Usa app que muestre tu pitch. Debe parecer montaña rusa, no línea recta."
            ],
            "good": [
                "Refinamiento: Tu tono es bueno, ahora hazlo estratégico. Baja el tono al final de afirmaciones. Sube en preguntas retóricas.",
                f"Matching contextual: En {ctx_lang['key_moments'][0]}, enfatiza con pitch alto. En {ctx_lang['key_moments'][1]}, mantén grave y firme.",
                "Practica emociones: Graba explicando algo feliz, luego triste, luego urgente. Nota cómo tu pitch sigue la emoción automáticamente."
            ]
        }
        
        if pitch < 10:
            actions.append(random.choice(pitch_actions["critical"]))
        elif pitch < ideal_pitch_min:
            actions.append(random.choice(pitch_actions["needs_work"]))
        elif pitch >= ideal_pitch_min and pitch < ideal_pitch_max * 0.8:
            actions.append(random.choice(pitch_actions["good"]))
        
        # Pitch-specific actions
        if pitch < 10:
            actions.append(f"CRÍTICO para {ctx_lang['name']}: Exagera tu tono. Lee el mismo texto como si se lo contaras a un niño de 5 años (muy exagerado), luego reduce 50%.")
        elif pitch < ideal_pitch_min:
            actions.append(f"Aumenta variación: En {ctx_lang['key_moments'][1]}, {ctx_lang['voice_tips'][0]}.")
        
        # Context-specific tactical advice
        actions.append(f"Táctica específica para {ctx_lang['name']}: {ctx_lang['voice_tips'][1]}")
        
        # Add anti-pattern warning
        if len(ctx_lang['common_mistakes']) > 0:
            mistake_idx = 0 if disfluencies > max_disf else (1 if pitch < ideal_pitch_min else 2)
            if mistake_idx < len(ctx_lang['common_mistakes']):
                actions.append(f"⚠️ Evita: {ctx_lang['common_mistakes'][mistake_idx]}")
        
        # Generate VARIED, SPECIFIC exercises
        exercises_pool = {
            "sales_pitch": [
                f"Graba 2 minutos vendiendo tu producto favorito. Meta: 0 muletillas, ritmo {min_pace}-{max_pace} ppm, y termina con 'Si dices SÍ ahora...' (fuerte énfasis en SÍ).",
                f"Pitch de 90 segundos: Problema (20s, tono preocupado) → Solución (40s, tono entusiasta) → Precio (20s, pausa antes de decirlo) → Cierre urgente (10s, acelerado).",
                f"Vende algo ridículo (ej: peine para calvos) pero en serio. Esto te fuerza a usar tono convincente incluso con producto absurdo. 2 minutos, {min_pace} ppm mínimo."
            ],
            "academic": [
                f"Explica [concepto de tu campo] en 3 minutos con esta estructura exacta: Definición (30s) → 3 ejemplos (60s cada uno) → Conclusión (30s). Pausa 2 segundos entre secciones.",
                f"Graba como si explicaras a tu profesor: introduce tesis en 20 segundos, presenta 3 evidencias (30s cada una con fuente), concluye en 20s. Máximo {max_disf} muletillas.",
                f"Método Feynman: Explica [tema complejo] como si tu audiencia tuviera 12 años, pero sin perder precisión académica. 4 minutos, ritmo {min_pace} ppm."
            ],
            "interview": [
                f"Responde 'Cuéntame de ti' con estructura: Pasado (30s) → Presente (30s) → Futuro/Por qué esta empresa (30s). Total 90s, cero muletillas, tono seguro.",
                f"Practica respuesta STAR a 'Cuéntame un logro': Situación (15s) → Tarea (15s) → Acción (45s con detalles) → Resultado cuantificable (15s). Pausa 1s antes del resultado.",
                f"Pregunta trampa: 'Cuál es tu mayor debilidad'. Responde en 60s convirtiendo debilidad en aprendizaje. Tono honesto pero confiado, máximo 2 muletillas."
            ],
            "public_speech": [
                f"Discurso de 2 minutos sobre tema que te apasiona. Debe incluir: Gancho emocional (pausa dramática después), 3 puntos principales (cambio de tono en cada uno), llamado a la acción (acelera al final).",
                f"Técnica 'Susurra-Grita': Cuenta una historia en 90s. Empieza susurrando (intimidad), sube volumen gradualmente, momento culminante en voz alta, termina en tono medio. Varía ritmo según tensión.",
                f"Practica MLK Jr: 'Tengo un sueño...' Repite la frase 3 veces con diferente énfasis cada vez. Nota cómo la repetición + variación = poder. Aplícalo a tu mensaje."
            ],
            "storytelling": [
                f"Cuenta historia personal de 3 minutos: Setup lento ({min_pace} ppm), conflicto acelerado ({max_pace} ppm), clímax (pausa dramática antes), resolución (ritmo medio). Varía tono según emoción.",
                f"Técnica Pixar: Había una vez [personaje]... Cada día [rutina]... Hasta que un día [conflicto]... Por eso [acciones]... Hasta que finalmente [resolución]. 3 min, cambia ritmo en 'Hasta que un día'.",
                f"Narra como película: Parte 1 descriptiva y lenta, Parte 2 acción rápida y dinámica, Parte 3 conclusión reflexiva media. Practica cambiar entre estos 3 'modos' fluidamente."
            ],
            "general": [
                f"Graba 2 minutos explicando tu día. Meta: conversacional pero claro, {min_pace}-{max_pace} ppm, máximo {max_disf} muletillas, y termina con reflexión (no 'ya, eso es todo').",
                f"Técnica 'Elevator Pitch' de ti mismo: 60 segundos donde explicas quién eres, qué haces, y por qué es interesante. Debe sonar natural, no memorizado. Ritmo {(min_pace+max_pace)//2} ppm.",
                f"Lee un párrafo de un libro, luego explícalo con tus palabras (sin mirarlo). Compara tu ritmo vs el original. Meta: mantener claridad pero con tu estilo natural."
            ]
        }
        
        exercise_list = exercises_pool.get(context, exercises_pool["general"])
        # Rotate exercises based on user's history
        exercise_index = hash(str(metrics)) % len(exercise_list)
        exercise = exercise_list[exercise_index]
        
    else:  # English
        # Opening varies by overall performance
        if overall_score >= 85:
            openings = [
                f"Excellent work! In your {ctx_lang['name']}, ",
                f"Impressive! Your {ctx_lang['name']} demonstrates ",
                f"Outstanding! You've mastered your {ctx_lang['name']} with "
            ]
        elif overall_score >= 70:
            openings = [
                f"Good progress on your {ctx_lang['name']}. ",
                f"You're on the right track with your {ctx_lang['name']}. ",
                f"Solid performance on your {ctx_lang['name']}. "
            ]
        else:
            openings = [
                f"Room for improvement in your {ctx_lang['name']}. ",
                f"Let's work on your {ctx_lang['name']} together. ",
                f"With practice, you'll improve your {ctx_lang['name']}. "
            ]
        
        import random
        summary = random.choice(openings)
        
        # DETAILED pace analysis with specific advice
        pace_diff = pace - ((min_pace + max_pace) / 2)
        if pace < min_pace - 20:
            summary += f"Your pace of {pace} wpm is very slow. This can cause your audience to lose attention. "
            summary += f"The ideal range for {ctx_lang['name']} is {min_pace}-{max_pace} wpm. "
            summary += "Tip: Practice reading aloud with a metronome to naturally increase speed. "
        elif pace < min_pace:
            summary += f"Your pace of {pace} wpm is measured ({abs(pace_diff):.0f} wpm below ideal). "
            summary += "This can be good for clarity, but you might lose momentum. "
        elif pace > max_pace + 20:
            summary += f"Your pace of {pace} wpm is very fast. Your audience may have difficulty processing. "
            summary += f"Try to reduce to {min_pace}-{max_pace} wpm. "
            summary += "Tip: Pause for 2-3 seconds after each key point. "
        elif pace > max_pace:
            summary += f"Your pace of {pace} wpm is slightly fast (+{pace_diff:.0f} wpm above ideal). "
            summary += "This adds energy, but be careful not to rush through critical moments. "
        else:
            summary += f"Your pace of {pace} wpm is perfect for this context. You're in the ideal range of {min_pace}-{max_pace} wpm. "
        
        # DETAILED disfluency analysis with varied phrasing
        disfluency_comments = {
            "very_high": [
                f"We detected {disfluencies:.1f} disfluencies per minute (more than double the ideal limit of {max_disf}). This can significantly weaken your message.",
                f"High level of fillers: {disfluencies:.1f}/min when the ideal is max {max_disf}. Each 'um' or 'like' reduces the impact of your ideas.",
                f"Disfluencies ({disfluencies:.1f}/min) are affecting your credibility. The recommended threshold is {max_disf}/min for {ctx_lang['name']}."
            ],
            "high": [
                f"You have {disfluencies:.1f} disfluencies/min (ideal is max {max_disf}). They're manageable, but each filler reduces credibility.",
                f"We detected {disfluencies:.1f} fillers per minute. It's above the ideal ({max_disf}/min) but with practice you'll improve.",
                f"Moderate-high level of disfluencies: {disfluencies:.1f}/min. Reducing to {max_disf}/min will noticeably improve your professionalism."
            ],
            "low": [
                f"Excellent disfluency control: only {disfluencies:.1f} per minute. Very few 'ums' and 'likes'!",
                f"Outstanding fluency with barely {disfluencies:.1f} fillers/min. Your message sounds polished and reliable.",
                f"Impressive control: {disfluencies:.1f} disfluencies/min (ideal: <{max_disf}). Your speech flows naturally."
            ],
            "perfect": [
                "Perfect fluency! Zero detectable disfluencies. You spoke like a seasoned professional.",
                "Flawless! We didn't detect a single filler. Your message was crystal clear.",
                "Expert-level fluency: 0 disfluencies. Every word had purpose and intention."
            ]
        }
        
        if disfluencies > max_disf * 2:
            summary += random.choice(disfluency_comments["very_high"]) + " "
        elif disfluencies > max_disf:
            summary += random.choice(disfluency_comments["high"]) + " "
        elif disfluencies > 0:
            summary += random.choice(disfluency_comments["low"]) + " "
        else:
            summary += random.choice(disfluency_comments["perfect"]) + " "
        
        # DETAILED pitch analysis with varied phrasing
        pitch_comments = {
            "very_low": [
                f"Your pitch variation ({pitch:.1f}) is very monotone. This is critical in {ctx_lang['name']} where {ctx_lang['focus']}. Your voice sounds flat.",
                f"Monotone detected ({pitch:.1f}). In {ctx_lang['name']}, lack of vocal variation can make people lose interest quickly.",
                f"Your voice lacks dynamism ({pitch:.1f} variation). For {ctx_lang['name']}, you need to modulate your tone more to maintain engagement."
            ],
            "low": [
                f"Your tone needs more dynamism (currently {pitch:.1f}, ideal {ideal_pitch_min}+). In {ctx_lang['name']}, {ctx_lang['key_moments'][0]} requires vocal variation.",
                f"Limited pitch variation ({pitch:.1f}). Raise the range to {ideal_pitch_min}+ to give {ctx_lang['name']} more life.",
                f"Your vocal modulation ({pitch:.1f}) can improve. The range {ideal_pitch_min}-{ideal_pitch_max} is optimal for {ctx_lang['name']}."
            ],
            "high": [
                f"Excellent pitch variation ({pitch:.1f})! You maintain attention naturally.",
                f"Outstanding vocal modulation ({pitch:.1f}). Your voice has dynamism and keeps the listener interested.",
                f"Impressive pitch variation ({pitch:.1f}). You use your voice as an instrument to emphasize key ideas."
            ],
            "good": [
                f"Good pitch variation ({pitch:.1f}). You have an adequate vocal range for {ctx_lang['name']}.",
                f"Solid vocal modulation ({pitch:.1f}). Your tone varies enough to maintain interest.",
                f"Appropriate pitch range ({pitch:.1f}). You avoid monotony without overdoing it."
            ]
        }
        
        if pitch < 10:
            summary += random.choice(pitch_comments["very_low"]) + " "
        elif pitch < ideal_pitch_min:
            summary += random.choice(pitch_comments["low"]) + " "
        elif pitch > ideal_pitch_max:
            summary += random.choice(pitch_comments["high"]) + " "
        else:
            summary += random.choice(pitch_comments["good"]) + " "
        
        # Add comparison with previous if available
        if previous_recording:
            summary += "\n\nComparison with your last practice: "
            prev_pace = previous_recording.get('pace', 0)
            prev_disf = previous_recording.get('disfluencies_per_minute', 0)
            prev_pitch = previous_recording.get('pitch_variation', 0)
            
            if abs(pace - prev_pace) > 10:
                trend = "increased" if pace > prev_pace else "decreased"
                summary += f"Your pace {trend} {abs(pace - prev_pace):.0f} wpm. "
            
            if prev_disf > 0 and disfluencies < prev_disf:
                improvement = ((prev_disf - disfluencies) / prev_disf) * 100
                summary += f"You reduced disfluencies by {improvement:.0f}%! "
            elif disfluencies > prev_disf:
                summary += f"Disfluencies increased (+{disfluencies - prev_disf:.1f}/min). "
        
        # SPECIFIC, ACTIONABLE steps based on weaknesses with variety
        actions = []
        
        # Pace-specific actions with multiple options
        pace_actions = {
            "very_slow": [
                f"URGENT: Speed up. Record 1 minute today, listen to it, then re-record 10% faster. Repeat until {min_pace} wpm.",
                f"Metronome exercise: Speak following 120 bpm, then 130, then 140. Find your ideal rhythm at {min_pace}-{max_pace} wpm.",
                f"Read news articles aloud for 2 minutes. Goal: finish the entire article. This will force you to naturally speed up."
            ],
            "slow": [
                f"Gradually accelerate: Each day, speak 5 wpm faster. In 1 week you'll be at {min_pace} wpm.",
                f"Stopwatch technique: Explain a concept in 60 seconds (today), then in 50 seconds (tomorrow), then in 45 seconds.",
                f"Record one minute at {pace} wpm, another at {min_pace} wpm. Listen to the difference. Practice the second rhythm."
            ],
            "fast": [
                f"Reduce speed: Pause for 1-2 seconds after each important phrase. Count mentally.",
                f"Breathing technique: Take a deep breath every 3 sentences. This forces you to pause and naturally reduces pace.",
                f"Record 2 minutes. Mark with 'X' each moment you should have paused. Re-record adding those pauses."
            ],
            "very_fast": [
                f"URGENT: Strategic pausing. After each key point, 3 seconds of silence. Your audience needs time to process.",
                f"Reverse stutter exercise: Speak ex-treme-ly slow-ly for 30s. Then normal speed. You'll notice the difference.",
                f"Divide your message into 'chunks' of 10 words. Pause 2 seconds between chunks. Gradually reduce to {max_pace} wpm."
            ]
        }
        
        if pace < min_pace - 20:
            actions.append(random.choice(pace_actions["very_slow"]))
        elif pace < min_pace:
            actions.append(random.choice(pace_actions["slow"]))
        elif pace > max_pace + 20:
            actions.append(random.choice(pace_actions["very_fast"]))
        elif pace > max_pace:
            actions.append(random.choice(pace_actions["fast"]))
        
        # Disfluency-specific actions with variety
        disfluency_actions = {
            "critical": [
                "CRITICAL: Record 30 seconds. Listen and count your fillers. Re-record replacing each one with 1 second of silence. Repeat 5 times.",
                "Mental censor technique: Every time you feel an 'um' or 'like' coming, bite your tongue (literally). Practice until it becomes automatic.",
                "Extreme exercise: Record 1 minute. Each filler = 5 push-ups. You'll notice your brain learns FAST to avoid them."
            ],
            "high": [
                "Identify your #1 filler. Every time you use it in conversation, stop for 3 seconds before continuing. Your brain will self-correct.",
                "Replacement technique: Change 'um' to pause, 'like' to deep breath, 'you know' to 'specifically'. Practice actively.",
                "Record 2 minutes without a script. Transcribe ONLY the fillers. You'll see the pattern. Next recording: reduce by 50%."
            ],
            "moderate": [
                "Fine-tuning: Before recording, say aloud 'I will speak without fillers'. This activates your mental filter.",
                "Practice 'point speaking': Complete idea → pause → next idea. Fillers live in confused transitions.",
                "Read aloud for 2 minutes perfectly (written text has no fillers). Then improvise 2 minutes imitating that fluency."
            ]
        }
        
        if disfluencies > max_disf * 2:
            actions.append(random.choice(disfluency_actions["critical"]))
        elif disfluencies > max_disf:
            actions.append(random.choice(disfluency_actions["high"]))
        elif disfluencies > max_disf * 0.5:
            actions.append(random.choice(disfluency_actions["moderate"]))
        
        # Pitch-specific actions with variety
        pitch_actions = {
            "critical": [
                f"CRITICAL for {ctx_lang['name']}: Exaggerate your tone to the max (like a movie narrator). Then reduce 50%. That's your target.",
                "Imitation technique: Listen to [Steve Jobs/Obama/your favorite speaker]. Copy their modulation in 1 minute of practice.",
                "Vocal exercise: Repeat the same phrase 5 times: whispering, normal, emphatic, questioning, exclaiming. Notice the difference."
            ],
            "needs_work": [
                "Improve dynamics: Mark 3 key words in your script. Raise pitch 30% ONLY on those words. The contrast generates interest.",
                "'Up-down' technique: First sentence high pitch, second low, third medium. Vary constantly.",
                "Record and visualize: Use an app that shows your pitch. It should look like a rollercoaster, not a flat line."
            ],
            "good": [
                "Refinement: Your tone is good, now make it strategic. Lower pitch at end of statements. Raise on rhetorical questions.",
                f"Contextual matching: In {ctx_lang['key_moments'][0]}, emphasize with high pitch. In {ctx_lang['key_moments'][1]}, keep it low and firm.",
                "Practice emotions: Record explaining something happy, then sad, then urgent. Notice how your pitch follows emotion automatically."
            ]
        }
        
        if pitch < 10:
            actions.append(random.choice(pitch_actions["critical"]))
        elif pitch < ideal_pitch_min:
            actions.append(random.choice(pitch_actions["needs_work"]))
        elif pitch >= ideal_pitch_min and pitch < ideal_pitch_max * 0.8:
            actions.append(random.choice(pitch_actions["good"]))
        
        # Context-specific tactical advice
        actions.append(f"Specific tactic for {ctx_lang['name']}: {ctx_lang['voice_tips'][1]}")
        
        # Add anti-pattern warning
        if len(ctx_lang['common_mistakes']) > 0:
            mistake_idx = 0 if disfluencies > max_disf else (1 if pitch < ideal_pitch_min else 2)
            if mistake_idx < len(ctx_lang['common_mistakes']):
                actions.append(f"Warning: Avoid {ctx_lang['common_mistakes'][mistake_idx]}")
        
        # Generate VARIED, SPECIFIC exercises
        exercises_pool = {
            "sales_pitch": [
                f"Record 2 minutes selling your favorite product. Goal: 0 fillers, {min_pace}-{max_pace} wpm pace, and end with 'If you say YES now...' (strong emphasis on YES).",
                f"90-second pitch: Problem (20s, worried tone) → Solution (40s, enthusiastic) → Price (20s, pause before stating) → Urgent close (10s, accelerated).",
                f"Sell something ridiculous (e.g., comb for bald people) but seriously. This forces you to use convincing tone even with absurd product. 2 minutes, {min_pace} wpm minimum."
            ],
            "academic": [
                f"Explain [concept in your field] in 3 minutes with exact structure: Definition (30s) → 3 examples (60s each) → Conclusion (30s). Pause 2 seconds between sections.",
                f"Record as if explaining to your professor: introduce thesis in 20 seconds, present 3 pieces of evidence (30s each with source), conclude in 20s. Max {max_disf} fillers.",
                f"Feynman method: Explain [complex topic] as if your audience is 12 years old, but without losing academic precision. 4 minutes, {min_pace} wpm pace."
            ],
            "interview": [
                f"Answer 'Tell me about yourself' with structure: Past (30s) → Present (30s) → Future/Why this company (30s). Total 90s, zero fillers, confident tone.",
                f"Practice STAR response to 'Tell me about an achievement': Situation (15s) → Task (15s) → Action (45s with details) → Quantifiable Result (15s). Pause 1s before result.",
                f"Tricky question: 'What's your biggest weakness'. Answer in 60s turning weakness into learning. Honest but confident tone, max 2 fillers."
            ],
            "public_speech": [
                f"2-minute speech on topic you're passionate about. Must include: Emotional hook (dramatic pause after), 3 main points (tone change in each), call to action (accelerate at end).",
                f"'Whisper-Shout' technique: Tell story in 90s. Start whispering (intimacy), gradually increase volume, climax loudly, end medium tone. Vary pace with tension.",
                f"Practice MLK Jr style: 'I have a dream...' Repeat the phrase 3 times with different emphasis each time. Notice how repetition + variation = power. Apply to your message."
            ],
            "storytelling": [
                f"Tell personal story in 3 minutes: Slow setup ({min_pace} wpm), accelerated conflict ({max_pace} wpm), climax (dramatic pause before), medium resolution. Vary tone with emotion.",
                f"Pixar technique: Once upon a time [character]... Every day [routine]... Until one day [conflict]... Because of that [actions]... Until finally [resolution]. 3 min, change pace at 'Until one day'.",
                f"Narrate like a movie: Part 1 descriptive and slow, Part 2 fast-paced action, Part 3 reflective conclusion. Practice switching between these 3 'modes' fluidly."
            ],
            "general": [
                f"Record 2 minutes explaining your day. Goal: conversational but clear, {min_pace}-{max_pace} wpm, max {max_disf} fillers, and end with reflection (not 'that's it').",
                f"'Elevator Pitch' of yourself: 60 seconds where you explain who you are, what you do, and why it's interesting. Should sound natural, not memorized. {(min_pace+max_pace)//2} wpm pace.",
                f"Read a book paragraph, then explain it in your words (without looking). Compare your pace vs the original. Goal: maintain clarity but with your natural style."
            ]
        }
        
        exercise_list = exercises_pool.get(context, exercises_pool["general"])
        # Rotate exercises based on user's history
        exercise_index = hash(str(metrics)) % len(exercise_list)
        exercise = exercise_list[exercise_index]
    
    return {
        "summary": summary,
        "actions": actions,
        "exercise": exercise,
        "overall_score": round(overall_score, 1),
        "pace_score": round(pace_score, 1),
        "pitch_score": round(pitch_score, 1),
        "disfluency_score": round(disfluency_score, 1)
    }

def transcribe_local(file_path: str):
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel(
            os.getenv('LOCAL_WHISPER_MODEL', 'small'), 
            device="cpu", 
            compute_type="int8"
        )
        segments, _ = model.transcribe(file_path)
        return " ".join([seg.text for seg in segments])
    except Exception as e:
        print(f"faster_whisper no disponible o falló: {e}")
        return ""

# ==============================================================================
# DEPENDENCIAS Y ENDPOINTS DE API
# ==============================================================================
async def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(
            status_code=401,
            detail="No authentication token provided",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError as e:
        print(f"JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    # Query Supabase for user
    response = supabase.table("users").select("*").eq("email", email).execute()
    
    if not response.data or len(response.data) == 0:
        raise HTTPException(status_code=401, detail="User not found")
    
    user = response.data[0]
    return {"email": email, **user}

@app.post("/register")
async def register_user(form_data: OAuth2PasswordRequestForm = Depends()):
    is_valid, message = validate_password(form_data.password)
    if not is_valid: 
        raise HTTPException(status_code=400, detail=message)
    
    # Check if user exists
    existing = supabase.table("users").select("email").eq("email", form_data.username).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    hashed_password = get_password_hash(form_data.password)
    
    # Insert new user
    supabase.table("users").insert({
        "email": form_data.username,
        "hashed_password": hashed_password,
        "created_at": int(time.time()),
        "minutes": 0,
        "tier": "free"
    }).execute()
    
    return {"message": "Usuario creado exitosamente"}

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    response = supabase.table("users").select("*").eq("email", form_data.username).execute()
    
    if not response.data:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    
    user = response.data[0]
    
    if not verify_password(form_data.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    
    access_token = create_access_token(
        data={"sub": form_data.username}, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ==============================================================================
# SESSION MANAGEMENT ENDPOINTS
# ==============================================================================
@app.post("/sessions/create")
async def create_session(
    session_data: SessionCreate,
    user: dict = Depends(get_current_user)
):
    """Create a new practice session"""
    user_email = user.get("email")
    
    response = supabase.table("sessions").insert({
        "user_email": user_email,
        "name": session_data.name,
        "context": session_data.context,
        "target_audience": session_data.target_audience,
        "goal": session_data.goal,
        "created_at": int(time.time())
    }).execute()
    
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create session")
    
    session_id = response.data[0]["id"]
    
    return {
        "session_id": session_id,
        "message": "Session created successfully"
    }

@app.get("/sessions/list")
async def list_sessions(user: dict = Depends(get_current_user)):
    """List all sessions for the current user with accurate recording counts"""
    user_email = user.get("email")
    
    # Get sessions
    sessions_response = supabase.table("sessions").select(
        "id, name, context, created_at"
    ).eq("user_email", user_email).order("created_at", desc=True).execute()
    
    sessions = []
    for session in sessions_response.data:
        # Get recording count separately for accuracy
        recordings_response = supabase.table("recordings").select(
            "id", count="exact"
        ).eq("session_id", session["id"]).execute()
        
        sessions.append({
            "id": session["id"],
            "name": session["name"],
            "context": session["context"],
            "created_at": session["created_at"],
            "recordings_count": recordings_response.count or 0
        })
    
    return {"sessions": sessions}

@app.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    user: dict = Depends(get_current_user)
):
    """Get session details with all recordings"""
    user_email = user.get("email")
    
    # Get session with recordings
    response = supabase.table("sessions").select(
        "*, recordings(*)"
    ).eq("id", session_id).eq("user_email", user_email).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return response.data[0]

# ==============================================================================
# AUDIO ANALYSIS ENDPOINTS
# ==============================================================================
@app.post("/upload-audio/")
async def upload_audio(
    session_id: str,
    locale: str = "es",
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    print(f"\n[INFO] Starting upload for session_id: {session_id}")
    print(f"[INFO] Locale received: {locale}")
    user_email = user.get("email")
    user_tier = user.get("tier", "free")
    user_minutes_used = user.get("minutes", 0)

    if user_tier == "free" and user_minutes_used >= FREE_TIER_MINUTES:
        raise HTTPException(
            status_code=403,
            detail=f"Límite de {FREE_TIER_MINUTES} minutos para el plan gratuito superado."
        )

    temp_dir = "temp_audio"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, secrets.token_hex(8) + "_" + file.filename)
    
    try:
        contents = await file.read()
        if len(contents) > 15 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large")
        
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        
        acoustic_results = analyze_acoustics(file_path)
        duration = acoustic_results.get("duration", 0)
        transcript = ""
        
        if 1 < duration < 65:
            try:
                client = speech.SpeechClient()
                audio = speech.RecognitionAudio(content=contents)
                config = speech.RecognitionConfig(
                    encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                    sample_rate_hertz=48000,
                    language_code="es-ES",
                    alternative_language_codes=["en-US"]
                )
                response = client.recognize(config=config, audio=audio)
                if response.results:
                    transcript = response.results[0].alternatives[0].transcript
            except Exception as e:
                print(f"Error en transcripción de Google Speech: {e}")
        elif duration >= 65:
            transcript = transcribe_local(file_path)
        
        conviction_analysis = analyze_conviction(transcript)
        duration_minutes = duration / 60 if duration > 0 else 1
        
        pace = (
            round(conviction_analysis["total_words"] / duration_minutes)
            if conviction_analysis["total_words"] > 0 and duration_minutes > 0
            else estimate_pace_from_audio(file_path, duration)
        )
        disfluencies_per_minute = (
            round(conviction_analysis["disfluency_count"] / duration_minutes, 1)
            if duration > 0 else 0
        )
        hedges_per_minute = (
            round(conviction_analysis["hedge_count"] / duration_minutes, 1)
            if duration > 0 else 0
        )
        
        evaluations, scores = evaluate_metrics_and_scores(
            pace,
            acoustic_results["pitch_variation"],
            disfluencies_per_minute,
            hedges_per_minute
        )
        feedback = generate_structured_feedback(evaluations, conviction_analysis)
        
        # Get session context
        session_response = supabase.table("sessions").select("context").eq("id", session_id).eq("user_email", user_email).execute()
        if not session_response.data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session_context = session_response.data[0]["context"]
        
        print("[INFO] Generating insights...")
        insights = generate_smart_insights(
            metrics={
                'pace': pace,
                'disfluencies_per_minute': disfluencies_per_minute,
                'pitch_variation': acoustic_results["pitch_variation"],
                'duration': duration
            },
            transcript=transcript,
            language=locale,
            context=session_context,
            
        )
        
        # Insert recording
        recording_response = supabase.table("recordings").insert({
            "session_id": session_id,
            "pace": pace,
            "pitch_variation": acoustic_results["pitch_variation"],
            "disfluencies_per_minute": disfluencies_per_minute,
            "hedge_count": conviction_analysis["hedge_count"],
            "total_words": conviction_analysis["total_words"],
            "duration": duration,
            "transcript": transcript,  # ← ADD THIS LINE
            "insights_summary": insights.get("summary", ""),
            "timestamp": int(time.time())
        }).execute()
        
        # Update user minutes
        supabase.table("users").update({
            "minutes": user_minutes_used + round(duration_minutes)
        }).eq("email", user_email).execute()
        
        # Get updated session with all recordings
        updated_session_response = supabase.table("sessions").select(
            "*, recordings(*)"
        ).eq("id", session_id).eq("user_email", user_email).execute()
        
        updated_session = updated_session_response.data[0] if updated_session_response.data else None

        return {
            "transcription": transcript,
            "pitch_variation": acoustic_results["pitch_variation"],
            "pace": pace,
            "disfluencies_per_minute": disfluencies_per_minute,
            "hedge_count": conviction_analysis["hedge_count"],
            "details": conviction_analysis.get("details", {}),
            "evaluations": evaluations,
            "scores": scores,
            "feedback": feedback,
            "duration": duration,
            "total_words": conviction_analysis["total_words"],
            "insights": insights,
            "session_id": session_id,
            "updated_session": updated_session
        }
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/insights/")
async def insights(
    payload: InsightsRequest,
    user: dict = Depends(get_current_user)
):
    """Generate contextual insights"""
    metrics = {
        'pace': payload.metrics.pace,
        'disfluencies_per_minute': payload.metrics.disfluencies_per_minute,
        'pitch_variation': payload.metrics.pitch_variation,
        'duration': payload.metrics.duration
    }
    
    language = detect_language(payload.transcript)
    
    return generate_smart_insights(
        metrics,
        payload.transcript,
        language,
        payload.context
    )

@app.post("/confirm-subscription")
async def confirm_subscription(
    payload: dict,
    user: dict = Depends(get_current_user)
):
    subscription_id = payload.get("subscriptionID")
    user_email = user.get("email")
    print(f"Confirmando suscripción {subscription_id} para el usuario {user_email}")
    
    # Update user tier and store subscription ID
    supabase.table("users").update({
        "tier": "pro",
        "subscription_id": subscription_id,
        "subscription_status": "active"
    }).eq("email", user_email).execute()
    
    # Log subscription activation
    supabase.table("payments").insert({
        "order_id": subscription_id,
        "user_email": user_email,
        "timestamp": int(time.time()),
        "event": "subscription_activated"
    }).execute()
    
    return {"status": "success", "message": "La suscripción ha sido activada."}

@app.post("/confirm-payment")
async def confirm_payment(
    payload: PaymentConfirmation,
    user: dict = Depends(get_current_user)
):
    user_email = user.get("email")
    print(f"Confirmando pago para el pedido {payload.orderID} del usuario {user_email}")
    
    # Update user tier
    supabase.table("users").update({
        "tier": "pro"
    }).eq("email", user_email).execute()
    
    # Log payment
    supabase.table("payments").insert({
        "order_id": payload.orderID,
        "user_email": user_email,
        "timestamp": int(time.time()),
        "event": "tier_upgraded_to_pro"
    }).execute()
    
    return {"status": "success", "message": "La cuenta ha sido actualizada a Pro."}

@app.post("/cancel-subscription")
async def cancel_subscription(
    user: dict = Depends(get_current_user)
):
    """Cancel user's Pro subscription and downgrade to free tier"""
    user_email = user.get("email")
    subscription_id = user.get("subscription_id")
    
    print(f"Cancelando suscripción {subscription_id} para el usuario {user_email}")
    
    # Update user tier to free and mark subscription as cancelled
    supabase.table("users").update({
        "tier": "free",
        "subscription_status": "cancelled"
    }).eq("email", user_email).execute()
    
    # Log subscription cancellation
    supabase.table("payments").insert({
        "order_id": subscription_id or "unknown",
        "user_email": user_email,
        "timestamp": int(time.time()),
        "event": "subscription_cancelled"
    }).execute()
    
    return {"status": "success", "message": "La suscripción ha sido cancelada."}

@app.post("/reactivate-subscription")
async def reactivate_subscription(
    user: dict = Depends(get_current_user)
):
    """Reactivate a cancelled Pro subscription"""
    user_email = user.get("email")
    subscription_id = user.get("subscription_id")
    
    print(f"Reactivando suscripción {subscription_id} para el usuario {user_email}")
    
    # Update user tier back to pro and mark subscription as active
    supabase.table("users").update({
        "tier": "pro",
        "subscription_status": "active"
    }).eq("email", user_email).execute()
    
    # Log subscription reactivation
    supabase.table("payments").insert({
        "order_id": subscription_id or "unknown",
        "user_email": user_email,
        "timestamp": int(time.time()),
        "event": "subscription_reactivated"
    }).execute()
    
    return {"status": "success", "message": "La suscripción ha sido reactivada."}

# ==============================================================================
# HEALTH CHECK
# ==============================================================================
@app.get("/")
async def root():
    return {"message": "LucidSpeak API is running with Supabase", "version": "3.0"}