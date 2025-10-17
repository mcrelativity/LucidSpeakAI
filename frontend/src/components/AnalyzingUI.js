"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const STATUS_MESSAGES = {
    0: "Preparando análisis...",
    10: "Cargando audio...",
    15: "Inicializando...",
    20: "Extrayendo características de audio...",
    35: "Analizando prosody...",
    50: "Detectando muletillas...",
    65: "Analizando emociones...",
    80: "Generando insights con IA...",
    95: "Finalizando análisis...",
    100: "¡Análisis completado!"
};

const getStatusMessage = (prog) => {
    if (prog >= 80) return STATUS_MESSAGES[80];
    if (prog >= 65) return STATUS_MESSAGES[65];
    if (prog >= 50) return STATUS_MESSAGES[50];
    if (prog >= 35) return STATUS_MESSAGES[35];
    if (prog >= 20) return STATUS_MESSAGES[20];
    if (prog >= 15) return STATUS_MESSAGES[15];
    if (prog >= 10) return STATUS_MESSAGES[10];
    return STATUS_MESSAGES[0];
};

const AnalyzingUI = ({ audioBlob, sessionId, onAnalysisComplete, locale = 'es' }) => {
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Preparando análisis...');
    const [jobId, setJobId] = useState(null);
    const { token, apiBase, user } = useAuth();
    const hasUploadedRef = useRef(false);
    const isProcessingRef = useRef(false);
    const pollIntervalRef = useRef(null);



    useEffect(() => {
        if (isProcessingRef.current) {
            console.log('[WARN] Already processing, skipping duplicate effect');
            return;
        }

        const pollJobStatus = (jId) => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }

            pollIntervalRef.current = setInterval(async () => {
                try {
                    const response = await fetch(`${apiBase}/api/job/${jId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const jobStatus = await response.json();
                        setProgress(jobStatus.progress || 0);
                        setStatusMessage(getStatusMessage(jobStatus.progress || 0));

                        if (jobStatus.status === 'completed') {
                            clearInterval(pollIntervalRef.current);
                            setProgress(100);
                            setStatusMessage('Análisis completado');
                            
                            // Pequeña pausa antes de mostrar resultados
                            await new Promise(resolve => setTimeout(resolve, 500));
                            onAnalysisComplete(jobStatus.result);
                            
                        } else if (jobStatus.status === 'failed') {
                            clearInterval(pollIntervalRef.current);
                            onAnalysisComplete({
                                error: true,
                                message: jobStatus.error || 'El análisis falló'
                            });
                        }
                    } else {
                        console.error('[ERROR] Failed to fetch job status');
                    }
                } catch (error) {
                    console.error('[ERROR] Polling error:', error);
                }
            }, 1000); // Poll every 1 second
        };

        const uploadAndAnalyze = async () => {
            if (!audioBlob || !sessionId) {
                console.error('[ERROR] Missing audioBlob or sessionId');
                onAnalysisComplete({ 
                    error: true, 
                    message: 'Error: Datos incompletos para el análisis' 
                });
                return;
            }

            if (hasUploadedRef.current) {
                console.log('[WARN] Upload already completed, skipping');
                return;
            }

            isProcessingRef.current = true;
            hasUploadedRef.current = true;
            console.log('[INFO] Starting upload...');

            try {
                setProgress(10);
                setStatusMessage('Subiendo audio al servidor...');

                const formData = new FormData();
                formData.append('file', audioBlob, 'recording.webm');

                setProgress(15);
                setStatusMessage('Transcribiendo tu grabación...');

                console.log(`[INFO] Sending to: ${apiBase}/upload-audio/?session_id=${sessionId}`);
                console.log(`[INFO] Using locale: ${locale}`);
                console.log(`[INFO] User tier: ${user?.tier || 'unknown'}`);

                const response = await fetch(`${apiBase}/upload-audio/?session_id=${sessionId}&locale=${locale}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('[SUCCESS] Upload complete:', result);

                    // Si el usuario es Pro y hay un job_id, hacer polling
                    if (user?.tier === 'pro' && result.job_id) {
                        console.log('[INFO] Pro user detected, starting job polling:', result.job_id);
                        setJobId(result.job_id);
                        setProgress(20);
                        pollJobStatus(result.job_id);
                    } else {
                        // Free tier - análisis rápido
                        console.log('[INFO] Free user, showing regular analysis');
                        setProgress(100);
                        setStatusMessage('Análisis completo');

                        await new Promise(resolve => setTimeout(resolve, 300));
                        onAnalysisComplete(result);
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('[ERROR] Upload error:', errorData);
                    onAnalysisComplete({
                        error: true,
                        message: errorData.detail || `Error del servidor: ${response.status}`
                    });
                }
            } catch (error) {
                console.error('[ERROR] Error during analysis:', error);
                onAnalysisComplete({
                    error: true,
                    message: 'Error de conexión. Verifica tu conexión a internet.'
                });
            } finally {
                isProcessingRef.current = false;
            }
        };

        uploadAndAnalyze();

        const pollInterval = pollIntervalRef.current;
        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [audioBlob, sessionId, token, apiBase, locale, onAnalysisComplete, user]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center w-full"
        >
            <div className="text-center mb-8">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 border-4 border-sky-500 border-t-transparent rounded-full mx-auto mb-4"
                />
                <h2 className="text-2xl font-bold text-sky-400 mb-2">Analizando tu voz...</h2>
                <p className="text-slate-400">{statusMessage}</p>
            </div>

            <div className="w-full max-w-md">
                <div className="bg-slate-700 rounded-full h-4 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full"
                    />
                </div>
                <p className="text-center text-slate-500 mt-2 text-sm">{progress}%</p>
            </div>

            {jobId && (
                <div className="mt-6 flex items-center justify-center gap-2">
                    <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 bg-sky-500 rounded-full"
                    />
                    <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                        className="w-2 h-2 bg-sky-500 rounded-full"
                    />
                    <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                        className="w-2 h-2 bg-sky-500 rounded-full"
                    />
                </div>
            )}

            <div className="mt-8 text-sm text-slate-500 text-center max-w-md">
                <p>Estamos procesando tu audio con IA para darte feedback personalizado...</p>
            </div>
        </motion.div>
    );
};

export default AnalyzingUI;