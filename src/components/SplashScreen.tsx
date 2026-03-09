import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

interface SplashScreenProps {
  logoUrl?: string;
  tenantName?: string;
}

export default function SplashScreen({ logoUrl, tenantName }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#f8fafc] flex flex-col items-center justify-center overflow-hidden">
      {/* Abstract background shapes */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square bg-emerald-500 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, -45, 0],
          opacity: [0.1, 0.15, 0.1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-5%] left-[-5%] w-[35%] aspect-square bg-blue-500 rounded-full blur-[100px]"
      />

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          {/* Logo container */}
          <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center p-6 border border-slate-100 relative z-10 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={tenantName || 'Logo'} className="w-full h-full object-contain" />
            ) : (
              <Shield className="w-full h-full text-slate-900" />
            )}
            
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 pointer-events-none" />
          </div>

          {/* Pulse effect */}
          <motion.div
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-emerald-500/20 rounded-[2.5rem] -z-0"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 text-center"
        >
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {tenantName || 'MecaERP'}
          </h1>
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity, 
                  delay: i * 0.2,
                  ease: "easeInOut" 
                }}
                className="w-2 h-2 bg-emerald-500 rounded-full"
              />
            ))}
          </div>
          <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Carregando sua oficina
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-12 text-[10px] font-bold text-slate-300 uppercase tracking-widest"
      >
        MecaERP &copy; 2026 • Sistema de Gestão Automotiva
      </motion.div>
    </div>
  );
}
