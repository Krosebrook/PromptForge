
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge,
  Handle, Position, Node, Edge, Connection, MarkerType
} from 'reactflow';
import { GoogleGenAI } from "@google/genai";
import { PromptItem, PipelineConfig } from './types';
import { 
  Play, Save, Plus, X, Loader2, AlertCircle, 
  CheckCircle2, Wand2, Terminal, ChevronDown, ChevronRight, Eraser,
  MessageSquare, Square, PenTool, Edit3
} from 'lucide-react';

interface PipelineEditorProps {
  pipeline: PipelineConfig;
  allPrompts: PromptItem[];
  onSave: (pipeline: PipelineConfig) => void;
  onClose: () => void;
}

// --- Custom Node Components ---

const InputNode = ({ data, id }: { data: any, id: string }) => {
  return (
    <div className="w-[320px] bg-[#0f172a] border-2 border-emerald-500/50 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 group focus-within:border-emerald-500 transition-colors">
      <div className="bg-emerald-500/10 p-3 border-b border-emerald-500/20 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
           <Terminal size={12} /> System Input
        </span>
      </div>
      <div className="p-4">
         <textarea 
            className="w-full bg-[#1e293b] text-xs font-mono text-white p-3 rounded-xl outline-none border border-transparent focus:border-emerald-500/50 resize-y min-h-[100px] leading-relaxed placeholder:text-slate-600" 
            placeholder="Enter initial context or data..."
            value={data.value}
            onChange={(e) => data.onChange(id, e.target.value)}
            onMouseDown={(e) => e.stopPropagation()} 
         />
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-2 border-[#0f172a]" />
    </div>
  );
};

const PersonaNode = ({ data, id }: { data: any, id: string }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`w-[400px] rounded-2xl shadow-2xl transition-all border-2 group ${data.status === 'running' ? 'border-amber-400 ring-4 ring-amber-400/10' : data.status === 'completed' ? 'border-blue-500' : data.status === 'error' ? 'border-red-500' : 'border-[#334155] bg-[#1e293b] hover:border-[#475569]'}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500 border-2 border-[#0f172a]" />
      
      <div className="bg-[#0f172a] p-3 flex items-center justify-between rounded-t-xl border-b border-[#334155]">
         <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${data.status === 'completed' ? 'bg-blue-500 text-white' : 'bg-[#334155] text-slate-400'}`}>
               <Wand2 size={14} />
            </div>
            <div className="min-w-0">
               <div className="text-xs font-bold text-white truncate max-w-[200px]">{data.label}</div>
               <div className="text-[9px] text-slate-500 font-mono">{data.category || 'Persona'}</div>
            </div>
         </div>
         <div className="flex items-center gap-2">
            {data.status === 'running' ? (
                <Loader2 size={16} className="text-amber-400 animate-spin" />
            ) : (
                <button 
                    onClick={() => data.onRunNode(id)}
                    className="p-1.5 rounded-lg bg-[#1e293b] text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/30"
                    title="Run this node only (Manual Pipe)"
                >
                    <Play size={12} fill="currentColor" />
                </button>
            )}
         </div>
      </div>
      
      <div className="p-4 bg-[#1e293b] space-y-3 rounded-b-xl">
         {/* Prompt Preview */}
         <div className="relative group/prompt">
             <div className="text-[10px] text-slate-400 line-clamp-2 italic border-l-2 border-slate-600 pl-3 leading-relaxed opacity-80 group-hover/prompt:opacity-100 transition-opacity select-none cursor-help" title={data.promptPreview}>
                {data.promptPreview}
             </div>
         </div>
         
         {/* Output Section */}
         <div className="animate-in fade-in slide-in-from-top-2 pt-2 border-t border-[#334155]">
            <button 
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-[#0f172a] hover:bg-black/20 border border-[#334155] text-[9px] font-black uppercase tracking-wider text-slate-500 mb-2 transition-colors group/btn"
            >
                <span className="flex items-center gap-2">
                  <MessageSquare size={10} /> 
                  {data.output ? 'Output' : 'Output Area'}
                  <span className="text-[8px] opacity-50 font-normal normal-case tracking-normal ml-1 bg-[#1e293b] px-1.5 py-0.5 rounded flex items-center gap-1 group-hover/btn:text-blue-400 transition-colors">
                    <Edit3 size={8} /> Editable
                  </span>
                </span>
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            
            {expanded && (
                <div className="relative group/edit">
                  <textarea 
                      className={`w-full bg-[#0f172a] rounded-xl p-3 border text-[11px] font-mono leading-relaxed outline-none focus:border-blue-500/50 resize-y min-h-[100px] custom-scrollbar transition-colors ${data.status === 'completed' ? 'border-blue-500/30 text-blue-100' : 'border-[#334155] text-slate-300'}`}
                      value={data.output}
                      onChange={(e) => data.onOutputChange(id, e.target.value)}
                      placeholder="Waiting for execution... (Or type manually to inject data)"
                      onMouseDown={(e) => e.stopPropagation()}
                  />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none">
                     <div className="p-1 rounded bg-black/50 text-[8px] text-white/50 font-bold uppercase tracking-widest backdrop-blur-sm">
                        Manual Edit
                     </div>
                  </div>
                </div>
            )}
        </div>
         
         {data.status === 'error' && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
               <AlertCircle size={14} />
               <span>Execution Failed</span>
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
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Refs for stable access inside callbacks without re-creating functions
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // --- Callbacks ---

  const onInputChange = useCallback((id: string, value: string) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) return { ...node, data: { ...node.data, value } };
      return node;
    }));
  }, [setNodes]);

  const onOutputChange = useCallback((id: string, value: string) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        // Automatically mark as completed if user types manually (and not currently running)
        const newStatus = node.data.status === 'running' ? 'running' : 'completed';
        return { ...node, data: { ...node.data, output: value, status: newStatus } };
      }
      return node;
    }));
  }, [setNodes]);

  const runSingleNode = useCallback(async (nodeId: string) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const targetNode = currentNodes.find(n => n.id === nodeId);
    
    if (!targetNode || targetNode.type !== 'persona') return;

    // 1. Set status to running
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n));

    try {
        // 2. Gather inputs from parents
        const incomingEdges = currentEdges.filter(e => e.target === nodeId);
        let contextString = "";
        
        for (const edge of incomingEdges) {
            const sourceNode = currentNodes.find(n => n.id === edge.source);
            if (!sourceNode) continue;
            
            const val = sourceNode.type === 'input' ? sourceNode.data.value : sourceNode.data.output;
            contextString += `\n\n--- INPUT FROM [${sourceNode.data.label || 'System'}] ---\n${val || '(Empty Input)'}\n`;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        const fullPrompt = `${targetNode.data.promptPreview}\n\n[CONTEXT DATA]:${contextString || '(No upstream inputs)'}\n\n[INSTRUCTION]: Process the Context Data according to your Persona rules.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: fullPrompt
        });

        const output = response.text || '';

        // 3. Update Node
        setNodes(nds => nds.map(n => n.id === nodeId ? { 
            ...n, 
            data: { ...n.data, status: 'completed', output } 
        } : n));

    } catch (err) {
        console.error("Node Execution Failed:", err);
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' } } : n));
    }

  }, [setNodes]);

  // Inject callbacks into nodes whenever list changes
  useEffect(() => {
     setNodes((nds) => nds.map((node) => {
        const newData = { ...node.data };
        let changed = false;
        
        if (node.type === 'input' && newData.onChange !== onInputChange) {
           newData.onChange = onInputChange;
           changed = true;
        }
        if (node.type === 'persona') {
           if (newData.onRunNode !== runSingleNode) { newData.onRunNode = runSingleNode; changed = true; }
           if (newData.onOutputChange !== onOutputChange) { newData.onOutputChange = onOutputChange; changed = true; }
        }

        return changed ? { ...node, data: newData } : node;
     }));
  }, [onInputChange, runSingleNode, onOutputChange, setNodes, nodes.length]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), [setEdges]);

  // --- Actions ---

  const addPersonaNode = (prompt: PromptItem) => {
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'persona',
      position: { x: 400 + Math.random() * 50, y: 200 + Math.random() * 50 },
      data: { 
        label: prompt.act, 
        promptId: prompt.id,
        category: prompt.category,
        promptPreview: prompt.prompt,
        status: 'idle',
        output: '',
        onRunNode: runSingleNode,
        onOutputChange: onOutputChange
      }
    };
    setNodes((nds) => [...nds, newNode]);
    setIsAddMenuOpen(false);
  };

  const addInputNode = () => {
    if (nodes.some(n => n.type === 'input')) return; 
    const newNode: Node = {
       id: 'root-input',
       type: 'input',
       position: { x: 50, y: 250 },
       data: { value: '', label: 'System Input', onChange: onInputChange }
    };
    setNodes((nds) => [...nds, newNode]);
    setIsAddMenuOpen(false);
  };

  const clearTrace = () => {
     setNodes(nds => nds.map(n => {
        if (n.type === 'persona') {
           return { ...n, data: { ...n.data, status: 'idle', output: '' } };
        }
        return n;
     }));
  };
  
  const stopExecution = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
      }
      setIsExecuting(false);
  };

  const executePipeline = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    abortControllerRef.current = new AbortController();
    
    // 1. Reset statuses for a clean run
    setNodes(nds => nds.map(n => {
        if (n.type === 'persona') return { ...n, data: { ...n.data, status: 'idle' } }; 
        return n;
    }));

    await new Promise(r => setTimeout(r, 100));

    // 2. Initialize results map with Input Node values
    const results = new Map<string, string>();
    const inputNode = nodesRef.current.find(n => n.type === 'input');
    if (inputNode) {
        results.set(inputNode.id, inputNode.data.value || '');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // 3. Execution Graph Logic
    const completedInThisRun = new Set<string>(inputNode ? [inputNode.id] : []);
    let active = true;

    while (active && abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        // Find nodes ready to execute
        const currentNodes = nodesRef.current;
        const currentEdges = edgesRef.current;

        const readyNodes = currentNodes.filter(n => {
            if (n.type === 'input') return false;
            if (completedInThisRun.has(n.id)) return false;

            const incoming = currentEdges.filter(e => e.target === n.id);
            if (incoming.length === 0) return false; 

            const allSourcesReady = incoming.every(e => completedInThisRun.has(e.source));
            return allSourcesReady;
        });

        if (readyNodes.length === 0) {
            active = false;
            break;
        }

        // Parallel execution for current layer
        await Promise.all(readyNodes.map(async (node) => {
            if (abortControllerRef.current?.signal.aborted) return;

            setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'running' } } : n));

            try {
                const incoming = currentEdges.filter(e => e.target === node.id);
                let contextString = "";
                
                incoming.forEach(e => {
                    const sourceNode = currentNodes.find(sn => sn.id === e.source);
                    const sourceVal = results.get(e.source); 
                    const label = sourceNode?.data.label || 'System';
                    contextString += `\n\n--- INPUT FROM [${label}] ---\n${sourceVal}\n`;
                });

                const fullPrompt = `${node.data.promptPreview}\n\n[CONTEXT DATA]:${contextString}\n\n[INSTRUCTION]: Process the Context Data according to your Persona rules.`;

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: fullPrompt
                });
                
                const output = response.text || '';
                results.set(node.id, output);

                setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'completed', output } } : n));
                completedInThisRun.add(node.id);

            } catch (err) {
                console.error("Exec error", err);
                setNodes(prev => prev.map(n => n.id === node.id ? { ...n, data: { ...n.data, status: 'error' } } : n));
            }
        }));
    }

    setIsExecuting(false);
    abortControllerRef.current = null;
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
               className="bg-transparent text-white font-bold text-lg outline-none placeholder:text-slate-600 focus:text-emerald-400 transition-colors" 
               value={pipelineName}
               onChange={(e) => setPipelineName(e.target.value)}
               placeholder="Untitled Pipeline"
            />
         </div>
         <div className="flex items-center gap-3">
            <button 
               onClick={clearTrace}
               className="p-2.5 rounded-lg bg-[#1e293b] text-slate-400 hover:text-red-400 transition-all border border-transparent hover:border-red-500/30"
               title="Clear Outputs"
            >
               <Eraser size={18} />
            </button>
            <div className="h-6 w-px bg-[#334155]" />
            <button 
               onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} 
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isAddMenuOpen ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-[#1e293b] text-slate-400 hover:text-white hover:bg-[#334155]'}`}
            >
               <Plus size={14} /> Add Node
            </button>
            {isExecuting ? (
                <button 
                    onClick={stopExecution}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg active:scale-95"
                >
                    <Square size={12} fill="currentColor" /> Stop Chain
                </button>
            ) : (
                <button 
                   onClick={executePipeline} 
                   className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                   <Play size={14} fill="currentColor" /> Run Chain
                </button>
            )}
            <button onClick={handleSave} className="p-2.5 rounded-lg bg-[#1e293b] text-indigo-400 hover:text-white transition-all hover:bg-indigo-500"><Save size={18} /></button>
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
            <MiniMap className="bg-[#0f172a] border-[#1e293b] rounded-lg overflow-hidden" nodeColor="#334155" />
         </ReactFlow>

         {/* Add Node Menu Overlay */}
         {isAddMenuOpen && (
            <div className="absolute top-4 right-4 w-[320px] bg-[#0f172a] border border-[#334155] rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 z-20 flex flex-col gap-2 max-h-[80%]">
               <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Node Library</h4>
                  <button onClick={() => setIsAddMenuOpen(false)} className="text-slate-500 hover:text-white"><X size={14} /></button>
               </div>
               
               {!nodes.some(n => n.type === 'input') && (
                  <button onClick={addInputNode} className="flex items-center gap-3 p-3 rounded-xl bg-[#1e293b] hover:bg-emerald-500/10 hover:border-emerald-500 border border-transparent transition-all group text-left">
                     <div className="p-2.5 rounded-lg bg-[#0f172a] text-emerald-500 border border-[#334155] group-hover:border-emerald-500/50"><Terminal size={18} /></div>
                     <div>
                        <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">System Input</div>
                        <div className="text-[10px] text-slate-400">Initial data entry point</div>
                     </div>
                  </button>
               )}
               
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mt-2 pt-2 border-t border-[#1e293b]">
                  {allPrompts.map(prompt => (
                     <button key={prompt.id} onClick={() => addPersonaNode(prompt)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#1e293b] hover:bg-blue-500/10 hover:border-blue-500 border border-transparent transition-all group text-left">
                        <div className="p-2.5 rounded-lg bg-[#0f172a] text-blue-400 border border-[#334155] group-hover:border-blue-500/50"><Wand2 size={18} /></div>
                        <div className="min-w-0">
                           <div className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">{prompt.act}</div>
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
