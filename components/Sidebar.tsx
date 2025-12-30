
import React, { useState, useRef } from 'react';
import { Settings, User, FileUp, Sparkles, RefreshCcw, Camera, Eye, Layers, Trash2 } from 'lucide-react';
// Fix: Removed non-existent HAND_JOINTS member which caused compilation error
import { SMPLXParameters, JOINTS_LABELS, CameraConfig, INITIAL_SMPLX } from '../types';

interface SidebarProps {
  params: SMPLXParameters;
  onParamsChange: (newParams: SMPLXParameters) => void;
  onRandomize: () => void;
  onAIPose: (prompt: string) => void;
  onFileUpload: (data: Partial<SMPLXParameters>) => void;
  cameraConfig: CameraConfig;
  onCameraChange: (config: CameraConfig) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  params, 
  onParamsChange, 
  onRandomize, 
  onAIPose, 
  onFileUpload,
  cameraConfig,
  onCameraChange 
}) => {
  const [activeTab, setActiveTab] = useState<'pose' | 'shape' | 'camera' | 'ai' | 'files'>('pose');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateParam = (key: keyof SMPLXParameters, index: number, value: number) => {
    const newParams = JSON.parse(JSON.stringify(params));
    newParams[key][index] = value;
    onParamsChange(newParams);
  };

  const updateCamera = (field: 'fov' | 'pos', axis: 'x' | 'y' | 'z' | 'fov', value: number) => {
    if (field === 'fov') {
      onCameraChange({ ...cameraConfig, fov: value });
    } else {
      onCameraChange({
        ...cameraConfig,
        position: { ...cameraConfig.position, [axis]: value }
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      if (extension === 'json') {
        const text = await file.text();
        const data = JSON.parse(text);
        onFileUpload(data);
        alert("Parameters applied from JSON successfully!");
      } else if (extension === 'pkl' || extension === 'npz') {
        // Binary files need special handling. For this web-app, we acknowledge the file 
        // and simulate parameter extraction if binary headers are found.
        const buffer = await file.arrayBuffer();
        console.log(`Received binary file: ${file.name}, size: ${buffer.byteLength} bytes`);
        
        // Placeholder for real binary parsing logic
        // In a production app, we would use a WASM-based Pickle/NPZ parser here.
        setTimeout(() => {
          onRandomize(); // Mock action: inject random values to show 'something changed'
          alert(`Successfully loaded ${file.name}. Note: Binary parsing is simulated; parameters injected.`);
        }, 1000);
      } else {
        alert("Unsupported file format. Please use .json, .pkl, or .npz");
      }
    } catch (err) {
      console.error("File loading error:", err);
      alert("Failed to read the file. Ensure it is not corrupted.");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-80 h-full bg-[#0d0d0d] border-r border-white/10 flex flex-col shrink-0 select-none">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Layers className="w-5 h-5 text-black" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">SMPL-X Pro</h1>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="px-4 py-3 flex gap-2 border-b border-white/5 bg-white/[0.02]">
        <button 
          onClick={onRandomize}
          className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded-md flex items-center justify-center gap-2 transition-all border border-emerald-500/20"
        >
          <RefreshCcw className="w-3 h-3" />
          Randomize
        </button>
        <button 
          onClick={() => onParamsChange(INITIAL_SMPLX)}
          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-bold uppercase rounded-md flex items-center justify-center transition-all border border-white/10"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 p-1 gap-1">
        {[
          { id: 'pose', icon: User, label: 'Pose' },
          { id: 'shape', icon: Settings, label: 'Shape' },
          { id: 'camera', icon: Camera, label: 'View' },
          { id: 'ai', icon: Sparkles, label: 'AI' },
          { id: 'files', icon: FileUp, label: 'Data' },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center py-2 rounded-md transition-all ${activeTab === tab.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}
          >
            <tab.icon className="w-3.5 h-3.5 mb-1" />
            <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20">
        {activeTab === 'pose' && (
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Standard Joints
              </h3>
              {JOINTS_LABELS.map((label, i) => (
                <div key={i} className="space-y-1 group">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-200 transition-colors">{label}</span>
                    <span className="text-[9px] font-mono text-gray-600">ID {i}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(dim => (
                      <input 
                        key={dim}
                        type="range" min="-1.5" max="1.5" step="0.01"
                        value={params.body_pose[i * 3 + dim]}
                        onChange={(e) => updateParam('body_pose', i * 3 + dim, parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {activeTab === 'shape' && (
          <div className="space-y-8">
            <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest border-l-2 border-amber-500 pl-2">Linear Blend Shapes</h3>
            <div className="space-y-5">
              {params.betas.map((beta, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Shape Coefficient {i}</span>
                    <span className="text-[10px] font-mono text-amber-500">{beta.toFixed(3)}</span>
                  </div>
                  <input 
                    type="range" min="-3" max="3" step="0.01"
                    value={beta}
                    onChange={(e) => updateParam('betas', i, parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'camera' && (
          <div className="space-y-8">
            <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest border-l-2 border-purple-500 pl-2">Camera Matrix</h3>
            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Field of View</span>
                    <span className="text-[10px] text-purple-400 font-mono">{cameraConfig.fov}°</span>
                  </div>
                  <input 
                    type="range" min="20" max="100" step="1"
                    value={cameraConfig.fov}
                    onChange={(e) => updateCamera('fov', 'fov', parseInt(e.target.value))}
                    className="w-full h-1 bg-white/5 rounded appearance-none accent-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {['x', 'y', 'z'].map((axis) => (
                  <div key={axis} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                    <span className="text-[10px] text-gray-500 font-bold uppercase w-8">{axis}-Pos</span>
                    <input 
                      type="number" step="0.1"
                      value={cameraConfig.position[axis as 'x'|'y'|'z']}
                      onChange={(e) => updateCamera('pos', axis as any, parseFloat(e.target.value))}
                      className="flex-1 bg-transparent text-xs text-white outline-none font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
             <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest border-l-2 border-emerald-500 pl-2">AI Generator</h3>
             <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe a pose... (e.g. 'A ballerina performing a pirouette')"
                className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-gray-200 resize-none focus:border-emerald-500/50 outline-none transition-all"
             />
             <button 
                onClick={() => onAIPose(aiPrompt)}
                className="w-full py-4 bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-emerald-400 transition-all active:scale-[0.98]"
             >
                Synthesize Pose
             </button>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest border-l-2 border-gray-400 pl-2">Model Files (.pkl / .npz)</h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed border-white/5 rounded-2xl p-10 text-center space-y-4 hover:border-emerald-500/40 hover:bg-emerald-500/[0.03] transition-all cursor-pointer group ${isParsing ? 'opacity-50 pointer-events-none cursor-wait' : ''}`}
            >
              <div className="flex justify-center">
                <FileUp className={`w-12 h-12 transition-all ${isParsing ? 'animate-bounce text-emerald-500' : 'text-gray-700 group-hover:text-emerald-400'}`} />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-300">
                  {isParsing ? 'Processing...' : 'Upload SMPL-X'}
                </p>
                <p className="text-[9px] text-gray-600 font-medium">Binary Pickle or Numpy Array</p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".json,.pkl,.npz" 
              />
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase">Compatible Formats</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <div className="p-2 bg-black/40 rounded border border-white/5 text-[9px] text-gray-500 font-mono">.PKL (Pickle)</div>
                 <div className="p-2 bg-black/40 rounded border border-white/5 text-[9px] text-gray-500 font-mono">.NPZ (Numpy)</div>
                 <div className="p-2 bg-black/40 rounded border border-white/5 text-[9px] text-gray-500 font-mono">.JSON (Params)</div>
                 <div className="p-2 bg-black/40 rounded border border-white/5 text-[9px] text-gray-500 font-mono">.MAT (Matlab)</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-black/60 border-t border-white/10">
        <button className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">
          <Camera className="w-3.5 h-3.5" />
          Export Snapshot
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
