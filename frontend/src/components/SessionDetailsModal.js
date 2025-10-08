"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChevronLeft } from 'react-icons/fa';

export default function SessionDetailsModal({ session, onClose }) {
    const [selectedRecording, setSelectedRecording] = useState(null);

    if (!session) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-800 rounded-xl p-6 max-w-md w-full text-center"
                >
                    <p className="text-slate-300 mb-4">Sesión no encontrada</p>
                    <button
                        onClick={onClose}
                        className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-6 rounded transition-colors"
                    >
                        Cerrar
                    </button>
                </motion.div>
            </motion.div>
        );
    }

    const contextLabels = {
        general: "General",
        sales_pitch: "Pitch de Ventas",
        academic: "Académica",
        interview: "Entrevista",
        public_speech: "Discurso Público",
        storytelling: "Narrativa"
    };

    const recordings = session.recordings || [];
    const sortedRecordings = [...recordings].sort((a, b) => b.timestamp - a.timestamp);

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

    // Detailed recording view
    if (selectedRecording) {
        const recordingIndex = sortedRecordings.findIndex(r => r.timestamp === selectedRecording.timestamp);
        const previousRecording = recordingIndex < sortedRecordings.length - 1 ? sortedRecordings[recordingIndex + 1] : null;

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-800 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                >
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setSelectedRecording(null)}
                            className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors"
                        >
                            <FaChevronLeft /> Volver
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
                            {new Date(selectedRecording.timestamp * 1000).toLocaleString('es-ES', {
                                dateStyle: 'long',
                                timeStyle: 'short'
                            })}
                        </p>
                    </div>

                    {selectedRecording.insights_summary && (
                        <div className="mb-6 p-4 bg-slate-900 rounded-lg">
                            <h3 className="text-lg font-semibold text-sky-400 mb-2">Análisis Completo</h3>
                            <p className="text-slate-300 whitespace-pre-line">{selectedRecording.insights_summary}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-slate-700 p-4 rounded-lg text-center">
                            <p className="text-sm text-slate-400 mb-1">Ritmo</p>
                            <p className={`text-4xl font-bold ${getScoreColor(selectedRecording.pace, 'pace')}`}>
                                {Math.round(selectedRecording.pace)}
                            </p>
                            <p className="text-xs text-slate-500">palabras/min</p>
                        </div>
                        <div className="bg-slate-700 p-4 rounded-lg text-center">
                            <p className="text-sm text-slate-400 mb-1">Variación de Tono</p>
                            <p className={`text-4xl font-bold ${getScoreColor(selectedRecording.pitch_variation, 'pitch')}`}>
                                {Math.round(selectedRecording.pitch_variation)}
                            </p>
                        </div>
                        <div className="bg-slate-700 p-4 rounded-lg text-center">
                            <p className="text-sm text-slate-400 mb-1">Disfluencias</p>
                            <p className={`text-4xl font-bold ${getScoreColor(selectedRecording.disfluencies_per_minute, 'disfluencies')}`}>
                                {selectedRecording.disfluencies_per_minute.toFixed(1)}
                            </p>
                            <p className="text-xs text-slate-500">por minuto</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-900 p-4 rounded-lg">
                            <p className="text-sm text-slate-400 mb-1">Duración</p>
                            <p className="text-xl font-semibold text-white">
                                {Math.floor(selectedRecording.duration / 60)}m {Math.round(selectedRecording.duration % 60)}s
                            </p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-lg">
                            <p className="text-sm text-slate-400 mb-1">Total de Palabras</p>
                            <p className="text-xl font-semibold text-white">{selectedRecording.total_words}</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-lg">
                            <p className="text-sm text-slate-400 mb-1">Palabras de Duda</p>
                            <p className="text-xl font-semibold text-white">{selectedRecording.hedge_count}</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-lg">
                            <p className="text-sm text-slate-400 mb-1">Puntuación General</p>
                            <p className="text-xl font-semibold text-green-400">
                                {Math.round((
                                    Math.min(100, Math.max(0, 100 - Math.abs(selectedRecording.pace - 150))) +
                                    Math.min(100, (selectedRecording.pitch_variation / 40) * 100) +
                                    Math.max(0, 100 - (selectedRecording.disfluencies_per_minute * 10))
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
                                        Math.abs(selectedRecording.pace - 150) < Math.abs(previousRecording.pace - 150)
                                            ? 'text-green-400'
                                            : Math.abs(selectedRecording.pace - 150) > Math.abs(previousRecording.pace - 150)
                                            ? 'text-red-400'
                                            : 'text-yellow-400'
                                    }`}>
                                        {Math.abs(selectedRecording.pace - 150) < Math.abs(previousRecording.pace - 150) ? '↑ Mejor' :
                                         Math.abs(selectedRecording.pace - 150) > Math.abs(previousRecording.pace - 150) ? '↓ Peor' : '→ Igual'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Tono</p>
                                    <p className={`text-lg font-bold ${
                                        selectedRecording.pitch_variation > previousRecording.pitch_variation
                                            ? 'text-green-400'
                                            : selectedRecording.pitch_variation < previousRecording.pitch_variation
                                            ? 'text-red-400'
                                            : 'text-yellow-400'
                                    }`}>
                                        {selectedRecording.pitch_variation > previousRecording.pitch_variation ? '↑ Mejor' :
                                         selectedRecording.pitch_variation < previousRecording.pitch_variation ? '↓ Peor' : '→ Igual'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Disfluencias</p>
                                    <p className={`text-lg font-bold ${
                                        selectedRecording.disfluencies_per_minute < previousRecording.disfluencies_per_minute
                                            ? 'text-green-400'
                                            : selectedRecording.disfluencies_per_minute > previousRecording.disfluencies_per_minute
                                            ? 'text-red-400'
                                            : 'text-yellow-400'
                                    }`}>
                                        {selectedRecording.disfluencies_per_minute < previousRecording.disfluencies_per_minute ? '↑ Mejor' :
                                         selectedRecording.disfluencies_per_minute > previousRecording.disfluencies_per_minute ? '↓ Peor' : '→ Igual'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        );
    }

    // List view
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
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
                                                {recording.disfluencies_per_minute.toFixed(1)}
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

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-slate-700 hover:bg-slate-600 text-white py-2 px-6 rounded transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}