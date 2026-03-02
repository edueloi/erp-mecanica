/**
 * Normalização de telefones para formato E.164
 * Garante padrão único para matching de clientes
 */

/**
 * Normaliza telefone para formato E.164 (+55349910088557)
 * Remove caracteres especiais, adiciona +55 se necessário
 */
export function normalizePhoneE164(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remover sufixos do WhatsApp (@c.us, @g.us, @lid)
  let cleaned = phone.replace(/@.*$/, '');

  // Remover todos os caracteres não numéricos
  cleaned = cleaned.replace(/\D/g, '');

  // Se estiver vazio após limpeza
  if (!cleaned) return null;

  // Se começar com 0, remover (telefone local com DDD)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Brasil: garantir código do país 55
  if (!cleaned.startsWith('55')) {
    // Se tiver 10 ou 11 dígitos, é telefone BR sem código de país
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }
  }

  // Validação básica: telefone BR deve ter 12 ou 13 dígitos (55 + DDD + número)
  if (cleaned.startsWith('55') && (cleaned.length < 12 || cleaned.length > 13)) {
    console.warn(`⚠️ Telefone com formato suspeito: ${cleaned}`);
  }

  // Adicionar + na frente
  return '+' + cleaned;
}

/**
 * Extrai versões possíveis de um telefone para busca flexível
 * Útil para buscar cliente por telefone com/sem 9 extra
 */
export function getPhoneVariations(phoneE164: string | null): string[] {
  if (!phoneE164) return [];

  const variations = [phoneE164];

  // Remove o +
  const numbers = phoneE164.replace('+', '');

  // Se for BR (55) e tiver 13 dígitos (55 + 2 DDD + 9 + 8 números)
  if (numbers.startsWith('55') && numbers.length === 13) {
    // Variação sem o 9: +5511987654321 → +551187654321
    const without9 = '+55' + numbers.substring(2, 4) + numbers.substring(5);
    variations.push(without9);
  }

  // Se for BR e tiver 12 dígitos (55 + 2 DDD + 8 números)
  if (numbers.startsWith('55') && numbers.length === 12) {
    // Variação com 9: +551187654321 → +5511987654321
    const with9 = '+55' + numbers.substring(2, 4) + '9' + numbers.substring(4);
    variations.push(with9);
  }

  return variations;
}

/**
 * Formata telefone E.164 para exibição amigável
 * +55349910088557 → (34) 99100-8857
 */
export function formatPhoneDisplay(phoneE164: string | null): string {
  if (!phoneE164) return '-';

  const numbers = phoneE164.replace(/\D/g, '');

  // Brasil
  if (numbers.startsWith('55') && numbers.length >= 12) {
    const ddd = numbers.substring(2, 4);
    const rest = numbers.substring(4);

    if (rest.length === 9) {
      // Celular com 9: (34) 99100-8857
      return `(${ddd}) ${rest.substring(0, 5)}-${rest.substring(5)}`;
    } else if (rest.length === 8) {
      // Fixo: (34) 3210-8857
      return `(${ddd}) ${rest.substring(0, 4)}-${rest.substring(4)}`;
    }
  }

  // Fallback: mostrar como está
  return phoneE164;
}

/**
 * Valida se telefone é brasileiro válido
 */
export function isValidBRPhone(phoneE164: string | null): boolean {
  if (!phoneE164) return false;

  const numbers = phoneE164.replace(/\D/g, '');

  // Deve começar com 55 e ter 12 ou 13 dígitos
  if (!numbers.startsWith('55')) return false;
  if (numbers.length !== 12 && numbers.length !== 13) return false;

  // DDD deve ser válido (11-99)
  const ddd = parseInt(numbers.substring(2, 4));
  if (ddd < 11 || ddd > 99) return false;

  return true;
}
