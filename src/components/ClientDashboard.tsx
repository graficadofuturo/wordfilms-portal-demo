import React from 'react';
import { motion } from 'motion/react';
import { Video, Clock, AlertCircle, CheckCircle2, LogIn, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ClientDashboardProps {
  user: any;
  onLogin: () => void;
  onLogout: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, onLogin, onLogout }) => {
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-8 rounded-2xl text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Portal do Cliente</h2>
          <p className="text-zinc-400 mb-8">Faça login para acompanhar o status dos seus projetos, métricas e aprovações em tempo real.</p>
          <button 
            onClick={onLogin}
            className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            Entrar com Google
          </button>
        </motion.div>
      </div>
    );
  }

  // Mockup data for Notion API integration
  const dashboardData = {
    totalVideos: { produced: 12, inProgress: 3 },
    sla: "4.2 dias",
    currentProject: {
      name: "Campanha Institucional 2026",
      progress: 65,
      status: "Em Edição"
    },
    bottlenecks: [
      { id: 1, reason: "Mudança de footage/assets", count: 2, impact: "Alto" },
      { id: 2, reason: "Demora na aprovação do cliente final", count: 1, impact: "Médio" },
      { id: 3, reason: "Erro de digitação/legenda", count: 3, impact: "Baixo" }
    ]
  };

  return (
    <div className="min-h-screen bg-black pt-32 pb-16 px-4 md:px-12">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Dashboard</h1>
            <p className="text-zinc-400 mt-2">Bem-vindo(a) de volta, {user.displayName || user.email}</p>
          </div>
          <button 
            onClick={onLogout}
            className="text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-colors border border-zinc-800 px-4 py-2 rounded-full"
          >
            Sair
          </button>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          
          {/* Current Project Progress - Span 2 cols */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-zinc-400 mb-6">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-xs uppercase tracking-widest font-semibold">Projeto Atual</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">{dashboardData.currentProject.name}</h3>
              <p className="text-zinc-500 mb-8">Status: <span className="text-white">{dashboardData.currentProject.status}</span></p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400">Progresso</span>
                <span className="font-bold">{dashboardData.currentProject.progress}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${dashboardData.currentProject.progress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-white h-full rounded-full"
                />
              </div>
            </div>
            {/* TODO (Engenheiro de Dados): Conectar endpoint do Notion aqui para buscar o projeto com status 'Em Andamento' mais recente */}
          </motion.div>

          {/* Total Videos */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 text-zinc-400 mb-6">
              <Video size={20} />
              <span className="text-xs uppercase tracking-widest font-semibold">Volume</span>
            </div>
            <div>
              <div className="text-5xl font-black mb-2">{dashboardData.totalVideos.produced}</div>
              <p className="text-zinc-500 text-sm">Vídeos Produzidos</p>
            </div>
            <div className="mt-6 pt-6 border-t border-zinc-800/50">
              <div className="text-2xl font-bold mb-1">{dashboardData.totalVideos.inProgress}</div>
              <p className="text-zinc-500 text-xs">Em Execução</p>
            </div>
            {/* TODO (Engenheiro de Dados): Conectar endpoint do Notion para contagem de itens na base de dados de projetos */}
          </motion.div>

          {/* SLA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 text-zinc-400 mb-6">
              <Clock size={20} />
              <span className="text-xs uppercase tracking-widest font-semibold">Eficiência</span>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black mb-2">{dashboardData.sla}</div>
              <p className="text-zinc-500 text-sm leading-relaxed">Tempo médio de entrega (SLA)</p>
            </div>
            {/* TODO (Engenheiro de Dados): Calcular SLA médio baseado na data de início e entrega dos projetos no Notion */}
          </motion.div>

          {/* Bottlenecks Tracker - Span 4 cols on mobile, 4 cols on desktop to form a wide bottom row */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-4 bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8"
          >
            <div className="flex items-center gap-2 text-zinc-400 mb-8">
              <AlertCircle size={20} />
              <span className="text-xs uppercase tracking-widest font-semibold">Rastreador de Gargalos & Versões</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboardData.bottlenecks.map((bottleneck) => (
                <div key={bottleneck.id} className="bg-black/50 rounded-2xl p-6 border border-zinc-800/30">
                  <div className="flex justify-between items-start mb-4">
                    <span className={cn(
                      "text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-bold",
                      bottleneck.impact === 'Alto' ? "bg-red-500/20 text-red-500" :
                      bottleneck.impact === 'Médio' ? "bg-yellow-500/20 text-yellow-500" :
                      "bg-emerald-500/20 text-emerald-500"
                    )}>
                      Impacto {bottleneck.impact}
                    </span>
                    <span className="text-2xl font-black text-zinc-700">{bottleneck.count}x</span>
                  </div>
                  <p className="text-zinc-300 font-medium">{bottleneck.reason}</p>
                </div>
              ))}
            </div>
            {/* TODO (Engenheiro de Dados): Conectar endpoint do Notion que lista as tags/propriedades de "Motivo de Refação" ou "Atraso" */}
          </motion.div>

        </div>
      </div>
    </div>
  );
};
