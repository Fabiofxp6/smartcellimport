# Smart Cell Import · Catálogo digital

Aplicação em português com catálogo público, painel administrativo e carrinho de interesse encaminhado ao WhatsApp. Implementada com Next.js App Router, React, TypeScript, Tailwind, componentes no padrão shadcn/ui/Radix, Lucide, React Hook Form, Zod, Mongoose, Auth.js e Cloudinary. Sem módulos de estoque, pedidos, pagamentos ou vendas.

## Começar

Requer Node.js 22.12 ou superior (recomendado Node 24 LTS), npm, MongoDB Atlas e uma conta Cloudinary. As versões exatas ficam no `package-lock.json`.

```sh
npm ci
cp .env.example .env
```

Preencha o `.env` localmente. Não envie credenciais em mensagens nem as adicione ao Git. Se já existir `.env`, preencha os campos sem sobrescrever seu conteúdo.

| Variável                | Uso                                                                             |
| ----------------------- | ------------------------------------------------------------------------------- |
| `MONGODB_URI`           | URI Atlas com banco explícito, por exemplo nome `smartcell`                     |
| `AUTH_SECRET`           | Segredo aleatório de pelo menos 32 bytes                                        |
| `AUTH_URL`              | Origem completa do aplicativo: localhost em desenvolvimento e HTTPS em produção |
| `CLOUDINARY_CLOUD_NAME` | Ambiente de mídia do Cloudinary                                                 |
| `CLOUDINARY_API_KEY`    | Chave da API, somente servidor                                                  |
| `CLOUDINARY_API_SECRET` | Segredo da API, somente servidor                                                |
| `NEXT_PUBLIC_SITE_URL`  | URL pública, usada em SEO, sitemap e metadata                                   |

Gere o segredo em seu terminal: `openssl rand -base64 32`. Não reutilize o exemplo como credencial. Nenhum segredo foi criado ou incluído no repositório.

Sem MongoDB configurado, a vitrine abre com a marca e os contatos fornecidos e estados vazios. Não há dados fictícios de produtos nem persistência substituta. O login informa a configuração pendente. Com URI configurada e serviço indisponível, a aplicação exibe o estado de erro.

## Configurar MongoDB Atlas

1. Crie um cluster Atlas e um banco específico para a loja. As transações precisam de replica set, fornecido pelo Atlas.
2. Em **Database Access**, crie um usuário exclusivo com `readWrite` somente no banco da aplicação, sem permissões de organização ou administração do cluster.
3. Em **Network Access**, autorize os endereços de saída do ambiente. Para produção, prefira saída estática e uma lista restrita, conforme o plano da hospedagem. Uma abertura global de rede não substitui uma política adequada de acesso.
4. Copie a URI SRV pelo menu **Connect → Drivers** e defina o nome do banco no caminho. Codifique caracteres especiais da senha na URI.
5. Execute uma vez, e após alterações documentadas de índices:

```sh
npm run db:init
```

Esse comando cria índices e as configurações iniciais da Smart Cell; não cria produtos nem categorias. Os três contatos enviados nas imagens ficam editáveis no painel. Não há campos de estoque. A conexão tem cache de promessa, pool limitado e timeouts, com queries somente no servidor.

## Cloudinary

Copie cloud name, API key e API secret no ambiente Cloudinary para as respectivas variáveis. Os uploads são assinados no servidor, autenticados, limitados a 3 MB por arquivo e transformados para tamanho máximo de 2000 × 2000. Não é necessário preset público/unsigned. Não se grava mídia permanentemente no disco da Vercel.

No painel, envie as imagens, edite a descrição acessível, use a estrela para escolher a principal e as setas para ordenar. Para substituir, envie a nova e remova a referência antiga antes de salvar. Arquivos não referenciados não são apagados imediatamente: a limpeza protege referências e permite recuperar falhas.

```sh
npm run images:cleanup
```

