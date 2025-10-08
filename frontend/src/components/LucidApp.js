"use client";
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import RecordingUI from './RecordingUI';
import AnalyzingUI from './AnalyzingUI';
import ResultsUI from './ResultsUI';
import SessionSetupModal from './SessionSetupModal';
import SessionDetailsModal from './SessionDetailsModal';
import { useAuth } from '@/context/AuthContext';

const LucidApp = ({ locale = 'es' }) => {
    const [appState, setAppState] = useState('sessions');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [currentSessionData, setCurrentSessionData] = useState(null);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedSessionForDetails, setSelectedSessionForDetails] = useState(null);
    const { token, apiBase } = useAuth();
    const t = useTranslations('Dashboard');
    const tCommon = useTranslations('Common');

    useEffect(() => {
        if (token) {
            loadSessions();
        }
    }, [token]);

    const loadSessions = async () => {
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
        }
    };

    const handleReset = useCallback(() => {
        setAnalysisResult(null);
        setAudioBlob(null);
        setAppState('sessions');
        setCurrentSessionId(null);
        setCurrentSessionData(null);
    }, []);

    const handleAnalysisComplete = useCallback((result) => {
        if (!result) {
            console.error('No result provided');
            return;
        }

        if (result.error) {
            setAnalysisResult(result);
            setAppState('results');
            return;
        }

        setAnalysisResult(result);
        setAppState('results');
        
        if (currentSessionId) {
            loadCurrentSession(currentSessionId);
        }
        loadSessions();
    }, [currentSessionId, token, apiBase]);

    const loadCurrentSession = async (sessionId) => {
        try {
            const response = await fetch(`${apiBase}/sessions/${sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setCurrentSessionData(data);
            }
        } catch (error) {
            console.error("Error loading session:", error);
        }
    };

    const createNewSession = async (config) => {
        try {
            const response = await fetch(`${apiBase}/sessions/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: config.name,
                    context: config.context,
                    target_audience: config.targetAudience,
                    goal: config.goal
                })
            });

            if (response.ok) {
                await loadSessions();
                setShowSetupModal(false);
            } else {
                console.error("Failed to create session");
            }
        } catch (error) {
            console.error("Error creating session:", error);
        }
    };

    const selectExistingSession = async (sessionId) => {
        setCurrentSessionId(sessionId);
        await loadCurrentSession(sessionId);
        setAppState('permissioning');
    };

    const viewSessionDetails = async (sessionId) => {
        try {
            const response = await fetch(`${apiBase}/sessions/${sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setSelectedSessionForDetails(data);
                setShowDetailsModal(true);
            }
        } catch (error) {
            console.error("Error loading session details:", error);
        }
    };

    return (
        <div className="w-full max-w-4xl min-h-[600px] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 shadow-2xl rounded-2xl p-6 sm:p-10 flex flex-col justify-center items-center border border-slate-700">
            <AnimatePresence mode="wait">
                {appState === 'sessions' && (
                    <motion.div
                        key="sessions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full"
                    >
                        {/* Header Section */}
                        <div className="text-center mb-8">
                            <motion.h1 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-3"
                            >
                                Tus Sesiones de Práctica
                            </motion.h1>
                            <motion.p 
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-slate-400 text-sm sm:text-base"
                            >
                                Mejora tu comunicación, una práctica a la vez
                            </motion.p>
                        </div>

                        {/* Stats Overview */}
                        {sessions.some(s => s.recordings_count > 0) && (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="grid grid-cols-3 gap-3 sm:gap-4 mb-6"
                            >
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="bg-gradient-to-br from-sky-500/20 to-blue-500/10 border border-sky-500/30 rounded-xl p-4 text-center backdrop-blur-sm"
                                >
                                    <p className="text-3xl sm:text-4xl font-bold text-sky-400 mb-1">
                                        {sessions.length}
                                    </p>
                                    <p className="text-xs text-slate-400">Sesiones</p>
                                </motion.div>
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 text-center backdrop-blur-sm"
                                >
                                    <p className="text-3xl sm:text-4xl font-bold text-purple-400 mb-1">
                                        {sessions.reduce((sum, s) => sum + s.recordings_count, 0)}
                                    </p>
                                    <p className="text-xs text-slate-400">Grabaciones</p>
                                </motion.div>
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 text-center backdrop-blur-sm"
                                >
                                    <p className="text-3xl sm:text-4xl font-bold text-green-400 mb-1">
                                        {sessions.filter(s => s.recordings_count > 0).length}
                                    </p>
                                    <p className="text-xs text-slate-400">Activas</p>
                                </motion.div>
                            </motion.div>
                        )}
                        
                        {/* Create New Session Button */}
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-center mb-8"
                        >
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowSetupModal(true)}
                                className="relative bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 shadow-lg shadow-sky-500/50 hover:shadow-xl hover:shadow-sky-500/60"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-2xl">+</span>
                                    <span>Nueva Sesión</span>
                                </span>
                                {/* Animated glow effect */}
                                <motion.div
                                    className="absolute inset-0 rounded-full bg-sky-400 opacity-0"
                                    animate={{ opacity: [0, 0.3, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            </motion.button>
                        </motion.div>

                        {/* Sessions List */}
                        {sessions.length > 0 ? (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
                            >
                                {sessions.map((session, index) => (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + index * 0.1 }}
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 hover:from-slate-750 hover:to-slate-850 border border-slate-700 hover:border-sky-500/50 text-left p-5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10 backdrop-blur-sm"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-sky-400 text-xl mb-2 flex items-center gap-2">
                                                    <span className="w-5 h-5 flex items-center justify-center bg-sky-500/20 rounded border border-sky-500/40">
                                                        <svg className="w-3 h-3 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                    {session.name}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs bg-slate-700/70 border border-slate-600 px-3 py-1 rounded-full text-slate-300 font-medium backdrop-blur-sm">
                                                        {tCommon(`contexts.${session.context}`) || session.context}
                                                    </span>
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <motion.span 
                                                            animate={{ scale: [1, 1.2, 1] }}
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                            className="w-2 h-2 bg-sky-400 rounded-full"
                                                        />
                                                        {session.recordings_count} {session.recordings_count !== 1 ? t('recordingsCountPlural') : t('recordingsCount')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-slate-500 block bg-slate-800/50 px-2 py-1 rounded">
                                                    {new Date(session.created_at * 1000).toLocaleDateString('es-ES', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2 mt-4">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => selectExistingSession(session.id)}
                                                className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-300 hover:shadow-md shadow-sky-500/30 flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                                </svg>
                                                {t('recordNew')}
                                            </motion.button>
                                            {session.recordings_count > 0 && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => viewSessionDetails(session.id)}
                                                    className="flex-1 bg-slate-700/70 hover:bg-slate-600/70 border border-slate-600 hover:border-slate-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-300 backdrop-blur-sm flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                                    </svg>
                                                    {t('viewHistory')}
                                                </motion.button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-center py-12 px-6 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl backdrop-blur-sm"
                            >
                                <motion.div 
                                    animate={{ 
                                        rotate: [0, 10, -10, 0],
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-sky-500/10 border-2 border-sky-500/30 rounded-full"
                                >
                                    <svg className="w-10 h-10 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                    </svg>
                                </motion.div>
                                <h3 className="text-xl font-bold text-slate-300 mb-2">
                                    {t('emptyStateTitle')}
                                </h3>
                                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                    {t('emptyStateMessage')}
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowSetupModal(true)}
                                    className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors inline-flex items-center gap-2 shadow-lg shadow-sky-500/30"
                                >
                                    <span>+</span>
                                    <span>{t('createFirstSession')}</span>
                                </motion.button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
                
                {(appState === 'permissioning' || appState === 'recording') && (
                    <RecordingUI
                        key="recording"
                        setAppState={setAppState}
                        setAudioBlob={setAudioBlob}
                    />
                )}
                
                {appState === 'analyzing' && (
                    <AnalyzingUI
                        key="analyzing"
                        audioBlob={audioBlob}
                        sessionId={currentSessionId}
                        locale={locale}
                        onAnalysisComplete={handleAnalysisComplete}
                    />
                )}
                
                {appState === 'results' && (
                    <ResultsUI
                        key="results"
                        result={analysisResult}
                        sessionData={currentSessionData}
                        onReset={handleReset}
                    />
                )}
            </AnimatePresence>

            {showSetupModal && (
                <SessionSetupModal
                    onStart={(config) => createNewSession(config)}
                    onSkip={() => setShowSetupModal(false)}
                />
            )}

            {showDetailsModal && selectedSessionForDetails && (
                <SessionDetailsModal
                    session={selectedSessionForDetails}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedSessionForDetails(null);
                    }}
                    onSelectRecording={(recording) => {
                        console.log("Selected recording:", recording);
                    }}
                />
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.5);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(14, 165, 233, 0.3);
                    border-radius: 4px;
                    transition: background 0.3s;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(14, 165, 233, 0.5);
                }
            `}</style>
        </div>
    );
};

export default LucidApp;