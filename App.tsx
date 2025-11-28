import React, { useState } from 'react';
import { DiagramData, NodeType, ERNode, ERLink } from './types';
import ERCanvas from './components/ERCanvas';
import InfoPanel from './components/InfoPanel';
import Controls from './components/Controls';
import { generateScenario } from './services/geminiService';
import { GraduationCap, Database, Plus, X } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<DiagramData>({
    nodes: [
      { id: '1', type: NodeType.ENTITY, label: '学生', x: 150, y: 150 },
      { id: '2', type: NodeType.ATTRIBUTE, label: '学号', x: 150, y: 250 },
      { id: '3', type: NodeType.ENTITY, label: '课程', x: 450, y: 150 },
      { id: '4', type: NodeType.RELATIONSHIP, label: '选修', x: 300, y: 150 },
    ],
    links: [
        { source: '2', target: '1' },
        { source: '1', target: '4', label: 'M' },
        { source: '4', target: '3', label: 'N' }
    ],
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>('实体-联系模型 (ER Model)');
  const [scenario, setScenario] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');

  // Linking Mode State
  const [isLinking, setIsLinking] = useState(false);
  const [linkingSourceId, setLinkingSourceId] = useState<string | null>(null);

  // Input Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'NODE' | 'LINK' | 'STUDENT_ID';
    nodeType?: NodeType;
    sourceId?: string;
    targetId?: string;
    title: string;
    placeholder: string;
    value: string;
  }>({
    isOpen: false,
    type: 'NODE',
    title: '',
    placeholder: '',
    value: ''
  });

  // Handle adding a new node (trigger from Controls)
  const handleAddNodeRequest = (type: NodeType) => {
    // Exit linking mode if active
    if (isLinking) setIsLinking(false);
    
    setModalConfig({
        isOpen: true,
        type: 'NODE',
        nodeType: type,
        title: '添加节点',
        placeholder: '输入名称 (如: 学生)',
        value: ''
    });
  };

  const handleSetStudentId = () => {
    // Exit linking mode if active
    if (isLinking) setIsLinking(false);

    setModalConfig({
      isOpen: true,
      type: 'STUDENT_ID',
      title: '设置学号',
      placeholder: '请输入您的学号 (将会显示在画布上)',
      value: studentId
    });
  };

  const confirmAdd = () => {
      const val = modalConfig.value.trim();
      
      if (modalConfig.type === 'NODE') {
          if (!val) return; // Node label required
          if (modalConfig.nodeType) {
            const newNode: ERNode = {
                id: Date.now().toString(),
                type: modalConfig.nodeType,
                label: val,
                x: Math.random() * 200 + 100,
                y: Math.random() * 200 + 100,
            };
            setData(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
          }
      } else if (modalConfig.type === 'LINK') {
          // Link label optional
          if (modalConfig.sourceId && modalConfig.targetId) {
            const newLink: ERLink = {
                source: modalConfig.sourceId,
                target: modalConfig.targetId,
                label: modalConfig.value // Allow empty
            };
            setData(prev => ({ ...prev, links: [...prev.links, newLink] }));
          }
      } else if (modalConfig.type === 'STUDENT_ID') {
          setStudentId(val);
      }

      // Close Modal
      setModalConfig(prev => ({ ...prev, isOpen: false, value: '' }));
  };

  const handleToggleLinking = () => {
      setIsLinking(!isLinking);
      setLinkingSourceId(null); // Reset source if toggling
      setSelectedIds([]); // Clear selection to avoid confusion
  };

  const handleCanvasNodeClick = (id: string) => {
      if (!isLinking) return; // Logic handled by Canvas for selection if not linking

      if (!linkingSourceId) {
          // Select source
          setLinkingSourceId(id);
      } else {
          // Select target -> Open Modal
          if (id === linkingSourceId) return; // Cannot link to self

          setModalConfig({
              isOpen: true,
              type: 'LINK',
              sourceId: linkingSourceId,
              targetId: id,
              title: '创建连线',
              placeholder: '连线标注 (可选, 如: 1, N, M)',
              value: ''
          });

          // Reset Linking State
          setIsLinking(false);
          setLinkingSourceId(null);
      }
  };

  const handleDelete = () => {
    setData(prev => {
      const remainingNodes = prev.nodes.filter(n => !selectedIds.includes(n.id));
      const remainingLinks = prev.links.filter(l => 
        !selectedIds.includes(l.source) && !selectedIds.includes(l.target)
      );
      return { nodes: remainingNodes, links: remainingLinks };
    });
    setSelectedIds([]);
  };

  const handleNodeDragEnd = (id: string, x: number, y: number) => {
    setData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === id ? { ...n, x, y } : n)
    }));
  };

  const handleGenerateScenario = async () => {
    setScenario("正在生成题目...");
    const text = await generateScenario();
    setScenario(text);
  };

  const handleTopicChange = (topic: string) => {
    setCurrentTopic(topic);
  };

  const handleExportImage = () => {
    const svgElement = document.getElementById('er-main-svg');
    if (!svgElement) return;

    // Serialize SVG data
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    
    // Create an Image from SVG
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
        const canvas = document.createElement('canvas');
        // Set canvas dimensions to match SVG or larger for quality
        const bbox = svgElement.getBoundingClientRect();
        canvas.width = bbox.width;
        canvas.height = bbox.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fill background white (otherwise it's transparent)
        ctx.fillStyle = '#f8fafc'; // Matches bg-slate-50
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines (optional manual simulation) or just the drawing
        ctx.drawImage(img, 0, 0);
        
        // Export
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `er-diagram-${studentId || 'export'}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            数据库原理
          </h1>
          <p className="text-xs mt-2 text-slate-500">ER图交互式教学系统</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">基础概念</div>
          <ul className="space-y-1">
            {[
              '实体-联系模型 (ER Model)',
              '实体 (Entity)',
              '属性 (Attribute)',
              '关系 (Relationship)',
              '一对一关系 (1:1)',
              '一对多关系 (1:N)',
              '多对多关系 (M:N)'
            ].map(topic => (
              <li key={topic}>
                <button
                  onClick={() => handleTopicChange(topic)}
                  className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors ${
                    currentTopic === topic 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-slate-800'
                  }`}
                >
                  {topic}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <GraduationCap className="w-4 h-4" />
            <span>基于《数据库基础与应用》</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Control Bar */}
        <Controls 
          onAddNodeRequest={handleAddNodeRequest}
          onToggleLinking={handleToggleLinking}
          onDelete={handleDelete}
          selectedCount={selectedIds.length}
          onGenerateScenario={handleGenerateScenario}
          isLinking={isLinking}
          onExport={handleExportImage}
          onSetStudentId={handleSetStudentId}
        />
        
        {/* Linking Helper Message */}
        {isLinking && (
            <div className="bg-amber-100 text-amber-800 px-4 py-2 text-center text-sm font-bold border-b border-amber-200">
                {linkingSourceId 
                    ? '请点击第二个节点以完成连接...' 
                    : '请点击第一个节点作为连线起点...'}
                <button 
                    onClick={handleToggleLinking}
                    className="ml-4 underline text-amber-900 hover:text-amber-700"
                >
                    取消
                </button>
            </div>
        )}

        {/* Workspace: Split View */}
        <div className="flex-1 flex overflow-hidden">
            {/* Left: Canvas */}
            <div className="flex-1 relative flex flex-col">
                {scenario && (
                    <div className="absolute top-4 left-4 right-4 z-10 bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-sm">练习任务</span>
                            <span className="text-sm font-medium">{scenario}</span>
                        </div>
                        <button onClick={() => setScenario('')} className="text-white/70 hover:text-white text-sm">关闭</button>
                    </div>
                )}
                <div className="flex-1 bg-slate-100 p-4">
                   <ERCanvas 
                     data={data} 
                     onNodeDragEnd={handleNodeDragEnd}
                     onSelectionChange={setSelectedIds}
                     onNodeClick={handleCanvasNodeClick}
                     linkingMode={isLinking}
                     linkingSourceId={linkingSourceId}
                     studentId={studentId}
                   />
                </div>
            </div>

            {/* Right: Info Panel */}
            <div className="w-96 flex-shrink-0 border-l border-slate-200 bg-white h-full overflow-hidden shadow-2xl relative z-20">
              <InfoPanel topic={currentTopic} />
            </div>
        </div>

        {/* Global Input Modal */}
        {modalConfig.isOpen && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-start justify-center pt-32">
                 <div className="bg-white p-6 rounded-xl shadow-2xl border border-slate-200 w-96 animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                        <h3 className="font-bold text-lg text-slate-800">{modalConfig.title}</h3>
                        <button 
                            onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <input
                        autoFocus
                        type="text"
                        placeholder={modalConfig.placeholder}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        value={modalConfig.value}
                        onChange={(e) => setModalConfig(prev => ({ ...prev, value: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && confirmAdd()}
                    />
                    
                    <div className="flex justify-end gap-2">
                         <button 
                            onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            取消
                        </button>
                        <button 
                            onClick={confirmAdd}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> 确认
                        </button>
                    </div>
                    {modalConfig.type === 'LINK' && (
                        <p className="mt-3 text-xs text-slate-500 text-center">提示：实体与属性之间的连线通常留空即可。</p>
                    )}
                 </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;