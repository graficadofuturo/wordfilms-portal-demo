import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ArrowLeft, Calendar, Video, CheckCircle } from 'lucide-react';

type WizardStep = 'type' | 'duration' | 'shooting' | 'result';

export const PricingWizard = ({ onBack }: { onBack: () => void }) => {
  const [step, setStep] = useState<WizardStep>('type');
  
  // State to hold answers
  const [answers, setAnswers] = useState({
    type: '',
    duration: '',
    shooting: ''
  });

  const handleAnswer = (key: keyof typeof answers, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    
    // Logic to move to next step
    if (key === 'type') setStep('duration');
    if (key === 'duration') setStep('shooting');
    if (key === 'shooting') setStep('result');
  };

  // ==========================================
  // INSTRUÇÕES PARA O ENGENHEIRO DE DADOS (MOTOR DE IA E PRECIFICAÇÃO):
  // ==========================================
  // 1. Substitua a função `calculateResult` por uma chamada à sua API de IA.
  // 2. Envie o objeto `answers` para o endpoint: POST /api/pricing-engine
  // 3. O backend deve processar as respostas e retornar um objeto com o formato:
  //    { type: 'simple', price: 'R$ X.XXX,00', message: '...' } 
  //    OU { type: 'complex', message: '...' }
  // ==========================================
  const calculateResult = () => {
    const isComplex = 
      answers.type === 'Evento/Cobertura' || 
      answers.duration === 'Mais de 3 minutos' || 
      answers.shooting === 'Sim, múltiplos dias/locais';

    if (isComplex) {
      return {
        type: 'complex',
        message: "Recebemos o seu contato e sugerimos uma reunião para entender melhor o seu projeto.",
        action: "Agendar Reunião"
      };
    }

    // Simple pricing logic mockup
    let basePrice = 1500;
    if (answers.type === 'Comercial') basePrice += 1000;
    if (answers.duration === 'Até 3 minutos') basePrice += 500;
    if (answers.shooting === 'Sim, 1 diária') basePrice += 1200;

    return {
      type: 'simple',
      price: `R$ ${basePrice.toLocaleString('pt-BR')},00`,
      message: "Estimativa baseada nas informações fornecidas. O valor final pode variar após o briefing detalhado.",
      action: "Solicitar Proposta Formal"
    };
  };

  const result = step === 'result' ? calculateResult() : null;

  return (
    <div className="min-h-screen pt-32 pb-16 px-4 md:px-12 relative z-10 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <button 
          onClick={step === 'type' ? onBack : () => {
            if (step === 'duration') setStep('type');
            if (step === 'shooting') setStep('duration');
            if (step === 'result') setStep('shooting');
          }}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm uppercase tracking-widest font-bold"
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 shadow-2xl rounded-3xl p-8 md:p-12 overflow-hidden relative min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {step === 'type' && (
              <motion.div 
                key="type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full justify-center"
              >
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-8">Qual o tipo de projeto?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Vídeo Institucional', 'Comercial', 'Conteúdo para Redes', 'Evento/Cobertura'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer('type', option)}
                      className="p-6 border border-zinc-800 rounded-2xl hover:bg-white hover:text-black transition-all text-left font-bold text-lg group flex justify-between items-center"
                    >
                      {option}
                      <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'duration' && (
              <motion.div 
                key="duration"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full justify-center"
              >
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-8">Qual a duração estimada?</h2>
                <div className="grid grid-cols-1 gap-4">
                  {['Até 1 minuto', 'Até 3 minutos', 'Mais de 3 minutos', 'Não tenho certeza'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer('duration', option)}
                      className="p-6 border border-zinc-800 rounded-2xl hover:bg-white hover:text-black transition-all text-left font-bold text-lg group flex justify-between items-center"
                    >
                      {option}
                      <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'shooting' && (
              <motion.div 
                key="shooting"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full justify-center"
              >
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-8">Precisará de captação de imagens?</h2>
                <div className="grid grid-cols-1 gap-4">
                  {['Não, já tenho o material', 'Sim, 1 diária', 'Sim, múltiplos dias/locais'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer('shooting', option)}
                      className="p-6 border border-zinc-800 rounded-2xl hover:bg-white hover:text-black transition-all text-left font-bold text-lg group flex justify-between items-center"
                    >
                      {option}
                      <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 'result' && result && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full justify-center items-center text-center"
              >
                {result.type === 'simple' ? (
                  <>
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle size={32} />
                    </div>
                    <h2 className="text-zinc-500 uppercase tracking-widest text-sm font-bold mb-4">Estimativa de Investimento</h2>
                    <p className="text-5xl md:text-7xl font-black mb-6">{result.price}</p>
                    <p className="text-zinc-400 max-w-md mx-auto mb-8">{result.message}</p>
                    <button className="bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                      {result.action}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center mb-6">
                      <Calendar size={32} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4">Projeto Personalizado</h2>
                    <p className="text-zinc-400 max-w-md mx-auto mb-8 text-lg leading-relaxed">{result.message}</p>
                    
                    {/* ==========================================
                        INSTRUÇÕES PARA INTEGRAÇÃO DE AGENDA:
                        ==========================================
                        1. Substitua esta div pelo iframe ou componente do Calendly / Google Calendar.
                        2. Exemplo Calendly: <InlineWidget url="https://calendly.com/seu-link" />
                        ========================================== */}
                    <div className="w-full max-w-md bg-black/50 border border-zinc-800 rounded-2xl p-6 mb-8">
                      <p className="text-sm text-zinc-500 uppercase tracking-widest mb-4">Selecione um horário</p>
                      <div className="grid grid-cols-3 gap-2">
                        {['10:00', '14:30', '16:00'].map(time => (
                          <button key={time} className="py-2 border border-zinc-700 rounded-lg hover:border-white transition-colors text-sm">
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button className="bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors w-full max-w-md">
                      {result.action}
                    </button>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
