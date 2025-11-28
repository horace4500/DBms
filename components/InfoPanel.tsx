import React, { useEffect, useState } from 'react';
import { TextbookContent } from '../types';
import { fetchExplanation } from '../services/geminiService';
import { BookOpen, Lightbulb, Loader2 } from 'lucide-react';

interface InfoPanelProps {
  topic: string;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ topic }) => {
  const [content, setContent] = useState<TextbookContent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadContent = async () => {
      setLoading(true);
      const data = await fetchExplanation(topic);
      if (isMounted) {
        setContent(data);
        setLoading(false);
      }
    };
    loadContent();
    return () => { isMounted = false; };
  }, [topic]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-pulse p-8">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
        <p>AI 教授正在查阅教材...</p>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="h-full overflow-y-auto p-6 bg-white border-l border-slate-200 shadow-lg">
      <div className="flex items-center gap-2 mb-6 text-blue-700">
        <BookOpen className="w-6 h-6" />
        <h2 className="text-2xl font-bold">{content.title}</h2>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">核心定义</h3>
        <p className="text-slate-800 leading-relaxed text-lg bg-blue-50 p-4 rounded-lg border border-blue-100">
          {content.definition}
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">关键知识点</h3>
        <ul className="space-y-3">
          {content.keyPoints.map((point, index) => (
            <li key={index} className="flex items-start gap-3 text-slate-700">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs">
                {index + 1}
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 bg-amber-50 p-5 rounded-xl border border-amber-100">
        <div className="flex items-center gap-2 mb-3 text-amber-700 font-bold">
          <Lightbulb className="w-5 h-5" />
          <span>应用示例</span>
        </div>
        <p className="text-slate-700 italic">
          {content.example}
        </p>
      </div>
    </div>
  );
};

export default InfoPanel;
