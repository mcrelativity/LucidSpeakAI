# ==============================================================================
# PRO AUDIO ANALYZER SERVICE
# Comprehensive audio analysis for Pro tier users
# ==============================================================================

import librosa
import numpy as np
import os
import json
from typing import Dict, Any, Optional, List
from datetime import datetime
import asyncio
from pydub import AudioSegment
import re

try:
    import parselmouth
    PARSELMOUTH_AVAILABLE = True
except ImportError:
    PARSELMOUTH_AVAILABLE = False
    print("⚠️  Parselmouth not installed. Prosody analysis disabled.")

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠️  OpenAI not installed. GPT synthesis disabled.")


class ProAudioAnalyzer:
    """
    Comprehensive audio analysis for LucidSpeakAI Pro users.
    
    Analyzes:
    - Audio features (energy, spectral characteristics)
    - Prosody (pitch, intensity, speech rate)
    - Filler words (text + audio-based detection)
    - Emotion (optional, using audio patterns)
    - GPT-powered contextual insights
    """
    
    def __init__(self, openai_api_key: Optional[str] = None):
        """Initialize the analyzer with optional OpenAI key."""
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        self.openai_client = None
        
        if OPENAI_AVAILABLE and self.openai_api_key:
            self.openai_client = OpenAI(api_key=self.openai_api_key)
    
    async def comprehensive_analysis(
        self, 
        audio_path: str, 
        transcript: str,
        context: str = "general",
        language: str = "en",
        job = None  # Optional job reference for progress tracking
    ) -> Dict[str, Any]:
        """
        Perform comprehensive pro analysis on audio and transcript.
        
        Args:
            audio_path: Path to audio file
            transcript: Transcribed text from audio
            context: Context of the speech (interview, presentation, casual, etc.)
            language: Language code (en, es)
            job: Optional job object to track progress
        
        Returns:
            Dictionary with all analysis results
        """
        
        results = {
            "timestamp": datetime.now().isoformat(),
            "audio_file": os.path.basename(audio_path),
            "transcript": transcript,
            "context": context,
            "language": language,
            "metrics": {},
            "prosody": {},
            "fillers": {},
            "emotions": {},
            "gpt_insights": {},
            "processing_time_ms": 0,
            "errors": []
        }
        
        start_time = datetime.now()
        
        try:
            # 1. Extract audio metrics
            if job: job.progress = 20
            audio_metrics = self._extract_audio_metrics(audio_path)
            results["metrics"] = audio_metrics
        except Exception as e:
            results["errors"].append(f"Audio metrics extraction failed: {str(e)}")
        
        try:
            # 2. Analyze prosody (if Parselmouth available)
            if job: job.progress = 35
            if PARSELMOUTH_AVAILABLE:
                prosody_data = self._analyze_prosody(audio_path)
                results["prosody"] = prosody_data
        except Exception as e:
            results["errors"].append(f"Prosody analysis failed: {str(e)}")
        
        try:
            # 3. Detect filler words
            if job: job.progress = 50
            fillers_data = self._extract_fillers(transcript)
            results["fillers"] = fillers_data
        except Exception as e:
            results["errors"].append(f"Filler detection failed: {str(e)}")
        
        try:
            # 4. Emotion detection (basic, from audio patterns)
            if job: job.progress = 65
            emotions = self._detect_emotions(results.get("metrics", {}), results.get("prosody", {}))
            results["emotions"] = emotions
        except Exception as e:
            results["errors"].append(f"Emotion detection failed: {str(e)}")
        
        try:
            # 5. GPT synthesis (if OpenAI available)
            if job: job.progress = 80
            if self.openai_client:
                insights = await self._get_gpt_insights(
                    transcript=transcript,
                    metrics=results.get("metrics", {}),
                    prosody=results.get("prosody", {}),
                    fillers=results.get("fillers", {}),
                    context=context
                )
                results["gpt_insights"] = insights
        except Exception as e:
            results["errors"].append(f"GPT synthesis failed: {str(e)}")
        
        # Calculate processing time
        results["processing_time_ms"] = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return results
    
    # ===========================================================================
    # AUDIO FEATURE EXTRACTION (Librosa)
    # ===========================================================================
    
    def _extract_audio_metrics(self, audio_path: str) -> Dict[str, Any]:
        """
        Extract core audio features using librosa.
        
        Returns:
            Dictionary with audio characteristics
        """
        try:
            y, sr = librosa.load(audio_path, sr=None)
        except Exception as e:
            raise ValueError(f"Could not load audio file: {str(e)}")
        
        duration = librosa.get_duration(y=y, sr=sr)
        
        # Energy (loudness)
        rms_energy = float(np.mean(librosa.feature.rms(y=y)))
        
        # Spectral centroid (brightness/harshness of voice)
        spectral_centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
        
        # Zero crossing rate (noise/friction indicator)
        zero_crossing_rate = float(np.mean(librosa.feature.zero_crossing_rate(y)))
        
        # MFCC (Mel-frequency cepstral coefficients - speech characteristics)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1).tolist()
        
        # Onset detection (approximate word/syllable boundaries)
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        onsets = librosa.onset.onset_detect(onset_env=onset_env, sr=sr)
        
        # Speaking rate estimation
        speech_rate = self._calculate_speech_rate(duration, len(onsets))
        
        # Silence detection
        silence_ratio = self._calculate_silence_ratio(y, sr)
        
        return {
            "duration_seconds": float(duration),
            "rms_energy": rms_energy,
            "rms_energy_normalized": float(rms_energy / np.max([rms_energy, 0.01])),  # Normalized 0-1
            "spectral_centroid_hz": spectral_centroid,
            "zero_crossing_rate": zero_crossing_rate,
            "mfcc_mean": mfcc_mean,
            "num_onsets": int(len(onsets)),
            "speech_rate_wpm": speech_rate,
            "silence_ratio": silence_ratio,
            "sample_rate_hz": int(sr)
        }
    
    def _calculate_speech_rate(self, duration_seconds: float, num_onsets: int) -> float:
        """
        Estimate speech rate in words per minute.
        Uses onset detection as proxy for word boundaries.
        """
        if duration_seconds < 0.1:
            return 0.0
        
        # Rough conversion: onsets ~= syllables, ~3 syllables per word on average
        estimated_words = num_onsets / 3.0
        wpm = (estimated_words / duration_seconds) * 60
        
        return float(max(0, min(wpm, 300)))  # Clamp to 0-300 WPM
    
    def _calculate_silence_ratio(self, y: np.ndarray, sr: int) -> float:
        """
        Calculate ratio of silence to total duration.
        """
        # Frame-based energy threshold
        frame_length = 2048
        hop_length = 512
        
        S = librosa.feature.melspectrogram(y=y, sr=sr)
        S_db = librosa.power_to_db(S, ref=np.max)
        
        # Energy threshold: -40dB
        is_silent = np.mean(S_db, axis=0) < -40
        
        silence_frames = np.sum(is_silent)
        total_frames = len(is_silent)
        
        if total_frames == 0:
            return 0.0
        
        return float(silence_frames / total_frames)
    
    # ===========================================================================
    # PROSODY ANALYSIS (Parselmouth/Praat)
    # ===========================================================================
    
    def _analyze_prosody(self, audio_path: str) -> Dict[str, Any]:
        """
        Analyze pitch and intensity (prosody) using Parselmouth/Praat.
        
        Returns:
            Dictionary with prosody characteristics
        """
        if not PARSELMOUTH_AVAILABLE:
            return {"error": "Parselmouth not available"}
        
        try:
            sound = parselmouth.Sound(audio_path)
        except Exception as e:
            raise ValueError(f"Could not load audio with Praat: {str(e)}")
        
        # Pitch analysis
        pitch = sound.to_pitch()
        pitch_values = pitch.selected_array['frequency']
        pitch_values = pitch_values[pitch_values > 0]  # Remove unvoiced
        
        mean_pitch = float(np.mean(pitch_values)) if len(pitch_values) > 0 else 0.0
        min_pitch = float(np.min(pitch_values)) if len(pitch_values) > 0 else 0.0
        max_pitch = float(np.max(pitch_values)) if len(pitch_values) > 0 else 0.0
        pitch_std = float(np.std(pitch_values)) if len(pitch_values) > 0 else 0.0
        
        # Pitch contour (rising = positive, falling = negative)
        if len(pitch_values) > 1:
            pitch_contour = self._calculate_contour(pitch_values)
        else:
            pitch_contour = 0.0
        
        # Intensity analysis
        intensity = sound.to_intensity()
        intensity_values = intensity.values.T
        intensity_values = intensity_values[intensity_values > 0]
        
        mean_intensity = float(np.mean(intensity_values)) if len(intensity_values) > 0 else 0.0
        intensity_std = float(np.std(intensity_values)) if len(intensity_values) > 0 else 0.0
        
        # Duration
        duration = sound.duration
        
        return {
            "pitch": {
                "mean_hz": mean_pitch,
                "min_hz": min_pitch,
                "max_hz": max_pitch,
                "std_hz": pitch_std,
                "range_hz": max_pitch - min_pitch,
                "contour": pitch_contour  # -1 = falling, 0 = level, 1 = rising
            },
            "intensity": {
                "mean_db": mean_intensity,
                "std_db": intensity_std,
                "dynamic_range_db": 0.0  # Could calculate max-min
            },
            "duration_seconds": float(duration),
            "voiced_ratio": float(len(pitch_values) / max(len(pitch_values) + (len(pitch_values) == 0 and 1 or 0), 1))
        }
    
    def _calculate_contour(self, pitch_values: np.ndarray) -> float:
        """
        Calculate overall pitch contour: -1 (falling) to 1 (rising).
        """
        if len(pitch_values) < 2:
            return 0.0
        
        # Split into quarters
        quarter = len(pitch_values) // 4
        first_quarter = np.mean(pitch_values[:quarter])
        last_quarter = np.mean(pitch_values[-quarter:])
        
        # Normalize
        overall_mean = np.mean(pitch_values)
        if overall_mean == 0:
            return 0.0
        
        contour = (last_quarter - first_quarter) / overall_mean
        return float(np.clip(contour, -1, 1))
    
    # ===========================================================================
    # FILLER WORD DETECTION
    # ===========================================================================
    
    def _extract_fillers(self, transcript: str) -> Dict[str, Any]:
        """
        Detect filler words in transcript.
        
        Returns:
            Dictionary with filler statistics
        """
        filler_words = {
            # Spanish fillers
            "eh": 0, "em": 0, "este": 0, "pues": 0, "bueno": 0, "vale": 0,
            "mmm": 0, "ajá": 0, "claro": 0, "entonces": 0, "mira": 0, "oye": 0,
            "tipo": 0, "nada": 0, "vamos": 0, "venga": 0, "onda": 0, "rollo": 0,
            "osea": 0, "ósea": 0, "literal": 0, "literalmente": 0, "básicamente": 0,
            "obviamente": 0, "realmente": 0, "actualmente": 0, "evidentemente": 0,
            
            # English fillers
            "uh": 0, "um": 0, "er": 0, "ah": 0, "like": 0, "so": 0,
            "well": 0, "right": 0, "okay": 0, "actually": 0, "basically": 0,
            "literally": 0, "seriously": 0, "honestly": 0, "totally": 0,
            "absolutely": 0, "definitely": 0, "certainly": 0, "clearly": 0,
            "obviously": 0, "evidently": 0, "apparently": 0, "essentially": 0,
            "yeah": 0, "yep": 0, "yup": 0, "nah": 0, "nope": 0,
            "hmm": 0, "mhm": 0, "kinda": 0, "sorta": 0, "gonna": 0, "wanna": 0,
            "gotta": 0, "quite": 0, "rather": 0, "fairly": 0, "pretty": 0,
            "very": 0
        }
        
        lower_text = transcript.lower()
        
        # Count fillers
        for word in filler_words:
            # Word boundary matching
            pattern = r'\b' + re.escape(word) + r'\b'
            matches = re.findall(pattern, lower_text)
            filler_words[word] = len(matches)
        
        # Sort by frequency
        top_fillers = sorted(
            [(word, count) for word, count in filler_words.items() if count > 0],
            key=lambda x: x[1],
            reverse=True
        )
        
        total_words = len(transcript.split())
        total_fillers = sum(filler_words.values())
        
        return {
            "detected": [
                {"word": word, "count": count, "percentage": (count / total_words * 100) if total_words > 0 else 0}
                for word, count in top_fillers[:10]  # Top 10
            ],
            "total_count": total_fillers,
            "filler_density": float(total_fillers / total_words) if total_words > 0 else 0,
            "total_words": total_words,
            "top_3": [word for word, _ in top_fillers[:3]]
        }
    
    # ===========================================================================
    # EMOTION DETECTION (Basic, from audio patterns)
    # ===========================================================================
    
    def _detect_emotions(self, metrics: Dict[str, Any], prosody: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect emotions from audio patterns.
        Uses heuristics based on pitch, energy, and prosody.
        
        Returns:
            Dictionary with emotion scores
        """
        emotions = {
            "confident": 0.0,
            "anxious": 0.0,
            "engaged": 0.0,
            "bored": 0.0,
            "happy": 0.0,
            "sad": 0.0,
            "frustrated": 0.0,
            "neutral": 0.5  # Baseline
        }
        
        # Extract features
        energy = metrics.get("rms_energy_normalized", 0.5)
        speech_rate = metrics.get("speech_rate_wpm", 150) / 300  # Normalize to 0-1
        
        if prosody:
            pitch_range = prosody.get("pitch", {}).get("range_hz", 0) / 200  # Normalize
            pitch_contour = prosody.get("pitch", {}).get("contour", 0)  # -1 to 1
        else:
            pitch_range = 0.5
            pitch_contour = 0.0
        
        # Heuristic rules
        if energy > 0.7 and speech_rate > 0.8 and pitch_range > 0.5:
            emotions["engaged"] = 0.8
            emotions["happy"] = 0.6
        
        if energy < 0.3 and speech_rate < 0.5:
            emotions["bored"] = 0.7
            emotions["sad"] = 0.5
        
        if energy > 0.8 and speech_rate > 0.9:
            emotions["frustrated"] = 0.6
            emotions["anxious"] = 0.5
        
        if pitch_contour > 0.3:
            emotions["engaged"] += 0.2
            emotions["happy"] += 0.1
        
        if pitch_range < 0.2:
            emotions["neutral"] += 0.2
            emotions["bored"] += 0.1
        
        # Confidence: high energy + varied pitch = confident
        if energy > 0.6 and pitch_range > 0.5:
            emotions["confident"] = 0.7
        elif energy < 0.4 or pitch_range < 0.3:
            emotions["anxious"] += 0.3
        
        # Normalize to 0-1
        total = sum(emotions.values())
        if total > 0:
            emotions = {k: v / total for k, v in emotions.items()}
        
        return {
            "primary": max(emotions, key=emotions.get),
            "scores": {k: float(v) for k, v in emotions.items()}
        }
    
    # ===========================================================================
    # GPT SYNTHESIS
    # ===========================================================================
    
    async def _get_gpt_insights(
        self,
        transcript: str,
        metrics: Dict[str, Any],
        prosody: Dict[str, Any],
        fillers: Dict[str, Any],
        context: str
    ) -> Dict[str, Any]:
        """
        Use GPT to synthesize insights from all metrics.
        
        Returns:
            Dictionary with AI-generated analysis
        """
        if not self.openai_client:
            return {"error": "OpenAI client not initialized"}
        
        # Build prompt
        prompt = self._build_gpt_prompt(
            transcript=transcript,
            metrics=metrics,
            prosody=prosody,
            fillers=fillers,
            context=context
        )
        
        try:
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert speech coach analyzing audio recordings. Provide detailed, actionable insights based on the metrics provided."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            analysis_text = response.choices[0].message.content
            
            return {
                "analysis": analysis_text,
                "model": "gpt-4o-mini",
                "tokens_used": response.usage.total_tokens if response.usage else 0
            }
        
        except Exception as e:
            return {"error": f"GPT synthesis failed: {str(e)}"}
    
    def _build_gpt_prompt(
        self,
        transcript: str,
        metrics: Dict[str, Any],
        prosody: Dict[str, Any],
        fillers: Dict[str, Any],
        context: str
    ) -> str:
        """Build the prompt for GPT analysis."""
        
        # Build transcription part without nested f-strings
        transcript_preview = transcript[:500]
        transcript_extra = f"\nFull transcription: {len(transcript)} characters" if len(transcript) > 500 else ""
        
        prompt = f"""Analyze this speech recording and provide detailed coaching feedback.

CONTEXT: {context}

TRANSCRIPTION:
{transcript_preview}...{transcript_extra}

AUDIO METRICS:
- Duration: {metrics.get('duration_seconds', 0):.1f} seconds
- Energy Level: {metrics.get('rms_energy_normalized', 0):.2f}/1.0 (volume consistency)
- Speech Rate: {metrics.get('speech_rate_wpm', 0):.0f} words/minute
- Silence Ratio: {metrics.get('silence_ratio', 0):.1%} of total time
- Voice Brightness: {metrics.get('spectral_centroid_hz', 0):.0f} Hz

PROSODY ANALYSIS:
- Pitch Range: {prosody.get('pitch', {}).get('range_hz', 0):.0f} Hz
- Mean Pitch: {prosody.get('pitch', {}).get('mean_hz', 0):.0f} Hz
- Pitch Contour: {"Rising" if prosody.get('pitch', {}).get('contour', 0) > 0.2 else "Falling" if prosody.get('pitch', {}).get('contour', 0) < -0.2 else "Level"}
- Intensity Variation: {prosody.get('intensity', {}).get('std_db', 0):.2f} dB

FILLER WORDS:
- Total Fillers: {fillers.get('total_count', 0)}
- Filler Density: {fillers.get('filler_density', 0):.1%} of words
- Top Fillers: {', '.join(fillers.get('top_3', []))}

Please provide:
1. Overall Assessment (1-10 score for communication effectiveness)
2. Key Strengths (3-4 points)
3. Areas for Improvement (3-4 specific recommendations)
4. Specific Coaching Tips (actionable exercises)
5. Confidence Level (1-10 how confident the speaker sounds)

Format your response clearly with headers."""
        
        return prompt


# ==============================================================================
# CONVENIENCE FUNCTIONS
# ==============================================================================

async def analyze_audio_for_pro_user(
    audio_path: str,
    transcript: str,
    context: str = "general",
    language: str = "en",
    job = None  # Optional job reference for progress tracking
) -> Dict[str, Any]:
    """
    Convenience function to run full pro analysis.
    
    Usage:
        results = await analyze_audio_for_pro_user(
            audio_path="audio.wav",
            transcript="Hello world...",
            context="presentation",
            job=job_object  # Optional, for progress tracking
        )
    """
    analyzer = ProAudioAnalyzer()
    results = await analyzer.comprehensive_analysis(
        audio_path=audio_path,
        transcript=transcript,
        context=context,
        language=language,
        job=job
    )
    return results