O comando faz uma limpeza explícita de até 100 imagens órfãs com mais de sete dias; execute pelo ambiente administrativo com credenciais configuradas. Falhas ficam registradas para nova tentativa. Consulte os detalhes em [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Auth.js e primeiro administrador

O projeto usa a versão estável do Auth.js para Next.js (`next-auth` v4), Credentials e sessões JWT. `AUTH_URL` é mapeado internamente para a opção esperada pela v4. Em produção, use HTTPS para cookies Secure. Sessões duram oito horas; o usuário precisa continuar ativo e com papel ADMIN no banco em cada operação protegida.

Depois de configurar o banco e criar os índices:

```sh
npm run admin:create
```

O comando pede nome, e-mail e senha de pelo menos 12 caracteres em terminal interativo. A senha não aparece na tela, nos argumentos de processo ou nos logs e é armazenada somente como hash Argon2id. Não existe senha padrão, registro público ou rota de provisionamento. O comando não sobrescreve uma conta existente. Para revogar acesso, um operador autorizado pode definir `active: false` no documento do administrador. Não altere senhas diretamente sem gerar um novo hash forte.

```sh
npm run dev
```

Acesse `http://localhost:3000` e `/admin/login`. Primeiro crie categorias; depois cadastre produtos com imagens e, se necessário, combinações específicas. Um produto só aparece quando ele e sua categoria estiverem publicados. As alterações no painel refletem no catálogo sem novo deploy.

## Rotas e API

Públicas: `/`, `/catalogo`, `/categoria/[slug]`, `/produto/[slug]`, `/carrinho`.

Administração: `/admin/login`, `/admin`, `/admin/produtos`, `/admin/produtos/novo`, `/admin/produtos/[id]/editar`, `/admin/categorias`, `/admin/configuracoes`.

- Auth.js: `/api/auth/*` gerencia login, CSRF, sessão e logout.
- `POST /api/admin/upload`: multipart com `file`, origem igual à aplicação, administrador ativo, até 3 MB e JPEG/PNG/WebP real. Retorna metadados da imagem. Limite: 60 envios por 10 minutos por administrador.
- `GET /api/produtos/[id]`: retorna apenas um produto público em categoria publicada, para editar uma seleção do carrinho.
- `POST /api/carrinho/validar`: JSON `{ items: [{ productId, variantId?, quantity, expectedPrice, expectedAttributes? }], attendant? }`; `expectedPrice` em centavos e `expectedAttributes` com os pares nome/valor selecionados (obrigatório para conferir uma variação), quantidade 1–99, até 50 combinações. Retorna itens atuais, `changed`, `issues` e `url` somente quando a consulta puder prosseguir. `attendant` deve corresponder ao nome configurado no painel.
- Server Actions administrativas: validação Zod, sessão e papel ADMIN no servidor. Respostas tipadas `{ ok: true, id? }` ou `{ ok: false, error }`.

Erros HTTP: 400 entrada inválida, 401 sem sessão, 403 sem autorização/origem inválida, 404 produto retirado, 409 conflito de slug, 413 arquivo/corpo grande, 422 validação e 429 limite de tentativas. Falhas de serviços retornam mensagem segura e 503. Login limita oito tentativas por e-mail e 30 por IP a cada 15 minutos, em contador MongoDB compartilhado.

## Testes

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Vitest testa regras de preço, WhatsApp, combinações, uploads, Zod, busca, LocalStorage e persistência/transações num MongoDB temporário. Na primeira execução, `mongodb-memory-server` baixa um binário MongoDB e precisa de acesso à rede; não utiliza seu Atlas. O teste de upload simula somente o serviço Cloudinary. Playwright usa Google Chrome instalado (`channel: chrome`), inicia um MongoDB temporário isolado e serve o build de produção na porta 3111; execute o build antes. A conta de teste é criada apenas nesse banco temporário e removida ao terminar. O fluxo administrativo no navegador cobre login, cadastro, edição, publicação, exclusão e logout; o upload Cloudinary é simulado. Para outro navegador, ajuste `playwright.config.ts` e instale o Chromium do Playwright. Os testes de navegador não usam o Atlas da loja nem suas credenciais de autenticação.

Para validar as integrações reais, configure serviços de teste e: provisione um administrador, entre, crie categoria e produto, envie e substitua uma imagem, publique, pesquise por modelo/atributos, adicione variações ao carrinho, atualize o preço pelo painel e valide o aviso antes de abrir o WhatsApp. Confira o destinatário e a mensagem sem enviá-la automaticamente. Teste também logout, produto oculto e usuário desativado. Esses testes reais dependem das credenciais e não são substituídos pelos testes locais.

## Deploy na Vercel

1. Crie um repositório contendo somente esta pasta de projeto. Nunca adicione `.env`, `node_modules`, `.next` ou arquivos externos pessoais.
2. Importe o repositório na Vercel, com preset Next.js e runtime Node 24. Build: `npm run build`; instalação: `npm ci`.
3. Configure todas as variáveis no ambiente correto. Em produção, `AUTH_URL` e `NEXT_PUBLIC_SITE_URL` devem coincidir com a URL HTTPS definitiva; previews devem usar suas próprias URLs e serviços de teste.
4. Configure rede do Atlas, inicialize índices e crie o administrador por um terminal autorizado, fora do build. Mantenha Atlas e funções Vercel na mesma região quando possível.
5. Faça o deploy e valide o roteiro real descrito acima. Não é necessário disco persistente, Redis ou serviço de pagamento.
6. Em **Settings → Domains**, adicione o domínio e aplique os registros DNS indicados pela Vercel. Após validar HTTPS, atualize as duas URLs do ambiente e faça novo deploy para aplicar variáveis. Alterações de produtos não precisam de deploy.

Não foi executado deploy nem acesso a contas externas automaticamente. O `.env` recebido estava vazio; credenciais reais e configuração de produção são pendentes.

## Planos e custos

Este catálogo é de uso comercial. A Vercel limita o Hobby a uso pessoal/não comercial; escolha um plano comercial compatível e consulte valores, franquias e excedentes em [Vercel Pricing](https://vercel.com/pricing) e [Hobby](https://vercel.com/docs/plans/hobby). MongoDB Atlas tem ofertas gratuitas e pagas com limites de armazenamento, conexões e recursos: confira [Atlas Pricing](https://www.mongodb.com/pricing) e [limites gratuitos](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/). O Cloudinary cobra conforme plano/créditos de armazenamento, transformações e tráfego: consulte [planos](https://cloudinary.com/pricing) e [faturamento](https://cloudinary.com/documentation/billing_and_plans). Domínio e serviços adicionais podem gerar custos separados. Verifique os termos e preços atuais nas contas antes de contratar; nenhum plano foi contratado aqui.

## Decisões e limites

[ARCHITECTURE.md](docs/ARCHITECTURE.md) explica módulos, índices, transações, pesquisa, cache, segurança e limpeza de imagens. A busca usa tokens/prefixos normalizados e índices do MongoDB, sem IA. Atlas Search fica como evolução explícita conforme volume/cluster, sem depender de um índice ainda não provisionado. Valores são estimativas, e a negociação permanece no WhatsApp.
