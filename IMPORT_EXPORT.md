# Funcionalidade de Importação e Exportação

## Visão Geral

Sistema completo de importação e exportação de dados para o meca-ERP, permitindo que usuários importem dados em massa e exportem relatórios em diferentes formatos.

## Formatos Suportados

### Exportação
- **Excel (.xlsx)** - Planilha Excel com formatação automática
- **PDF (.pdf)** - Documento PDF formatado para impressão
- **CSV (.csv)** - Arquivo de texto separado por vírgulas

### Importação
- **Excel (.xlsx, .xls)** - Planilhas do Microsoft Excel
- **CSV (.csv)** - Arquivos separados por vírgula
- **JSON (.json)** - Formato JSON estruturado
- **XML (.xml)** - Formato XML estruturado

## Implementação por Módulo

### Clientes ✅
- **Exportação**: Disponível em Excel, PDF e CSV
- **Importação**: Disponível com template
- **Template**: Inclui todos os campos necessários (nome, documento, telefone, email, endereço)

### Ordens de Serviço ✅
- **Exportação**: Disponível em Excel, PDF e CSV
- **Importação**: Não implementada (uso interno)

### Peças, Serviços, Veículos
- Seguir o mesmo padrão implementado em Clientes

## Como Usar

### Exportar Dados

1. Na tela desejada, clique no botão **"Exportar"**
2. Selecione o formato desejado:
   - **Excel**: Melhor para análise de dados e planilhas
   - **PDF**: Melhor para impressão e compartilhamento
   - **CSV**: Melhor para importar em outros sistemas
3. Clique em **"Exportar"** - o arquivo será baixado automaticamente

### Importar Dados

1. Na tela desejada, clique no botão **"Importar"**
2. **Baixe o template** primeiro:
   - Clique em "Excel" ou "CSV" para baixar o modelo
   - Abra o arquivo e preencha com seus dados
3. **Envie o arquivo preenchido**:
   - Clique em "Escolher arquivo"
   - Selecione seu arquivo preenchido
   - O sistema processará automaticamente
4. Aguarde a confirmação de importação

## Estrutura dos Templates

### Template de Clientes

```csv
name,type,document,phone,email,cep,street,number,complement,neighborhood,city,state
Nome do Cliente,PF ou PJ,CPF ou CNPJ,(11) 98765-4321,cliente@email.com,01234-567,Rua Exemplo,123,Apto 45,Bairro,Cidade,SP
```

**Campos Obrigatórios:**
- `name`: Nome completo do cliente
- `type`: PF (Pessoa Física) ou PJ (Pessoa Jurídica)
- `document`: CPF ou CNPJ

**Campos Opcionais:**
- `phone`: Telefone de contato
- `email`: Email do cliente
- `cep`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`: Dados de endereço

## Mapeamento de Colunas

O sistema aceita nomes de colunas em português ou inglês:

### Clientes
- `name` ou `Nome`
- `type` ou `Tipo`
- `document` ou `Documento` ou `CPF` ou `CNPJ`
- `phone` ou `Telefone`
- `email` ou `Email`
- `cep` ou `CEP`
- `street` ou `Rua` ou `Logradouro`
- `number` ou `Numero` ou `Número`
- `complement` ou `Complemento`
- `neighborhood` ou `Bairro`
- `city` ou `Cidade`
- `state` ou `Estado` ou `UF`

## Validação de Dados

O sistema realiza as seguintes validações:

1. **Formato do arquivo**: Verifica se o arquivo está no formato correto
2. **Campos obrigatórios**: Valida se os campos essenciais estão presentes
3. **Duplicação**: (A implementar) Verifica duplicatas antes de importar
4. **Formato de dados**: Valida CPF/CNPJ, emails, telefones

## Tratamento de Erros

### Erros Comuns

1. **"Arquivo vazio ou formato inválido"**
   - Solução: Verifique se o arquivo tem dados e está no formato correto

2. **"Erro ao processar arquivo"**
   - Solução: Verifique se as colunas estão nomeadas corretamente

3. **"Erro ao importar [entidade]"**
   - Solução: Verifique se os dados obrigatórios estão preenchidos

## Backend - Endpoints Necessários

### Importação em Lote
```javascript
// POST /clients/bulk - Criar múltiplos clientes
// Body: [{ name, type, document, ... }, ...]
// Response: { success: number, errors: [] }
```

### Melhorias Sugeridas

1. **Validação no Backend**: Implementar validação robusta
2. **Transações**: Usar transações para rollback em caso de erro
3. **Relatório de Erros**: Retornar lista detalhada de erros por linha
4. **Preview**: Mostrar preview dos dados antes de importar
5. **Async Processing**: Para arquivos grandes, processar em background

## Personalização

### Adicionar Novos Módulos

1. Importe o componente:
```typescript
import ImportExportModal from '../components/ImportExportModal';
```

2. Defina os dados do template:
```typescript
const templateData = [{
  field1: 'exemplo',
  field2: 'exemplo',
  // ...
}];
```

3. Defina as colunas de exportação:
```typescript
const exportColumns = [
  { header: 'Coluna 1', dataKey: 'field1' },
  { header: 'Coluna 2', dataKey: 'field2' },
];
```

4. Implemente a função de importação:
```typescript
const handleImport = async (data: any[]) => {
  // Transformar e validar dados
  // Enviar para API
};
```

5. Adicione o modal:
```tsx
<ImportExportModal
  isOpen={isImportModalOpen}
  onClose={() => setIsImportModalOpen(false)}
  mode="import"
  title="Importar [Entidade]"
  templateData={templateData}
  onImport={handleImport}
  entityName="nome_entidade"
/>
```

## Bibliotecas Utilizadas

- **xlsx** (^0.18.5): Leitura e escrita de arquivos Excel
- **jspdf** (^4.2.0): Geração de PDFs
- **jspdf-autotable** (^5.0.7): Tabelas em PDF

## Considerações de Performance

- Arquivos grandes (>1000 registros): Considerar processamento em lote
- Feedback visual: Progress bar para uploads longos
- Validação client-side: Reduz carga no servidor
- Caching: Template files podem ser cacheados

## Segurança

- **Validação de tipo de arquivo**: Apenas formatos permitidos
- **Limite de tamanho**: Implementar limite de tamanho de arquivo
- **Sanitização**: Limpar dados antes de inserir no banco
- **Permissões**: Verificar permissões de usuário para importar/exportar

## Próximos Passos

1. ✅ Implementar em Clientes e Ordens de Serviço
2. [ ] Implementar em Peças, Serviços e Veículos
3. [ ] Adicionar preview antes de importar
4. [ ] Implementar processamento assíncrono
5. [ ] Adicionar validação de duplicatas
6. [ ] Criar dashboard de importações
7. [ ] Adicionar log de auditoria
