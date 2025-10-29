import React, { useState, useContext } from 'react';
import Card from '../components/ui/Card';
import { Bot, Cpu, Sun, BarChart, Loader, AlertTriangle } from 'lucide-react';
import { runVibrationDiagnosis, runSolarForecast, runMotorFaultDiagnosis } from '../services/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { AppContext } from '../contexts/AppContext';

const ModelInfo: React.FC<{ title: string, description: string, schema: string[] }> = ({ title, description, schema }) => (
    <div>
        <h4 className="text-md font-semibold mb-1 text-gray-800 dark:text-gray-200">{title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{description}</p>
        <div className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md border border-gray-200 dark:border-gray-700">
            <h5 className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">INPUT SCHEMA</h5>
            <ul className="list-disc list-inside space-y-1">
                {schema.map((item, i) => <li key={i} className="text-xs text-gray-500 dark:text-gray-400 font-mono">{item}</li>)}
            </ul>
        </div>
    </div>
);

const PredictionResult: React.FC<{ prediction: string | number | null; confidence?: number; isError?: boolean }> = ({ prediction, confidence, isError }) => {
    if (isError) {
        return <p className="text-red-500 text-sm font-semibold mt-4">Prediction failed. Please try again.</p>
    }
    if (prediction === null) return null;
    
    let resultColor = 'text-green-500';
    if (typeof prediction === 'string' && prediction.toLowerCase() !== 'normal' && prediction.toLowerCase() !== 'healthy') {
        resultColor = 'text-yellow-500';
    }

    return (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-md">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Result:</p>
            <p className={`text-lg font-bold ${resultColor}`}>{prediction}</p>
            {confidence && <p className="text-xs text-gray-500 dark:text-gray-400">Confidence: {(confidence * 100).toFixed(1)}%</p>}
        </div>
    )
}

const PredictionsPage: React.FC = () => {
    const { theme } = useContext(AppContext)!;
    const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
    const textColor = theme === 'dark' ? '#9ca3af' : '#6b7281';

    // State for Model 1
    const [vibrationResult, setVibrationResult] = useState<{ prediction: string, confidence: number } | null>(null);
    const [isVibrationLoading, setIsVibrationLoading] = useState(false);
    const [vibrationError, setVibrationError] = useState(false);

    // State for Model 2
    const [solarResult, setSolarResult] = useState<{ time: string, power: number }[] | null>(null);
    const [isSolarLoading, setIsSolarLoading] = useState(false);
    const [solarError, setSolarError] = useState(false);

    // State for Model 3
    const [faultResult, setFaultResult] = useState<{ prediction: string, confidence: number } | null>(null);
    const [isFaultLoading, setIsFaultLoading] = useState(false);
    const [faultError, setFaultError] = useState(false);
    
    const handleVibration = async () => {
        setIsVibrationLoading(true);
        setVibrationResult(null);
        setVibrationError(false);
        try {
            const result = await runVibrationDiagnosis();
            setVibrationResult(result);
        } catch (e) { setVibrationError(true); } 
        finally { setIsVibrationLoading(false); }
    };

    const handleSolar = async () => {
        setIsSolarLoading(true);
        setSolarResult(null);
        setSolarError(false);
        try {
            const { prediction } = await runSolarForecast();
            setSolarResult(prediction.map((p, i) => ({ time: `${i}:00`, power: p })));
        } catch (e) { setSolarError(true); }
        finally { setIsSolarLoading(false); }
    };
    
    const handleFault = async () => {
        setIsFaultLoading(true);
        setFaultResult(null);
        setFaultError(false);
        try {
            const result = await runMotorFaultDiagnosis();
            setFaultResult(result);
        } catch (e) { setFaultError(true); }
        finally { setIsFaultLoading(false); }
    };

    return (
        <div className="space-y-6">
            <Card title="AI Prediction Models">
                <p className="text-gray-500 dark:text-gray-400 -mt-2">
                    Run on-demand diagnostics and forecasts using pre-trained machine learning models. These are mock endpoints that simulate real model inference.
                </p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Model 1: Vibration Diagnosis */}
                <Card>
                    <div className="flex items-center text-lg font-semibold mb-4">
                        <Cpu className="w-6 h-6 mr-3 text-blue-500"/>
                        Motor Vibration Diagnosis
                    </div>
                    <ModelInfo 
                        title="RandomForest Classifier"
                        description="Diagnoses motor health based on 3-axis vibration data features from a time window."
                        schema={['24 features (mean, std, rms, etc.)', 'Scaled with vibration_scaler.joblib', 'Decoded with vibration_label_encoder.joblib']}
                    />
                    <button onClick={handleVibration} disabled={isVibrationLoading} className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold disabled:bg-blue-800">
                        {isVibrationLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Diagnose Vibration'}
                    </button>
                    <PredictionResult prediction={vibrationResult?.prediction ?? null} confidence={vibrationResult?.confidence} isError={vibrationError} />
                </Card>
                
                 {/* Model 3: Multi-Sensor Fault Diagnosis */}
                 <Card>
                    <div className="flex items-center text-lg font-semibold mb-4">
                        <Bot className="w-6 h-6 mr-3 text-purple-500"/>
                        Motor Fault Diagnosis (Multi-Sensor)
                    </div>
                     <ModelInfo 
                        title="XGBoost Classifier"
                        description="Identifies specific motor faults using features from accelerometers, microphone, and temperature sensors."
                        schema={['40 features from multiple sensors', 'Scaled with corresponding scaler.joblib', 'Decoded with label_encoder.joblib']}
                    />
                     <button onClick={handleFault} disabled={isFaultLoading} className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-semibold disabled:bg-purple-800">
                        {isFaultLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Run Multi-Sensor Diagnosis'}
                    </button>
                    <PredictionResult prediction={faultResult?.prediction ?? null} confidence={faultResult?.confidence} isError={faultError} />
                </Card>

                {/* Model 2: Solar Forecast */}
                <Card className="lg:col-span-2">
                    <div className="flex items-center text-lg font-semibold mb-4">
                        <Sun className="w-6 h-6 mr-3 text-orange-500"/>
                        Solar Power Forecast (LSTM)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <ModelInfo 
                                title="LSTM Neural Network"
                                description="Forecasts AC power output based on the last 6 hours (24 timesteps) of irradiation and power data."
                                schema={['Shape: (n, 24, 2) for (IRRADIATION, AC_POWER)', 'Scaled with lstm_solar_scaler.joblib', 'Inverse transformed for kW output']}
                            />
                             <button onClick={handleSolar} disabled={isSolarLoading} className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-semibold disabled:bg-orange-700">
                                {isSolarLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Forecast Power Output (24h)'}
                            </button>
                        </div>
                        <div className="h-64">
                            {isSolarLoading && <div className="flex items-center justify-center h-full"><Loader className="w-8 h-8 animate-spin text-orange-500" /></div>}
                            {solarError && <div className="flex items-center justify-center h-full text-red-500"><AlertTriangle className="w-6 h-6 mr-2"/> Failed to load forecast.</div>}
                            {solarResult && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={solarResult}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
                                        <XAxis dataKey="time" stroke={textColor} tick={{ fontSize: 12 }} interval={3}/>
                                        <YAxis stroke={textColor} tick={{ fontSize: 12 }} label={{ value: 'kW', angle: -90, position: 'insideLeft', fill: textColor, fontSize: 12 }}/>
                                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', border: `1px solid ${gridColor}` }}/>
                                        <Line type="monotone" dataKey="power" stroke="#f97316" dot={false} strokeWidth={2}/>
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                            {!isSolarLoading && !solarResult && !solarError && (
                                 <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                                    <BarChart className="w-12 h-12 mb-2"/>
                                    <p>Forecast chart will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default PredictionsPage;
