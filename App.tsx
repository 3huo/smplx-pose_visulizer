
import React, { useState, useCallback } from 'react';
import Viewport from './components/Viewport';
import Sidebar from './components/Sidebar';
import { SMPLXParameters, INITIAL_SMPLX, CameraConfig, generateRandomSMPLX } from './types';
import { generatePoseFromText } from './services/geminiService';

const App: React.FC = () => {
  const [params, setParams] = useState<SMPLXParameters>(INITIAL_SMPLX);
  const [loading, setLoading] = useState(false);
  const [cameraConfig, setCameraConfig] = useState<CameraConfig>({
    position: { x: 0, y: 1.5, z: 4 },
    target: { x: 0, y: 1, z: 0 },
    fov: 45
  });

  const handleRandomize = useCallback(() => {
    setParams(generateRandomSMPLX());
  }, []);

  const handleFileUpload = useCallback((data: Partial<SMPLXParameters>) => {
    setParams(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  const handleAIPose = async (prompt: string) => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const aiResult = await generatePoseFromText(prompt);
      if (aiResult.body_pose) {
        setParams(prev => ({
          ...prev,
          body_pose: aiResult.body_pose!,
          expression: aiResult.expression || prev.expression
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-[#0a0a0a]">
      <Sidebar 
        params={params} 
        onParamsChange={setParams} 
        onRandomize={handleRandomize}
        onAIPose={handleAIPose}
        onFileUpload={handleFileUpload}
        cameraConfig={cameraConfig}
        onCameraChange={setCameraConfig}
      />

      <main className="flex-1 relative h-full">
        {/* 确保 Viewport 填满 main 区域 */}
        <div className="absolute inset-0">
          <Viewport params={params} cameraConfig={cameraConfig} />
        </div>

        {/* Overlay HUD */}
        <div className="absolute top-6 right-6 pointer-events-none z-10">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex gap-6 shadow-2xl">
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Mode</p>
              <p className="text-xl font-mono text-emerald-400 uppercase">GPU-LBS</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Skinning</p>
              <p className="text-xl font-mono text-blue-400">Linear</p>
            </div>
          </div>
        </div>

        {/* AI Loading State */}
        {loading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black/80 border border-white/10 p-8 rounded-3xl flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-sm font-medium">Gemini Thinking...</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-6 left-6 right-6 pointer-events-none z-10">
           <div className="bg-black/40 backdrop-blur-lg border border-white/5 p-4 rounded-xl text-[10px] text-gray-400 max-w-sm leading-relaxed shadow-xl">
             <p><span className="text-emerald-500 font-bold">LBS IMPLEMENTATION:</span> 姿态参数（Axis-Angle）在 CPU 层级被转换为四元数并应用至 <code className="text-gray-200">THREE.Bone</code>。蒙皮变形则由 GPU 顶点的 <code className="text-gray-200">skinIndex</code> 与 <code className="text-gray-200">skinWeight</code> 驱动。</p>
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
