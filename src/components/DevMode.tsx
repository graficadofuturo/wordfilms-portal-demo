import React, { useState, useEffect, useRef } from 'react';
import { SiteData, SectionConfig, StyleConfig } from '../types';
import { Save, Plus, Trash2, ArrowUp, ArrowDown, LogOut, Upload, Loader2, ChevronDown, ChevronUp, Smartphone, Monitor, Eye, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { GOOGLE_FONTS } from '../lib/fonts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DevModeProps {
  data: SiteData;
  onSave: (data: SiteData) => Promise<void>;
  onChange?: (data: SiteData) => void;
  onClose: () => void;
  user: any;
  onLogin?: () => void;
}

const UploadButton = ({ onUpload, label, accept = "image/*", className }: { onUpload: (url: string) => void, label: string, accept?: string, className?: string }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 800px pra evitar exceder os 1MB do documento
          const MAX_SIZE = 800;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress with JPEG at 0.6 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      alert('Para vídeos, por favor utilize plataformas como YouTube ou Vimeo e cole o link no campo de texto. O upload direto de vídeos excede o limite de armazenamento do banco de dados.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024 && !file.type.startsWith('image/')) {
      alert(`O arquivo é muito grande (${(file.size / 1024 / 1024).toFixed(2)} MB). O limite é 2 MB para arquivos que não são imagens.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);

    try {
      if (file.type.startsWith('image/')) {
        const compressedBase64 = await compressImage(file);
        
        // Verifica se mesmo comprimido ficou muito grande (Firestore limit é 1MB, vamos alertar aos 800KB para ter margem)
        if (compressedBase64.length > 800 * 1024) {
             alert('A imagem é muito complexa/grande e excedeu o limite de armazenamento mesmo após compressão. Utilize um link externo.');
        } else {
             onUpload(compressedBase64);
        }
        
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          if (base64String.length > 800 * 1024) {
            alert('Arquivo muito grande para armazenamento direto. Insira um link externo.');
          } else {
            onUpload(base64String);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erro ao processar o arquivo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={cn("flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 whitespace-nowrap min-h-[44px]", className)}
      >
        {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {label}
      </button>
    </>
  );
};

const DebouncedColorInput = ({ value, onChange, className }: { value: string, onChange: (val: string) => void, className?: string }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  return (
    <input 
      type="color"
      value={localValue}
      onChange={handleChange}
      className={className}
    />
  );
};

const CustomDropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  className 
}: { 
  options: { label: string | React.ReactNode, value: string }[], 
  value: string, 
  onChange: (val: string) => void, 
  placeholder: string,
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
        className="w-full flex items-center justify-between text-left bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-1.5 text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all cursor-pointer hover:bg-zinc-800 h-full min-h-[44px]"
        style={{ cursor: 'pointer' }}
      >
        <span className="truncate flex items-center gap-2">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={14} className={cn("ml-2 flex-shrink-0 transition-transform opacity-50", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full max-h-60 overflow-y-auto hidden-scrollbar bg-zinc-900 border border-zinc-700/50 rounded-lg shadow-xl z-[1000]">
          <button
            onClick={(e) => { e.preventDefault(); onChange(''); setIsOpen(false); }}
            className={cn(
              "w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 cursor-pointer transition-colors block",
              !value && "text-emerald-400 bg-zinc-800/50"
            )}
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={(e) => { e.preventDefault(); onChange(opt.value); setIsOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 cursor-pointer transition-colors flex items-center gap-2",
                value === opt.value && "text-emerald-400 bg-zinc-800/50"
              )}
              style={{ cursor: 'pointer' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

import { FiInstagram, FiFacebook, FiTwitter, FiYoutube, FiLinkedin } from 'react-icons/fi';

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  Instagram: FiInstagram,
  Facebook: FiFacebook,
  Twitter: FiTwitter,
  Youtube: FiYoutube,
  Linkedin: FiLinkedin
};

const LEGACY_ICONS: Record<string, string> = {
  Instagram: 'Camera',
  Facebook: 'Share2',
  Twitter: 'Hash',
  Youtube: 'PlaySquare',
  Linkedin: 'Briefcase'
};

const DynamicIconSmall = ({ name }: { name: string }) => {
  const SocialIcon = SOCIAL_ICONS[name];
  if (SocialIcon) return <SocialIcon size={16} />;

  const actualName = LEGACY_ICONS[name] || name;
  const IconComponent = (LucideIcons as any)[actualName];
  if (!IconComponent) return <LucideIcons.HelpCircle size={16} />;
  return <IconComponent size={16} />;
};

const RichTextarea = ({ 
  value, 
  onChange, 
  onSelect, 
  data, 
  context,
  className, 
  minHeight = "80px",
  placeholder,
  previewScale,
  targetWidth
}: { 
  value: string, 
  onChange: (val: string) => void, 
  onSelect: (e: any, context?: string) => void, 
  data: SiteData, 
  context?: string,
  className?: string,
  minHeight?: string,
  placeholder?: string,
  previewScale?: number,
  targetWidth?: number
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0, focused: false });

  useEffect(() => {
    const handleSelectionChange = () => {
      if (textareaRef.current && document.activeElement === textareaRef.current) {
        setSelection({
          start: textareaRef.current.selectionStart,
          end: textareaRef.current.selectionEnd,
          focused: true
        });
        // Update selection in DevMode
        onSelect({ currentTarget: textareaRef.current } as any, context);
      } else if (textareaRef.current && document.activeElement !== textareaRef.current) {
        setSelection(prev => ({ ...prev, focused: false }));
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleSelect = (e: any) => {
    setSelection({
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
      focused: true
    });
    onSelect(e, context);
  };

  const baseFontFamily = data.styles?.fontFamily ? `"${data.styles.fontFamily}", sans-serif` : undefined;

  let globalCharIndex = 0;

  return (
    <div className="relative w-full" style={{ minHeight }}>
      <div 
        ref={preRef}
        className={cn(
          "absolute inset-0 p-5 pointer-events-none overflow-hidden whitespace-pre-wrap break-words border border-transparent rounded-2xl z-0",
          className
        )}
        style={{ 
          minHeight,
          lineHeight: '1',
          fontFamily: baseFontFamily
        }}
        aria-hidden="true"
      >
        {value.split('\n').map((line, lineIdx, linesArray) => {
          const isLastLine = lineIdx === linesArray.length - 1;
          
          let lineLineHeight: string | undefined = undefined;
          // Split by non-word characters but keep them as separate parts
          const parts = line.split(/([^a-zA-Z0-9À-ÿ']+)/).filter(p => p !== '');
          
          for (const part of parts) {
            if (!part.trim()) continue;
            const style = (context && data.wordStyles?.[`${context}:${part}`]) || data.wordStyles?.[part];
            if (style?.lineHeight !== undefined) {
              const formatValue = (val: string | number | undefined) => {
                if (val === undefined || val === '' || String(val).toLowerCase() === 'auto') return undefined;
                
                let pxValue: number | undefined = undefined;
                
                if (typeof val === 'number') {
                  pxValue = val;
                } else if (typeof val === 'string') {
                  if (val.endsWith('vw') && targetWidth) {
                    pxValue = (parseFloat(val) / 100) * targetWidth;
                  } else if (val.endsWith('px')) {
                    pxValue = parseFloat(val);
                  } else if (val.endsWith('em') || val.endsWith('rem')) {
                    pxValue = parseFloat(val) * 16;
                  } else if (/^-?\d*\.?\d+$/.test(val)) {
                    pxValue = parseFloat(val);
                  }
                }
                
                if (pxValue !== undefined) {
                  if (previewScale) {
                    return `${pxValue * previewScale}px`;
                  }
                  return `${pxValue}px`;
                }
                
                return String(val);
              };
              lineLineHeight = formatValue(style.lineHeight);
              break;
            }
          }

          return (
            <div key={lineIdx} className="leading-tight" style={{ marginBottom: lineLineHeight, lineHeight: '1.2', minHeight: '1em' }}>
              {line.split(/([^a-zA-Z0-9À-ÿ']+)/).map((part, i) => {
                if (!part) return null;
                const partStart = globalCharIndex;
                globalCharIndex += part.length;

                if (!part.trim() || !/^[a-zA-Z0-9À-ÿ']+$/.test(part)) {
                  const hasSelection = partStart < selection.end && (partStart + part.length) > selection.start;
                  const hasCaret = selection.start === selection.end && selection.focused && selection.start >= partStart && selection.start <= partStart + part.length;

                  return (
                    <span key={i} style={{ fontFamily: baseFontFamily }} className="relative whitespace-pre">
                      {(hasSelection || hasCaret) && (
                        <div className="absolute inset-0 pointer-events-none">
                          {part.split('').map((char, j) => {
                            const charIndex = partStart + j;
                            const isSelected = charIndex >= selection.start && charIndex < selection.end;
                            const isCaret = charIndex === selection.start && selection.start === selection.end && selection.focused;
                            return (
                              <span key={j} className="relative">
                                {isSelected && <span className="absolute inset-0 bg-emerald-500/30 z-10" />}
                                {isCaret && <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-400 animate-pulse z-20" />}
                                <span className="opacity-0">{char === ' ' ? '\u00A0' : char}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <span className="relative z-0">{part}</span>
                    </span>
                  );
                }
                
                const style = (context && data.wordStyles?.[`${context}:${part}`]) || data.wordStyles?.[part] || {};
                const isOutline = style.isOutline !== undefined ? style.isOutline : data.outlinedWords?.includes(part);
                
                const formatValue = (val: string | number | undefined) => {
                  if (val === undefined || val === '' || String(val).toLowerCase() === 'auto') return undefined;
                  
                  let pxValue: number | undefined = undefined;
                  
                  if (typeof val === 'number') {
                    pxValue = val;
                  } else if (typeof val === 'string') {
                    if (val.endsWith('vw') && targetWidth) {
                      pxValue = (parseFloat(val) / 100) * targetWidth;
                    } else if (val.endsWith('px')) {
                      pxValue = parseFloat(val);
                    } else if (val.endsWith('em') || val.endsWith('rem')) {
                      pxValue = parseFloat(val) * 16;
                    } else if (/^-?\d*\.?\d+$/.test(val)) {
                      pxValue = parseFloat(val);
                    }
                  }
                  
                  if (pxValue !== undefined) {
                    if (previewScale) {
                      const scaledValue = pxValue * previewScale;
                      // Ensure stroke width doesn't disappear into sub-pixel nothingness
                      if (String(val).includes('outlineWidth') || String(val).includes('stroke')) {
                        return `${Math.max(scaledValue, 0.5)}px`;
                      }
                      return `${scaledValue}px`;
                    }
                    return `${pxValue}px`;
                  }
                  
                  return String(val);
                };

                const actualLineHeight = '1';

                const getOutlineStyle = (width: string | undefined, color: string | undefined) => {
                  if (!isOutline) return {};
                  const pxStr = formatValue(width) || formatValue('1.1') || 1.1;
                  const w = parseFloat(pxStr as string) || 1.1;
                  const c = color || '#ffffff';
                  return { 
                    WebkitTextStroke: `${w}px ${c}`,
                    WebkitTextFillColor: '#000000',
                    color: '#000000',
                    mixBlendMode: 'screen' as const,
                    paintOrder: 'stroke fill',
                    WebkitFontSmoothing: 'antialiased' as const,
                    textRendering: 'geometricPrecision' as any,
                    WebkitBackfaceVisibility: 'hidden' as any,
                    backfaceVisibility: 'hidden' as any,
                    letterSpacing: style.letterSpacing ? formatValue(style.letterSpacing) : '0.02em',
                  };
                };

                const hasSelectionInPart = partStart < selection.end && (partStart + part.length) > selection.start;
                const hasCaretInPart = selection.start === selection.end && selection.focused && selection.start >= partStart && selection.start <= partStart + part.length;

                return (
                  <span 
                    key={i} 
                    className={cn("inline-block align-baseline relative whitespace-pre", style.fontWeight)}
                    style={{
                      fontFamily: style.fontFamily ? `"${style.fontFamily}", sans-serif` : undefined,
                      fontSize: formatValue(style.fontSize),
                      lineHeight: actualLineHeight,
                      ...(!isOutline ? { 
                        color: style.color || undefined,
                        letterSpacing: style.letterSpacing ? formatValue(style.letterSpacing) : undefined
                      } : getOutlineStyle(style.outlineWidth, style.color))
                    }}
                  >
                    {/* Background Selection Layer - Only if needed */}
                    {(hasSelectionInPart || hasCaretInPart) && (
                      <div className="absolute inset-0 pointer-events-none" style={{ letterSpacing: isOutline ? (style.letterSpacing ? formatValue(style.letterSpacing) : '0.02em') : (style.letterSpacing ? formatValue(style.letterSpacing) : undefined) }}>
                        {part.split('').map((char, j) => {
                          const charIndex = partStart + j;
                          const isSelected = charIndex >= selection.start && charIndex < selection.end;
                          const isCaret = charIndex === selection.start && selection.start === selection.end && selection.focused;
                          return (
                            <span 
                              key={j} 
                              className="relative"
                            >
                              {isSelected && <span className="absolute inset-0 bg-emerald-500/30 z-20" />}
                              {isCaret && <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-400 animate-pulse z-30" />}
                              <span className="opacity-0">{char === ' ' ? '\u00A0' : char}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {/* Actual Text Layer - Always a single segment for perfect outline */}
                    <span className="relative z-10">{part}</span>
                  </span>
                );
              })}
              {!isLastLine && (() => {
                const charIndex = globalCharIndex;
                globalCharIndex += 1; // for the \n
                const isSelected = charIndex >= selection.start && charIndex < selection.end;
                const isCaret = charIndex === selection.start && selection.start === selection.end && selection.focused;
                return (
                  <span className="relative inline-block w-0">
                    {isSelected && <span className="absolute inset-0 bg-emerald-500/30 -z-10 w-2" />}
                    {isCaret && <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-400 animate-pulse" />}
                  </span>
                );
              })()}
              {isLastLine && selection.start === value.length && selection.start === selection.end && selection.focused && (
                <span className="relative inline-block w-0 h-[1.2em] align-middle">
                  <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-400 animate-pulse" />
                </span>
              )}
              {isLastLine && value.endsWith('\n') ? '\u200b' : ''}
            </div>
          );
        })}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setSelection({
            start: e.target.selectionStart,
            end: e.target.selectionEnd,
            focused: true
          });
        }}
        onSelect={handleSelect}
        onFocus={() => setSelection(prev => ({ ...prev, focused: true }))}
        onBlur={() => setSelection(prev => ({ ...prev, focused: false }))}
        onScroll={handleScroll}
        placeholder={placeholder}
        className={cn(
          "absolute inset-0 w-full h-full border border-zinc-800 rounded-2xl p-5 caret-transparent resize-none outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all z-10 rich-textarea-input",
          className,
          "!bg-transparent !text-transparent"
        )}
        style={{ 
          minHeight,
          lineHeight: '1',
          fontFamily: baseFontFamily
        }}
      />
    </div>
  );
};

const COMMON_ICONS = [
  'Instagram', 'Facebook', 'Twitter', 'Youtube', 'Linkedin',
  'Mail', 'MapPin', 'Phone', 'Globe', 'PlaySquare', 'Briefcase', 'Hash', 'Share2', 
  'MessageSquare', 'Send', 'Camera', 'Video', 'Film', 'Play', 'Smartphone', 'Monitor', 
  'Calendar', 'Clock', 'User', 'Users', 'Heart', 'Star', 'Sparkles', 'Coffee', 'Rocket'
];

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero / Banner',
  works: 'Serviços / Trabalhos',
  about: 'Visão',
  expertise: 'Expertise',
  numbers: 'Números',
  clients: 'Clientes',
  contact: 'Contato'
};

export const DevMode: React.FC<DevModeProps> = ({ data, onSave, onChange, onClose, user, onLogin }) => {
  const [baseData, setBaseData] = useState<SiteData>(data);
  const [mobileData, setMobileData] = useState<Partial<SiteData>>(data.mobileData || {});
  const [isSaving, setIsSaving] = useState(false);
  const [floatingMenu, setFloatingMenu] = useState<{ visible: boolean, words: string[], context?: string }>({ visible: false, words: [] });
  const [expandedBackgrounds, setExpandedBackgrounds] = useState<Record<string, boolean>>({});
  const [expandedSpacing, setExpandedSpacing] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showDesktopPreview, setShowDesktopPreview] = useState(false);
  const [desktopPreviewScale, setDesktopPreviewScale] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const desktopIframeRef = useRef<HTMLIFrameElement>(null);
  const desktopPreviewContainerRef = useRef<HTMLDivElement>(null);

  const localData = React.useMemo(() => 
    viewMode === 'mobile' ? { ...baseData, ...mobileData } as SiteData : baseData,
    [baseData, mobileData, viewMode]
  );

  const lastSavedData = useRef(JSON.stringify({ ...baseData, mobileData }));

  useEffect(() => {
    // Sync external data changes (e.g. initial load from Firebase after refresh)
    const incomingObj = { ...data, mobileData: data.mobileData || {} };
    
    const incomingStr = JSON.stringify(incomingObj);
    if (incomingStr !== lastSavedData.current) {
      setBaseData(data);
      setMobileData(data.mobileData || {});
      lastSavedData.current = incomingStr;
    }
  }, [data]);

  useEffect(() => {
    const currentDataObj = { ...baseData, mobileData };
    const currentDataString = JSON.stringify(currentDataObj);
    
    if (currentDataString === lastSavedData.current) return;

    const timer = setTimeout(() => {
      lastSavedData.current = currentDataString;
      onSave(currentDataObj).catch(console.error);
    }, 1000);

    return () => clearTimeout(timer);
  }, [baseData, mobileData, onSave]);

  useEffect(() => {
    if (!desktopPreviewContainerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const scale = Math.min(width / 1920, height / 1080);
        setDesktopPreviewScale(scale);
      }
    });
    
    observer.observe(desktopPreviewContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const getEffectiveStyleForMenu = (word: string, field: string, context?: string) => {
    if (!word) return '';
    const styleKey = context ? `${context}:${word}` : word;
    const style = (localData.wordStyles as any)?.[styleKey] || (localData.wordStyles as any)?.[word] || {};
    const val = style[field];
    
    const targetWidth = viewMode === 'mobile' ? 375 : 1920;

    const toPx = (input: any, baseSize?: number): string => {
      if (input === undefined || input === '') return '';
      const str = String(input);
      if (str.endsWith('vw')) {
        return Math.round((parseFloat(str) / 100) * targetWidth) + 'px';
      }
      if (str.endsWith('vh')) {
        return Math.round((parseFloat(str) / 100) * 1080) + 'px';
      }
      if (str.endsWith('em') || str.endsWith('rem')) {
        const factor = parseFloat(str);
        return Math.round(factor * (baseSize || 16)) + 'px';
      }
      if (/^-?\d*\.?\d+$/.test(str)) {
        return str + 'px';
      }
      return str;
    };

    // Helper to get font size for em conversions
    const getBaseFontSize = () => {
      const fontSize = (localData.wordStyles as any)?.[styleKey]?.fontSize || (localData.wordStyles as any)?.[word]?.fontSize;
      if (fontSize) {
        const px = toPx(fontSize);
        return parseFloat(px) || 16;
      }
      if (context?.toLowerCase().includes('title')) return viewMode === 'mobile' ? 56 : 211;
      return 18;
    };

    if (val !== undefined && val !== '') {
      if (field === 'fontSize' || field === 'outlineWidth' || field === 'letterSpacing' || field === 'lineHeight') {
        return toPx(val, getBaseFontSize());
      }
      return val;
    }

    // Default fallbacks based on site data and context
    if (field === 'fontFamily') {
      const base = localData.styles?.fontFamily;
      if (base === 'font-sans') return 'Montserrat';
      return base || '';
    }

    if (field === 'fontWeight') {
      const ctx = context || '';
      // Section Titles and Hero are Black
      if (ctx === 'hero.title' || ctx === 'about.title' || ctx === 'works.title' || ctx === 'expertise.title' || ctx === 'numbers.title' || ctx === 'contact.title') {
        return 'font-black';
      }
      // Value numbers are also Black
      if (ctx.includes('.value')) return 'font-black';
      
      // Hero subtitle is specifically Light
      if (ctx === 'hero.subtitle') return 'font-light';

      // Item titles and labels are Bold
      if (ctx.includes('.title') || ctx.includes('.label') || ctx.includes('category') || ctx.includes('name')) {
        return 'font-bold';
      }
      
      // Subtitles and descriptions are Normal
      if (ctx.includes('subtitle') || ctx.includes('description') || ctx.includes('content')) {
        return 'font-normal';
      }
      
      return localData.styles?.fontWeight || 'font-normal';
    }

    if (field === 'fontSize') {
      if (context?.toLowerCase().includes('title')) return toPx(viewMode === 'mobile' ? '15vw' : '11vw');
      if (context?.toLowerCase().includes('hero')) return toPx(viewMode === 'mobile' ? '15vw' : '11vw');
      if (context?.toLowerCase().includes('label') || context?.toLowerCase().includes('name')) return '24px';
      return '18px';
    }

    if (field === 'lineHeight') {
      // In this theme, lineHeight is used as a gap/margin-bottom
      if (context?.toLowerCase().includes('title')) return '10px';
      return '5px';
    }

    if (field === 'letterSpacing') {
      if (context?.toLowerCase().includes('title')) return toPx('0.02em', getBaseFontSize());
      return '0px';
    }

    if (field === 'color') {
      return '#ffffff';
    }

    if (field === 'isOutline') {
      return (localData.outlinedWords || []).includes(word);
    }

    if (field === 'outlineWidth') {
      return '1.5px';
    }
    
    return '';
  };

  const setLocalData = (newData: SiteData | ((prev: SiteData) => SiteData)) => {
    if (typeof newData === 'function') {
      newData = newData(localData);
    }
    
    if (viewMode === 'mobile') {
      // Quando estamos no modo mobile, queremos salvar apenas o que mudou em relação ao baseData
      // Mas para simplificar e garantir que o preview funcione, salvamos o objeto inteiro no mobileData
      // O App.tsx já sabe lidar com isso fazendo { ...data, ...data.mobileData }
      setMobileData(newData);
    } else {
      // No modo desktop, atualizamos o baseData
      setBaseData(newData);
      
      // Se houver mobileData, precisamos decidir se queremos que a alteração do desktop 
      // também reflita no mobile. Geralmente sim, a menos que o mobile tenha um override específico.
      // Para manter simples: se o usuário alterou no desktop, a gente limpa o mobileData 
      // ou tenta mesclar. Vamos apenas atualizar o baseData por enquanto.
    }
  };

  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'DEV_MODE_PREVIEW_UPDATE', data: localData }, '*');
    }
    if (desktopIframeRef.current?.contentWindow) {
      desktopIframeRef.current.contentWindow.postMessage({ type: 'DEV_MODE_PREVIEW_UPDATE', data: localData }, '*');
    }
  }, [localData, viewMode]);

  const handleTextSelect = (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>, context?: string) => {
    const input = e.currentTarget;
    let start = input.selectionStart;
    let end = input.selectionEnd;
    
    if (start !== null && end !== null && start !== end) {
      const text = input.value;
      let selectedText = text.substring(start, end);
      
      let modified = false;
      while ((selectedText.endsWith(' ') || selectedText.endsWith('\n')) && end > start) {
        end--;
        selectedText = text.substring(start, end);
        modified = true;
      }
      while ((selectedText.startsWith(' ') || selectedText.startsWith('\n')) && end > start) {
        start++;
        selectedText = text.substring(start, end);
        modified = true;
      }

      if (modified && start < end) {
        input.setSelectionRange(start, end);
      }

      selectedText = text.substring(start, end).trim();
      
      if (selectedText.length > 0) {
        // Get all unique words in the selection using the same logic as RichTextarea
        const selectedWords = selectedText.split(/[^a-zA-Z0-9À-ÿ']+/).filter(w => w.length > 0);
        
        if (selectedWords.length > 0) {
          setFloatingMenu({ visible: true, words: Array.from(new Set(selectedWords)), context });
          return;
        }
      }
    }
    setFloatingMenu({ ...floatingMenu, visible: false });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const currentDataObj = { ...baseData, mobileData };
      lastSavedData.current = JSON.stringify(currentDataObj);
      await onSave(currentDataObj);
    } catch (error) {
      console.error(error);
      alert("Error saving data");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSection = (id: string, updates: Partial<SectionConfig>) => {
    setLocalData(prev => {
      const sections = prev.sections || [];
      return {
        ...prev,
        sections: sections.map(s => s.id === id ? { ...s, ...updates } : s)
      };
    });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setLocalData(prev => {
      const sections = [...(prev.sections || [])];
      if (index + direction < 0 || index + direction >= sections.length) return prev;
      
      const temp = sections[index];
      sections[index] = sections[index + direction];
      sections[index + direction] = temp;
      
      // Update order property
      sections.forEach((s, i) => s.order = i + 1);
      
      return { ...prev, sections };
    });
  };

  const updatePortfolio = (index: number, field: string, value: string) => {
    setLocalData(prev => {
      const portfolio = [...prev.portfolio];
      portfolio[index] = { ...portfolio[index], [field]: value };
      return { ...prev, portfolio };
    });
  };

  const addPortfolioItem = () => {
    setLocalData(prev => ({
      ...prev,
      portfolio: [
        ...prev.portfolio,
        { id: Date.now().toString(), title: "New Item", videoUrl: "", imageUrl: "", category: "NEW" }
      ]
    }));
  };

  const removePortfolioItem = (index: number) => {
    setLocalData(prev => {
      const portfolio = [...prev.portfolio];
      portfolio.splice(index, 1);
      return { ...prev, portfolio };
    });
  };

  const updateService = (index: number, field: string, value: string) => {
    setLocalData(prev => {
      const services = [...prev.services];
      services[index] = { ...services[index], [field]: value };
      return { ...prev, services };
    });
  };

  const addService = () => {
    setLocalData(prev => ({
      ...prev,
      services: [
        ...prev.services,
        { id: Date.now().toString(), title: "NOVA EXPERTISE", description: "Descrição da expertise aqui." }
      ]
    }));
  };

  const removeService = (index: number) => {
    setLocalData(prev => {
      const services = [...prev.services];
      services.splice(index, 1);
      return { ...prev, services };
    });
  };

  const updateClient = (index: number, field: string, value: string) => {
    setLocalData(prev => {
      const newClients = [...(prev.clients || [])];
      newClients[index] = { ...newClients[index], [field]: value };
      return { ...prev, clients: newClients };
    });
  };

  const removeClient = (index: number) => {
    setLocalData(prev => ({
      ...prev,
      clients: (prev.clients || []).filter((_, i) => i !== index)
    }));
  };

  const addClient = () => {
    setLocalData(prev => ({
      ...prev,
      clients: [
        ...(prev.clients || []),
        { id: Date.now().toString(), imageUrl: "https://picsum.photos/seed/logo/200/100", name: "Novo Cliente" }
      ]
    }));
  };

  const updateNumberItem = (index: number, field: string, value: string) => {
    setLocalData(prev => {
      const newNumbers = [...(prev.numbers || [])];
      newNumbers[index] = { ...newNumbers[index], [field]: value };
      return { ...prev, numbers: newNumbers };
    });
  };

  const removeNumberItem = (index: number) => {
    setLocalData(prev => ({
      ...prev,
      numbers: (prev.numbers || []).filter((_, i) => i !== index)
    }));
  };

  const addNumberItem = () => {
    setLocalData(prev => ({
      ...prev,
      numbers: [
        ...(prev.numbers || []),
        { id: Date.now().toString(), value: "0", label: "NOVO ITEM" }
      ]
    }));
  };

  const renderEstrutura = () => (
    <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50 backdrop-blur-sm">
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-6 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
        Estrutura do Site
      </h2>
      <div className="space-y-3">
        {(localData.sections || []).sort((a, b) => a.order - b.order).map((section, index) => (
          <div key={section.id} className="space-y-2">
            <div className="group flex items-center justify-between bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/30 hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    checked={section.visible} 
                    onChange={e => updateSection(section.id, { visible: e.target.checked })}
                    className="peer appearance-none w-5 h-5 border-2 border-zinc-700 rounded-md checked:bg-emerald-500 checked:border-emerald-500 transition-all cursor-pointer"
                  />
                  <svg className="absolute w-3 h-3 text-black pointer-events-none hidden peer-checked:block left-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">
                  {SECTION_LABELS[section.type] || section.type}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => moveSection(index, -1)} disabled={index === 0} className="p-2 text-zinc-500 hover:text-emerald-400 disabled:opacity-10 transition-colors">
                  <ArrowUp size={14} />
                </button>
                <button onClick={() => moveSection(index, 1)} disabled={index === (localData.sections?.length || 0) - 1} className="p-2 text-zinc-500 hover:text-emerald-400 disabled:opacity-10 transition-colors">
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>
            <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-700/20">
              <button 
                onClick={() => setExpandedBackgrounds(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                className="w-full flex items-center justify-between group/bg"
              >
                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover/bg:text-zinc-300 transition-colors cursor-pointer">Background da Seção</label>
                <div className="text-zinc-600 group-hover/bg:text-emerald-500 transition-colors">
                  {expandedBackgrounds[section.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {expandedBackgrounds[section.id] && (
                <div className="space-y-4 mt-4 pt-4 border-t border-zinc-800/50">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Tipo de Background</label>
                    <div className="grid grid-cols-3 gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                      {(['image', 'color', 'gradient'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => updateSection(section.id, { bgType: type })}
                          className={`py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${section.bgType === type ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-white'}`}
                        >
                          {type === 'image' ? 'Imagem' : type === 'color' ? 'Cor' : 'Degradê'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {section.bgType === 'image' && (
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Imagem de Fundo</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="URL da Imagem"
                          value={section.bgImageUrl || ''} 
                          onChange={e => updateSection(section.id, { bgImageUrl: e.target.value })}
                          className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-[10px] text-zinc-400 focus:border-emerald-500/50 outline-none"
                        />
                        <UploadButton 
                          label="Upload" 
                          onUpload={(url) => updateSection(section.id, { bgImageUrl: url })} 
                        />
                        {section.bgImageUrl && (
                          <button 
                            onClick={() => updateSection(section.id, { bgImageUrl: "" })}
                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                            title="Remover Background"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {section.bgType === 'color' && (
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Cor Sólida</label>
                      <div className="flex items-center gap-3">
                        <DebouncedColorInput 
                          value={section.bgColor || '#000000'} 
                          onChange={val => updateSection(section.id, { bgColor: val })}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0 overflow-hidden"
                        />
                        <input 
                          type="text" 
                          value={section.bgColor || '#000000'} 
                          onChange={e => updateSection(section.id, { bgColor: e.target.value })}
                          className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-[10px] text-zinc-400 focus:border-emerald-500/50 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {section.bgType === 'gradient' && (
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Degradê (CSS)</label>
                      <textarea 
                        placeholder="Ex: linear-gradient(to right, #000, #333)"
                        value={section.bgGradient || ''} 
                        onChange={e => updateSection(section.id, { bgGradient: e.target.value })}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-[10px] text-zinc-400 focus:border-emerald-500/50 outline-none min-h-[60px] font-mono"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500">Opacidade: {section.bgOpacity}%</label>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={section.bgOpacity ?? 50} 
                      onChange={e => updateSection(section.id, { bgOpacity: parseInt(e.target.value) })}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-700/20">
              <button 
                onClick={() => setExpandedSpacing(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                className="w-full flex items-center justify-between group/bg"
              >
                <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover/bg:text-zinc-300 transition-colors cursor-pointer">Espaçamento da Seção</label>
                <div className="text-zinc-600 group-hover/bg:text-emerald-500 transition-colors">
                  {expandedSpacing[section.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {expandedSpacing[section.id] && (
                <div className="mt-4 pt-4 border-t border-zinc-700/30 space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Espaçamento Superior (px)</label>
                     <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        step="4"
                        value={section.paddingTop ?? 64} 
                        onChange={e => updateSection(section.id, { paddingTop: parseInt(e.target.value) })}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <span className="text-xs text-zinc-400 w-8">{section.paddingTop ?? 'Auto'}</span>
                     </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">Espaçamento Inferior (px)</label>
                     <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        step="4"
                        value={section.paddingBottom ?? 64} 
                        onChange={e => updateSection(section.id, { paddingBottom: parseInt(e.target.value) })}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <span className="text-xs text-zinc-400 w-8">{section.paddingBottom ?? 'Auto'}</span>
                     </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => updateSection(section.id, { paddingTop: undefined, paddingBottom: undefined })}
                      className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      Resetar para Auto
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {floatingMenu.visible && floatingMenu.words.length > 0 && (
        <div 
          className="fixed z-[200] bg-zinc-900/90 border border-zinc-700/50 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center p-2 gap-3 text-sm backdrop-blur-xl ring-1 ring-white/10"
          style={{ bottom: '40px', left: '50%', transform: 'translateX(-50%)' }}
        >
          <CustomDropdown 
            className="w-40 ml-1"
            placeholder="Fonte Padrão"
            options={GOOGLE_FONTS.map(f => ({ label: f, value: f }))}
            value={floatingMenu.words.length > 0 ? getEffectiveStyleForMenu(floatingMenu.words[0], 'fontFamily', floatingMenu.context) : ''}
            onChange={(val) => {
              const newStyles = { ...localData.wordStyles };
              floatingMenu.words.forEach(word => {
                const key = floatingMenu.context ? `${floatingMenu.context}:${word}` : word;
                newStyles[key] = { ...newStyles[key], fontFamily: val };
              });
              setLocalData({ ...localData, wordStyles: newStyles });
            }}
          />

          <CustomDropdown 
            className="w-32"
            placeholder="Peso Padrão"
            options={[
              { label: 'Light', value: 'font-light' },
              { label: 'Regular', value: 'font-normal' },
              { label: 'Medium', value: 'font-medium' },
              { label: 'Bold', value: 'font-bold' },
              { label: 'Black', value: 'font-black' },
            ]}
            value={floatingMenu.words.length > 0 ? getEffectiveStyleForMenu(floatingMenu.words[0], 'fontWeight', floatingMenu.context) : ''}
            onChange={(val) => {
              const newStyles = { ...localData.wordStyles };
              floatingMenu.words.forEach(word => {
                const key = floatingMenu.context ? `${floatingMenu.context}:${word}` : word;
                newStyles[key] = { ...newStyles[key], fontWeight: val };
              });
              setLocalData({ ...localData, wordStyles: newStyles });
            }}
          />

          <div className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-1.5 group" title="Tamanho da Fonte">
            <span className="text-zinc-500 font-serif italic group-focus-within:text-emerald-400 transition-colors">T</span>
            <input 
              type="text"
              className="bg-transparent w-12 text-white outline-none text-center focus:text-emerald-400 transition-colors"
              placeholder="24px"
              value={floatingMenu.words.length > 0 ? getEffectiveStyleForMenu(floatingMenu.words[0], 'fontSize', floatingMenu.context) : ''}
              onChange={(e) => {
                const newStyles = { ...localData.wordStyles };
                floatingMenu.words.forEach(word => {
                  const key = floatingMenu.context ? `${floatingMenu.context}:${word}` : word;
                  newStyles[key] = { ...newStyles[key], fontSize: e.target.value };
                });
                setLocalData({ ...localData, wordStyles: newStyles });
              }}
            />
          </div>

          <div className="relative group">
            <DebouncedColorInput 
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0 overflow-hidden"
              value={floatingMenu.words.length > 0 ? getEffectiveStyleForMenu(floatingMenu.words[0], 'color', floatingMenu.context) : '#ffffff'}
              onChange={(val) => {
                const newStyles = { ...localData.wordStyles };
                floatingMenu.words.forEach(word => {
                  const key = floatingMenu.context ? `${floatingMenu.context}:${word}` : word;
                  newStyles[key] = { ...newStyles[key], color: val };
                });
                setLocalData({ ...localData, wordStyles: newStyles });
              }}
            />
          </div>

          <div className="h-6 w-px bg-zinc-700/50 mx-1"></div>

          <div className="flex bg-zinc-800/50 p-1 rounded-lg border border-zinc-700/50">
            <button
              onClick={(e) => {
                e.preventDefault();
                const newStyles = { ...localData.wordStyles };
                floatingMenu.words.forEach(word => {
                  const key = floatingMenu.context ? `${floatingMenu.context}:${word}` : word;
                  newStyles[key] = { ...newStyles[key], isOutline: false };
                });
                setLocalData({ ...localData, wordStyles: newStyles });
              }}
              className={cn(
                "p-1.5 px-2.5 rounded-md transition-all",
                (() => {
                  if (floatingMenu.words.length === 0) return false;
                  const word = floatingMenu.words[0];
                  const isOutline = getEffectiveStyleForMenu(word, 'isOutline', floatingMenu.context);
                  return !isOutline;
                })() ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
              )}
              title="Texto Sólido"
            >
              <span className="font-black text-xs uppercase">Solid</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                const newStyles = { ...localData.wordStyles };
                floatingMenu.words.forEach(word => {
                  const key = floatingMenu.context ? `${floatingMenu.context}:${word}` : word;
                  newStyles[key] = { ...newStyles[key], isOutline: true };
                });
                setLocalData({ ...localData, wordStyles: newStyles });
              }}
              className={cn(
                "p-1.5 px-2.5 rounded-md transition-all",
                (() => {
                  if (floatingMenu.words.length === 0) return false;
                  const word = floatingMenu.words[0];
                  const isOutline = getEffectiveStyleForMenu(word, 'isOutline', floatingMenu.context);
                  return isOutline;
                })() ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
              )}
              title="Texto Outline"
            >
              <span className="font-black text-xs uppercase">Outline</span>
            </button>
          </div>

          {(() => {
            if (floatingMenu.words.length === 0) return false;
            const word = floatingMenu.words[0];
            return getEffectiveStyleForMenu(word, 'isOutline', floatingMenu.context);
          })() && (
            <div className="flex items-center gap-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-2 py-1.5 group" title="Espessura do Outline (Ex: 1px, 2px)">
              <span className="text-zinc-500 group-focus-within:text-emerald-400 transition-colors text-base" style={{ WebkitTextStroke: '1px currentColor', color: 'transparent' }}>O</span>
              <input 
                type="text"
                className="bg-transparent w-12 text-white outline-none text-center focus:text-emerald-400 transition-colors"
                placeholder="1px"
                value={floatingMenu.words.length > 0 ? getEffectiveStyleForMenu(floatingMenu.words[0], 'outlineWidth', floatingMenu.context) : ''}
                onChange={(e) => {
                  const newStyles = { ...localData.wordStyles };
                  floatingMenu.words.forEach(word => {
                    const key = floatingMenu.context ? `${floatingMenu.context}:${word}` : word;
                    newStyles[key] = { ...newStyles[key], outlineWidth: e.target.value };
                  });
                  setLocalData({ ...localData, wordStyles: newStyles });
                }}
              />
            </div>
          )}

          <div className="h-6 w-px bg-zinc-700/50 mx-1"></div>

          <div className="flex items-center gap-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-2 py-1.5 group" title="Espaçamento Inferior">
            <span className="text-zinc-500 group-focus-within:text-emerald-400 transition-colors text-base">⤓</span>
            <input 
              type="text"
              className="bg-transparent w-12 text-white outline-none text-center focus:text-emerald-400 transition-colors"
              placeholder="0px"
              value={floatingMenu.words.length > 0 ? getEffectiveStyleForMenu(floatingMenu.words[0], 'lineHeight', floatingMenu.context) : ''}
              onChange={(e) => {
                const newStyles = { ...localData.wordStyles };
                floatingMenu.words.forEach(word => {
                  const key = floatingMenu.context ? `${floatingMenu.context}:${word}` : word;
                  newStyles[key] = { ...newStyles[key], lineHeight: e.target.value };
                });
                setLocalData({ ...localData, wordStyles: newStyles });
              }}
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-2 py-1.5 group" title="Espaçamento Horizontal">
            <span className="text-zinc-500 group-focus-within:text-emerald-400 transition-colors text-base">↔</span>
            <input 
              type="text"
              className="bg-transparent w-12 text-white outline-none text-center focus:text-emerald-400 transition-colors"
              placeholder="0px"
              value={floatingMenu.words.length > 0 ? getEffectiveStyleForMenu(floatingMenu.words[0], 'letterSpacing', floatingMenu.context) : ''}
              onChange={(e) => {
                const newStyles = { ...localData.wordStyles };
                floatingMenu.words.forEach(word => {
                  const key = floatingMenu.context ? `${floatingMenu.context}:${word}` : word;
                  newStyles[key] = { ...newStyles[key], letterSpacing: e.target.value };
                });
                setLocalData({ ...localData, wordStyles: newStyles });
              }}
            />
          </div>
          
          <button 
            onClick={(e) => { e.preventDefault(); setFloatingMenu({ visible: false, words: [] }); }}
            className="ml-1 p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      )}
      <div className="fixed inset-0 bg-zinc-950 z-[100] overflow-y-auto text-white font-sans selection:bg-emerald-500/30">
        <div className="sticky top-0 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 p-4 flex justify-between items-center z-50 px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center">
            <span className="text-black font-black text-xs">WF</span>
          </div>
          <h1 className="text-lg font-black tracking-tighter uppercase italic">Dev Mode <span className="text-emerald-500">CMS</span></h1>
        </div>
        
        <div className="flex items-center bg-zinc-900/50 rounded-lg p-1 border border-zinc-800/50">
          <button
            onClick={() => setViewMode('desktop')}
            className={cn(
              "px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all",
              viewMode === 'desktop' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Monitor size={14} /> Desktop
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={cn(
              "px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all",
              viewMode === 'mobile' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Smartphone size={14} /> Mobile
          </button>
        </div>

        <div className="flex gap-4 items-center">
          <button onClick={onClose} className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors">
            <LogOut size={16} /> Sair
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Save size={16} /> {isSaving ? 'Salvando...' : 'Publicar Alterações'}
          </button>
        </div>
      </div>

      <div className="p-8 md:p-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Mobile Preview) */}
        <div className={cn("lg:col-span-4 space-y-8 relative hidden lg:block", viewMode !== 'mobile' && '!hidden')}>
          <div className="sticky top-24 flex justify-center">
            {/* Phone Frame */}
            <div className="w-[391px] h-[716px] bg-black rounded-[3rem] border-[8px] border-zinc-800 relative overflow-hidden shadow-2xl ring-1 ring-white/10">
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-6 bg-zinc-800 rounded-b-3xl w-40 mx-auto z-50"></div>
              <iframe 
                ref={iframeRef}
                src="/?preview=true&device=mobile"
                className="absolute inset-0 w-full h-full border-0 bg-black"
                onLoad={() => {
                  if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage({ type: 'DEV_MODE_PREVIEW_UPDATE', data: localData }, '*');
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Left Column (Desktop Estrutura) */}
        <div className={cn("lg:col-span-4 space-y-8", viewMode !== 'desktop' && 'hidden lg:hidden')}>
          {renderEstrutura()}
        </div>

        {/* Right Column: Editing Options */}
        <div className={cn("space-y-8", viewMode === 'mobile' ? "lg:col-span-8" : "lg:col-span-8 lg:col-start-5")}>
          {viewMode === 'mobile' && renderEstrutura()}

          {/* Edição de Conteúdo - Hero */}
          <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Seção Hero
            </h2>
            <div className="grid grid-cols-1 gap-8">
              <div className="relative">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Título Principal</label>
                <RichTextarea 
                  value={localData.hero.title} 
                  onChange={val => setLocalData({ ...localData, hero: { ...localData.hero, title: val } })}
                  onSelect={handleTextSelect}
                  data={localData}
                  context="hero.title"
                  minHeight="120px"
                  className="bg-zinc-950/50 font-black uppercase tracking-tighter text-2xl"
                  previewScale={viewMode === 'mobile' ? 0.43 : 0.11}
                  targetWidth={viewMode === 'mobile' ? 375 : 1920}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Subtítulo / Descrição</label>
                <RichTextarea 
                  value={localData.hero.subtitle} 
                  onChange={val => setLocalData({ ...localData, hero: { ...localData.hero, subtitle: val } })}
                  onSelect={handleTextSelect}
                  data={localData}
                  context="hero.subtitle"
                  minHeight="100px"
                  className="bg-zinc-950/50 text-lg"
                  previewScale={viewMode === 'mobile' ? 2.25 : 0.75}
                  targetWidth={viewMode === 'mobile' ? 375 : 1920}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">URL do Vídeo de Fundo</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Cole o link do YouTube, Vimeo, ou arquivo .mp4"
                    value={localData.hero.videoUrl} 
                    onChange={e => setLocalData({ ...localData, hero: { ...localData.hero, videoUrl: e.target.value } })}
                    className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 text-zinc-400 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                  />
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">Vídeos devem ser inseridos via link (YouTube/Vimeo) devido a limitações de peso do site.</p>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Tamanho da Logo (Ex: 200px)</label>
                <input 
                  type="text" 
                  value={(() => {
                    const val = localData.hero.logoSize || '';
                    if (/^\d+$/.test(val)) return val + 'px';
                    return val;
                  })()} 
                  onChange={e => {
                    let val = e.target.value;
                    if (val.endsWith('px') && /^\d+px$/.test(val)) {
                      val = val.replace('px', '');
                    }
                    setLocalData({ ...localData, hero: { ...localData.hero, logoSize: val } });
                  }}
                  placeholder="Ex: 200px"
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 text-white text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Edição de Conteúdo - Nossos Trabalhos */}
          <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Portfólio
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Título da Seção (Trabalhos)</label>
                <RichTextarea 
                  value={localData.worksTitle || "Nossos Trabalhos"} 
                  onChange={val => setLocalData({ ...localData, worksTitle: val })}
                  onSelect={handleTextSelect}
                  data={localData}
                  context="works.title"
                  minHeight="80px"
                  className="bg-zinc-950/50 font-black uppercase tracking-tight text-xl"
                  previewScale={viewMode === 'mobile' ? 0.42 : 0.15}
                  targetWidth={viewMode === 'mobile' ? 375 : 1920}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Alinhamento do Título</label>
                <div className="grid grid-cols-3 gap-2 bg-zinc-800/30 p-1 rounded-xl border border-zinc-700/30">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => setLocalData({ ...localData, sectionStyles: { ...localData.sectionStyles, works: { ...localData.sectionStyles?.works, titleAlign: align } } })}
                      className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${localData.sectionStyles?.works?.titleAlign === align ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/10' : 'text-zinc-500 hover:text-white'}`}
                    >
                      {align === 'left' ? 'Esq' : align === 'center' ? 'Meio' : 'Dir'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {localData.portfolio.map((item, index) => (
                <div key={item.id} className="group bg-zinc-950/30 p-6 rounded-2xl border border-zinc-800/50 relative hover:border-emerald-500/20 transition-all">
                  <button onClick={() => removePortfolioItem(index)} className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-10">
                    <div className="flex flex-col">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Título do Projeto</label>
                      <RichTextarea 
                        value={item.title} 
                        onChange={val => updatePortfolio(index, 'title', val)}
                        onSelect={handleTextSelect}
                        data={localData}
                        context={`portfolio.${index}.title`}
                        minHeight="60px"
                        className="bg-zinc-900/50 font-bold uppercase tracking-tight text-base"
                        previewScale={viewMode === 'mobile' ? 0.67 : 0.44}
                        targetWidth={viewMode === 'mobile' ? 375 : 1920}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Categoria</label>
                      <RichTextarea 
                        value={item.category} 
                        onChange={val => updatePortfolio(index, 'category', val)}
                        onSelect={handleTextSelect}
                        data={localData}
                        context={`portfolio.${index}.category`}
                        minHeight="60px"
                        className="bg-zinc-900/50 font-bold uppercase tracking-[0.2em] text-[10px]"
                        previewScale={0.83}
                        targetWidth={viewMode === 'mobile' ? 375 : 1920}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">URL da Thumbnail (Imagem)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={item.imageUrl} 
                          onChange={e => updatePortfolio(index, 'imageUrl', e.target.value)}
                          className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-zinc-500 text-[10px] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                        />
                        <UploadButton 
                          label="Upload" 
                          onUpload={(url) => updatePortfolio(index, 'imageUrl', url)} 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">URL do Vídeo (Vimeo/Direct)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Link YouTube/Vimeo"
                          value={item.videoUrl} 
                          onChange={e => updatePortfolio(index, 'videoUrl', e.target.value)}
                          className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-zinc-500 text-[10px] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addPortfolioItem}
                className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] mt-6"
              >
                <Plus size={16} /> Adicionar Trabalho
              </button>
            </div>
          </div>

          {/* Edição de Conteúdo - Visão */}
          <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Sobre / Visão
            </h2>
            <div className="grid grid-cols-1 gap-8">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Título da Seção</label>
                <RichTextarea 
                  value={localData.about.title} 
                  onChange={val => setLocalData({ ...localData, about: { ...localData.about, title: val } })}
                  onSelect={handleTextSelect}
                  data={localData}
                  context="about.title"
                  minHeight="80px"
                  className="bg-zinc-950/50 font-black uppercase tracking-tight text-xl"
                  previewScale={viewMode === 'mobile' ? 0.42 : 0.15}
                  targetWidth={viewMode === 'mobile' ? 375 : 1920}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Texto Principal</label>
                <RichTextarea 
                  value={localData.about.content} 
                  onChange={val => setLocalData({ ...localData, about: { ...localData.about, content: val } })}
                  onSelect={handleTextSelect}
                  data={localData}
                  context="about.content"
                  minHeight="160px"
                  className="bg-zinc-950/50 text-zinc-300 text-lg leading-tight"
                  previewScale={viewMode === 'mobile' ? 1 : 0.9}
                  targetWidth={viewMode === 'mobile' ? 375 : 1920}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">URL da Imagem</label>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={localData.about.imageUrl} 
                      onChange={e => setLocalData({ ...localData, about: { ...localData.about, imageUrl: e.target.value } })}
                      className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 text-zinc-400 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                    />
                    <UploadButton 
                      label="Upload Imagem" 
                      onUpload={(url) => setLocalData({ ...localData, about: { ...localData.about, imageUrl: url } })} 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Largura da Imagem (px)</label>
                  <input 
                    type="number" 
                    value={localData.about.imageWidth || ''} 
                    onChange={e => setLocalData({ ...localData, about: { ...localData.about, imageWidth: parseInt(e.target.value) || 0 } })}
                    placeholder="Ex: 550"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 text-zinc-400 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Altura da Imagem (px)</label>
                  <input 
                    type="number" 
                    value={localData.about.imageHeight || ''} 
                    onChange={e => setLocalData({ ...localData, about: { ...localData.about, imageHeight: parseInt(e.target.value) || 0 } })}
                    placeholder="Ex: 750"
                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 text-zinc-400 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Edição de Conteúdo - Expertise */}
          <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Expertise
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Título da Seção</label>
                <RichTextarea 
                  value={localData.expertiseTitle || "Expertise"} 
                  onChange={val => setLocalData({ ...localData, expertiseTitle: val })}
                  onSelect={handleTextSelect}
                  data={localData}
                  context="expertise.title"
                  minHeight="80px"
                  className="bg-zinc-950/50 font-black uppercase tracking-tight text-xl"
                  previewScale={viewMode === 'mobile' ? 0.42 : 0.15}
                  targetWidth={viewMode === 'mobile' ? 375 : 1920}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Alinhamento do Título</label>
                <div className="grid grid-cols-3 gap-2 bg-zinc-800/30 p-1 rounded-xl border border-zinc-700/30">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => setLocalData({ ...localData, sectionStyles: { ...localData.sectionStyles, expertise: { ...localData.sectionStyles?.expertise, titleAlign: align } } })}
                      className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${localData.sectionStyles?.expertise?.titleAlign === align ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/10' : 'text-zinc-500 hover:text-white'}`}
                    >
                      {align === 'left' ? 'Esq' : align === 'center' ? 'Meio' : 'Dir'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {localData.services.map((service, index) => (
                <div key={service.id} className="group bg-zinc-950/30 p-6 rounded-2xl border border-zinc-800/50 relative hover:border-emerald-500/20 transition-all">
                  <button onClick={() => removeService(index)} className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                  <div className="grid grid-cols-1 gap-6 pr-10">
                    <div className="flex flex-col">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Título da Expertise</label>
                      <RichTextarea 
                        value={service.title} 
                        onChange={val => updateService(index, 'title', val.toUpperCase())}
                        onSelect={handleTextSelect}
                        data={localData}
                        context={`expertise.${index}.title`}
                        minHeight="60px"
                        className="bg-zinc-900/50 font-bold uppercase tracking-tight text-base"
                        previewScale={viewMode === 'mobile' ? 0.67 : 0.44}
                        targetWidth={viewMode === 'mobile' ? 375 : 1920}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Descrição</label>
                      <RichTextarea 
                        value={service.description} 
                        onChange={val => updateService(index, 'description', val)}
                        onSelect={handleTextSelect}
                        data={localData}
                        context={`expertise.${index}.description`}
                        minHeight="100px"
                        className="bg-zinc-900/50 text-zinc-400 text-sm leading-tight"
                        previewScale={1}
                        targetWidth={viewMode === 'mobile' ? 375 : 1920}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addService}
                className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] mt-6"
              >
                <Plus size={16} /> Adicionar Expertise
              </button>
            </div>
          </div>

          {/* Edição de Conteúdo - Números */}
          <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Números
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Título da Seção</label>
                <RichTextarea 
                  value={localData.numbersTitle || "NÚMEROS\n2025"} 
                  onChange={val => setLocalData({ ...localData, numbersTitle: val })}
                  onSelect={handleTextSelect}
                  data={localData}
                  context="numbers.title"
                  minHeight="80px"
                  className="bg-zinc-950/50 font-black uppercase tracking-tight text-xl"
                  previewScale={viewMode === 'mobile' ? 0.42 : 0.15}
                  targetWidth={viewMode === 'mobile' ? 375 : 1920}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Alinhamento do Título</label>
                <div className="grid grid-cols-3 gap-2 bg-zinc-800/30 p-1 rounded-xl border border-zinc-700/30">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => setLocalData({ ...localData, sectionStyles: { ...localData.sectionStyles, numbers: { ...localData.sectionStyles?.numbers, titleAlign: align } } })}
                      className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${localData.sectionStyles?.numbers?.titleAlign === align ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/10' : 'text-zinc-500 hover:text-white'}`}
                    >
                      {align === 'left' ? 'Esq' : align === 'center' ? 'Meio' : 'Dir'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {(localData.numbers || []).map((item, index) => (
                <div key={item.id} className="group bg-zinc-950/30 p-6 rounded-2xl border border-zinc-800/50 relative hover:border-emerald-500/20 transition-all">
                  <button onClick={() => removeNumberItem(index)} className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-10 items-stretch">
                    <div className="flex flex-col">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Valor Numérico</label>
                      <input 
                        type="text" 
                        value={item.value} 
                        onChange={e => updateNumberItem(index, 'value', e.target.value)}
                        placeholder="Ex: 93"
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-white text-2xl font-light focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none h-[60px]"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Rótulo / Label</label>
                      <input 
                        type="text" 
                        value={item.label} 
                        onChange={e => updateNumberItem(index, 'label', e.target.value)}
                        placeholder="Ex: PRODUÇÕES"
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-zinc-400 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none uppercase tracking-wider h-[60px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addNumberItem}
                className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] mt-6"
              >
                <Plus size={16} /> Adicionar Número
              </button>
            </div>
          </div>

          {/* Edição de Conteúdo - Clientes */}
          <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Clientes
            </h2>

            <div className="space-y-6">
              {(localData.clients || []).map((client, index) => (
                <div key={client.id} className="group bg-zinc-950/30 p-6 rounded-2xl border border-zinc-800/50 relative hover:border-emerald-500/20 transition-all flex flex-col md:flex-row gap-6 items-center">
                  <button onClick={() => removeClient(index)} className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 transition-colors z-10">
                    <Trash2 size={18} />
                  </button>
                  
                  <div className="w-full md:w-1/3 flex flex-col items-center gap-4">
                    <div className="w-full h-24 bg-black rounded-lg border border-zinc-800 flex items-center justify-center p-4 overflow-hidden relative group/img">
                      {client.imageUrl && (
                        <img src={client.imageUrl} alt={client.name || 'Logo'} className="max-w-full max-h-full object-contain filter grayscale group-hover/img:grayscale-0 transition-all duration-300" />
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-2/3 flex flex-col gap-4">
                    <div className="w-full">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">URL da Imagem</label>
                      <input 
                        type="text" 
                        value={client.imageUrl} 
                        onChange={e => updateClient(index, 'imageUrl', e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-zinc-400 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                      />
                    </div>
                    <div className="w-full">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Nome do Cliente (Opcional)</label>
                      <div className="flex gap-3 items-stretch">
                        <input 
                          type="text" 
                          value={client.name || ''} 
                          onChange={e => updateClient(index, 'name', e.target.value)}
                          placeholder="Ex: Itaú"
                          className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-white text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                        />
                        <UploadButton 
                          onUpload={(url) => updateClient(index, 'imageUrl', url)} 
                          label="LOGO" 
                          className="h-auto min-h-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addClient}
                className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] mt-6"
              >
                <Plus size={16} /> Adicionar Cliente
              </button>
            </div>
          </div>

          {/* Edição de Conteúdo - Contato */}
          <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800/50 backdrop-blur-sm">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Contato
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Título da Seção</label>
                <RichTextarea 
                  value={localData.contactTitle || "Let's Create"} 
                  onChange={val => setLocalData({ ...localData, contactTitle: val })}
                  onSelect={handleTextSelect}
                  data={localData}
                  context="contact.title"
                  minHeight="80px"
                  className="bg-zinc-950/50 font-black uppercase tracking-tight text-xl"
                  previewScale={viewMode === 'mobile' ? 0.42 : 0.15}
                  targetWidth={viewMode === 'mobile' ? 375 : 1920}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Alinhamento do Título</label>
                <div className="grid grid-cols-3 gap-2 bg-zinc-800/30 p-1 rounded-xl border border-zinc-700/30">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => setLocalData({ ...localData, sectionStyles: { ...localData.sectionStyles, contact: { ...localData.sectionStyles?.contact, titleAlign: align } } })}
                      className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${localData.sectionStyles?.contact?.titleAlign === align ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/10' : 'text-zinc-500 hover:text-white'}`}
                    >
                      {align === 'left' ? 'Esq' : align === 'center' ? 'Meio' : 'Dir'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {(localData.contact.items || [
                { id: "1", label: "Email", value: localData.contact.email, link: `mailto:${localData.contact.email}`, icon: "Mail" },
                { id: "2", label: "Instagram", value: localData.contact.instagram, link: `https://instagram.com/${localData.contact.instagram.replace('@', '')}`, icon: "Instagram" },
                { id: "3", label: "Localização", value: localData.contact.address, link: "", icon: "MapPin" }
              ]).map((item, index) => (
                <div key={item.id} className="bg-zinc-950/30 p-6 rounded-2xl border border-zinc-800/50 relative group">
                  <button 
                    onClick={() => {
                      const newItems = (localData.contact.items || []).filter(i => i.id !== item.id);
                      setLocalData({ ...localData, contact: { ...localData.contact, items: newItems } });
                    }}
                    className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pr-10">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Rótulo</label>
                      <input 
                        type="text" 
                        value={item.label} 
                        onChange={e => {
                          const newItems = (localData.contact.items || []).map((i, idx) => idx === index ? { ...i, label: e.target.value } : i);
                          setLocalData({ ...localData, contact: { ...localData.contact, items: newItems } });
                        }}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-white text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Valor</label>
                      <input 
                        type="text" 
                        value={item.value} 
                        onChange={e => {
                          const newItems = (localData.contact.items || []).map((i, idx) => idx === index ? { ...i, value: e.target.value } : i);
                          setLocalData({ ...localData, contact: { ...localData.contact, items: newItems } });
                        }}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-white text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Link</label>
                      <input 
                        type="text" 
                        value={item.link} 
                        onChange={e => {
                          const newItems = (localData.contact.items || []).map((i, idx) => idx === index ? { ...i, link: e.target.value } : i);
                          setLocalData({ ...localData, contact: { ...localData.contact, items: newItems } });
                        }}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-white text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all outline-none"
                        placeholder="mailto: ou https://"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">Ícone</label>
                      <CustomDropdown
                        value={item.icon}
                        onChange={(val) => {
                          const newItems = (localData.contact.items || []).map((i, idx) => idx === index ? { ...i, icon: val } : i);
                          setLocalData({ ...localData, contact: { ...localData.contact, items: newItems } });
                        }}
                        placeholder="Ícone"
                        options={Array.from(new Set([item.icon, ...COMMON_ICONS])).filter(Boolean).map(icon => ({
                          value: icon,
                          label: <><DynamicIconSmall name={icon} /> <span>{icon}</span></>
                        }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => {
                  const newItems = [...(localData.contact.items || []), { id: Date.now().toString(), label: "Novo", value: "", link: "", icon: "Mail" }];
                  setLocalData({ ...localData, contact: { ...localData.contact, items: newItems } });
                }}
                className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px]"
              >
                <Plus size={16} /> Adicionar Item
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="h-20"></div> {/* Bottom spacer */}

      {/* Floating Preview Button */}
      {viewMode === 'desktop' && (
        <button
          onClick={() => setShowDesktopPreview(true)}
          className="fixed bottom-8 right-8 z-[9999] w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all hover:scale-105 active:scale-95"
          title="Preview Desktop"
        >
          <Eye size={24} />
        </button>
      )}
    </div>

    {/* Desktop Preview Modal */}
    <div 
      className={cn(
        "fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6",
        !showDesktopPreview && "hidden"
      )}
    >
      <div 
        className="w-full bg-zinc-950 rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-zinc-800 ring-1 ring-white/10"
        style={{ maxWidth: 'calc((100vh - 3rem - 48px) * 16 / 9)' }}
      >
          <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <Monitor size={14} className="text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Preview Desktop</span>
            </div>
            <button 
              onClick={() => setShowDesktopPreview(false)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div ref={desktopPreviewContainerRef} className="w-full bg-black relative overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
            <div 
              style={{
                width: 1920,
                height: 1080,
                transform: `scale(${desktopPreviewScale})`,
                transformOrigin: 'center',
                position: 'absolute'
              }}
              className="bg-white flex-shrink-0"
            >
              <iframe 
                ref={desktopIframeRef}
                src="/?preview=true&device=desktop"
                className="w-full h-full border-0"
                onLoad={(e) => {
                  if (e.currentTarget.contentWindow) {
                    e.currentTarget.contentWindow.postMessage({ type: 'DEV_MODE_PREVIEW_UPDATE', data: localData }, '*');
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
