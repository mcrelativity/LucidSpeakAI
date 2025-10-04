"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaLightbulb, FaTachometerAlt, FaSmile, FaAlignLeft, FaBrain, FaHistory, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaQuestionCircle, FaChartLine, FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceArea } from 'recharts';

const TooltipComponent = ({ text, children }) => (
    <div className="relative flex items-center group">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
            {text}
        </div>
    </div>
);

const MetricCard = ({ icon, title, value, unit, evaluation, tooltipText }) => {
    const evaluationStyles = {
        "Bajo": "text-green-400", "Ideal": "text-green-400", "Dinámico": "text-green-400",
        "Moderado": "text-yellow-400", "Rápido": "text-yellow-400", "Lento": "text-yellow-400",
        "Alto": "text-red-400", "Monótono": "text-red-400", "N/A": "text-slate-500",
    };
    return (
        <div className="p-4 bg-slate-800 rounded-lg flex flex-col items-center justify-center h-full relative">
            <div className="absolute top-2 right-2">
                <TooltipComponent text={tooltipText}>
                    <FaInfoCircle className="text-slate-600 hover:text-slate-400 transition-colors cursor-pointer" />
                </TooltipComponent>
            </div>
            <div className="flex items-center space-x-2 mb-2">
                {icon}
                <h4 className="text-sm font-semibold text-slate-400">{title}</h4>
            </div>
            <p className="text-4xl sm:text-5xl font-bold">{value}</p>
            {unit && <p className="text-xs text-slate-500">{unit}</p>}
            {evaluation && (
                 <div className={`mt-2 text-xs font-bold px-2 py-1 rounded-full ${evaluationStyles[evaluation] || 'text-slate-400'}`}>
                    {evaluation}
                </div>
            )}
        </div>
    );
};

const HistoryCard = ({ item, previousItem }) => {
    const MetricComparison = ({ label, currentValue, previousValue, higherIsBetter = true }) => {
        const diff = (currentValue || 0) - (previousValue || 0);
        let Icon = FaMinus;
        let color = "text-yellow-400";
        if (diff > 0.1) {
            Icon = FaArrowUp;
            color = higherIsBetter ? "text-green-400" : "text-red-400";
        } else if (diff < -0.1) {
            Icon = FaArrowDown;
            color = higherIsBetter ? "text-red-400" : "text-green-400";
        }
        
        return (
            <div className="text-center">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-2xl font-bold">{Math.round(currentValue || 0)}</p>
                {previousValue !== undefined && (
                    <p className={`text-xs font-bold flex items-center justify-center ${color}`}>
                        <Icon className="mr-1"/> {diff.toFixed(1)}
                    </p>
                )}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 p-4 rounded-lg"
        >
            <p className="text-sm font-bold text-sky-400 mb-2">
                {new Date(item.date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
            {item.insights_summary && (
                <p className="text-sm text-slate-300 italic mb-2">{item.insights_summary}</p>
            )}
            <div className="grid grid-cols-3 gap-4">
                <MetricComparison label="Ritmo (ppm)" currentValue={item.pace} previousValue={previousItem?.pace} />
                <MetricComparison label="Disfluencias/Min" currentValue={item.disfluencies_per_minute} previousValue={previousItem?.disfluencies_per_minute} higherIsBetter={false} />
                <MetricComparison label="Tono" currentValue={item.pitch_variation} previousValue={previousItem?.pitch_variation} />
            </div>
        </motion.div>
    );
};

const CustomRadarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm">
                <p className="label text-slate-400">{`${payload[0].payload.subject}`}</p>
                <p className="intro text-sky-400">{`Tu Puntaje: ${payload[0].value.toFixed(0)} / 100`}</p>
            </div>
        );
    }
    return null;
};

