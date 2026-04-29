import React, { useState, useEffect, useCallback, Component, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView, animate } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { 
  Play, 
  Pause, 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Camera, 
  Mail, 
  MapPin, 
  ChevronDown,
  Lock,
  LogOut,
  Settings,
  Menu
} from 'lucide-react';
import { Logo } from './components/Logo';
import { AnimatedBackground } from './components/AnimatedBackground';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SiteData, DEFAULT_SITE_DATA, PortfolioItem, ServiceItem } from './types';
import { subscribeToSiteData, updateSiteData, loginWithGoogle, logout, auth, initializeSiteData } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ClientPortal } from './components/ClientPortal';
import { PricingWizard } from './components/PricingWizard';
import { DevMode } from './components/DevMode';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- COMPONENTS ---

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  state: { hasError: boolean, error: any };
  props: { children: React.ReactNode };
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <h2 className="text-4xl font-black uppercase mb-4">Something went wrong</h2>
            <p className="text-zinc-500 mb-8">
              {this.state.error?.message?.includes('{') 
                ? "A database error occurred. Please check your permissions." 
                : "An unexpected error occurred."}
            </p>
            <pre className="text-red-500 text-left text-xs overflow-auto max-h-64 mb-8">
              {this.state.error?.toString()}
              {'\n'}
              {this.state.error?.stack}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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

const DynamicIcon = ({ name, size = 32, className }: { name: string, size?: number, className?: string }) => {
  const SocialIcon = SOCIAL_ICONS[name];
  if (SocialIcon) return <SocialIcon size={size} className={className} />;

  const actualName = LEGACY_ICONS[name] || name;
  const IconComponent = (LucideIcons as any)[actualName];
  if (!IconComponent) return <LucideIcons.HelpCircle size={size} className={className} />;
  return <IconComponent size={size} className={className} />;
};

const DottedBlur = ({ className }: { className?: string }) => (
  <div 
    className={cn("absolute blur-[40px] opacity-60 pointer-events-none z-0", className)}
    style={{
      maskImage: 'radial-gradient(circle, black 1.5px, transparent 1.5px)',
      WebkitMaskImage: 'radial-gradient(circle, black 1.5px, transparent 1.5px)',
      maskSize: '12px 12px',
      WebkitMaskSize: '12px 12px'
    }}
  >
    <div className="w-full h-full bg-white/20 rounded-full animate-pulse" />
  </div>
);

