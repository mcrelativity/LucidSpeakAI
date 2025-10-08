"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

export default function SessionSetupModal({ onStart, onSkip }) {
    const [config, setConfig] = useState({
        name: '',
        context: 'general',
        targetAudience: 'general',
        goal: 'inform'
    });

    const contextOptions = [
        { value: 'general', label: 'General' },
        { value: 'sales_pitch', label: 'Pitch de Ventas' },
        { value: 'academic', label: 'Académica' },
        { value: 'interview', label: 'Entrevista' },
        { value: 'public_speech', label: 'Discurso Público' },
        { value: 'storytelling', label: 'Narrativa' }
    ];

    const audienceOptions = [
        { value: 'general', label: 'General' },
        { value: 'professionals', label: 'Profesionales' },
        { value: 'students', label: 'Estudiantes' },
        { value: 'executives', label: 'Ejecutivos' },
        { value: 'peers', label: 'Compañeros' }
    ];

    const goalOptions = [
        { value: 'inform', label: 'Informar' },
        { value: 'persuade', label: 'Persuadir' },
        { value: 'entertain', label: 'Entretener' },
        { value: 'inspire', label: 'Inspirar' },
        { value: 'teach', label: 'Enseñar' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (config.name.trim()) {
            onStart(config);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={onSkip}
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 rounded-xl p-6 max-w-lg w-full"
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-sky-400">Nueva Sesión de Práctica</h2>
                    <button
                        onClick={onSkip}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Nombre de la Sesión *
                        </label>
                        <input
                            type="text"
                            value={config.name}
                            onChange={(e) => setConfig({ ...config, name: e.target.value })}
                            placeholder="Ej: Práctica de Pitch Empresarial"
                            className="w-full bg-slate-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-sky-400"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Contexto
                        </label>
                        <select
                            value={config.context}
                            onChange={(e) => setConfig({ ...config, context: e.target.value })}
                            className="w-full bg-slate-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-sky-400"
                        >
                            {contextOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Audiencia Objetivo
                        </label>
                        <select
                            value={config.targetAudience}
                            onChange={(e) => setConfig({ ...config, targetAudience: e.target.value })}
                            className="w-full bg-slate-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-sky-400"
                        >
                            {audienceOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Objetivo
                        </label>
                        <select
                            value={config.goal}
                            onChange={(e) => setConfig({ ...config, goal: e.target.value })}
                            className="w-full bg-slate-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-sky-400"
                        >
                            {goalOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onSkip}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-2 px-4 rounded transition-colors"
                        >
                            Crear Sesión
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}