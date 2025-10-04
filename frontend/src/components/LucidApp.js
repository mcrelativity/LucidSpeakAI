"use client";
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import RecordingUI from './RecordingUI';
import AnalyzingUI from './AnalyzingUI';
import ResultsUI from './ResultsUI';

const LucidApp = () => {
    const [appState, setAppState] = useState('idle');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const loadHistory = () => {
            try {
                const savedHistory = localStorage.getItem('lucidSpeakHistory');
                if (savedHistory) {
                    const parsed = JSON.parse(savedHistory);
                    // Validación más estricta del historial
                    if (Array.isArray(parsed) && parsed.every(item => 
                        item && 
                        typeof item === 'object' && 
                        item.date && 
                        item.id && 
                        typeof item.id === 'number' &&
                        typeof item.pace === 'number' &&
                        typeof item.disfluencies_per_minute === 'number'
                    )) {
                        // Ordenar por fecha más reciente
                        const sortedHistory = parsed.sort((a, b) => new Date(b.date) - new Date(a.date));
                        setHistory(sortedHistory);
                    } else {
                        console.warn("Formato de historial inválido, reiniciando...");
                        localStorage.removeItem('lucidSpeakHistory');
                        setHistory([]);
                    }
                }
            } catch (error) {
                console.error("Error al cargar el historial:", error);
                localStorage.removeItem('lucidSpeakHistory');
                setHistory([]);
            }
        };

        loadHistory();
        
        // Actualizar el historial cuando cambie en otra pestaña
        const handleStorageChange = (e) => {
            if (e.key === 'lucidSpeakHistory') {
                loadHistory();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleReset = () => {
        setAnalysisResult(null);
        setAudioBlob(null);
        setAppState('idle');
    };

    const handleAnalysisComplete = (result) => {
        if (!result) return;

        // Crear nueva entrada asegurándose de incluir todos los datos necesarios
        const newEntry = {
            ...result,
            date: new Date().toISOString(),
            id: Date.now(),
            pace: result.pace || 0,
            pitch_variation: result.pitch_variation || 0,
            disfluencies_per_minute: result.disfluencies_per_minute || 0,
            duration: result.duration || 0,
            total_words: result.total_words || 0
        };

        // Actualizar el estado con los resultados
        setAnalysisResult(newEntry);
        setAppState('results');

        if (result.total_words > 0) {
            try {
                // Obtener el historial actual del localStorage
                let currentHistory = [];
                try {
                    const savedHistory = localStorage.getItem('lucidSpeakHistory');
                    if (savedHistory) {
                        currentHistory = JSON.parse(savedHistory);
                    }
                } catch (error) {
                    console.warn("Error al leer el historial actual:", error);
                }

                // Asegurar que currentHistory es un array
                if (!Array.isArray(currentHistory)) {
                    currentHistory = [];
                }

                // Agregar la nueva entrada al principio y ordenar por fecha
                const updatedHistory = [newEntry, ...currentHistory]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 50);

                // Actualizar el estado y localStorage
                setHistory(updatedHistory);
                localStorage.setItem('lucidSpeakHistory', JSON.stringify(updatedHistory));
            } catch (error) {
                console.error("Error al guardar en el historial:", error);
                // En caso de error, al menos actualizar el estado
                setHistory(prev => [newEntry, ...prev].slice(0, 50));
            }
        }
    };

    return (
        <div className="w-full max-w-3xl min-h-[500px] bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-10 flex flex-col justify-center items-center">
            <AnimatePresence mode="wait">
                {appState === 'idle' && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center"
                    >
                        <h2 className="text-2xl font-bold text-sky-400 mb-4">Prepárate para Mejorar</h2>
                        <p className="text-slate-400 mb-8">Presiona el botón para comenzar tu análisis de convicción.</p>
                        <button
                            onClick={() => setAppState('permissioning')}
                            className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform duration-300 hover:scale-105"
                        >
                            Comenzar Análisis
                        </button>
                    </motion.div>
                )}
                {(appState === 'permissioning' || appState === 'recording') && (
                    <RecordingUI
                        setAppState={setAppState}
                        setAudioBlob={setAudioBlob}
                    />
                )}
                {appState === 'analyzing' && (
                    <AnalyzingUI
                        audioBlob={audioBlob}
                        onAnalysisComplete={handleAnalysisComplete}
                    />
                )}
                {appState === 'results' && (
                    <ResultsUI
                        result={analysisResult}
                        history={history}
                        onReset={handleReset}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default LucidApp;