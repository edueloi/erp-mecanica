import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'mecaerp-secret-key';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenant_id: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    
    // Verificação de Bloqueio por Inadimplência ou Status
    if (user.role !== 'SUPER_ADMIN') {
      const tenant = db.prepare("SELECT status, last_payment_date, created_at FROM tenants WHERE id = ?").get(user.tenant_id) as any;
      
      if (!tenant) return res.status(403).json({ error: 'Oficina não encontrada' });

      // Lógica de 30 dias + 7 dias de carência
      const referenceDate = tenant.last_payment_date || tenant.created_at;
      const lastPay = new Date(referenceDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastPay.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Se passou de 37 dias (30 do mês + 7 de carência), bloqueia automaticamente
      if (diffDays > 37 && tenant.status !== 'BLOCKED') {
        db.prepare("UPDATE tenants SET status = 'BLOCKED' WHERE id = ?").run(user.tenant_id);
        return res.status(403).json({ error: 'Sistema Bloqueado por Inadimplência. Entre em contato com o suporte.' });
      }

      // Se o status já for BLOCKED ou INACTIVE
      if (tenant.status === 'BLOCKED') {
        return res.status(403).json({ error: 'Acesso bloqueado. Regularize seu pagamento.' });
      }
      
      if (tenant.status === 'INACTIVE') {
        return res.status(403).json({ error: 'Conta inativa. Entre em contato com a administração.' });
      }
    }

    req.user = user;
    next();
  });
};
