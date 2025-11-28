import React, { useState } from 'react';
import { NodeType } from '../types';
import { Square, Circle, Diamond, Link as LinkIcon, Trash2, Sparkles, X, HelpCircle, MousePointer2, Download, UserCircle } from 'lucide-react';

interface ControlsProps {
  onAddNodeRequest: (type: NodeType) => void;
  onToggleLinking: () => void;
  onDelete: () => void;
  selectedCount: number;
  onGenerateScenario: () => void;
  isLinking: boolean;
  onExport: () => void;
  onSetStudentId: () => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  onAddNodeRequest, 
  onToggleLinking, 
  onDelete, 
  selectedCount,
  onGenerateScenario,
  isLinking,
  onExport,
  onSetStudentId
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border-b border-slate-200 shadow-sm relative z-50">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            绘图工具栏
            <button 
                onClick={() => setShowHelp(!showHelp)}
                className="text-slate-400 hover:text-blue-600 transition-colors"
                title="使用说明"
            >
                <HelpCircle className="w-5 h-5" />
            </button>
        </h1>
        <button 
          onClick={onGenerateScenario}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
        >
          <Sparkles className="w-4 h-4" />
          生成练习题
        </button>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {/* Node Tools */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => onAddNodeRequest(NodeType.ENTITY)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-md shadow-sm transition-all border border-slate-200"
            title="添加实体 (矩形)"
          >
            <Square className="w-4 h-4" /> 实体
          </button>
          <button
            onClick={() => onAddNodeRequest(NodeType.ATTRIBUTE)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-green-50 hover:text-green-600 rounded-md shadow-sm transition-all border border-slate-200"
            title="添加属性 (椭圆)"
          >
            <Circle className="w-4 h-4" /> 属性
          </button>
          <button
            onClick={() => onAddNodeRequest(NodeType.RELATIONSHIP)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-amber-50 hover:text-amber-600 rounded-md shadow-sm transition-all border border-slate-200"
            title="添加关系 (菱形)"
          >
            <Diamond className="w-4 h-4" /> 关系
          </button>
        </div>

        <div className="w-px h-8 bg-slate-300 mx-1"></div>

        {/* Action Tools */}
        <div className="flex gap-2">
          <button
            onClick={onToggleLinking}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md shadow-sm transition-all border 
              ${isLinking 
                ? 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-200 animate-pulse' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}
            title="点击开始连线"
          >
            {isLinking ? <MousePointer2 className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            {isLinking ? '正在连线...' : '连接'}
          </button>

          <button
            onClick={onDelete}
            disabled={selectedCount === 0}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md shadow-sm transition-all border
              ${selectedCount > 0
                ? 'bg-white text-red-600 hover:bg-red-50 border-red-100' 
                : 'bg-slate-50 text-slate-400 cursor-not-allowed border-transparent'}`}
          >
            <Trash2 className="w-4 h-4" /> 删除
          </button>

          <div className="w-px h-8 bg-slate-300 mx-1"></div>

          <button
            onClick={onSetStudentId}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-md shadow-sm transition-all border border-slate-200"
            title="设置学号"
          >
            <UserCircle className="w-4 h-4" /> 学号
          </button>

          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-md shadow-sm transition-all border border-slate-200"
            title="保存为图片"
          >
            <Download className="w-4 h-4" /> 导出
          </button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
          <div className="absolute top-16 left-4 right-auto bg-white p-5 rounded-xl shadow-2xl border border-slate-200 z-50 w-80 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-500" />
                      操作指南
                  </h3>
                  <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                  </button>
              </div>
              <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                  <li><strong>添加节点：</strong>点击上方的实体、属性或关系按钮，输入名称后确认。</li>
                  <li>
                      <strong>连接节点：</strong>
                      <span className="block mt-1 text-slate-800 bg-amber-50 p-2 rounded border border-amber-100">
                        1. 点击“连接”按钮进入连线模式。<br/>
                        2. 依次点击两个要连接的节点。<br/>
                        3. 输入连线标注（可选）。
                      </span>
                  </li>
                  <li><strong>学号署名：</strong>点击“学号”按钮输入信息，将显示在画布右下角。</li>
                  <li><strong>删除对象：</strong>选中节点（按住 Ctrl 或 Shift 可多选）后点击删除按钮。</li>
                  <li><strong>保存：</strong>点击“导出”可下载包含学号的ER图。</li>
              </ul>
          </div>
      )}
    </div>
  );
};

export default Controls;