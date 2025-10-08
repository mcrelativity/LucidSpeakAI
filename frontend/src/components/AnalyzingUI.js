"use client";
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const AnalyzingUI = ({ audioBlob, sessionId, onAnalysisComplete, locale = 'es' }) => {
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Preparando análisis...');
    const { token, apiBase } = useAuth();
    const hasUploadedRef = useRef(false);
    const isProcessingRef = useRef(false);

    useEffect(() => {
        if (isProcessingRef.current) {
            console.log('[WARN] Already processing, skipping duplicate effect');
            return;
        }

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

                setProgress(30);
                setStatusMessage('Transcribiendo tu grabación...');

                console.log(`[INFO] Sending to: ${apiBase}/upload-audio/?session_id=${sessionId}`);
                console.log(`[INFO] Using locale: ${locale}`);

                const response = await fetch(`${apiBase}/upload-audio/?session_id=${sessionId}&locale=${locale}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                setProgress(70);
                setStatusMessage('Analizando métricas vocales...');

                if (response.ok) {
                    const result = await response.json();
                    console.log('[SUCCESS] Analysis complete:', result);
                    console.log('[DEBUG] Full result keys:', Object.keys(result));

                    setProgress(100);
                    setStatusMessage('Análisis completo');

                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    console.log('[INFO] Calling onAnalysisComplete with result');
                    onAnalysisComplete(result);
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
    }, []);

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

            <div className="mt-8 text-sm text-slate-500 text-center max-w-md">
                <p>Estamos procesando tu audio con IA para darte feedback personalizado...</p>
            </div>
        </motion.div>
    );
};

export default AnalyzingUI;