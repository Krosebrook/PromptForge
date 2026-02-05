
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { 
  Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge,
  Handle, Position, Node, Edge, Connection, MarkerType
} from 'reactflow';
import { GoogleGenAI } from "@google/genai";
import { PromptItem, PipelineConfig } from './types';
import { 
  Play, Save, Plus, X, Loader2, MessageSquare, AlertCircle, 
  CheckCircle2, ArrowRight, Wand2, Terminal, MousePointer2 
} from 'lucide-react';

interface PipelineEditorProps {
  pipeline: PipelineConfig;
  allPrompts: PromptItem[];
  onSave: (pipeline: PipelineConfig) => void;
  onClose: () => void;
}

const InputNode = ({ data }: { data: any }) => {
  return (
    <div className="w-[280px] bg-[#0f172a] border-2 border-emerald-500/50 rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-emerald-500/10 p-3 border-b border-emerald-500/20 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
           <Terminal size={12} /> System Input
        </span>
      </div>
      <div className="p-3">
         <textarea 
            className="w-full bg-[#1e293b] text-xs text-white p-3 rounded-lg outline-none border border-transparent focus:border-emerald-500 resize-y h-[80px]" 
            placeholder="Enter initial prompt data..."
            value={data.value}
            onChange={(e) => data.onChange(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()} 
         />
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-2 border-[#0f172a]" />
    </div>
  );
};

const PersonaNode = ({ data }: { data: any }) => {
  return (
    <div className={`w-[300px] rounded-2xl shadow-2xl transition-all border-2 ${data.status === 'running' ? 'border-amber-400 ring-2 ring-amber-400/20' : data.status === 'completed' ? 'border-blue-500' : 'border-[#334155] bg-[#1e293b]'}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-[#0f172a]" />
      
      <div className="bg-[#0f172a] p-3 flex items-center justify-between rounded-t-xl border-b border-[#334155]">
         <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${data.status === 'completed' ? 'bg-blue-500 text-white' : 'bg-[#334155] text-slate-400'}`}>
               <Wand2 size={12} />
            </div>
            <span className="text-xs font-bold text-white truncate max-w-[180px]">{data.label}</span>
         </div>
         {data.status === 'running' && <Loader2 size={14} className="text-amber-400 animate-spin" />}
         {data.status === 'completed' && <CheckCircle2 size={14} className="text-blue-400" />}
         {data.status === 'error' && <AlertCircle size={14} className="text-red-400" />}
      </div>
      
      <div className="p-4 bg-[#1e293b] space-y-3 rounded-b-xl">
         <div className="text-[10px] text-slate-400 line-clamp-2 italic border-l-2 border-slate-600 pl-2">
            "{data.promptPreview}"
         </div>
         
         {data.output && (
            <div className="bg-[#0f172a] rounded-lg p-2 border border-[#334155] mt-2">
               <div className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Output</div>
               <div className="text-[10px] text-slate-300 line-clamp-4 font-mono leading-relaxed">
                  {data.output}
               </div>
            </div>
         )}
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500 border-2 border-[#0f172a]" />
    </div>
  );
};

const nodeTypes = {
  input: InputNode,
  persona: PersonaNode
};

export const PipelineEditor: React.FC<PipelineEditorProps> = ({ pipeline, allPrompts, onSave, onClose }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(pipeline.flowState.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(pipeline.flowState.edges || []);
  const [pipelineName, setPipelineName] = useState(pipeline.name);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [inputValue, setInputValue] = useState(nodes.find(n => n.type === 'input')?.data?.value || '');

  // Sync Input Value to Node Data
  useEffect(() => {
     setNodes(nds => nds.map(node => {
        if (node.type === 'input') {
           return { ...node, data: { ...node.data, value: inputValue, onChange: setInputValue } };
        }
        return node;
     }));
  }, [inputValue, setNodes]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), [setEdges]);

  const addPersonaNode = (prompt: PromptItem) => {
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'persona',
      position: { x: 400 + Math.random() * 50, y: 200 + Math.random() * 50 },
      data: { 
        label: prompt.act, 
        promptId: prompt.id,
        promptPreview: prompt.prompt,
        status: 'idle',
        output: ''
      }
    };
    setNodes((nds) => [...nds, newNode]);
    setIsAddMenuOpen(false);
  };

  const addInputNode = () => {
    if (nodes.some(n => n.type === 'input')) return; // Limit to 1 input for simplicity
    const newNode: Node = {
       id: 'root-input',
       type: 'input',
       position: { x: 50, y: 250 },
       data: { value: inputValue, onChange: setInputValue }
    };
    setNodes((nds) => [...nds, newNode]);
    setIsAddMenuOpen(false);
  };

  const executePipeline = async () => {
    setIsExecuting(true);
    
    // Reset statuses
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle', output: '' } })));

    // Topological Sort / Execution Order
    // Simple approach: BFS from input node
    // 1. Find root input
    const inputNode = nodes.find(n => n.type === 'input');
    if (!inputNode) {
       setIsExecuting(false);
       return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Store outputs in a map
    const executionResults = new Map<string, string>();
    executionResults.set(inputNode.id, inputValue);

    // Queue for BFS
    const queue = [inputNode.id];
    const visited = new Set<string>();

    while (queue.length > 0) {
       const currentId = queue.shift()!;
       if (visited.has(currentId)) continue;
       visited.add(currentId);

       // Find outgoing edges
       const outgoing = edges.filter(e => e.source === currentId);
       
       for (const edge of outgoing) {
          const targetId = edge.target;
          const targetNode = nodes.find(n => n.id === targetId);
          if (!targetNode || targetNode.type !== 'persona') continue;

          // Check if all inputs for target are ready
          const incomingEdges = edges.filter(e => e.target === targetId);
          const allInputsReady = incomingEdges.every(e => executionResults.has(e.source));

          if (allInputsReady && !executionResults.has(targetId)) {
             // Execute Node
             setNodes(nds => nds.map(n => n.id === targetId ? { ...n, data: { ...n.data, status: 'running' } } : n));
             
             try {
                // Construct Context from Inputs
                const inputContexts = incomingEdges.map(e => `[INPUT FROM ${nodes.find(n => n.id === e.source)?.data.label || 'SYSTEM'}]:\n${executionResults.get(e.source)}`).join('\n\n');
                
                const promptText = `${targetNode.data.promptPreview}\n\n${inputContexts}`;
                
                // Call Gemini
                const result = await ai.models.generateContent({
                   model: 'gemini-3-flash-preview',
                   contents: promptText
                });
                
                const output = result.text || '';
                executionResults.set(targetId, output);
                
                setNodes(nds => nds.map(n => n.id === targetId ? { ...n, data: { ...n.data, status: 'completed', output } } : n));
                
                queue.push(targetId);
             } catch (e) {
                console.error(e);
                setNodes(nds => nds.map(n => n.id === targetId ? { ...n, data: { ...n.data, status: 'error' } } : n));
             }
          }
       }
    }

    setIsExecuting(false);
  };

  const handleSave = () => {
     onSave({
        ...pipeline,
        name: pipelineName,
        flowState: { nodes, edges },
        updatedAt: Date.now()
     });
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#020617] relative">
      <div className="h-16 border-b border-[#1e293b] flex items-center justify-between px-6 bg-[#0f172a] shrink-0 z-10">
         <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#1e293b] text-slate-400"><X size={20} /></button>
            <input 
               className="bg-transparent text-white font-bold text-lg outline-none placeholder:text-slate-600" 
               value={pipelineName}
               onChange={(e) => setPipelineName(e.target.value)}
               placeholder="Untitled Pipeline"
            />
         </div>
         <div className="flex items-center gap-3">
            <button 
               onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} 
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isAddMenuOpen ? 'bg-indigo-500 text-white' : 'bg-[#1e293b] text-slate-400 hover:text-white'}`}
            >
               <Plus size={14} /> Add Node
            </button>
            <button 
               onClick={executePipeline} 
               disabled={isExecuting}
               className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
            >
               {isExecuting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />} Run Trace
            </button>
            <button onClick={handleSave} className="p-2.5 rounded-lg bg-[#1e293b] text-indigo-400 hover:text-white transition-all"><Save size={18} /></button>
         </div>
      </div>

      <div className="flex-1 relative">
         <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-[#020617]"
         >
            <Background color="#1e293b" gap={20} />
            <Controls className="bg-[#1e293b] border-[#334155] fill-slate-400" />
            <MiniMap className="bg-[#0f172a] border-[#1e293b]" nodeColor="#334155" />
         </ReactFlow>

         {/* Add Node Menu Overlay */}
         {isAddMenuOpen && (
            <div className="absolute top-4 right-4 w-[300px] bg-[#0f172a] border border-[#334155] rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 z-20 flex flex-col gap-2 max-h-[80%]">
               <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Node Library</h4>
               
               {!nodes.some(n => n.type === 'input') && (
                  <button onClick={addInputNode} className="flex items-center gap-3 p-3 rounded-lg bg-[#1e293b] hover:bg-emerald-500/10 hover:border-emerald-500 border border-transparent transition-all group text-left">
                     <div className="p-2 rounded bg-[#0f172a] text-emerald-500"><Terminal size={16} /></div>
                     <div>
                        <div className="text-sm font-bold text-white">System Input</div>
                        <div className="text-[10px] text-slate-400">Initial data entry point</div>
                     </div>
                  </button>
               )}
               
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mt-2 pt-2 border-t border-[#1e293b]">
                  {allPrompts.map(prompt => (
                     <button key={prompt.id} onClick={() => addPersonaNode(prompt)} className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#1e293b] hover:bg-blue-500/10 hover:border-blue-500 border border-transparent transition-all group text-left">
                        <div className="p-2 rounded bg-[#0f172a] text-blue-400"><Wand2 size={16} /></div>
                        <div className="min-w-0">
                           <div className="text-sm font-bold text-white truncate">{prompt.act}</div>
                           <div className="text-[10px] text-slate-400 truncate">{prompt.category}</div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>
         )}
      </div>
    </div>
  );
};
