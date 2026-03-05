const fs = require('fs');
const path = 'c:/Users/Eduardo/Desktop/meca-erp-main/src/pages/Suppliers.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                    {/* Receive Button */}
                    {selectedPO.status !== 'RECEIVED' && (
                      <div className="pt-2">
                        <button
                          onClick={() => handleReceivePO(selectedPO.id)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
                        >
                          <Package size={20} /> REGISTRAR RECEBIMENTO
                        </button>
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">O que acontece ao confirmar:</p>
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-600">📦 Adiciona as quantidades ao estoque de cada peça</p>
                            <p className="text-[10px] text-slate-600">💰 Registra saída automática no Fluxo de Caixa</p>
                            <p className="text-[10px] text-slate-600">🔗 Vincula o fornecedor e o preço de custo a cada peça</p>
                          </div>
                        </div>
                      </div>
                    )}`;

const replacement = `                    {/* Action Buttons */}
                    <div className="pt-2 space-y-3">
                      {/* Confirm Button */}
                      {selectedPO.status === 'DRAFT' && (
                        <button
                          onClick={() => handleUpdatePOStatus(selectedPO.id, 'CONFIRMED')}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all"
                        >
                          <CheckCircle size={20} /> CONFIRMAR PEDIDO AGORA
                        </button>
                      )}

                      {/* Receive Button */}
                      {selectedPO.status !== 'RECEIVED' && selectedPO.status !== 'DRAFT' && (
                        <button
                          onClick={() => handleReceivePO(selectedPO.id)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
                        >
                          <Package size={20} /> REGISTRAR RECEBIMENTO DE PEÇAS
                        </button>
                      )}
                      
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">Informações de Processamento:</p>
                        <div className="space-y-1">
                          {selectedPO.status === 'DRAFT' && (
                            <p className="text-[10px] text-slate-600 italic">O pedido está em rascunho. Confirme para vincular o fornecedor e provisionar o financeiro.</p>
                          )}
                          {selectedPO.status === 'CONFIRMED' && (
                            <>
                              <p className="text-[10px] text-emerald-600 font-bold">✅ Fornecedor vinculado às peças</p>
                              <p className="text-[10px] text-indigo-600 font-bold">🕒 Valor provisionado no Fluxo de Caixa (Pendente)</p>
                              <p className="text-[10px] text-slate-600">Aguardando recebimento físico das peças para atualizar estoque.</p>
                            </>
                          )}
                          {selectedPO.status === 'RECEIVED' && (
                            <p className="text-[10px] text-emerald-700 font-bold">✅ Pedido Finalizado: Estoque, Financeiro e Histórico atualizados.</p>
                          )}
                        </div>
                      </div>
                    </div>`;

const newContent = content.split('\r\n').join('\n').replace(target.split('\r\n').join('\n'), replacement.split('\r\n').join('\n'));
if (content.length === newContent.length && content === newContent) {
    console.log('REPLACEMENT FAILED');
    // Try to find only a part of it
    const partialTarget = `{/* Receive Button */}`;
    if (content.includes(partialTarget)) {
        console.log('Found partialTarget, replacing it instead');
        fs.writeFileSync(path, content.replace(partialTarget, '/* Action Buttons */'));
    }
} else {
    fs.writeFileSync(path, newContent);
    console.log('SUCCESS');
}
