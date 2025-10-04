from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import shutil
from google.cloud import speech
import os
import librosa
import numpy as np
import re
import collections
from pydub import AudioSegment
from dotenv import load_dotenv

load_dotenv()
ffmpeg_path = r"Z:\ffmpeg\bin"
os.environ["PATH"] += os.pathsep + ffmpeg_path

app = FastAPI()

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def analyze_acoustics(audio_path: str):
    try:
        audio = AudioSegment.from_file(audio_path).set_channels(1)
        y = np.array(audio.get_array_of_samples(), dtype=np.float32)
        sr = audio.frame_rate
        duration_seconds = len(y) / sr
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch_values = pitches[magnitudes > np.median(magnitudes)]
        pitch_std_dev = np.std(pitch_values) if len(pitch_values) > 0 else 0
        return {"duration": float(duration_seconds), "pitch_variation": round(float(pitch_std_dev), 2)}
    except Exception as e:
        print(f"--- ERROR CRÍTICO EN ANÁLISIS ACÚSTICO ---\nError: {e}\n-----------------------------------------")
        return {"duration": 0, "pitch_variation": 0}

def analyze_conviction(transcript: str):
    lower_transcript = transcript.lower()
    words = lower_transcript.replace(",", "").replace(".", "").split()
    if not words: return {"disfluency_count": 0, "hedge_count": 0, "total_words": 0, "details": {}, "hedge_details": {}}
    # Muletillas y frases de relleno
    filler_phrases = {
        "o sea", "you know", "en plan", "tipo que", "es que", "como que", "digamos que",
        "por así decir", "por decirlo así", "¿me entiendes?", "¿sabes?", "¿verdad?", "¿no?"
    }
    filler_words = {
        "eh", "em", "pues", "bueno", "este", "vale", "mmm", "uh", "um", "like", "so",
        "actually", "basically", "right", "entonces", "digamos", "digo", "osea", "mira"
    }
    # Palabras y frases que indican duda o falta de convicción
    hedge_phrases = {
        "creo que", "pienso que", "a lo mejor", "de alguna manera", "siento que",
        "i think", "i guess", "i suppose", "kind of", "sort of", "más o menos",
        "en cierta manera", "por decirlo de algún modo", "se podría decir"
    }
    hedge_words = {
        "quizás", "tal vez", "posiblemente", "supongo", "parece", "poco", "algo",
        "simplemente", "realmente", "maybe", "perhaps", "just", "really", "probably",
        "aproximadamente", "prácticamente", "relativamente", "como", "supuestamente"
    }
    
    # Detectar muletillas y frases de relleno
    found_filler_phrases = [p for p in filler_phrases if p in lower_transcript]
    found_hedge_phrases = [p for p in hedge_phrases if p in lower_transcript]
    found_fillers = [w for w in words if w in filler_words]
    found_hedges = [w for w in words if w in hedge_words]
    
    # Repeticiones permitidas
    allowed_repetitions = {"no", "sí", "muy", "tan", "bien", "claro"}
    found_repetitions = []
    for i in range(1, len(words)):
        if words[i] == words[i-1] and words[i] not in allowed_repetitions:
            found_repetitions.append(f"{words[i]} (x2)")
    # Detectar elongaciones en finales de palabras
    elongation_patterns = [
        (r'\b\w+[aeiouáéíóú]{3,}\b', 'vocal_final'),      # Detecta elongaciones vocálicas al final
        (r'\b\w+([bcdfghjklmnñpqrstvwxyz])\1{2,}\b', 'consonante_final'),  # Detecta elongaciones consonánticas al final
        (r'\b\w*([aeiouáéíóú])\1{2,}\w*\b', 'vocal_media'),  # Detecta elongaciones vocálicas en medio
        (r'([aeiouy])\1{2,}', 'sonido_alargado')  # Detecta sonidos alargados generales
    ]
    
    found_elongations = []
    for pattern, tipo in elongation_patterns:
        matches = re.finditer(pattern, lower_transcript)
        for match in matches:
            palabra = match.group(0)
            if tipo == 'sonido_alargado':
                found_elongations.append(f"'{palabra}' (alargamiento)")
            else:
                found_elongations.append(palabra)
    
    all_hedges = found_hedge_phrases + found_hedges
    all_disfluencies = found_filler_phrases + found_fillers + found_repetitions + found_elongations
    details = {"Muletillas": dict(collections.Counter(found_filler_phrases + found_fillers)),"Repeticiones": dict(collections.Counter(found_repetitions)),"Alargamientos": dict(collections.Counter(found_elongations)),}
    details = {k: v for k, v in details.items() if v}
    return {"disfluency_count": len(all_disfluencies),"hedge_count": len(all_hedges),"total_words": len(words),"details": details,"hedge_details": dict(collections.Counter(all_hedges))}

