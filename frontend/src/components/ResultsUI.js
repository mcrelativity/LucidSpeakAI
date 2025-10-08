"use client";
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTachometerAlt, FaSmile, FaBrain, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaQuestionCircle, FaArrowUp, FaArrowDown, FaHistory, FaChartLine, FaTrophy, FaFire } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

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
        "Bajo": "text-green-400", 
        "Ideal": "text-green-400", 
        "Dinámico": "text-green-400",
        "Moderado": "text-yellow-400", 
        "Rápido": "text-yellow-400", 
        "Lento": "text-yellow-400",
        "Alto": "text-red-400", 
        "Monótono": "text-red-400", 
        "N/A": "text-slate-500",
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

const IndividualChart = ({ data, dataKey, title, color, idealRange, unit, yAxisDomain }) => {
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-3 bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl">
                    <p className="text-slate-400 text-xs mb-1">{payload[0].payload.session}</p>
                    <p className="text-lg font-bold" style={{ color }}>
                        {payload[0].value} {unit}
                    </p>
                    {idealRange && (
                        <p className="text-xs text-slate-500 mt-1">
                            Ideal: {idealRange[0]}-{idealRange[1]} {unit}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-4 text-sky-400">{title}</h3>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                        dataKey="session" 
                        stroke="#94a3b8" 
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#cbd5e1' }}
                    />
                    <YAxis 
                        stroke="#94a3b8" 
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#cbd5e1' }}
                        domain={yAxisDomain || ['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {idealRange && (
                        <>
                            <ReferenceLine 
                                y={idealRange[0]} 
                                stroke="#4ade80" 
                                strokeDasharray="3 3" 
                                strokeOpacity={0.5}
                                label={{ value: 'Mín ideal', fill: '#4ade80', fontSize: 10, position: 'insideTopLeft' }}
                            />
                            <ReferenceLine 
                                y={idealRange[1]} 
                                stroke="#4ade80" 
                                strokeDasharray="3 3" 
                                strokeOpacity={0.5}
                                label={{ value: 'Máx ideal', fill: '#4ade80', fontSize: 10, position: 'insideBottomLeft' }}
                            />
                        </>
                    )}
                    <Line 
                        type="monotone" 
                        dataKey={dataKey} 
                        stroke={color} 
                        strokeWidth={3}
                        dot={{ fill: color, strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, strokeWidth: 3 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const ProgressComparison = ({ current, previous, allRecordings }) => {
    const stats = useMemo(() => {
        if (!allRecordings || allRecordings.length === 0) return null;

        let currentStreak = 1;
        for (let i = allRecordings.length - 2; i >= 0; i--) {
            const curr = allRecordings[i + 1];
            const prev = allRecordings[i];
            
            const improvementCount = [
                Math.abs(curr.pace - 150) < Math.abs(prev.pace - 150),
                curr.pitch_variation > prev.pitch_variation,
                curr.disfluencies_per_minute < prev.disfluencies_per_minute
            ].filter(Boolean).length;

            if (improvementCount >= 2) {
                currentStreak++;
            } else {
                break;
            }
        }

        const bestPace = allRecordings.reduce((best, r) => 
            Math.abs(r.pace - 150) < Math.abs(best - 150) ? r.pace : best, 
            allRecordings[0].pace
        );
        const bestPitch = Math.max(...allRecordings.map(r => r.pitch_variation));
        const bestFluency = Math.min(...allRecordings.map(r => r.disfluencies_per_minute));

        const isPaceBest = Math.abs(current.pace - 150) <= Math.abs(bestPace - 150);
        const isPitchBest = current.pitch_variation >= bestPitch;
        const isFluencyBest = current.disfluencies_per_minute <= bestFluency;

        return {
            streak: currentStreak,
            isPaceBest,
            isPitchBest,
            isFluencyBest,
            bestPace,
            bestPitch,
            bestFluency
        };
    }, [allRecordings, current]);

    if (!previous && (!allRecordings || allRecordings.length <= 1)) {
        return (
            <div className="text-center py-8 text-slate-400">
                <p>Esta es tu primera grabación. Sigue practicando para ver tu progreso</p>
            </div>
        );
    }

    const compareMetric = (currentVal, prevVal, higherIsBetter = true, ideal = null) => {
        const diff = currentVal - prevVal;
        const percentChange = prevVal !== 0 ? Math.abs((diff / prevVal) * 100) : 0;
        
        let status, color, icon, displayPercent;
        
        // Umbral del 5% para considerar cambio significativo
        const THRESHOLD = 5;
        
        if (ideal) {
            const currentDistance = Math.abs(currentVal - ideal);
            const prevDistance = Math.abs(prevVal - ideal);
            const distanceChange = Math.abs(currentDistance - prevDistance);
            const percentDistanceChange = prevDistance !== 0 ? (distanceChange / prevDistance) * 100 : 0;
            
            if (percentDistanceChange < THRESHOLD) {
                status = "mantenido";
                color = "text-slate-400";
                icon = <span className="text-lg">→</span>;
                displayPercent = null;
            } else if (currentDistance < prevDistance) {
                status = "mejor";
                color = "text-green-400";
                icon = <FaArrowUp />;
                displayPercent = percentDistanceChange.toFixed(0);
            } else {
                status = "peor";
                color = "text-red-400";
                icon = <FaArrowDown />;
                displayPercent = percentDistanceChange.toFixed(0);
            }
        } else {
            if (percentChange < THRESHOLD) {
                status = "mantenido";
                color = "text-slate-400";
                icon = <span className="text-lg">→</span>;
                displayPercent = null;
            } else if (diff > 0) {
                status = higherIsBetter ? "mejor" : "peor";
                color = higherIsBetter ? "text-green-400" : "text-red-400";
                icon = <FaArrowUp />;
                displayPercent = percentChange.toFixed(0);
            } else {
                status = higherIsBetter ? "peor" : "mejor";
                color = higherIsBetter ? "text-red-400" : "text-green-400";
                icon = <FaArrowDown />;
                displayPercent = percentChange.toFixed(0);
            }
        }
        
        return { diff, percentChange, status, color, icon, displayPercent };
    };

    const paceComp = compareMetric(current.pace, previous.pace, null, 150);
    const pitchComp = compareMetric(current.pitch_variation, previous.pitch_variation, true);
    const disfComp = compareMetric(current.disfluencies_per_minute, previous.disfluencies_per_minute, false);

    const avgPace = allRecordings ? allRecordings.reduce((sum, r) => sum + r.pace, 0) / allRecordings.length : current.pace;
    const avgPitch = allRecordings ? allRecordings.reduce((sum, r) => sum + r.pitch_variation, 0) / allRecordings.length : current.pitch_variation;
    const avgDisf = allRecordings ? allRecordings.reduce((sum, r) => sum + r.disfluencies_per_minute, 0) / allRecordings.length : current.disfluencies_per_minute;

    return (
        <div className="space-y-6">
            {stats && stats.streak > 1 && (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500/50 p-4 rounded-lg"
                >
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <FaFire className="text-orange-400 text-3xl" />
                        <div>
                            <h3 className="text-2xl font-bold text-yellow-400">{stats.streak} Sesiones Mejorando</h3>
                            <p className="text-sm text-slate-300">Mantén la racha practicando consistentemente</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {stats && (stats.isPaceBest || stats.isPitchBest || stats.isFluencyBest) && (
                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-2 border-green-500/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <FaTrophy className="text-yellow-400 text-2xl" />
                        <h3 className="text-xl font-bold text-green-400">Nuevo Récord Personal</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {stats.isPaceBest && (
                            <span className="text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full border border-green-500/30">
                                Mejor Ritmo
                            </span>
                        )}
                        {stats.isPitchBest && (
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                                Mejor Tono
                            </span>
                        )}
                        {stats.isFluencyBest && (
                            <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                                Mayor Fluidez
                            </span>
                        )}
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-lg font-semibold text-sky-400 mb-4 flex items-center">
                    <FaChartLine className="mr-2" /> Comparación con tu última grabación
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-slate-400">Ritmo</h4>
                            <div className={`flex items-center gap-1 ${paceComp.color} font-bold text-sm`}>
                                {paceComp.icon}
                                <span>{Math.abs(paceComp.percentChange).toFixed(0)}%</span>
                            </div>
                        </div>
                        <p className="text-3xl font-bold mb-1">{Math.round(current.pace)}</p>
                        <p className="text-xs text-slate-500">vs {Math.round(previous.pace)} ppm anterior</p>
                        <p className={`text-sm mt-2 ${paceComp.color}`}>
                            {paceComp.status === "mejor" && "Mejoraste - más cerca del ritmo ideal"}
                            {paceComp.status === "peor" && "Te alejaste del ritmo ideal"}
                            {paceComp.status === "igual" && "Mantuviste un ritmo similar"}
                        </p>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-slate-400">Variación de Tono</h4>
                            <div className={`flex items-center gap-1 ${pitchComp.color} font-bold text-sm`}>
                                {pitchComp.icon}
                                <span>{Math.abs(pitchComp.percentChange).toFixed(0)}%</span>
                            </div>
                        </div>
                        <p className="text-3xl font-bold mb-1">{Math.round(current.pitch_variation)}</p>
                        <p className="text-xs text-slate-500">vs {Math.round(previous.pitch_variation)} anterior</p>
                        <p className={`text-sm mt-2 ${pitchComp.color}`}>
                            {pitchComp.status === "mejor" && "Excelente - tu voz es más dinámica"}
                            {pitchComp.status === "peor" && "Tu tono fue más monótono"}
                            {pitchComp.status === "igual" && "Tono similar a tu última práctica"}
                        </p>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-slate-400">Disfluencias</h4>
                            <div className={`flex items-center gap-1 ${disfComp.color} font-bold text-sm`}>
                                {disfComp.icon}
                                <span>{Math.abs(disfComp.percentChange).toFixed(0)}%</span>
                            </div>
                        </div>
                        <p className="text-3xl font-bold mb-1">{current.disfluencies_per_minute.toFixed(1)}</p>
                        <p className="text-xs text-slate-500">vs {previous.disfluencies_per_minute.toFixed(1)}/min anterior</p>
                        <p className={`text-sm mt-2 ${disfComp.color}`}>
                            {disfComp.status === "mejor" && "Mejoraste - menos muletillas"}
                            {disfComp.status === "peor" && "Aumentaron las disfluencias"}
                            {disfComp.status === "igual" && "Fluidez similar"}
                        </p>
                    </div>
                </div>
            </div>

            {allRecordings && allRecordings.length > 2 && (
                <div>
                    <h3 className="text-lg font-semibold text-sky-400 mb-4 flex items-center">
                        <FaHistory className="mr-2" /> Comparación con tu promedio histórico
                    </h3>
                    
                    <div className="bg-slate-900 p-4 rounded-lg">
                        <p className="text-sm text-slate-400 mb-3">Basado en {allRecordings.length} grabaciones</p>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Ritmo</p>
                                <p className="text-2xl font-bold">
                                    {current.pace > avgPace ? (
                                        <span className={current.pace - avgPace > 10 ? "text-yellow-400" : "text-green-400"}>
                                            +{(current.pace - avgPace).toFixed(0)}
                                        </span>
                                    ) : (
                                        <span className={avgPace - current.pace > 10 ? "text-yellow-400" : "text-green-400"}>
                                            {(current.pace - avgPace).toFixed(0)}
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-slate-500">vs promedio {avgPace.toFixed(0)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Tono</p>
                                <p className="text-2xl font-bold">
                                    {current.pitch_variation > avgPitch ? (
                                        <span className="text-green-400">+{(current.pitch_variation - avgPitch).toFixed(0)}</span>
                                    ) : (
                                        <span className="text-red-400">{(current.pitch_variation - avgPitch).toFixed(0)}</span>
                                    )}
                                </p>
                                <p className="text-xs text-slate-500">vs promedio {avgPitch.toFixed(0)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Disfluencias</p>
                                <p className="text-2xl font-bold">
                                    {current.disfluencies_per_minute < avgDisf ? (
                                        <span className="text-green-400">{(current.disfluencies_per_minute - avgDisf).toFixed(1)}</span>
                                    ) : (
                                        <span className="text-red-400">+{(current.disfluencies_per_minute - avgDisf).toFixed(1)}</span>
                                    )}
                                </p>
                                <p className="text-xs text-slate-500">vs promedio {avgDisf.toFixed(1)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
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

const ResultsUI = ({ result, sessionData, onReset }) => {
    const [activeTab, setActiveTab] = useState('Resumen');
    const recordings = sessionData?.recordings || [];
    const sortedRecordings = [...recordings].sort((a, b) => b.timestamp - a.timestamp);
    const previousRecording = sortedRecordings.length > 1 ? sortedRecordings[1] : null;

    const evaluations = result?.evaluations || {
        pace: "N/A",
        pitch: "N/A",
        hedges: "N/A"
    };

    const strengths = result?.feedback?.strengths || [];
    const improvements = result?.feedback?.improvements || [];
    const disfluencyDetails = result?.details ? Object.entries(result.details) : [];

    if (!result || result.error) {
        return (
            <div className="text-center">
                <h2 className="text-2xl text-red-400 mb-4">Error en el Análisis</h2>
                <p className="text-slate-400 mb-8">
                    {result?.message || "No pudimos procesar tu audio. Verifica tu conexión o la terminal del servidor."}
                </p>
                <button 
                    onClick={onReset} 
                    className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 rounded-full"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    const currentMetrics = {
        pace: result.pace || 0,
        pitch_variation: result.pitch_variation || 0,
        disfluencies_per_minute: result.disfluencies_per_minute || 0
    };

    // Prepare chart data
    const chartData = sortedRecordings.length >= 2 
        ? [...sortedRecordings]
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((r, index) => ({
                session: `#${index + 1}`,
                pace: Math.round(r.pace),
                pitch: Math.round(r.pitch_variation),
                disfluencies: parseFloat(r.disfluencies_per_minute.toFixed(1))
            }))
        : null;

    return (
        <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
        >
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-sky-400 text-center">
                Tu Reporte de Convicción
            </h2>

            <div className="flex justify-center border-b border-slate-700 mb-6 flex-wrap">
                <TabButton 
                    name="Resumen" 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    icon={<FaBrain />} 
                />
                <TabButton 
                    name="Métricas" 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    icon={<FaTachometerAlt />} 
                />
                <TabButton 
                    name="Progreso" 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                    icon={<FaHistory />} 
                />
            </div>

            {activeTab === 'Resumen' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {result.insights && (
                        <div className="p-4 bg-slate-900 rounded-lg mb-6">
                            <h4 className="font-semibold text-sky-400 mb-2">
                                Análisis Personalizado
                            </h4>
                            <p className="text-slate-300 mb-2 whitespace-pre-line">
                                {result.insights.summary}
                            </p>
                            {result.insights.actions && result.insights.actions.length > 0 && (
                                <div className="mb-2">
                                    <h5 className="text-sm text-slate-400 mb-1">
                                        Acciones recomendadas
                                    </h5>
                                    <ul className="list-disc pl-5 text-slate-300">
                                        {result.insights.actions.map((a, i) => (
                                            <li key={i}>{a}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {result.insights.exercise && (
                                <div className="mb-2">
                                    <h5 className="text-sm text-slate-400 mb-1">
                                        Ejercicio sugerido
                                    </h5>
                                    <p className="text-slate-300">
                                        {result.insights.exercise}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h4 className="font-semibold text-slate-400 mb-2 flex items-center">
                                <FaCheckCircle className="mr-2 text-green-400"/> 
                                Puntos Fuertes
                            </h4>
                            <div className="p-4 bg-slate-800 rounded-lg space-y-2 text-sm min-h-[100px]">
                                {strengths.length > 0 ? (
                                    strengths.map((s, i) => <p key={i}>▸ {s}</p>)
                                ) : (
                                    <p className="text-slate-500">
                                        Sigue practicando para identificar tus fortalezas.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-400 mb-2 flex items-center">
                                <FaExclamationTriangle className="mr-2 text-yellow-400"/> 
                                Áreas de Mejora
                            </h4>
                            <div className="p-4 bg-slate-800 rounded-lg space-y-2 text-sm min-h-[100px]">
                                {improvements.length > 0 ? (
                                    improvements.map((imp, i) => <p key={i}>▸ {imp}</p>)
                                ) : (
                                    <p className="text-slate-500">
                                        Gran trabajo No hemos encontrado áreas críticas para mejorar.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'Métricas' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-6">
                        <MetricCard
                            icon={<FaTachometerAlt className="text-green-400"/>}
                            title="RITMO"
                            value={Math.round(result.pace || 0)}
                            unit="palabras / min"
                            evaluation={evaluations.pace}
                            tooltipText="El ritmo ideal para un discurso claro está entre 130 y 170 palabras por minuto."
                        />
                        <MetricCard
                            icon={<FaSmile className="text-purple-400"/>}
                            title="TONO"
                            value={result.pitch_variation || 0}
                            unit="variación"
                            evaluation={evaluations.pitch}
                            tooltipText="Una mayor variación de tono hace tu discurso más dinámico. Un valor bajo indica monotonía."
                        />
                        <MetricCard
                            icon={<FaQuestionCircle className="text-red-400"/>}
                            title="PALABRAS DE DUDA"
                            value={result.hedge_count || 0}
                            evaluation={evaluations.hedges}
                            tooltipText="Palabras como 'creo que' o 'tal vez' que debilitan tu mensaje. Un orador seguro las evita."
                        />
                    </div>

                    {/* Resumen de disfluencias */}
                    <div className="bg-slate-900 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-sky-400 mb-3 flex items-center">
                            <span className="mr-2 w-5 h-5 flex items-center justify-center bg-sky-500/20 rounded border border-sky-500/40">
                                <svg className="w-3 h-3 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                </svg>
                            </span>
                            Resumen de Disfluencias
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-3xl font-bold text-red-400">{result.disfluencies_per_minute?.toFixed(1) || 0}</p>
                                <p className="text-xs text-slate-400">Por minuto</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-orange-400">
                                    {disfluencyDetails.reduce((sum, [, details]) => 
                                        sum + Object.values(details).reduce((a, b) => a + b, 0), 0
                                    )}
                                </p>
                                <p className="text-xs text-slate-400">Total detectadas</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-yellow-400">{result.total_words || 0}</p>
                                <p className="text-xs text-slate-400">Palabras totales</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-green-400">
                                    {result.total_words > 0 
                                        ? ((disfluencyDetails.reduce((sum, [, details]) => 
                                            sum + Object.values(details).reduce((a, b) => a + b, 0), 0
                                        ) / result.total_words) * 100).toFixed(1)
                                        : 0
                                    }%
                                </p>
                                <p className="text-xs text-slate-400">Ratio disfluencias</p>
                            </div>
                        </div>
                    </div>
                    
                    {chartData && chartData.length >= 2 && (
                        <div className="space-y-6 mb-6">
                            <IndividualChart
                                data={chartData}
                                dataKey="pace"
                                title="Evolución del Ritmo"
                                color="#0ea5e9"
                                idealRange={[130, 170]}
                                unit="ppm"
                                yAxisDomain={[0, 250]}
                            />
                            
                            <IndividualChart
                                data={chartData}
                                dataKey="pitch"
                                title="Evolución del Tono"
                                color="#a78bfa"
                                idealRange={[20, 50]}
                                unit=""
                                yAxisDomain={[0, 'auto']}
                            />
                            
                            <IndividualChart
                                data={chartData}
                                dataKey="disfluencies"
                                title="Evolución de Disfluencias"
                                color="#f87171"
                                idealRange={null}
                                unit="/min"
                                yAxisDomain={[0, 'auto']}
                            />
                        </div>
                    )}
                    
                    {disfluencyDetails.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-slate-400 mb-2">
                                Análisis de Disfluencias:
                            </h4>
                            <div className="p-4 bg-slate-800 rounded-lg">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {disfluencyDetails.map(([category, details]) => (
                                        <div key={category}>
                                            <h5 className="text-sm font-bold text-sky-400 mb-2">
                                                {category}
                                            </h5>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(details).map(([word, count]) => (
                                                    <div 
                                                        key={word} 
                                                        className="bg-slate-700 p-2 rounded-md text-center flex-shrink-0"
                                                    >
                                                        <p className="text-lg font-bold">{count}</p>
                                                        <p className="text-xs text-slate-400">
                                                            &quot;{word}&quot;
                                                        </p>
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 className="font-bold text-lg mb-4">Tu Progreso en esta Sesión</h3>
                    
                    <ProgressComparison 
                        current={currentMetrics}
                        previous={previousRecording}
                        allRecordings={sortedRecordings}
                    />
                </motion.div>
            )}

            <div className="text-center mt-8">
                <button 
                    onClick={onReset} 
                    className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 rounded-full transition-transform duration-300 hover:scale-105"
                >
                    Analizar de Nuevo
                </button>
            </div>
        </motion.div>
    );
};

export default ResultsUI;