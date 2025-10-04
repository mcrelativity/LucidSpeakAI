"use client";
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaStop } from 'react-icons/fa';

const RecordingUI = ({ setAppState, setAudioBlob }) => {
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);
    const MAX_DURATION_SECONDS = 900; // 15 minutos

    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef(null);
    
    const startTimer = () => {
        const startTime = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            setElapsedTime(elapsed);
            
            if (elapsed >= MAX_DURATION_SECONDS * 1000) {
                stopRecording();
            }
        }, 100);
    };
    
    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            stopTimer();
        }
    };

    useEffect(() => {
        let isMounted = true;
        
        const getMicrophonePermission = async () => {
            try {
                const streamData = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                if (isMounted) {
                    streamRef.current = streamData;
                    startRecording(streamData);
                }
            } catch (err) {
                if (isMounted) {
                    alert("Necesitamos permiso del micrófono para continuar.");
                    setAppState('idle');
                }
            }
        };

        const startRecording = (streamData) => {
            setAppState('recording');
            const media = new MediaRecorder(streamData, { mimeType: "audio/webm" });
            mediaRecorderRef.current = media;

            media.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                setAudioBlob(audioBlob);
                setAppState('analyzing');
            };

            media.ondataavailable = (event) => {
                if (typeof event.data === "undefined" || event.data.size === 0) return;
                audioChunksRef.current.push(event.data);
            };

            media.start();
            startTimer(); // Inicia el temporizador
        };
        
        getMicrophonePermission();

        return () => {
            isMounted = false;
            stopTimer();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [setAppState, setAudioBlob]); // Agregamos las dependencias necesarias

    const elapsedSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

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
                <div className="absolute -inset-4 bg-sky-500 rounded-full animate-pulse"></div>
                <button
                    onClick={stopRecording}
                    className="relative w-28 h-28 bg-red-500 text-white rounded-full flex items-center justify-center text-5xl hover:bg-red-600 transition-colors duration-300"
                >
                    <FaStop />
                </button>
            </div>
        </motion.div>
    );
};
export default RecordingUI;