const TabButton = ({ name, activeTab, setActiveTab, icon }) => (
    <button
        onClick={() => setActiveTab(name)}
        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium flex items-center space-x-2 transition-colors duration-300 ${
            activeTab === name
                ? 'border-b-2 border-sky-400 text-sky-400'
                : 'text-slate-400 hover:text-white border-b-2 border-transparent'
        }`}
    >
        {icon} <span>{name}</span>
    </button>
);


const ResultsUI = ({ result, history, onReset }) => {
    const [activeTab, setActiveTab] = useState('Resumen');
    
    const strengths = result?.feedback?.strengths || [];
    const improvements = result?.feedback?.improvements || [];
    const disfluencyDetails = result?.details ? Object.entries(result.details) : [];
    
    if(!result) {
         return (
             <div className="text-center">
                <h2 className="text-2xl text-red-400 mb-4">Error en el Análisis</h2>
                <p className="text-slate-400 mb-8">No pudimos procesar tu audio. Verifica tu conexión o la terminal del servidor.</p>
                <button onClick={onReset} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 rounded-full">Reintentar</button>
            </div>
        );
    }
    
    const radarData = [
        { subject: 'Ritmo', value: result?.scores?.pace, idealScore: 95 },
        { subject: 'Tono', value: result?.scores?.pitch, idealScore: 90 },
        { subject: 'Fluidez', value: result?.scores?.disfluencies, idealScore: 98 },
        { subject: 'Convicción', value: result?.scores?.hedges, idealScore: 99 },
    ].map(item => ({...item, value: Math.round(Math.max(0, Math.min(100, item.value || 0))), idealScore: Math.round(Math.max(0, Math.min(100, item.idealScore || 0))),}));
    
    return (
        <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
        >
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-sky-400 text-center">Tu Reporte de Convicción</h2>

            <div className="flex justify-center border-b border-slate-700 mb-6 flex-wrap">
                <TabButton name="Resumen" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FaBrain />} />
                <TabButton name="Métricas" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FaTachometerAlt />} />
                <TabButton name="Progreso" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FaHistory />} />
                <TabButton name="Transcripción" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FaAlignLeft />} />
            </div>

            {activeTab === 'Resumen' && (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}}>
                    {result.insights && (
                        <div className="p-4 bg-slate-900 rounded-lg mb-6">
                            <h4 className="font-semibold text-sky-400 mb-2">Insights Automatizados</h4>
                            <p className="text-slate-300 mb-2">{result.insights.summary}</p>
                            <div className="mb-2">
                                <h5 className="text-sm text-slate-400 mb-1">Acciones recomendadas</h5>
                                <ul className="list-disc pl-5 text-slate-300">
                                    {result.insights.actions?.map((a, i) => <li key={i}>{a}</li>)}
                                </ul>
                            </div>
                            <div className="mb-2">
                                <h5 className="text-sm text-slate-400 mb-1">Ejercicio sugerido</h5>
                                <p className="text-slate-300">{result.insights.exercise}</p>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h4 className="font-semibold text-slate-400 mb-2 flex items-center"><FaCheckCircle className="mr-2 text-green-400"/> Puntos Fuertes</h4>
                            <div className="p-4 bg-slate-800 rounded-lg space-y-2 text-sm min-h-[100px]">
                                {strengths.length > 0 ? strengths.map((s, i) => <p key={i}>- {s}</p>) : <p className="text-slate-500">Sigue practicando para identificar tus fortalezas.</p>}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-400 mb-2 flex items-center"><FaExclamationTriangle className="mr-2 text-yellow-400"/> Áreas de Mejora</h4>
                             <div className="p-4 bg-slate-800 rounded-lg space-y-2 text-sm min-h-[100px]">
                                {improvements.length > 0 ? improvements.map((imp, i) => <p key={i}>- {imp}</p>) : <p className="text-slate-500">¡Gran trabajo! No hemos encontrado áreas críticas para mejorar.</p>}
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg">
                         <h3 className="font-bold text-lg pt-4 text-center">Tu Perfil vs. el Ideal</h3>
                         <div className="h-80 sm:h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#334155" />
                                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                                    <PolarRadiusAxis angle={45} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Tu Práctica" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                                    <Radar name="Perfil Ideal" dataKey="idealScore" stroke="#4ade80" fill="#4ade80" fillOpacity={0.2} />
                                    <Legend wrapperStyle={{ paddingTop: '20px', paddingBottom: '10px' }} />
                                    <Tooltip content={<CustomRadarTooltip />} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'Métricas' && (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-6">
                        <MetricCard 
                            icon={<FaTachometerAlt className="text-green-400"/>} 
                            title="RITMO" 
                            value={Math.round(result.pace || 0)} 
                            unit="palabras / min" 
                            evaluation={result.evaluations.pace}
                            tooltipText="El ritmo ideal para un discurso claro está entre 130 y 170 palabras por minuto."
                        />
                        <MetricCard 
                            icon={<FaSmile className="text-purple-400"/>} 
                            title="TONO" 
                            value={result.pitch_variation} 
                            unit="variación" 
                            evaluation={result.evaluations.pitch}
                            tooltipText="Una mayor variación de tono hace tu discurso más dinámico. Un valor bajo indica monotonía."
                        />
                        <MetricCard 
                            icon={<FaQuestionCircle className="text-red-400"/>} 
                            title="PALABRAS DE DUDA" 
                            value={result.hedge_count || 0}
                            evaluation={result.evaluations.hedges}
                            tooltipText="Palabras como 'creo que' o 'tal vez' que debilitan tu mensaje. Un orador seguro las evita."
                        />
                    </div>
                     {disfluencyDetails.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-slate-400 mb-2">Análisis de Disfluencias:</h4>
                            <div className="p-4 bg-slate-800 rounded-lg">
                                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {disfluencyDetails.map(([category, details]) => (
                                        <div key={category}>
                                            <h5 className="text-sm font-bold text-sky-400 mb-2">{category}</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(details).map(([word, count]) => (
                                                    <div key={word} className="bg-slate-700 p-2 rounded-md text-center flex-shrink-0">
                                                        <p className="text-lg font-bold">{count}</p>
                                                        <p className="text-xs text-slate-400">&quot;{word}&quot;</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
            
            {activeTab === 'Progreso' && (
                 <motion.div initial={{opacity: 0}} animate={{opacity: 1}}>
                     <h3 className="font-bold text-lg mb-4">Tu Historial de Prácticas</h3>
                     <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {history.length > 0 ? history.map((item, index) => (
                            <HistoryCard key={item.id} item={item} previousItem={history[index + 1]} />
                        )) : (
                            <p className="text-slate-400 text-center">Aún no tienes un historial. ¡Completa tu primer análisis para empezar a medir tu progreso!</p>
                        )}
                     </div>
                 </motion.div>
            )}

            {activeTab === 'Transcripción' && (
                 <motion.div initial={{opacity: 0}} animate={{opacity: 1}}>
                    <p className="text-slate-300 italic p-4 bg-slate-800 rounded-lg max-h-60 overflow-y-auto">
                        {result.transcription || "[Transcripción omitida para grabaciones de más de 1 minuto]"}
                    </p>
                 </motion.div>
            )}
            
            <div className="text-center mt-8">
                 <button onClick={onReset} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 rounded-full transition-transform duration-300 hover:scale-105">
                    Analizar de Nuevo
                </button>
            </div>
        </motion.div>
    );
};
export default ResultsUI;