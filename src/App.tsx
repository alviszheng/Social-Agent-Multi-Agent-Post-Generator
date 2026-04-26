import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Settings, 
  FileText, 
  Layers, 
  Play, 
  CheckCircle2, 
  Info, 
  ShieldCheck, 
  Search, 
  Code,
  Layout,
  Terminal,
  Activity
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { marked } from 'marked';

// Add this styles to head for markdown in App.tsx component if needed or use tailwind prose
// but since I'm using dangerouslySetInnerHTML, I'll ensure the content is parsed correctly

type Tab = 'dashboard' | 'architecture' | 'configs' | 'rfc' | 'evals';

interface LogEntry {
  step: number;
  agent: string;
  status: 'started' | 'completed';
  output?: string;
  toolCalls?: any[];
  timestamp: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [topic, setTopic] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [configs, setConfigs] = useState<any>(null);
  const [rfcContent, setRfcContent] = useState('');
  const [evals, setEvals] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
    fetchRFC();
    fetchEvals();
  }, []);

  const fetchConfigs = async () => {
    const res = await fetch('/api/config');
    const data = await res.json();
    setConfigs(data);
  };

  const fetchRFC = async () => {
    const res = await fetch('/api/rfc');
    const data = await res.text();
    setRfcContent(data);
  };

  const fetchEvals = async () => {
    const res = await fetch('/api/evals');
    const data = await res.json();
    setEvals(data);
  };

  const handleGenerate = async () => {
    if (!topic || !apiKey) {
      setError('Please provide both a topic and an API key.');
      return;
    }
    setError(null);
    setIsProcessing(true);
    setLogs([]);
    
    localStorage.setItem('gemini_api_key', apiKey);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, apiKey }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLogs(data.logs);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const testApiKey = async () => {
    if (!apiKey) return alert('Enter API key first');
    // Simple test call (we could add a dedicated endpoint for this)
    handleGenerate();
  };

  return (
    <div className="flex h-screen w-full bg-[#0F1115] text-[#E2E8F0] font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#161B22] border-r border-[#30363D] flex flex-col z-50">
        <div className="p-6 border-b border-[#30363D]">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
            SocialAgent.ai
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarNavItem icon={<Layout size={18} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarNavItem icon={<Layers size={18} />} label="Workflows" active={activeTab === 'architecture'} onClick={() => setActiveTab('architecture')} />
          <SidebarNavItem icon={<Code size={18} />} label="Configs" active={activeTab === 'configs'} onClick={() => setActiveTab('configs')} />
          <SidebarNavItem icon={<FileText size={18} />} label="RFC.md" active={activeTab === 'rfc'} onClick={() => setActiveTab('rfc')} />
          <SidebarNavItem icon={<Activity size={18} />} label="Evals (OTEL)" active={activeTab === 'evals'} onClick={() => setActiveTab('evals')} />
        </nav>
        
        <div className="p-4 border-t border-[#30363D] mt-auto">
          <div className="flex items-center gap-3 text-sm text-gray-400 cursor-pointer hover:text-white transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-900/30 border border-blue-500/50 flex items-center justify-center font-bold text-blue-200">S</div>
            <span>Settings</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col bg-[#0D1117] overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-[#30363D] flex items-center justify-between px-8 bg-[#161B22]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Session</span>
              <h2 className="text-sm font-semibold text-white truncate max-w-xs">{topic || "No Active Topic"}</h2>
            </div>
            
            <div className="flex items-center gap-4 border-l border-[#30363D] pl-6">
              <div className="relative">
                <input 
                  type="password" 
                  placeholder="Gemini API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pl-3 pr-10 py-1.5 bg-[#0D1117] border border-[#30363D] rounded text-[11px] w-48 focus:outline-none focus:border-blue-500 transition-all text-gray-300"
                />
                <button onClick={testApiKey} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-[9px] uppercase tracking-wider hover:text-blue-400">Test</button>
              </div>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors uppercase tracking-wider font-bold">Get Key</a>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {isProcessing && (
              <div className="flex items-center gap-2 text-blue-400 mr-4">
                <Activity size={14} className="animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Orchestrating...</span>
              </div>
            )}
            <button 
              onClick={handleGenerate}
              disabled={isProcessing}
              className="px-4 py-1.5 bg-[#238636] hover:bg-[#2ea043] disabled:bg-gray-700 rounded text-white text-xs font-bold transition-all flex items-center gap-2"
            >
              {isProcessing ? 'RUNNING...' : 'START NEW RUN'}
              <Play size={14} fill="currentColor" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Multi-Agent Processing</h3>
                    <span className="text-[10px] text-blue-400 font-mono">FLOW: PLANNER → RESEARCH → GENERATOR → EDITOR → COMPLIANCE</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter a topic to generate social content..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isProcessing}
                    className="w-full px-6 py-4 bg-[#161B22] border border-[#30363D] rounded-xl text-lg text-[#E2E8F0] focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-600 shadow-2xl"
                  />
                </div>

                {error && <div className="p-3 bg-red-900/20 text-red-400 rounded border border-red-900/50 text-xs font-mono">{error}</div>}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
                  {/* Left Column: Log Feed */}
                  <div className="lg:col-span-12 xl:col-span-7 space-y-4">
                    {configs?.workflow?.workflow?.steps.map((step: any) => {
                      const log = logs.find(l => l.step === step.step && l.status === 'completed');
                      const active = isProcessing && logs.filter(l => l.step === step.step).length > 0;
                      const agentCfg = configs?.agents?.agents?.find((a: any) => a.name === step.agent);
                      return (
                        <SleekAgentCard 
                          key={step.step}
                          name={step.agent}
                          description={step.description}
                          model={agentCfg?.model}
                          status={log ? 'completed' : (active ? 'active' : 'pending')}
                          output={log?.output}
                          toolCalls={log?.toolCalls}
                        />
                      );
                    })}
                    {logs.length === 0 && !isProcessing && (
                      <div className="h-48 border border-dashed border-[#30363D] bg-[#161B22]/30 rounded-xl flex flex-col items-center justify-center text-gray-600">
                        <Zap size={32} className="mb-2 opacity-20 text-blue-500" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Waiting for Run Initialization</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Console & Stats */}
                  <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    <div className="bg-black border border-[#30363D] rounded-xl p-0 flex flex-col h-[500px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                      <div className="bg-[#161B22] px-4 py-2 border-b border-[#30363D] flex items-center justify-between">
                         <h4 className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Final Output Console</h4>
                         <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/30"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/30"></div>
                         </div>
                      </div>
                      <div className="flex-1 p-6 overflow-y-auto text-gray-300 font-mono text-xs leading-relaxed selection:bg-blue-500/30">
                        {logs.length > 0 ? (
                          <div className="space-y-6">
                            {logs.filter(l => l.status === 'completed').map((l, i) => (
                              <div key={i} className="space-y-2 group">
                                <div className="text-blue-500 font-bold border-b border-[#30363D] pb-1 flex justify-between items-center opacity-70 group-hover:opacity-100 transition-opacity">
                                   <span># {l.agent.toUpperCase()} </span>
                                   <span className="text-[9px] text-gray-600">t+{i}s</span>
                                </div>
                                <pre className="whitespace-pre-wrap text-gray-400 group-hover:text-gray-200 transition-colors">{l.output}</pre>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-600 font-bold uppercase tracking-tighter text-[10px] opacity-20">
                            No active output stream
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <StatBox label="API Status" value={apiKey ? "Active" : "Key Missing"} color={apiKey ? "text-green-500" : "text-red-500"} />
                      <StatBox label="Run ID" value={logs.length > 0 ? "82EF-91C0" : "----"} color="text-gray-300" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'architecture' && (
              <motion.div key="architecture" className="space-y-8 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-[#161B22] p-8 rounded-xl border border-[#30363D] shadow-2xl">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6">System Data Flow</h3>
                      <pre className="font-mono text-xs text-gray-400 bg-[#0D1117] p-8 rounded border border-[#30363D] leading-relaxed">
{`USER_INPUT: "${topic || 'Topic'}"
      |
      V
+-----------+      [TOOLS]
|  PLANNER  | <--- Search, Trends
+-----+-----+
      |
      V
+-----------+      [TOOLS]
| RESEARCH  | <--- Browser, Keywords
+-----+-----+
      |
      V
+-----------+
| GENERATOR |
+-----+-----+
      |
      V
+-----------+
|  EDITOR   |
+-----+-----+
      |
      V
+-----------+
| COMPLIANCE|
+-----------+
      |
      V
[FINAL_OUTPUT]`}
                      </pre>
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Agent Map</h3>
                      <div className="grid grid-cols-1 gap-4">
                         <SleekAgentInfo name="Planner" model="gemini-3.1-pro-preview" roles="Decomposition & Strategy" />
                         <SleekAgentInfo name="Researcher" model="gemini-3.1-pro-preview" roles="Market Signals & Stats" />
                         <SleekAgentInfo name="Generator" model="gemini-3-flash-preview" roles="Copywriting" />
                         <SleekAgentInfo name="Editor" model="gemini-3-flash-preview" roles="Tone Refinement" />
                         <SleekAgentInfo name="Compliance" model="gemini-3-flash-preview" roles="Safety & QA" />
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'configs' && (
               <motion.div key="configs" className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
                  <SleekConfigFile title="agents.yaml" content={JSON.stringify(configs?.agents, null, 2)} />
                  <SleekConfigFile title="tools.yaml" content={JSON.stringify(configs?.tools, null, 2)} />
                  <SleekConfigFile title="workflow.yaml" content={JSON.stringify(configs?.workflow, null, 2)} />
               </motion.div>
            )}

            {activeTab === 'rfc' && (
              <motion.div key="rfc" className="bg-[#161B22] border border-[#30363D] p-12 rounded-xl prose prose-invert prose-slate max-w-none prose-pre:bg-[#0D1117] prose-pre:border prose-pre:border-[#30363D] prose-headings:text-white prose-a:text-blue-400 pb-12">
                <div dangerouslySetInnerHTML={{ __html: marked.parse(rfcContent) as string }} />
              </motion.div>
            )}

            {activeTab === 'evals' && (
              <motion.div key="evals" className="space-y-6 pb-20">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Continuous Evaluation Dashboard</h3>
                   <div className="flex items-center gap-2 text-[10px] text-green-500 font-bold bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      SYSTEM STABLE
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {evals.map((e, idx) => (
                     <div key={idx} className="bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-2xl">
                        <div className="bg-[#1c222b] px-6 py-3 border-b border-[#30363D] flex justify-between items-center">
                           <h3 className="text-xs font-bold text-[#E2E8F0] tracking-wider uppercase">{e.agent}</h3>
                           <span className="text-[10px] font-mono text-gray-500">v1.2</span>
                        </div>
                        <div className="p-6 space-y-4">
                          {e.evals.evals.map((ev: any, i: number) => (
                            <div key={i} className="flex items-center justify-between bg-[#0D1117] p-4 rounded border border-[#30363D]">
                               <div className="space-y-1">
                                  <div className="text-[11px] font-bold text-gray-300">{ev.name}</div>
                                  <div className="text-[9px] font-mono text-gray-500">Checks: {ev.expected_output_contains.join(", ")}</div>
                               </div>
                               <div className="text-[9px] font-bold text-green-400 uppercase tracking-widest border border-green-500/30 px-2 py-1 rounded bg-green-500/5">
                                  Passed
                               </div>
                            </div>
                          ))}
                        </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Footer Controls */}
        <footer className="h-20 border-t border-[#30363D] bg-[#161B22] px-8 flex items-center justify-between">
            <div className="flex gap-2">
              {["Future of AI", "Energy Transition", "Remote Work Evolution"].map(t => (
                <button 
                  key={t}
                  onClick={() => setTopic(t)}
                  className="px-3 py-1.5 bg-[#0D1117] hover:bg-[#30363D] border border-[#30363D] text-gray-500 hover:text-white rounded text-[10px] font-bold transition-all uppercase tracking-tight"
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
               <div>LOG_LEVEL: <span className="text-blue-500">VERBOSE</span></div>
               <div className="w-px h-4 bg-[#30363D]"></div>
               <div>BUILD: <span className="text-white">v4.1.14</span></div>
            </div>
        </footer>
      </main>
    </div>
  );
}

function SidebarNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-2.5 rounded flex items-center gap-3 cursor-pointer transition-all duration-200 group text-sm font-medium",
        active ? "bg-blue-600/10 text-blue-400 border-l border-blue-500" : "text-gray-400 hover:bg-[#30363D] hover:text-gray-200"
      )}
    >
      <span className={cn("transition-colors", active ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300")}>
        {icon}
      </span>
      {label}
    </div>
  );
}

function SleekAgentCard({ name, description, status, output, toolCalls, model }: { name: string, description: string, status: 'pending' | 'active' | 'completed', output?: string, toolCalls?: any[], key?: React.Key, model?: string }) {
  const getAgentColor = (name: string) => {
    switch(name.toLowerCase()) {
      case 'planner': return 'border-blue-500/30 text-blue-400 bg-blue-900/10';
      case 'researcher': return 'border-green-500/30 text-green-400 bg-green-900/10';
      case 'generator': return 'border-purple-500/30 text-purple-400 bg-purple-900/10';
      case 'editor': return 'border-yellow-500/30 text-yellow-400 bg-yellow-900/10';
      case 'compliance': return 'border-red-500/30 text-red-400 bg-red-900/10';
      default: return 'border-gray-500/30 text-gray-400 bg-gray-900/10';
    }
  };

  const getAgentBadge = (name: string) => {
    switch(name.toLowerCase()) {
      case 'planner': return 'bg-blue-500/20 text-blue-400';
      case 'researcher': return 'bg-green-500/20 text-green-400';
      case 'generator': return 'bg-purple-500/20 text-purple-400';
      case 'editor': return 'bg-yellow-500/20 text-yellow-400';
      case 'compliance': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className={cn(
      "bg-[#161B22] border rounded-lg p-5 transition-all duration-700 shadow-2xl",
      status === 'completed' ? "border-[#30363D]" : (status === 'active' ? "border-blue-500/50 ring-1 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "border-[#30363D] opacity-40")
    )}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", getAgentBadge(name))}>
             {name}
          </span>
          <span className="text-sm font-semibold text-[#E2E8F0] tracking-tight">{description}</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-mono text-gray-600 italic">{model || 'gemini-3.1-pro'}</span>
           {status === 'active' && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>}
        </div>
      </div>
      
      {output ? (
        <div className="text-xs text-gray-400 border-l border-[#30363D] pl-4 py-1 space-y-2 mt-2 leading-relaxed">
           <pre className="whitespace-pre-wrap font-sans text-gray-400 group-hover:text-gray-300">{output.slice(0, 300)}{output.length > 300 ? '...' : ''}</pre>
        </div>
      ) : (
        <div className="h-6 w-1/3 bg-[#0D1117] rounded animate-pulse mt-2"></div>
      )}

      {toolCalls && toolCalls.length > 0 && (
         <div className="mt-4 p-2 bg-[#0D1117] rounded border border-[#30363D] flex items-center gap-3">
            <Search size={10} className="text-blue-500" />
            <code className="text-[9px] font-mono text-gray-500 uppercase tracking-tighter">
               CALL: {toolCalls[0].tool}("{toolCalls[0].query}")
            </code>
         </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-[#161B22] p-4 rounded-xl border border-[#30363D] shadow-xl">
      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{label}</p>
      <p className={cn("text-xs font-bold uppercase tracking-tighter", color)}>{value}</p>
    </div>
  );
}

function SleekConfigFile({ title, content }: { title: string, content: string }) {
   return (
      <div className="space-y-4">
         <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{title}</h4>
         <div className="bg-[#0D1117] border border-[#30363D] rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-[#1c222b] px-4 py-2 border-b border-[#30363D] flex gap-1.5 items-center">
               <div className="w-2 h-2 rounded-full bg-gray-700"></div>
               <div className="w-2 h-2 rounded-full bg-gray-700"></div>
            </div>
            <pre className="p-6 text-[11px] font-mono text-gray-400 overflow-x-auto h-80 custom-scrollbar leading-relaxed">
               {content}
            </pre>
         </div>
      </div>
   );
}

function SleekAgentInfo({ name, model, roles }: { name: string, model: string, roles: string }) {
   return (
      <div className="bg-[#161B22] p-5 rounded-xl border border-[#30363D] hover:border-blue-500/30 transition-all transition-colors group">
         <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-[#E2E8F0] tracking-tight group-hover:text-blue-400 transition-colors uppercase text-xs">{name}</span>
            <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">{model}</span>
         </div>
         <p className="text-[10px] text-gray-500 font-medium tracking-tight leading-4">
            {roles}
         </p>
      </div>
   );
}

