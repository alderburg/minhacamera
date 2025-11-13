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

#### Opção A: Via GitHub (Recomendado)
1. Faça push do código para um repositório GitHub
2. No Railway, clique em "New Project" → "Deploy from GitHub repo"
3. Selecione seu repositório
4. O Railway detectará automaticamente o arquivo `.nixpacks.toml`
5. O build será executado automaticamente

#### Opção B: Via Railway CLI
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Iniciar novo projeto
railway init

# Deploy
railway up
```

**IMPORTANTE**: Certifique-se de que os seguintes arquivos estejam no repositório:
- `.nixpacks.toml` - Configuração de build
- `package.json` - Dependências
- Todo o código-fonte

### 4. Verificar o Deploy

Após o deploy, o Railway fornecerá uma URL pública. Acesse-a para verificar se a aplicação está rodando.

## Estrutura de Build

O sistema usa Nixpacks para build automático conforme o arquivo `.nixpacks.toml`:

1. **Setup**: Instala Node.js 20
2. **Install**: `npm ci` - Instala dependências do package.json
3. **Build**: `npm run build` - Compila frontend (Vite) e backend (esbuild)
4. **Start**: `npm start` - Inicia o servidor em produção na porta 5000

O arquivo `.nixpacks.toml` contém:
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

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
