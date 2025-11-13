# Guia de Deploy no Railway

Este guia explica como fazer o deploy da aplicação MinhaCamera no Railway.

## Pré-requisitos

1. Conta no Railway (https://railway.app)
2. Banco de dados PostgreSQL já criado no Railway
3. Código-fonte do projeto

## Configuração do Banco de Dados

O banco de dados PostgreSQL já está configurado e as tabelas foram criadas com sucesso:
- `users` - Usuários do sistema (super_admin, admin, user)
- `empresas` - Empresas (multi-tenant)
- `clientes` - Clientes finais que visualizam câmeras
- `cameras` - Câmeras IP com streaming RTSP
- `camera_acessos` - Controle de acesso câmera/cliente

## Passos para Deploy

### 1. Criar Novo Projeto no Railway

1. Acesse https://railway.app
2. Clique em "New Project"
3. Selecione "Deploy from GitHub repo" ou "Empty Project"

### 2. Configurar Variáveis de Ambiente

No painel do Railway, adicione as seguintes variáveis:

```
DATABASE_URL=postgresql://postgres:xkcGqjXGBWWufNlERDgljXCtYkUMfEiN@yamabiko.proxy.rlwy.net:48731/railway
NODE_ENV=production
PORT=5000
```

### 3. Deploy do Código

#### Opção A: Via GitHub
1. Conecte seu repositório GitHub ao Railway
2. O Railway detectará automaticamente o `nixpacks.toml` e `railway.json`
3. O build será executado automaticamente

#### Opção B: Via Railway CLI
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Linkar ao projeto
railway link

# Deploy
railway up
```

### 4. Verificar o Deploy

Após o deploy, o Railway fornecerá uma URL pública. Acesse-a para verificar se a aplicação está rodando.

## Estrutura de Build

O sistema usa Nixpacks para build automático:

1. **Install**: `npm ci` - Instala dependências
2. **Build**: `npm run build` - Compila frontend (Vite) e backend (esbuild)
3. **Start**: `npm start` - Inicia o servidor em produção

## Comandos Úteis

```bash
# Build local (para testar)
npm run build

# Iniciar em produção local
npm start

# Sincronizar schema do banco
npm run db:push
```

## Portas e Configuração

- **Porta padrão**: 5000 (configurável via PORT)
- **Host**: 0.0.0.0 (permite conexões externas)
- **SSL do banco**: Habilitado em produção

## Solução de Problemas

### Erro de conexão com banco de dados
- Verifique se a DATABASE_URL está correta
- Confirme que o banco permite conexões externas
- Verifique se o SSL está configurado corretamente

### Build falha
- Execute `npm ci` localmente para verificar dependências
- Verifique os logs do Railway para erros específicos
- Confirme que `railway.json` e `nixpacks.toml` estão presentes

### Aplicação não inicia
- Verifique os logs do Railway
- Confirme que a porta 5000 está sendo usada
- Verifique se todas as variáveis de ambiente estão configuradas

## Próximos Passos

1. Configure um domínio personalizado no Railway (opcional)
2. Ative HTTPS automático (já incluído no Railway)
3. Configure backups automáticos do banco de dados
4. Configure monitoramento e alertas

## Suporte

Em caso de problemas:
1. Verifique os logs no painel do Railway
2. Consulte a documentação: https://docs.railway.app
3. Verifique a conexão com o banco de dados usando as ferramentas do Railway

---

**Nota**: O sistema já está configurado e pronto para deploy. As tabelas do banco de dados já foram criadas e o código está otimizado para produção.
