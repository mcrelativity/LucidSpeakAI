"use client";
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaStop, FaMicrophone } from 'react-icons/fa';
import { useTranslations } from 'next-intl';

const RecordingUI = ({ setAppState, setAudioBlob }) => {
    const t = useTranslations('Recording');
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);
    const hasStartedRef = useRef(false);
    const MAX_DURATION_SECONDS = 900; // 15 minutos

    const [elapsedTime, setElapsedTime] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [isRequestingPermission, setIsRequestingPermission] = useState(false);
    const timerRef = useRef(null);
    
    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log('🛑 Stopping recording...');
            mediaRecorderRef.current.stop();
        }
        stopTimer();
    };

    const startRecording = async () => {
        if (hasStartedRef.current || isRecording) {
            console.log('⚠️ Recording already in progress');
            return;
        }

        setIsRequestingPermission(true);

        try {
            console.log('🎤 Requesting microphone permission...');
            const streamData = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            
            streamRef.current = streamData;
            hasStartedRef.current = true;
            
            // Clear previous chunks and reset timer
            audioChunksRef.current = [];
            setElapsedTime(0);
            
            console.log('🎙️ Starting MediaRecorder...');
            const media = new MediaRecorder(streamData, { mimeType: "audio/webm" });
            mediaRecorderRef.current = media;

            media.onstop = () => {
                console.log('✅ Recording stopped, creating blob...');
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                console.log(`📦 Blob size: ${audioBlob.size} bytes`);
                
                setAudioBlob(audioBlob);
                setAppState('analyzing');
            };

            media.ondataavailable = (event) => {
                if (typeof event.data === "undefined" || event.data.size === 0) return;
                audioChunksRef.current.push(event.data);
            };

            media.start();
            setIsRecording(true);
            setIsRequestingPermission(false);
            console.log('⏺️ Recording started!');

            // Start the timer
            const startTime = Date.now();
            timerRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                setElapsedTime(elapsed);
                
                if (elapsed >= MAX_DURATION_SECONDS * 1000) {
                    console.log('⏰ Max duration reached, stopping...');
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                        mediaRecorderRef.current.stop();
                    }
                    stopTimer();
                }
            }, 100);
        } catch (err) {
            console.error('❌ Microphone permission error:', err);
            alert("Necesitamos permiso del micrófono para continuar.");
            setAppState('sessions');
            setIsRequestingPermission(false);
        }
    };

    useEffect(() => {
        return () => {
            console.log('🧹 Cleaning up RecordingUI...');
            stopTimer();
            
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    track.stop();
                    console.log('🔇 Stopped track:', track.label);
                });
            }
            
            hasStartedRef.current = false;
        };
    }, []);

    const elapsedSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const remainingSeconds = MAX_DURATION_SECONDS - elapsedSeconds;
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    const remainingSecondsDisplay = remainingSeconds % 60;

    if (!isRecording && !isRequestingPermission) {
        // Initial state - show "Start Recording" button
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center w-full"
            >
                <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-red-500/10 border-2 border-red-500/30 rounded-full"
                >
                    <svg className="w-10 h-10 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                </motion.div>
                <h2 className="text-2xl font-bold text-sky-400 mb-2">
                    {t('ready')}
                </h2>
                <p className="text-slate-400 mb-8 max-w-md">
                    {t('instructions')}
                </p>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startRecording}
                    className="relative bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/60"
                >
                    <span className="flex items-center gap-3">
                        <FaMicrophone size={24} />
                        <span>Comenzar Grabación</span>
                    </span>
                </motion.button>
                <p className="text-slate-500 text-sm mt-4">
                    Duración máxima: 15 minutos
                </p>
            </motion.div>
        );
    }

    if (isRequestingPermission) {
        // Requesting microphone permission
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center text-center w-full"
            >
                <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400">Solicitando permiso del micrófono...</p>
            </motion.div>
        );
    }

    // Recording in progress
    return (
        <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center text-center w-full"
        >
            <p className="text-slate-400 mb-4">Grabando... Presiona para detener.</p>
            <div className="text-sky-400 text-6xl font-bold mb-8" style={{fontVariantNumeric: 'tabular-nums'}}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="relative">
                <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -inset-4 bg-sky-500 rounded-full opacity-50"
                />
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopRecording}
                    className="relative w-28 h-28 bg-red-500 text-white rounded-full flex items-center justify-center text-5xl hover:bg-red-600 transition-colors duration-300 shadow-lg shadow-red-500/50"
                >
                    <FaStop />
                </motion.button>
            </div>
            <p className="text-slate-500 text-sm mt-6">
                Tiempo restante: {String(remainingMinutes).padStart(2, '0')}:{String(remainingSecondsDisplay).padStart(2, '0')}
            </p>
        </motion.div>
    );
};

export default RecordingUI;