def evaluate_metrics_and_scores(pace, pitch_variation, disfluencies_per_minute, hedges_per_minute):
    evaluations, scores = {}, {}
    if pace > 175: evaluations["pace"] = "Rápido"
    elif pace < 130 and pace > 0: evaluations["pace"] = "Lento"
    else: evaluations["pace"] = "Ideal"
    scores["pace"] = max(0, 100 - abs(pace - 150))
    if pitch_variation < 15 and pitch_variation > 0: evaluations["pitch"] = "Monótono"
    else: evaluations["pitch"] = "Dinámico"
    scores["pitch"] = min(100, (pitch_variation / 40) * 100)
    if disfluencies_per_minute > 5: evaluations["disfluencies"] = "Alto"
    else: evaluations["disfluencies"] = "Bajo"
    scores["disfluencies"] = max(0, 100 - (disfluencies_per_minute * 10))
    if hedges_per_minute > 5: evaluations["hedges"] = "Alto"
    else: evaluations["hedges"] = "Bajo"
    scores["hedges"] = max(0, 100 - (hedges_per_minute * 20))
    return evaluations, scores

def generate_structured_feedback(evaluations, conviction_analysis):
    strengths, improvements = [], []
    if evaluations.get("pace") == "Ideal": strengths.append("Tu ritmo fue ideal, manteniendo a la audiencia enganchada.")
    elif evaluations.get("pace") == "Rápido": improvements.append("Tu ritmo fue muy rápido. Intenta hacer pausas para controlar la velocidad.")
    else: improvements.append("Tu ritmo fue pausado. Trabaja en inyectar más energía.")
    if evaluations.get("pitch") == "Dinámico": strengths.append("Excelente variación de tono. Tu voz es expresiva.")
    else: improvements.append("Tu voz tendió a ser monótona. Prueba a enfatizar palabras clave.")
    if evaluations.get("disfluencies") == "Bajo": strengths.append("Tu fluidez fue excelente, con muy pocas disfluencias.")
    else: improvements.append("El principal área de mejora son las disfluencias. Reemplázalas por silencios.")
    if evaluations.get("hedges") == "Bajo": strengths.append("Hablaste con convicción, usando muy pocas palabras de duda.")
    else:
        if conviction_analysis.get('hedge_details'):
            most_common = max(conviction_analysis['hedge_details'], key=conviction_analysis['hedge_details'].get)
            improvements.append(f"Usaste varias palabras de duda (como \"{most_common}\"). Intenta hacer afirmaciones más directas.")
    if not improvements and not strengths:
        strengths.append("Un buen primer análisis. Sigue practicando para refinar tus habilidades.")
    return {"strengths": strengths, "improvements": improvements}

@app.post("/upload-audio/")
async def upload_audio(file: UploadFile = File(...)):
    file_path = f"./{file.filename}"
    with open(file_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
    
    acoustic_results = analyze_acoustics(file_path)
    duration = acoustic_results["duration"]
    transcript = ""
    
    # MODO DE ANÁLISIS DUAL: CORTO vs LARGO
    if duration <= 65: # Damos 5 segundos de margen
        try:
            client = speech.SpeechClient()
            with open(file_path, "rb") as audio_file: content = audio_file.read()
            audio = speech.RecognitionAudio(content=content)
            config = speech.RecognitionConfig(encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS, sample_rate_hertz=48000, language_code="es-ES", alternative_language_codes=["en-US"])
            response = client.recognize(config=config, audio=audio)
            if response.results: transcript = response.results[0].alternatives[0].transcript
        except Exception as e:
            print(f"--- ERROR EN TRANSCRIPCIÓN ---\nError: {e}\n-------------------------")
            transcript = ""
    else:
        transcript = "[Transcripción omitida para grabaciones de más de 1 minuto]"

    conviction_analysis = analyze_conviction(transcript)
    # Asegurar que duration sea mayor que 0 y convertir a minutos
    duration_minutes = duration / 60 if duration > 0 else 1
    
    # Calcular métricas por minuto
    pace = round((conviction_analysis["total_words"] / duration_minutes)) if duration > 0 else 0
    disfluencies_per_minute = round((conviction_analysis["disfluency_count"] / duration_minutes)) if duration > 0 else 0
    hedges_per_minute = round((conviction_analysis["hedge_count"] / duration_minutes)) if duration > 0 else 0
    
    # Agregar los valores al análisis para referencia
    conviction_analysis["duration"] = duration
    conviction_analysis["disfluencies_per_minute"] = disfluencies_per_minute
    
    evaluations, scores = evaluate_metrics_and_scores(pace, acoustic_results["pitch_variation"], disfluencies_per_minute, hedges_per_minute)
    feedback = generate_structured_feedback(evaluations, conviction_analysis)
    os.remove(file_path)

    return {
        "transcription": transcript,
        "pitch_variation": max(0, acoustic_results["pitch_variation"]),
        "pace": max(0, pace),
        "disfluencies_per_minute": max(0, disfluencies_per_minute),
        "hedge_count": max(0, conviction_analysis["hedge_count"]),
        "details": conviction_analysis.get("details", {}),
        "evaluations": evaluations,
        "scores": scores,
        "feedback": feedback
    }