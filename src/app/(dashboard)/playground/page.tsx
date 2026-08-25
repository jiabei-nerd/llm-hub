'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface Attachment {
  type: 'image' | 'file';
  name: string;
  preview: string; // base64 for image, text content for file
}

interface Message {
  role: 'user' | 'assistant';
  content: string | ContentPart[];
  displayContent?: string;
  attachments?: Attachment[];
}

interface ModelInfo {
  id: string;
  modelId: string;
  displayName: string;
  provider: { displayName: string };
  inputPrice: number;
  outputPrice: number;
}

export default function PlaygroundPage() {
  const { authFetch } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    authFetch('/api/models').then(async res => {
      const data = await res.json();
      setModels(data.models || []);
      if (data.models?.length) setSelectedModel(data.models[0].modelId);
    });
  }, [authFetch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachments(prev => [...prev, {
            type: 'image',
            name: file.name,
            preview: reader.result as string,
          }]);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setAttachments(prev => [...prev, {
            type: 'file',
            name: file.name,
            preview: reader.result as string,
          }]);
        };
        reader.readAsText(file);
      }
    }
    e.target.value = '';
  }

  function removeAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSend() {
    if ((!input.trim() && attachments.length === 0) || loading) return;

    const displayText = input.trim();
    const currentAttachments = [...attachments];
    const images = currentAttachments.filter(a => a.type === 'image');
    const files = currentAttachments.filter(a => a.type === 'file');

    // Build API content
    let apiContent: string | ContentPart[];
    const hasVision = images.length > 0;

    if (hasVision) {
      const parts: ContentPart[] = [];
      for (const img of images) {
        parts.push({ type: 'image_url', image_url: { url: img.preview } });
      }
      let textContent = displayText;
      if (files.length > 0) {
        const fileTexts = files.map(f => `【文件: ${f.name}】\n${f.preview}`).join('\n\n');
        textContent = textContent ? `${textContent}\n\n${fileTexts}` : fileTexts;
      }
      if (textContent) {
        parts.push({ type: 'text', text: textContent });
      }
      apiContent = parts;
    } else if (files.length > 0) {
      const fileTexts = files.map(f => `【文件: ${f.name}】\n${f.preview}`).join('\n\n');
      apiContent = displayText ? `${displayText}\n\n${fileTexts}` : fileTexts;
    } else {
      apiContent = displayText;
    }

    const userMsg: Message = {
      role: 'user',
      content: apiContent,
      displayContent: displayText,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setAttachments([]);
    setLoading(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages([...newMessages, assistantMsg]);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const res = await authFetch('/api/playground/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
          stream: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages([...newMessages, { role: 'assistant', content: `错误: ${err.error?.message || '请求失败'}` }]);
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;
            if (trimmed.startsWith('data: ')) {
              try {
                const chunk = JSON.parse(trimmed.slice(6));
                const content = chunk.choices?.[0]?.delta?.content;
                if (content) {
                  accumulated += content;
                  setMessages([...newMessages, { role: 'assistant', content: accumulated }]);
                }
              } catch {}
            }
          }
        }
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: '请求失败，请检查网络连接' }]);
    }

    setLoading(false);
  }

  function getDisplayText(msg: Message): string {
    if (msg.displayContent !== undefined) return msg.displayContent;
    if (typeof msg.content === 'string') return msg.content;
    const textPart = msg.content.find(p => p.type === 'text');
    return textPart?.text || '';
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">对话</h1>
        <select
          value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
          className="px-3 py-1.5 border border-input rounded-lg bg-background text-sm"
        >
          {models.map(m => (
            <option key={m.modelId} value={m.modelId}>
              {m.displayName} ({m.provider.displayName})
            </option>
          ))}
          {models.length === 0 && <option value="">暂无可用模型</option>}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto border border-border rounded-xl bg-card p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            选择模型开始对话，支持发送图片和文件
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-xl text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}>
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {msg.attachments.map((att, idx) => (
                    att.type === 'image' ? (
                      <img key={idx} src={att.preview} alt={att.name} className="max-w-[200px] max-h-[150px] rounded-lg object-cover" />
                    ) : (
                      <div key={idx} className="px-2 py-1 bg-black/10 rounded text-xs">
                        📄 {att.name}
                      </div>
                    )
                  ))}
                </div>
              )}
              {getDisplayText(msg) || (loading && i === messages.length - 1 ? '思考中...' : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Attachment preview */}
      {attachments.length > 0 && (
        <div className="mt-2 flex gap-2 flex-wrap">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative">
              {att.type === 'image' ? (
                <img src={att.preview} alt={att.name} className="w-16 h-16 rounded-lg object-cover border border-border" />
              ) : (
                <div className="h-16 px-3 flex items-center gap-1 rounded-lg border border-border bg-secondary text-xs">
                  📄 {att.name.length > 12 ? att.name.slice(0, 12) + '...' : att.name}
                </div>
              )}
              <button
                onClick={() => removeAttachment(idx)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-2 flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.txt,.md,.csv,.json,.py,.js,.ts,.html,.css,.xml,.yaml,.yml,.log,.sql,.sh,.c,.cpp,.java,.go,.rs"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 border border-input rounded-lg text-sm hover:bg-accent"
          title="添加图片或文件"
        >
          📎
        </button>
        <input
          type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="输入消息..."
          className="flex-1 px-4 py-2 border border-input rounded-lg bg-background text-sm"
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || (!input.trim() && attachments.length === 0)}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
          发送
        </button>
      </div>
    </div>
  );
}
