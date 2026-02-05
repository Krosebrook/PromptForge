
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Trash2, ChevronRight, ChevronDown, Braces, List, 
  Type as TypeIcon, Hash, ToggleLeft, Box, AlertTriangle, Code, Layout,
  CheckCircle2, X, AlertCircle
} from 'lucide-react';

type SchemaType = 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT';

interface SchemaNode {
  type: SchemaType;
  description?: string;
  properties?: Record<string, SchemaNode>;
  items?: SchemaNode;
  required?: string[];
  enum?: string[];
}

interface SchemaBuilderProps {
  value: string;
  onChange: (value: string) => void;
}

const DEFAULT_ROOT: SchemaNode = {
  type: 'OBJECT',
  properties: {},
  required: []
};

const TYPE_COLORS: Record<SchemaType, string> = {
  STRING: 'text-emerald-400',
  NUMBER: 'text-blue-400',
  INTEGER: 'text-blue-400',
  BOOLEAN: 'text-rose-400',
  ARRAY: 'text-orange-400',
  OBJECT: 'text-purple-400'
};

const TYPE_ICONS: Record<SchemaType, React.ElementType> = {
  STRING: TypeIcon,
  NUMBER: Hash,
  INTEGER: Hash,
  BOOLEAN: ToggleLeft,
  ARRAY: List,
  OBJECT: Box
};