const StyledText = ({ text, data, className, context, cursor }: { text: string, data: SiteData, className?: string, context?: string, cursor?: React.ReactNode }) => {
  const formatValue = (val: string | number | undefined) => {
    if (val === undefined || val === '' || String(val).toLowerCase() === 'auto') return undefined;
    if (typeof val === 'number') return `${val}px`;
    if (/^-?\d*\.?\d+$/.test(val)) return `${val}px`;
    return val;
  };

  const lines = text.split('\n');

  return (
    <span className={cn("block", className)}>
      {lines.map((line, lineIdx) => {
        const parts = line.split(/([^a-zA-Z0-9À-ÿ']+)/);
        
        // Find line-level styles from the first word that has them
        let lineLineHeight: string | undefined = undefined;
        for (const part of parts) {
          if (!/^[a-zA-Z0-9À-ÿ']+$/.test(part)) continue;
          const style = (context && data.wordStyles?.[`${context}:${part}`]) || data.wordStyles?.[part];
          if (style?.lineHeight !== undefined) {
            lineLineHeight = formatValue(style.lineHeight);
            break;
          }
        }

        return (
          <span key={lineIdx} className="block" style={{ marginBottom: lineLineHeight, lineHeight: '1.2' }}>
            {parts.map((word, i) => {
              if (!word) return null;
              
              if (!/^[a-zA-Z0-9À-ÿ']+$/.test(word)) {
                return <span key={i}>{word}</span>;
              }
              
              const style = (context && data.wordStyles?.[`${context}:${word}`]) || data.wordStyles?.[word] || {};
              const isOutline = style.isOutline !== undefined ? style.isOutline : data.outlinedWords?.includes(word);
              
              if (Object.keys(style).length === 0 && !isOutline) {
                return <span key={i}>{word}</span>;
              }

              const getOutlineStyle = (width: string | undefined, color: string | undefined) => {
                if (!isOutline) return {};
                const w = parseFloat(formatValue(width) || '1.1') || 1.1;
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
                  backfaceVisibility: 'hidden' as any
                };
              };

              return (
                <span 
                  key={i} 
                  className={cn("inline-block align-baseline leading-none", style.fontWeight)}
                  style={{
                    fontFamily: style.fontFamily ? `"${style.fontFamily}", sans-serif` : undefined,
                    fontSize: formatValue(style.fontSize),
                    ...(!isOutline ? { color: style.color || undefined } : getOutlineStyle(style.outlineWidth, style.color)),
                    lineHeight: '1',
                    letterSpacing: style.letterSpacing ? formatValue(style.letterSpacing) : (isOutline ? '0.02em' : undefined),
                  }}
                >
                  {word}
                </span>
              );
            })}
            {lineIdx === lines.length - 1 && cursor}
            {line === '' && <span className="inline-block">&nbsp;</span>}
          </span>
        );
      })}
    </span>
  );
};

const SectionTitle = ({ children, outline, className, align = 'left' }: { children: React.ReactNode, outline?: boolean, className?: string, align?: 'left' | 'center' | 'right' }) => (
  <motion.h2 
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className={cn(
      "font-black tracking-tight uppercase mb-6 md:mb-10 break-words max-w-full w-full",
      outline ? "text-outline" : "text-white",
      className || "text-5xl md:text-8xl",
      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
    )}
  >
    {children}
  </motion.h2>
);

const AnimatedCounter = ({ value, className, style }: { value: string, className?: string, style?: React.CSSProperties }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  
  useEffect(() => {
    if (inView && ref.current) {
      const match = value.match(/^([^\d]*)(\d+)([^\d]*)$/);
      
      if (match) {
        const prefix = match[1];
        const numericValue = parseInt(match[2], 10);
        const suffix = match[3];
        const startValue = Math.max(0, numericValue - 20);
        
        animate(startValue, numericValue, {
          duration: 2,
          ease: "easeOut",
          onUpdate: (latest) => {
            if (ref.current) ref.current.textContent = `${prefix}${Math.round(latest)}${suffix}`;
          }
        });
      } else {
        ref.current.textContent = value;
      }
    }
  }, [inView, value]);

  const previewMatch = value.match(/^([^\d]*)(\d+)([^\d]*)$/);
  const initialNumeric = previewMatch ? Math.max(0, parseInt(previewMatch[2], 10) - 20) : null;
  const initialDisplay = previewMatch ? `${previewMatch[1]}${initialNumeric}${previewMatch[3]}` : value;

  return (
    <span ref={ref} className={className} style={style}>
      {initialDisplay}
    </span>
  );
};

const RevealText = ({ text, className }: { text: string, className?: string }) => {
  const words = text.split(" ");
  return (
    <div className={cn("overflow-hidden flex flex-wrap", className)}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ y: "100%" }}
          whileInView={{ y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
          className="mr-[0.3em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

const TypingText = ({ text, data, context, className }: { text: string, data: SiteData, context?: string, className?: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  useEffect(() => {
    if (isInView) {
      setDisplayedText("");
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
        }
      }, 20); // Velocidade estilo CMD
      return () => clearInterval(interval);
    }
  }, [isInView, text]);

  const cursor = (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, ease: (t) => (t < 0.5 ? 0 : 1) }}
      className="inline-block ml-1 w-[1px] h-[1.2em] bg-white align-middle"
    />
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <StyledText text={displayedText} data={data} context={context} cursor={cursor} />
    </div>
  );
};

const ServiceCard = ({ service, index, isEditable, data, setData, className }: { key?: React.Key, service: any, index: number, isEditable: boolean, data: any, setData: any, className?: string }) => {
  const ref = useRef(null);
  // Reduzimos a área de intersecção para o meio exato da tela (margem de -45% em cima e embaixo)
  // Isso garante que apenas um card por vez fique no centro no mobile
  const isCentered = useInView(ref, { margin: "-45% 0px -45% 0px" });

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      className={cn(
        "backdrop-blur-sm p-6 md:p-12 transition-colors duration-500 group flex flex-row md:flex-col items-center md:items-start gap-6 md:gap-10",
        // Mobile: brilha quando centralizado
        isCentered ? "bg-zinc-900/60" : "bg-black/40",
        // Desktop: ignora o isCentered e usa apenas o hover
        "md:bg-black/40 md:hover:bg-zinc-900/60",
        className
      )}
    >
      <span className={cn(
        "text-5xl md:text-7xl font-black mb-0 block shrink-0 transition-colors duration-500",
        // Mobile
        isCentered ? "text-white" : "text-zinc-700",
        // Desktop
        "md:text-zinc-700 md:group-hover:text-white"
      )}>
        0{index + 1}
      </span>
      <div className="flex-1 w-full">
        {isEditable ? (
          <div className="space-y-4">
            <input 
              value={service.title}
              onChange={(e) => {
                const newServices = [...data.services];
                newServices[index].title = e.target.value.toUpperCase();
                setData({ ...data, services: newServices });
              }}
              className="bg-transparent text-xl md:text-2xl font-bold uppercase tracking-tight focus:outline-none border-b border-white/20 w-full"
            />
            <textarea 
              value={service.description}
              onChange={(e) => {
                const newServices = [...data.services];
                newServices[index].description = e.target.value;
                setData({ ...data, services: newServices });
              }}
              className="bg-transparent text-zinc-500 text-sm md:text-base leading-relaxed focus:outline-none border border-white/10 p-2 rounded w-full h-24"
            />
          </div>
        ) : (
          <>
            <h3 className="text-xl md:text-2xl font-bold uppercase mb-1 md:mb-2">
              <StyledText text={service.title} data={data} context={`expertise.${index}.title`} />
            </h3>
            <p className={cn(
              "text-sm md:text-base leading-tight transition-colors duration-500",
              // Mobile
              isCentered ? "text-zinc-400" : "text-zinc-500",
              // Desktop
              "md:text-zinc-500 md:group-hover:text-zinc-400"
            )}>
              <StyledText text={service.description} data={data} context={`expertise.${index}.description`} />
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
};

const AdminModal = ({ 
  isOpen, 
  onClose, 
  onVerify, 
  isVerified, 
  user, 
  onLogin, 
  onLogout 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onVerify: (key: string) => void,
  isVerified: boolean,
  user: User | null,
  onLogin: () => void,
  onLogout: () => void
}) => {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key === (process.env.VITE_ADMIN_MASTER_KEY || "wordfilms2026")) {
      onVerify(key);
      setError("");
    } else {
      setError("Invalid Master Key");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl w-full max-w-md relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <Lock className="text-white" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white uppercase tracking-widest">Dev Mode</h3>
          <p className="text-zinc-500 text-sm mt-2">Enter the master key to access administrative features.</p>
        </div>

        {!isVerified ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="password" 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="MASTER KEY"
              className="w-full bg-zinc-800 border border-zinc-700 text-white p-4 rounded-xl focus:outline-none focus:border-white transition-colors text-center tracking-widest"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors uppercase tracking-widest"
            >
              Unlock
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
              <p className="text-zinc-400 text-xs uppercase tracking-widest mb-2">Status</p>
              <div className="flex items-center justify-between">
                <span className="text-emerald-500 font-bold text-sm uppercase">Verified</span>
                <span className="text-zinc-500 text-xs">{user?.email || "Not Signed In"}</span>
              </div>
            </div>

            {!user ? (
              <button 
                onClick={onLogin}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
              >
                Sign in with Google
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-zinc-400 text-xs text-center">You are now authorized to edit the site content.</p>
                <button 
                  onClick={onLogout}
                  className="w-full bg-zinc-800 text-white font-bold py-4 rounded-xl hover:bg-zinc-700 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <LogOut size={18} /> Sign Out
                </button>
                <button 
                  onClick={onClose}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors uppercase tracking-widest"
                >
                  Enter Editor
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [data, setData] = useState<SiteData>(DEFAULT_SITE_DATA);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [backgroundVisible, setBackgroundVisible] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'portal' | 'wizard' | 'dev'>('home');
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auth listener
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      document.body.classList.add('is-scrolling');
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 200); // 200ms after last scroll event
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
      document.body.classList.remove('is-scrolling');
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        initializeSiteData();
      }
    });
    return () => unsubscribe();
  }, []);

  // Data listener
  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
    if (isPreview) return;

    const unsubscribe = subscribeToSiteData((newData) => {
      setData(newData);
    });
    initializeSiteData();
    return () => unsubscribe();
  }, []);

  // PostMessage listener for DevMode preview
  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
    const isIframe = window !== window.parent;
    if (!isPreview || !isIframe) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DEV_MODE_PREVIEW_UPDATE') {
        setData(event.data.data);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const isPreviewMobile = new URLSearchParams(window.location.search).get('device') === 'mobile';
  const shouldShowMobile = isMobileScreen || isPreviewMobile;

  const activeData = React.useMemo(() => 
    shouldShowMobile && data.mobileData ? { ...data, ...data.mobileData } : data,
    [shouldShowMobile, data]
  );

  // Hotkey for Dev Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check URL for mode=dev
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#/dev') {
        setCurrentView('dev');
      } else if (window.location.hash === '#/portal') {
        setCurrentView('portal');
      } else if (window.location.hash === '#/wizard') {
        setCurrentView('wizard');
      } else {
        setCurrentView('home');
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // initial check
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Dynamically load Google Fonts
  useEffect(() => {
    const loadFont = (font: string) => {
      if (font && !font.startsWith('font-')) {
        const linkId = `google-font-${font.replace(/\s+/g, '-')}`;
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
          document.head.appendChild(link);
        }
      }
    };

    if (activeData.styles?.fontFamily) {
      loadFont(activeData.styles.fontFamily);
    }

    if (activeData.wordStyles) {
      Object.values(activeData.wordStyles).forEach((style: any) => {
        if (style.fontFamily) {
          loadFont(style.fontFamily);
        }
      });
    }
  }, [activeData.styles?.fontFamily, activeData.wordStyles]);

  const handleUpdate = async (newData: SiteData) => {
    setIsSaving(true);
    try {
      await updateSiteData(newData);
    } catch (err) {
      console.error(err);
      alert("Error saving data. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const isEditable = isVerified && user?.email === "graficadfuturo@gmail.com";

  // Force background visible for other views
  useEffect(() => {
    if (currentView !== 'home') {
      setBackgroundVisible(true);
    }
  }, [currentView]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  return (
    <ErrorBoundary>
      <div className="relative bg-black text-white min-h-screen font-sans selection:bg-white selection:text-black overflow-y-auto overflow-x-hidden">
      <AnimatedBackground isVisible={backgroundVisible} />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-12 py-8 bg-black/20 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Logo className="w-12 h-auto" />
            <span className="text-xl font-black tracking-tighter uppercase hidden md:block">Word Films</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-8"
          >
            <div className="hidden md:flex gap-8 text-[10px] font-bold uppercase tracking-[0.3em]">
              {currentView === 'home' ? (
                <>
                  {(activeData.sections || DEFAULT_SITE_DATA.sections!)
                    .filter(s => s.visible && s.type !== 'hero')
                    .sort((a, b) => a.order - b.order)
                    .map(section => {
                      const labels: Record<string, string> = {
                        works: 'Serviços',
                        about: 'Visão',
                        expertise: 'Expertise',
                        numbers: 'Números',
                        clients: 'Clientes',
                        contact: 'Contato'
                      };
                      return (
                        <a 
                          key={section.id} 
                          href={`#${section.type}`} 
                          className="hover:text-zinc-400 transition-colors"
                        >
                          {labels[section.type] || section.type}
                        </a>
                      );
                    })}
                </>
              ) : (
                <button onClick={() => setCurrentView('home')} className="hover:text-zinc-400 transition-colors uppercase tracking-[0.3em]">INÍCIO</button>
              )}
              <button onClick={() => setCurrentView('wizard')} className="hover:text-zinc-400 transition-colors text-emerald-400 uppercase tracking-[0.3em]">ORÇAMENTO</button>
              <button onClick={() => setCurrentView('portal')} className="hover:text-zinc-400 transition-colors uppercase tracking-[0.3em]">PORTAL</button>
            </div>
            <button className="md:hidden">
              <Menu size={24} />
            </button>
          </motion.div>
        </div>
      </nav>

      {/* Admin Controls */}
      <AnimatePresence>
        {isEditable && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-[90] bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30">
                Live Editor Active
              </div>
              <span className="text-zinc-500 text-xs">Logged in as {user?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsVerified(false)}
                className="text-zinc-400 hover:text-white text-xs uppercase tracking-widest transition-colors"
              >
                Exit Editor
              </button>
              <button 
                onClick={() => handleUpdate(data)}
                disabled={isSaving}
                className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : <><Save size={14} /> Save Changes</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onVerify={() => setIsVerified(true)}
        isVerified={isVerified}
        user={user}
        onLogin={loginWithGoogle}
        onLogout={logout}
      />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {currentView === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "linear" }}
            className="min-h-screen"
          >
            <div 
              className={activeData.styles?.fontFamily?.startsWith('font-') ? activeData.styles.fontFamily : ''}
              style={activeData.styles?.fontFamily && !activeData.styles.fontFamily.startsWith('font-') ? { fontFamily: `"${activeData.styles.fontFamily}", sans-serif` } : {}}
            >
          {(activeData.sections || DEFAULT_SITE_DATA.sections!).filter(s => s.visible).sort((a, b) => a.order - b.order).map(section => {
            const customPadding: React.CSSProperties = {};
            if (section.paddingTop !== undefined) customPadding.paddingTop = `${section.paddingTop}px`;
            if (section.paddingBottom !== undefined) customPadding.paddingBottom = `${section.paddingBottom}px`;

            const bgType = section.bgType || (section.bgImageUrl ? 'image' : undefined);
            const sectionBg = bgType ? (
              <div 
                className="absolute inset-0 z-[-1] pointer-events-none overflow-hidden"
                style={{ opacity: (section.bgOpacity ?? 50) / 100 }}
              >
                {bgType === 'image' && section.bgImageUrl && (
                  <>
                    <img 
                      src={section.bgImageUrl || undefined} 
                      alt="" 
                      className="w-full h-full object-cover grayscale"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                  </>
                )}
                {bgType === 'color' && section.bgColor && (
                  <div className="w-full h-full" style={{ backgroundColor: section.bgColor }} />
                )}
                {bgType === 'gradient' && section.bgGradient && (
                  <div className="w-full h-full" style={{ background: section.bgGradient }} />
                )}
              </div>
            ) : null;

            switch (section.type) {
              case 'hero':
                return (
                  <section key="hero" style={customPadding} className="relative h-screen w-full overflow-hidden flex items-center justify-center z-10">
                    {sectionBg}
        <div className="absolute inset-0 z-0">
          {activeData.hero.videoUrl && (
            <div className="w-full h-full opacity-40 grayscale relative overflow-hidden">
              {activeData.hero.videoUrl.includes('vimeo.com') ? (
                <iframe 
                  src={`https://player.vimeo.com/video/${activeData.hero.videoUrl.includes('player.vimeo.com') ? activeData.hero.videoUrl.split('video/')[1]?.split('?')[0] : activeData.hero.videoUrl.split('vimeo.com/')[1]?.split('?')[0]}?background=1&autoplay=1&loop=1&byline=0&title=0`}
                  className="absolute top-1/2 left-1/2 w-[150vw] h-[150vh] -translate-x-1/2 -translate-y-1/2 object-cover pointer-events-none"
                  allow="autoplay; fullscreen"
                />
              ) : activeData.hero.videoUrl.includes('youtube.com') || activeData.hero.videoUrl.includes('youtu.be') ? (
                 <iframe 
                  src={`https://www.youtube.com/embed/${activeData.hero.videoUrl.includes('youtu.be') ? activeData.hero.videoUrl.split('youtu.be/')[1]?.split('?')[0] : (activeData.hero.videoUrl.split('v=')[1]?.split('&')[0] || activeData.hero.videoUrl.split('embed/')[1]?.split('?')[0])}?autoplay=1&mute=1&controls=0&loop=1&playlist=${activeData.hero.videoUrl.includes('youtu.be') ? activeData.hero.videoUrl.split('youtu.be/')[1]?.split('?')[0] : (activeData.hero.videoUrl.split('v=')[1]?.split('&')[0] || activeData.hero.videoUrl.split('embed/')[1]?.split('?')[0])}`}
                  className="absolute top-1/2 left-1/2 w-[150vw] h-[150vh] -translate-x-1/2 -translate-y-1/2 object-cover pointer-events-none"
                  allow="autoplay"
                />
              ) : (
                <video 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="w-full h-full object-cover"
                  src={activeData.hero.videoUrl}
                />
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            onAnimationComplete={() => setBackgroundVisible(true)}
            className="flex flex-col items-center gap-[10px] w-full"
          >
            <Logo 
              className={cn(
                (!activeData.hero.logoSize) ? "w-32 md:w-48" : 
                ((activeData.hero.logoSize.includes('px') || /^\d+$/.test(activeData.hero.logoSize)) ? "" : activeData.hero.logoSize),
                "h-auto"
              )} 
              style={{
                width: (activeData.hero.logoSize && (/^\d+$/.test(activeData.hero.logoSize) || activeData.hero.logoSize.includes('px'))) 
                  ? (/^\d+$/.test(activeData.hero.logoSize) ? `${activeData.hero.logoSize}px` : activeData.hero.logoSize) 
                  : undefined,
                height: 'auto',
                minHeight: 'auto'
              }}
            />
            {isEditable ? (
              <input 
                value={activeData.hero.title}
                onChange={(e) => setData({ ...data, hero: { ...data.hero, title: e.target.value.toUpperCase() } })}
                className="bg-transparent text-center text-[15vw] md:text-[11vw] font-black uppercase focus:outline-none border-b border-white/20 max-w-full leading-none"
              />
            ) : (
              <h1 className="flex flex-col justify-center items-center font-black uppercase leading-[0.9] text-[15vw] md:text-[11vw]">
                {activeData.hero.title.split('\n').map((line, lineIdx) => {
                  const words = line.split(/\s+/).filter(w => w.trim());
                  let lineMarginBottom: string | undefined = undefined;
                  
                  const formatValue = (val: string | number | undefined) => {
                    if (val === undefined || val === '' || String(val).toLowerCase() === 'auto') return undefined;
                    if (typeof val === 'number') return `${val}px`;
                    if (/^-?\d*\.?\d+$/.test(val)) return `${val}px`;
                    return val;
                  };

                  for (const word of words) {
                    const style = activeData.wordStyles?.[word];
                    if (style?.lineHeight !== undefined) {
                      lineMarginBottom = formatValue(style.lineHeight);
                      break;
                    }
                  }

                  return (
                    <div 
                      key={lineIdx} 
                      className="flex flex-row flex-wrap justify-center items-baseline gap-x-[0.05em] md:gap-x-[0.1em]"
                      style={{ marginBottom: lineMarginBottom }}
                    >
                      {line.split(/\s+/).map((word, i) => {
                        if (!word.trim()) return null;
                        const style = (activeData.wordStyles?.[`hero.title:${word}`]) || activeData.wordStyles?.[word] || {};
                        const isOutline = style.isOutline !== undefined ? style.isOutline : activeData.outlinedWords?.includes(word);
                        
                        const actualLineHeight = '1';

                        const getOutlineStyle = (width: string | undefined, color: string | undefined) => {
                          if (!isOutline) return {};
                          const w = parseFloat(formatValue(width) || '1.2') || 1.2;
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
                            backfaceVisibility: 'hidden' as any
                          };
                        };

                        return (
                          <div 
                            key={i} 
                            className={cn("inline-block align-baseline leading-none whitespace-nowrap", style.fontWeight)}
                            style={{
                              fontFamily: style.fontFamily ? `"${style.fontFamily}", sans-serif` : undefined,
                              fontSize: formatValue(style.fontSize),
                              lineHeight: actualLineHeight,
                              letterSpacing: style.letterSpacing ? formatValue(style.letterSpacing) : (isOutline ? '0.02em' : undefined),
                              ...(!isOutline ? { color: style.color || undefined } : getOutlineStyle(style.outlineWidth, style.color))
                            }}
                          >
                            {word}
                          </div>
                      );
                    })}
                  </div>
                );
              })}
              </h1>
            )}
            
            <div>
              {isEditable ? (
                <input 
                  value={activeData.hero.subtitle}
                  onChange={(e) => setData({ ...data, hero: { ...data.hero, subtitle: e.target.value.toUpperCase() } })}
                  className="bg-transparent text-center text-[8px] md:text-2xl font-light tracking-[0.5em] uppercase focus:outline-none border-b border-white/20 w-full max-w-md"
                />
              ) : (
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="text-[8px] md:text-2xl font-light tracking-[0.5em] uppercase -mr-[0.5em]"
                >
                  <StyledText text={activeData.hero.subtitle} data={activeData} context="hero.subtitle" />
                </motion.p>
              )}
            </div>
          </motion.div>
          
          {isEditable && (
            <div className="mt-8">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Background Video URL</p>
              <input 
                value={activeData.hero.videoUrl}
                onChange={(e) => setData({ ...data, hero: { ...data.hero, videoUrl: e.target.value } })}
                className="bg-zinc-900/50 border border-zinc-800 text-zinc-400 p-2 rounded text-xs w-full max-w-md focus:outline-none focus:border-white"
              />
            </div>
          )}
        </div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50"
        >
          <ChevronDown size={32} />
        </motion.div>
                  </section>
                );
              case 'works':
                return (
                  <section key="works" id="works" style={customPadding} className={`${activeData.styles?.spacing || 'py-16 md:py-32'} px-4 md:px-12 bg-transparent relative z-10 w-full overflow-hidden`}>
                    {sectionBg}
        <div className="max-w-screen-2xl mx-auto relative z-10">
          <div className="flex items-end justify-between mb-10 md:mb-20">
            <SectionTitle align={activeData.sectionStyles?.works?.titleAlign || 'left'} className={activeData.styles?.titleSize === 'text-4xl md:text-6xl' ? 'text-5xl md:text-[7vw] lg:text-8xl' : activeData.styles?.titleSize}>
              <StyledText text={activeData.worksTitle || "Nossos Trabalhos"} data={activeData} context="works.title" />
            </SectionTitle>
            {isEditable && (
              <button 
                onClick={() => {
                  const newItem: PortfolioItem = {
                    id: Date.now().toString(),
                    title: "NEW PROJECT",
                    videoUrl: "",
                    imageUrl: "https://picsum.photos/seed/new/1920/1080",
                    category: "CATEGORY"
                  };
                  setData({ ...data, portfolio: [...data.portfolio, newItem] });
                }}
                className="bg-zinc-800 text-white p-4 rounded-full hover:bg-zinc-700 transition-colors mb-12"
              >
                <Plus size={24} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {activeData.portfolio.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: index % 2 * 0.2 }}
                className="group relative"
              >
                <div 
                  className="relative aspect-video overflow-hidden rounded-lg bg-zinc-900 cursor-pointer"
                  onClick={() => {
                    if (item.videoUrl) {
                      setPlayingVideo(item.videoUrl);
                    }
                  }}
                >
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl || undefined} 
                      alt={item.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border border-white flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-500">
                      <Play fill="white" size={32} />
                    </div>
                  </div>
                  
                  {isEditable && (
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={() => {
                          const newPortfolio = data.portfolio.filter(p => p.id !== item.id);
                          setData({ ...data, portfolio: newPortfolio });
                        }}
                        className="bg-red-500/80 p-2 rounded-full hover:bg-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-between items-start">
                  <div>
                    {isEditable ? (
                      <div className="space-y-2">
                        <textarea 
                          value={item.title}
                          onChange={(e) => {
                            const newPortfolio = [...data.portfolio];
                            newPortfolio[index].title = e.target.value.toUpperCase();
                            setData({ ...data, portfolio: newPortfolio });
                          }}
                          className="bg-transparent text-2xl font-bold uppercase tracking-tight focus:outline-none border-b border-white/20 w-full resize-none overflow-hidden"
                          rows={item.title.split('\n').length || 1}
                        />
                        <textarea 
                          value={item.category}
                          onChange={(e) => {
                            const newPortfolio = [...data.portfolio];
                            newPortfolio[index].category = e.target.value.toUpperCase();
                            setData({ ...data, portfolio: newPortfolio });
                          }}
                          className="bg-transparent text-xs text-zinc-500 uppercase tracking-widest focus:outline-none border-b border-white/20 w-full resize-none overflow-hidden"
                          rows={item.category.split('\n').length || 1}
                        />
                        <input 
                          value={item.imageUrl}
                          onChange={(e) => {
                            const newPortfolio = [...data.portfolio];
                            newPortfolio[index].imageUrl = e.target.value;
                            setData({ ...data, portfolio: newPortfolio });
                          }}
                          placeholder="Image URL"
                          className="bg-zinc-900/50 text-[10px] text-zinc-600 p-1 rounded w-full"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-2xl md:text-4xl font-bold uppercase tracking-tight transition-colors">
                          <StyledText text={item.title} data={activeData} context={`portfolio.${index}.title`} />
                        </h3>
                        <p className="text-zinc-500 text-xs uppercase tracking-widest mt-2">
                          <StyledText text={item.category} data={activeData} context={`portfolio.${index}.category`} />
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
                  </section>
                );
              case 'about':
                return (
                  <section key="about" id="about" style={customPadding} className={`${activeData.styles?.spacing || 'py-16 md:py-32'} px-4 md:px-12 bg-transparent relative z-10 w-full overflow-hidden`}>
                    {sectionBg}
        <div className="max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-2 md:grid-rows-[max-content_max-content_1fr] gap-y-8 md:gap-x-20 items-start relative z-10">
          {/* Title */}
          <div className="relative md:col-start-1 md:row-start-1 flex flex-col">
            <DottedBlur className="w-64 h-64 -top-32 -left-16" />
            <SectionTitle align={activeData.sectionStyles?.about?.titleAlign || 'left'} className={activeData.styles?.titleSize === 'text-4xl md:text-6xl' ? 'text-5xl md:text-[7vw] lg:text-8xl' : activeData.styles?.titleSize}>
              <StyledText text={activeData.about.title} data={activeData} context="about.title" />
            </SectionTitle>
          </div>
          
          {/* Image */}
          <div 
            className="relative overflow-hidden rounded-2xl md:col-start-2 md:row-start-1 md:row-span-3 mx-auto w-full" 
            style={{ 
              width: !isMobileScreen ? '550px' : (activeData.about.imageWidth ? `${activeData.about.imageWidth}px` : '100%'), 
              height: !isMobileScreen ? '750px' : 'auto',
              maxWidth: '100%',
              aspectRatio: isMobileScreen ? (activeData.about.imageWidth && activeData.about.imageHeight ? `${activeData.about.imageWidth} / ${activeData.about.imageHeight}` : '16 / 9') : undefined
            }}
          >
            <img 
              src={activeData.about.imageUrl || "https://picsum.photos/seed/vision/1200/1500"} 
              alt="Vision"
              className="absolute inset-0 w-full h-full object-cover grayscale transition-all duration-700 block"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          </div>

          {/* Text */}
          <div className="md:col-start-1 md:row-start-2 -mt-4 md:-mt-6">
            {isEditable ? (
              <textarea 
                value={activeData.about.content}
                onChange={(e) => setData({ ...activeData, about: { ...activeData.about, content: e.target.value } })}
                className="bg-transparent text-lg md:text-xl text-zinc-400 leading-relaxed focus:outline-none border border-white/10 p-4 rounded-xl w-full h-64"
              />
            ) : (
              <div className="relative">
                {/* Placeholder invisível para reservar o espaço e evitar que a seção abaixo pule */}
                <div className="opacity-0 select-none pointer-events-none" aria-hidden="true">
                  <StyledText 
                    text={activeData.about.content} 
                    data={activeData} 
                    context="about.content"
                    className="text-lg md:text-xl font-light"
                  />
                </div>
                <div className="absolute top-0 left-0 w-full h-full">
                  <TypingText 
                    text={activeData.about.content}
                    data={activeData}
                    context="about.content"
                    className="text-lg md:text-xl text-zinc-400 leading-tight font-light"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
                  </section>
                );
              case 'expertise':
                return (
                  <section key="expertise" id="expertise" style={customPadding} className={`${activeData.styles?.spacing || 'py-16 md:py-32'} px-4 md:px-12 bg-transparent relative z-10 w-full overflow-hidden`}>
                    {sectionBg}
        <div className="max-w-screen-2xl mx-auto relative z-10">
          <SectionTitle align={activeData.sectionStyles?.expertise?.titleAlign || 'left'} className={activeData.styles?.titleSize === 'text-4xl md:text-6xl' ? 'text-5xl md:text-[7vw] lg:text-8xl' : activeData.styles?.titleSize}>
            <StyledText text={activeData.expertiseTitle || "Expertise"} data={activeData} context="expertise.title" />
          </SectionTitle>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-px bg-zinc-800 border-y border-zinc-800 mt-10 md:mt-20">
            {activeData.services.map((service, index) => {
              const totalServices = activeData.services.length;
              const isLastRow = index >= Math.floor((totalServices - 1) / 3) * 3;
              const orphans = totalServices % 3;
              let colSpan = "md:col-span-2"; // Default 1/3 (2 columns out of 6)
              
              if (isLastRow) {
                if (orphans === 1) {
                  colSpan = "md:col-span-6";
                } else if (orphans === 2) {
                  colSpan = "md:col-span-3";
                }
              }

              return (
                <ServiceCard 
                  key={service.id}
                  service={service}
                  index={index}
                  isEditable={isEditable}
                  data={activeData}
                  setData={setData}
                  className={colSpan}
                />
              );
            })}
          </div>
        </div>
                  </section>
                );
              case 'numbers':
                return (
                  <section key="numbers" id="numbers" style={customPadding} className={`${activeData.styles?.spacing || 'py-16 md:py-32'} relative z-10 w-full bg-transparent overflow-hidden flex flex-col`}>
                    {sectionBg}
                    <div className="w-full max-w-screen-xl mx-auto px-4 md:px-12 lg:px-24 flex flex-col items-start relative z-10">
                      
                      <div className="w-full mb-16 md:mb-24">
                        <SectionTitle align={activeData.sectionStyles?.numbers?.titleAlign || 'left'} className={activeData.styles?.titleSize === 'text-4xl md:text-6xl' ? 'text-5xl md:text-[7vw] lg:text-8xl' : activeData.styles?.titleSize}>
                          <StyledText text={activeData.numbersTitle || "NÚMEROS\n2025"} data={activeData} context="numbers.title" />
                        </SectionTitle>
                      </div>
                      
                      <div className="flex justify-start md:justify-center w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 md:gap-x-24 lg:gap-x-40 gap-y-12 md:gap-y-16 lg:gap-y-20 max-w-5xl w-full">
                          {(activeData.numbers || []).map((item) => (
                            <div key={item.id} className="flex items-end justify-start md:justify-center gap-4 md:gap-6">
                              <AnimatedCounter
                                value={item.value}
                                className="text-7xl sm:text-8xl md:text-[100px] lg:text-[120px] leading-[0.75] font-light uppercase text-[#000000] tracking-tight tabular-nums shrink-0"
                                style={{ 
                                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                                  WebkitTextStroke: '1.1px #ffffff',
                                  paintOrder: 'stroke fill',
                                  mixBlendMode: 'screen' as any,
                                  WebkitTextFillColor: '#000000',
                                  WebkitFontSmoothing: 'antialiased' as const,
                                  textRendering: 'geometricPrecision' as any,
                                  WebkitBackfaceVisibility: 'hidden' as any,
                                  backfaceVisibility: 'hidden' as any
                                }}
                              />
                              <span className="font-bold text-[10px] md:text-xs tracking-[0.1em] uppercase text-white pb-1 md:pb-2 max-w-[120px] leading-[1.3]">
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </section>
                );
              case 'clients':
                return (
                  <section key="clients" id="clients" style={customPadding} className={`${activeData.styles?.spacing || 'py-16 md:py-32'} px-4 md:px-12 bg-transparent relative z-10 w-full overflow-hidden`}>
                    {sectionBg}
                    <div className="max-w-screen-xl mx-auto relative z-10">
                      <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24">
                        {activeData.clients?.map((client) => (
                          <div key={client.id} className="w-28 sm:w-32 md:w-40 h-16 flex items-center justify-center shrink-0">
                            {client.imageUrl && (
                              <img src={client.imageUrl} alt={client.name || 'Client Logo'} className="max-w-full max-h-full object-contain" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                );
              case 'contact':
                return (
                  <section key="contact" id="contact" style={customPadding} className={`${activeData.styles?.spacing || 'py-16 md:py-32'} px-4 md:px-12 bg-transparent relative z-10 w-full overflow-hidden`}>
                    {sectionBg}
        <div className="w-full max-w-screen-xl mx-auto text-center px-4 md:px-12 relative z-10">
          <SectionTitle align={activeData.sectionStyles?.contact?.titleAlign || 'left'} className={activeData.styles?.titleSize === 'text-4xl md:text-6xl' ? 'text-5xl md:text-[7vw] lg:text-8xl' : activeData.styles?.titleSize}>
            <StyledText text={activeData.contactTitle || "Let's Create"} data={activeData} context="contact.title" />
          </SectionTitle>
          
          <div className="grid grid-cols-3 md:flex md:flex-wrap justify-center gap-x-4 md:gap-x-32 gap-y-12 md:gap-y-32 mt-12 md:mt-32 max-w-6xl mx-auto">
            {(activeData.contact.items || [
              { id: "1", label: "Email", value: activeData.contact.email, link: `mailto:${activeData.contact.email}`, icon: "Mail" },
              { id: "2", label: "Instagram", value: activeData.contact.instagram, link: `https://instagram.com/${activeData.contact.instagram.replace('@', '')}`, icon: "Instagram" },
              { id: "3", label: "Localização", value: activeData.contact.address, link: "", icon: "MapPin" }
            ]).map((item) => (
              <div key={item.id} className="flex flex-col items-center w-full md:w-72">
                {isEditable ? (
                  <>
                    <DynamicIcon name={item.icon} className="text-zinc-500 mb-4 md:mb-8" size={32} />
                    <div className="w-full space-y-2">
                      <input 
                        value={item.value}
                        onChange={(e) => {
                          const newItems = (data.contact.items || []).map(i => i.id === item.id ? { ...i, value: e.target.value } : i);
                          setData({ ...data, contact: { ...data.contact, items: newItems } });
                        }}
                        className="bg-transparent text-center text-xl font-bold focus:outline-none border-b border-white/20 w-full"
                        placeholder="Valor"
                      />
                      <input 
                        value={item.link}
                        onChange={(e) => {
                          const newItems = (data.contact.items || []).map(i => i.id === item.id ? { ...i, link: e.target.value } : i);
                          setData({ ...data, contact: { ...data.contact, items: newItems } });
                        }}
                        className="bg-transparent text-center text-[10px] text-zinc-500 focus:outline-none border-b border-white/10 w-full"
                        placeholder="Link (opcional)"
                      />
                    </div>
                  </>
                ) : (
                  item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center w-full h-full min-h-[100px] p-4 group cursor-pointer relative z-20">
                      <DynamicIcon name={item.icon} className="text-zinc-500 mb-0 md:mb-8" size={32} />
                      <div className="hidden md:block text-xl font-bold group-hover:text-zinc-400 transition-colors">
                        <StyledText text={item.value} data={activeData} context={`contact.${item.id}.value`} />
                      </div>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full min-h-[100px] p-4">
                      <DynamicIcon name={item.icon} className="text-zinc-500 mb-0 md:mb-8" size={32} />
                      <div className="hidden md:block text-xl font-bold">
                        <StyledText text={item.value} data={activeData} context={`contact.${item.id}.value`} />
                      </div>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
              default:
                return null;
            }
          })}
        </div>
          
        <footer className="mt-12 pt-12 pb-12 border-t border-zinc-900 flex flex-col items-center gap-6 bg-black relative z-20 w-full px-4 md:px-12">
            <Logo className="w-12 h-auto" />
            <p className="text-zinc-700 text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.5em] text-center">
              © 2026 WORD FILMS. ALL RIGHTS RESERVED.
            </p>
          </footer>
        </motion.div>
      )}

      {currentView === 'portal' && (
        <motion.div
          key="portal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-full min-h-screen"
        >
          <ClientPortal onBack={() => setCurrentView('home')} />
        </motion.div>
      )}

      {currentView === 'wizard' && (
        <motion.div
          key="wizard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-full min-h-screen"
        >
          <PricingWizard onBack={() => setCurrentView('home')} />
        </motion.div>
      )}

      {currentView === 'dev' && (
        <motion.div
          key="dev"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          <DevMode 
            data={data} 
            onSave={handleUpdate} 
            onChange={setData}
            onClose={() => {
              window.location.hash = '';
              setCurrentView('home');
            }} 
            user={user} 
            onLogin={loginWithGoogle}
          />
        </motion.div>
      )}
      </AnimatePresence>

      {/* Dev Mode Trigger Hint (Only visible for a moment or very subtle) */}
      {window === window.parent && (
        <div className="fixed bottom-4 right-4 opacity-10 hover:opacity-100 transition-opacity z-50">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-[8px] uppercase tracking-widest text-zinc-500"
          >
            Dev Mode: Ctrl+Shift+D
          </button>
        </div>
      )}

      {/* Video Modal */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8 cursor-zoom-out"
            onClick={() => setPlayingVideo(null)}
          >
            <div className="absolute top-6 right-6 z-50">
              <button 
                onClick={() => setPlayingVideo(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[1200px] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              {playingVideo.includes('vimeo.com') ? (
                <iframe 
                  src={`https://player.vimeo.com/video/${playingVideo.includes('player.vimeo.com') ? playingVideo.split('video/')[1]?.split('?')[0] : playingVideo.split('vimeo.com/')[1]?.split('?')[0]}?autoplay=1&color=ffffff&title=0&byline=0&portrait=0`} 
                  className="w-full h-full" 
                  allow="autoplay; fullscreen; picture-in-picture" 
                  allowFullScreen 
                />
              ) : playingVideo.includes('youtube.com') || playingVideo.includes('youtu.be') ? (
                <iframe 
                  src={`https://www.youtube.com/embed/${playingVideo.includes('youtu.be') ? playingVideo.split('youtu.be/')[1]?.split('?')[0] : playingVideo.split('v=')[1]?.split('&')[0]}?autoplay=1`} 
                  className="w-full h-full" 
                  allow="autoplay; fullscreen; picture-in-picture" 
                  allowFullScreen 
                />
              ) : (
                <video 
                  src={playingVideo} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain" 
                  playsInline
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
}