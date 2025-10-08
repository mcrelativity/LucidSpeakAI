"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowUp, FaArrowDown, FaMinus, FaBrain, FaCheckCircle, FaLightbulb, FaChevronLeft, FaTimes } from 'react-icons/fa';

export default function SessionsPage() {
    const { user, loading, token, apiBase } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const locale = pathname?.split('/')[1] || 'es';
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [selectedRecording, setSelectedRecording] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push(`/${locale}/login`);
        }
    }, [user, loading, router, locale]);

    useEffect(() => {
        if (token) {
            loadSessions();
        }
    }, [token]);

    const loadSessions = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiBase}/sessions/list`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const sortedSessions = (data.sessions || []).sort((a, b) => b.created_at - a.created_at);
                setSessions(sortedSessions);
            }
        } catch (error) {
            console.error("Error loading sessions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSessionDetails = async (sessionId) => {
        try {
            const response = await fetch(`${apiBase}/sessions/${sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setSelectedSession(data);
            }
        } catch (error) {
            console.error("Error loading session details:", error);
        }
    };

    if (loading || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-sky-400 text-xl">Cargando...</div>
            </div>
        );
    }

    if (!user) return null;

    const contextLabels = {
        general: "General",
        sales_pitch: "Pitch de Ventas",
        academic: "Académica",
        interview: "Entrevista",
        public_speech: "Discurso Público",
        storytelling: "Narrativa"
    };

    const getScoreColor = (value, metric) => {
        if (metric === 'pace') {
            if (value >= 130 && value <= 170) return 'text-green-400';
            if (value < 110 || value > 190) return 'text-red-400';
            return 'text-yellow-400';
        }
        if (metric === 'pitch') {
            if (value >= 20) return 'text-green-400';
            if (value < 10) return 'text-red-400';
            return 'text-yellow-400';
        }
        if (metric === 'disfluencies') {
            if (value <= 2) return 'text-green-400';
            if (value > 5) return 'text-red-400';
            return 'text-yellow-400';
        }
        return 'text-slate-400';
    };

    const RecordingDetailModal = ({ recording, allRecordings, onClose, onBack }) => {
        if (!recording) return null;

        const sortedRecordings = [...allRecordings].sort((a, b) => b.timestamp - a.timestamp);
        const recordingIndex = sortedRecordings.findIndex(r => r.timestamp === recording.timestamp);
        const previousRecording = recordingIndex < sortedRecordings.length - 1 ? sortedRecordings[recordingIndex + 1] : null;

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-800 rounded-xl p-6 max-w-3xl max-h-[90vh] overflow-y-auto w-full"
                >
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={onBack}
                            className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors"
                        >
                            <FaChevronLeft /> Volver a la sesión
                        </button>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <FaTimes size={24} />
                        </button>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-sky-400 mb-2">
                            Grabación #{sortedRecordings.length - recordingIndex}
                        </h2>
                        <p className="text-slate-400">
                            {new Date(recording.timestamp * 1000).toLocaleString('es-ES', {
                                dateStyle: 'long',
                                timeStyle: 'short'
                            })}
                        </p>
                    </div>

                    {recording.insights_summary && (
                        <div className="mb-6 p-4 bg-slate-900 rounded-lg">
                            <h3 className="text-lg font-semibold text-sky-400 mb-2 flex items-center">
                                <FaBrain className="mr-2" /> Análisis Completo
                            </h3>
                            <p className="text-slate-300 whitespace-pre-line">{recording.insights_summary}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-slate-700 p-4 rounded-lg text-center">
                            <p className="text-sm text-slate-400 mb-1">Ritmo</p>
                            <p className={`text-4xl font-bold ${getScoreColor(recording.pace, 'pace')}`}>
                                {Math.round(recording.pace)}
                            </p>
                            <p className="text-xs text-slate-500">palabras/min</p>
                        </div>
                        <div className="bg-slate-700 p-4 rounded-lg text-center">
                            <p className="text-sm text-slate-400 mb-1">Variación de Tono</p>
                            <p className={`text-4xl font-bold ${getScoreColor(recording.pitch_variation, 'pitch')}`}>
                                {Math.round(recording.pitch_variation)}
                            </p>
                        </div>
                        <div className="bg-slate-700 p-4 rounded-lg text-center">
                            <p className="text-sm text-slate-400 mb-1">Disfluencias</p>
                            <p className={`text-4xl font-bold ${getScoreColor(recording.disfluencies_per_minute, 'disfluencies')}`}>
                                {recording.disfluencies_per_minute?.toFixed(1)}
                            </p>
                            <p className="text-xs text-slate-500">por minuto</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-900 p-4 rounded-lg">
                            <p className="text-sm text-slate-400 mb-1">Duración</p>
                            <p className="text-xl font-semibold text-white">
                                {Math.floor(recording.duration / 60)}m {Math.round(recording.duration % 60)}s
                            </p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-lg">
                            <p className="text-sm text-slate-400 mb-1">Total de Palabras</p>
                            <p className="text-xl font-semibold text-white">{recording.total_words}</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-lg">
                            <p className="text-sm text-slate-400 mb-1">Palabras de Duda</p>
                            <p className="text-xl font-semibold text-white">{recording.hedge_count}</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-lg">
                            <p className="text-sm text-slate-400 mb-1">Puntuación General</p>
                            <p className="text-xl font-semibold text-green-400">
                                {Math.round((
                                    Math.min(100, Math.max(0, 100 - Math.abs(recording.pace - 150))) +
                                    Math.min(100, (recording.pitch_variation / 40) * 100) +
                                    Math.max(0, 100 - (recording.disfluencies_per_minute * 10))
                                ) / 3)}/100
                            </p>
                        </div>
                    </div>

                    {previousRecording && (
                        <div className="bg-slate-900 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-slate-400 mb-3">Progreso desde la última grabación</h4>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Ritmo</p>
                                    <p className={`text-lg font-bold ${
                                        Math.abs(recording.pace - 150) < Math.abs(previousRecording.pace - 150)
                                            ? 'text-green-400'
                                            : Math.abs(recording.pace - 150) > Math.abs(previousRecording.pace - 150)
                                            ? 'text-red-400'
                                            : 'text-yellow-400'
                                    }`}>
                                        {Math.abs(recording.pace - 150) < Math.abs(previousRecording.pace - 150) ? '↑ Mejor' :
                                         Math.abs(recording.pace - 150) > Math.abs(previousRecording.pace - 150) ? '↓ Peor' : '→ Igual'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Tono</p>
                                    <p className={`text-lg font-bold ${
                                        recording.pitch_variation > previousRecording.pitch_variation
                                            ? 'text-green-400'
                                            : recording.pitch_variation < previousRecording.pitch_variation
                                            ? 'text-red-400'
                                            : 'text-yellow-400'
                                    }`}>
                                        {recording.pitch_variation > previousRecording.pitch_variation ? '↑ Mejor' :
                                         recording.pitch_variation < previousRecording.pitch_variation ? '↓ Peor' : '→ Igual'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Disfluencias</p>
                                    <p className={`text-lg font-bold ${
                                        recording.disfluencies_per_minute < previousRecording.disfluencies_per_minute
                                            ? 'text-green-400'
                                            : recording.disfluencies_per_minute > previousRecording.disfluencies_per_minute
                                            ? 'text-red-400'
                                            : 'text-yellow-400'
                                    }`}>
                                        {recording.disfluencies_per_minute < previousRecording.disfluencies_per_minute ? '↑ Mejor' :
                                         recording.disfluencies_per_minute > previousRecording.disfluencies_per_minute ? '↓ Peor' : '→ Igual'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        );
    };

    const SessionDetailModal = ({ session, onClose }) => {
        if (!session) return null;

        const recordings = session.recordings || [];
        const sortedRecordings = [...recordings].sort((a, b) => b.timestamp - a.timestamp);

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-800 rounded-xl p-6 max-w-3xl max-h-[90vh] overflow-y-auto w-full"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-sky-400">{session.name}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm bg-slate-700 px-3 py-1 rounded text-slate-300">
                                    {contextLabels[session.context] || session.context}
                                </span>
                                <span className="text-sm text-slate-400">
                                    Creada: {new Date(session.created_at * 1000).toLocaleDateString('es-ES')}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <FaTimes size={24} />
                        </button>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-slate-300 mb-4">
                            Historial de Grabaciones ({sortedRecordings.length})
                        </h3>

                        {sortedRecordings.length > 0 ? (
                            <div className="space-y-3">
                                {sortedRecordings.map((recording, index) => (
                                    <button
                                        key={recording.timestamp}
                                        onClick={() => setSelectedRecording(recording)}
                                        className="w-full bg-slate-700 hover:bg-slate-600 rounded-lg p-4 transition-colors text-left"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-semibold text-white">
                                                    Grabación #{sortedRecordings.length - index}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(recording.timestamp * 1000).toLocaleString('es-ES', {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short'
                                                    })}
                                                </p>
                                            </div>
                                            <span className="text-xs text-slate-500">
                                                {Math.floor(recording.duration / 60)}:{String(Math.round(recording.duration % 60)).padStart(2, '0')}
                                            </span>
                                        </div>

                                        {recording.insights_summary && (
                                            <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                                                {recording.insights_summary}
                                            </p>
                                        )}

                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div>
                                                <p className="text-xs text-slate-400">Ritmo</p>
                                                <p className={`text-xl font-bold ${getScoreColor(recording.pace, 'pace')}`}>
                                                    {Math.round(recording.pace)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Tono</p>
                                                <p className={`text-xl font-bold ${getScoreColor(recording.pitch_variation, 'pitch')}`}>
                                                    {Math.round(recording.pitch_variation)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400">Disfluencias</p>
                                                <p className={`text-xl font-bold ${getScoreColor(recording.disfluencies_per_minute, 'disfluencies')}`}>
                                                    {recording.disfluencies_per_minute?.toFixed(1)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-center py-8">
                                No hay grabaciones en esta sesión aún.
                            </p>
                        )}
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={() => router.push(`/${locale}/dashboard`)}
                            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2 px-6 rounded transition-colors"
                        >
                            Nueva Grabación
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 px-6 rounded transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        );
    };

    return (
        <div className="flex-grow flex flex-col items-center w-full p-6">
            <div className="w-full max-w-4xl">
                <h1 className="text-3xl font-bold text-sky-400 mb-6">Mis Sesiones de Práctica</h1>
                
                {sessions.length === 0 ? (
                    <div className="bg-slate-800 rounded-lg p-8 text-center">
                        <p className="text-slate-400 mb-4">No tienes sesiones registradas aún.</p>
                        <button
                            onClick={() => router.push(`/${locale}/dashboard`)}
                            className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 rounded-full"
                        >
                            Comenzar Primera Sesión
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((session) => (
                            <motion.div
                                key={session.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-800 p-5 rounded-lg"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-sky-400 mb-2">{session.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                                                {contextLabels[session.context] || session.context}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {session.recordings_count} grabación{session.recordings_count !== 1 ? 'es' : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500">
                                        {new Date(session.created_at * 1000).toLocaleDateString('es-ES')}
                                    </span>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => router.push(`/${locale}/dashboard`)}
                                        className="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-sm py-2 rounded transition-colors"
                                    >
                                        Nueva Grabación
                                    </button>
                                    {session.recordings_count > 0 && (
                                        <button
                                            onClick={() => loadSessionDetails(session.id)}
                                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 rounded transition-colors"
                                        >
                                            Ver Historial
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedSession && !selectedRecording && (
                    <SessionDetailModal 
                        session={selectedSession} 
                        onClose={() => setSelectedSession(null)} 
                    />
                )}
                {selectedRecording && selectedSession && (
                    <RecordingDetailModal 
                        recording={selectedRecording}
                        allRecordings={selectedSession.recordings || []}
                        onClose={() => {
                            setSelectedRecording(null);
                            setSelectedSession(null);
                        }}
                        onBack={() => setSelectedRecording(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}