const SchemaField: React.FC<{
  name?: string;
  node: SchemaNode;
  onChange: (newNode: SchemaNode) => void;
  onDelete?: () => void;
  onNameChange?: (newName: string) => void;
  isRequired?: boolean;
  onRequiredChange?: (req: boolean) => void;
  depth?: number;
  isRoot?: boolean;
}> = ({ name, node, onChange, onDelete, onNameChange, isRequired, onRequiredChange, depth = 0, isRoot = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleTypeChange = (newType: SchemaType) => {
    const newNode: SchemaNode = { ...node, type: newType };
    if (newType === 'OBJECT' && !newNode.properties) {
      newNode.properties = {};
      newNode.required = [];
    }
    if (newType === 'ARRAY' && !newNode.items) {
      newNode.items = { type: 'STRING' };
    }
    onChange(newNode);
  };

  const handleAddProperty = () => {
    if (node.type !== 'OBJECT') return;
    const newProps = { ...node.properties };
    let key = 'new_field';
    let i = 1;
    while (newProps[key]) {
      key = `new_field_${i++}`;
    }
    newProps[key] = { type: 'STRING', description: '' };
    onChange({ ...node, properties: newProps });
    setIsExpanded(true);
  };

  const handlePropertyChange = (key: string, newPropNode: SchemaNode) => {
    if (node.type !== 'OBJECT' || !node.properties) return;
    onChange({
      ...node,
      properties: { ...node.properties, [key]: newPropNode }
    });
  };

  const handlePropertyRename = (oldKey: string, newKey: string) => {
    if (node.type !== 'OBJECT' || !node.properties || oldKey === newKey) return;
    const newProps: Record<string, SchemaNode> = {};
    Object.keys(node.properties).forEach(k => {
      if (k === oldKey) newProps[newKey] = node.properties![oldKey];
      else newProps[k] = node.properties![k];
    });
    
    // Update required array if needed
    let newRequired = node.required;
    if (newRequired?.includes(oldKey)) {
        newRequired = newRequired.map(k => k === oldKey ? newKey : k);
    }

    onChange({ ...node, properties: newProps, required: newRequired });
  };

  const handlePropertyDelete = (key: string) => {
    if (node.type !== 'OBJECT' || !node.properties) return;
    const newProps = { ...node.properties };
    delete newProps[key];
    
    // Remove from required
    const newRequired = node.required?.filter(k => k !== key);

    onChange({ ...node, properties: newProps, required: newRequired });
  };

  const togglePropertyRequired = (key: string, req: boolean) => {
      if (node.type !== 'OBJECT') return;
      let newRequired = [...(node.required || [])];
      if (req && !newRequired.includes(key)) {
          newRequired.push(key);
      } else if (!req) {
          newRequired = newRequired.filter(k => k !== key);
      }
      onChange({ ...node, required: newRequired });
  };

  const handleItemsChange = (newItems: SchemaNode) => {
      onChange({ ...node, items: newItems });
  };

  const Icon = TYPE_ICONS[node.type];

  return (
    <div className={`relative ${!isRoot ? 'mt-2' : ''}`}>
        <div className={`flex items-start gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-element)]/50 group hover:border-[var(--accent)]/30 transition-all ${isRoot ? 'border-dashed border-2' : ''}`}>
            {/* Drag/Structure Handle could go here */}
            <div className="mt-1.5 opacity-50 hover:opacity-100 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                {(node.type === 'OBJECT' || node.type === 'ARRAY') ? (
                    isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                ) : <div className="w-3.5" />}
            </div>

            <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    {!isRoot && onNameChange && (
                        <input 
                            className="bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] outline-none text-xs font-bold text-[var(--text-heading)] min-w-[100px] py-1"
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                            placeholder="field_name"
                        />
                    )}
                    
                    <div className="relative group/type">
                        <select 
                            value={node.type} 
                            onChange={(e) => handleTypeChange(e.target.value as SchemaType)}
                            className={`appearance-none pl-7 pr-6 py-1 rounded-lg bg-[var(--bg-panel)] border border-[var(--border)] text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer ${TYPE_COLORS[node.type]}`}
                        >
                            <option value="STRING">String</option>
                            <option value="NUMBER">Number</option>
                            <option value="INTEGER">Integer</option>
                            <option value="BOOLEAN">Boolean</option>
                            <option value="OBJECT">Object</option>
                            <option value="ARRAY">Array</option>
                        </select>
                        <Icon size={12} className={`absolute left-2 top-1/2 -translate-y-1/2 ${TYPE_COLORS[node.type]}`} />
                    </div>

                    {!isRoot && onRequiredChange && (
                        <button 
                            onClick={() => onRequiredChange(!isRequired)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-bold uppercase transition-all ${isRequired ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-transparent text-[var(--text-muted)] border-transparent hover:border-[var(--border)]'}`}
                        >
                            <AlertCircle size={10} />
                            {isRequired ? 'Required' : 'Optional'}
                        </button>
                    )}

                    {!isRoot && onDelete && (
                        <button onClick={onDelete} className="ml-auto text-[var(--text-muted)] hover:text-red-500 transition-colors p-1">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider shrink-0">Desc:</span>
                     <input 
                        className="flex-1 bg-transparent border-b border-[var(--border)] focus:border-[var(--accent)] outline-none text-xs text-[var(--text-body)] py-0.5 placeholder:text-[var(--text-muted)]/30"
                        value={node.description || ''}
                        onChange={(e) => onChange({ ...node, description: e.target.value })}
                        placeholder="Describe what this field represents..."
                     />
                </div>
            </div>
        </div>

        {/* Children Render */}
        {isExpanded && (
            <div className="pl-4 mt-2 border-l border-[var(--border)] ml-3 space-y-2">
                {node.type === 'OBJECT' && node.properties && (
                    <>
                        {Object.entries(node.properties).map(([key, childNode]) => (
                            <SchemaField 
                                key={key}
                                name={key}
                                node={childNode}
                                onChange={(n) => handlePropertyChange(key, n)}
                                onDelete={() => handlePropertyDelete(key)}
                                onNameChange={(newName) => handlePropertyRename(key, newName)}
                                isRequired={node.required?.includes(key)}
                                onRequiredChange={(req) => togglePropertyRequired(key, req)}
                                depth={depth + 1}
                            />
                        ))}
                        <button 
                            onClick={handleAddProperty}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/50 text-xs font-bold transition-all w-full justify-center group"
                        >
                            <Plus size={14} className="group-hover:scale-110 transition-transform" />
                            Add Property
                        </button>
                    </>
                )}

                {node.type === 'ARRAY' && node.items && (
                    <div className="pt-2">
                        <div className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-2"><List size={12} /> Array Items Schema</div>
                        <SchemaField 
                            node={node.items}
                            onChange={handleItemsChange}
                            depth={depth + 1}
                        />
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export const SchemaBuilder: React.FC<SchemaBuilderProps> = ({ value, onChange }) => {
  const [mode, setMode] = useState<'visual' | 'code'>('visual');
  const [parsed, setParsed] = useState<SchemaNode>(DEFAULT_ROOT);
  const [parseError, setParseError] = useState<string | null>(null);
  const [codeValue, setCodeValue] = useState(value);

  // Sync prop value to local state
  useEffect(() => {
    setCodeValue(value);
    if (!value.trim()) {
        setParsed(DEFAULT_ROOT);
        return;
    }
    try {
        const p = JSON.parse(value);
        setParsed(p);
        setParseError(null);
    } catch (e) {
        setParseError("Invalid JSON");
        setMode('code'); // Force code mode if invalid
    }
  }, [value]);

  const handleVisualChange = (newNode: SchemaNode) => {
      setParsed(newNode);
      const json = JSON.stringify(newNode, null, 2);
      setCodeValue(json);
      onChange(json);
  };

  const handleCodeChange = (val: string) => {
      setCodeValue(val);
      onChange(val);
      try {
          const p = JSON.parse(val);
          setParsed(p);
          setParseError(null);
      } catch (e) {
          setParseError("Invalid JSON");
      }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-panel)]/30 rounded-3xl border border-[var(--border)] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-element)]/50">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Layout size={18} />
                </div>
                <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-heading)]">Output Architect</h3>
                    <p className="text-[10px] text-[var(--text-muted)]">Define rigid JSON structure for model responses.</p>
                </div>
            </div>
            <div className="flex bg-[var(--bg-panel)] rounded-lg p-1 border border-[var(--border)]">
                <button 
                    onClick={() => setMode('visual')}
                    disabled={!!parseError}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${mode === 'visual' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-body)] disabled:opacity-50'}`}
                >
                    <Layout size={12} /> Visual
                </button>
                <button 
                    onClick={() => setMode('code')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${mode === 'code' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}
                >
                    <Code size={12} /> JSON
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[var(--bg-app)]/50">
            {mode === 'visual' ? (
                <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
                   <SchemaField 
                      node={parsed}
                      onChange={handleVisualChange}
                      isRoot={true}
                   />
                </div>
            ) : (
                <div className="h-full relative">
                    <textarea 
                        className="w-full h-full min-h-[400px] bg-transparent font-mono text-xs leading-relaxed text-[var(--text-body)] resize-none outline-none"
                        value={codeValue}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="{ ... }"
                        spellCheck={false}
                    />
                    {parseError && (
                        <div className="absolute bottom-4 right-4 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-2">
                            <AlertCircle size={14} />
                            {parseError}
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
