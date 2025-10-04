"use client";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const AnalyzingUI = ({ audioBlob, onAnalysisComplete }) => {
    const [status, setStatus] = useState("Iniciando análisis...");

    useEffect(() => {
        const analyze = async () => {
            if (!audioBlob) return;
            
            setStatus("Transcribiendo audio...");
            const formData = new FormData();
            formData.append("file", audioBlob, "audio.webm");

            try {
                await new Promise(resolve => setTimeout(resolve, 1500));
                setStatus("Analizando fluidez y convicción...");
                
                const response = await fetch("http://localhost:8000/upload-audio/", {
                    method: "POST",
                    body: formData,
                });
                 await new Promise(resolve => setTimeout(resolve, 1500));

                if (response.ok) {
                    const data = await response.json();
                    setStatus("Generando feedback...");
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    onAnalysisComplete(data);
                } else {
                     throw new Error("Analysis failed");
                }
            } catch (error) {
                onAnalysisComplete(null); 
            }
        };

        analyze();
    }, [audioBlob, onAnalysisComplete]);

    const variants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
        >
            <h2 className="text-3xl font-bold text-sky-400 mb-4">Analizando...</h2>
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 mx-auto animate-spin border-t-sky-500"></div>
            <motion.p
                key={status}
                variants={variants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.5 }}
                className="text-slate-400"
            >
                {status}
            </motion.p>
        </motion.div>
    );
};

export default AnalyzingUI;