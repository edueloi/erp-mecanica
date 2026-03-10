import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Shield, FileText, Lock } from 'lucide-react';
import LandingChatBot from '../components/LandingChatBot';

interface LegalPageProps {
  title: string;
  lastUpdate: string;
  type: 'terms' | 'privacy' | 'lgpd';
}

const LegalPage: React.FC<LegalPageProps> = ({ title, lastUpdate, type }) => {
  const icons = {
    terms: FileText,
    privacy: Lock,
    lgpd: Shield
  };

  const Icon = icons[type];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-all font-bold text-xs uppercase tracking-widest">
            <ChevronLeft size={16} /> Voltar para o Site
          </Link>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">MecaERP • Legal Center</div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-16">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-white rounded-[2rem] p-10 md:p-16 shadow-xl border border-slate-200"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Icon size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Última atualização: {lastUpdate}</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-4">1. Introdução</h2>
              <p>
                Bem-vindo ao MecaERP. Ao utilizar nossos serviços, você concorda em cumprir e ser regido por estas diretrizes. 
                Estes documentos foram criados para garantir a máxima transparência e segurança na relação entre a nossa tecnologia e a sua oficina.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-4">2. Coleta de Dados</h2>
              <p>
                Coletamos apenas as informações estritamente necessárias para a operação da sua oficina, como dados de clientes, 
                veículos e ordens de serviço. Todos os dados são processados em servidores seguros com criptografia de ponta.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-4">3. Responsabilidades</h2>
              <p>
                O MecaERP é uma ferramenta de auxílio à gestão. A precisão dos dados inseridos e a conformidade com as leis locais 
                quanto à execução dos serviços mecânicos são de responsabilidade do estabelecimento usuário.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-4">4. Segurança</h2>
              <p>
                Implementamos as melhores práticas de mercado para garantir que seu bando de dados esteja sempre disponível e protegido 
                contra acessos não autorizados. Realizamos backups automáticos redundantes para sua tranquilidade.
              </p>
            </section>

            <section className="pt-10 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 text-center">
                Dúvidas sobre estes termos podem ser enviadas para nosso suporte oficial.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
      <LandingChatBot />
    </div>
  );
};

export default LegalPage;
