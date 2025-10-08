"use client";
import { motion } from 'framer-motion';
import { FaMicrophone } from 'react-icons/fa';

const ReadyToRecordUI = ({ onStartRecording, sessionName }) => {
    return (
        <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center flex flex-col items-center justify-center"
        >
            <h2 className="text-2xl sm:text-3xl font-bold text-sky-400 mb-2">
                {sessionName || 'Nueva Sesión'}
            </h2>
            <p className="text-slate-400 mb-8 text-sm sm:text-base">
                Presiona el micrófono cuando estés listo para comenzar
            </p>
            
            <div className="relative mb-8">
                {/* Pulsing rings */}
                <div className="absolute inset-0 -m-8">
                    <div className="absolute inset-0 bg-sky-500/20 rounded-full animate-ping"></div>
                </div>
                <div className="absolute inset-0 -m-12">
                    <div className="absolute inset-0 bg-sky-500/10 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                </div>
                
                {/* Main button */}
                <motion.button
                    onClick={onStartRecording}
                    className="relative w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-sky-500/50 transition-all duration-300 hover:scale-110"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FaMicrophone className="text-5xl sm:text-6xl" />
                </motion.button>
            </div>
            
            <p className="text-slate-500 text-xs sm:text-sm max-w-md">
                Tip: Encuentra un lugar tranquilo para obtener los mejores resultados
            </p>
        </motion.div>
    );
};

export default ReadyToRecordUI;
