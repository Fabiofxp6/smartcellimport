# Arquitetura e decisões

O diretório inicial continha apenas um `.env` vazio; não havia código a migrar.

## Organização

- `src/app/(store)`: páginas públicas renderizadas no servidor, filtros na URL e componentes interativos pequenos.
- `src/app/admin/(protected)`: layout protegido e páginas administrativas; `/admin/login` fica fora desse grupo.
- `src/features`: serviços de consulta, autenticação, mutações e regras do carrinho. Server Actions transportam operações administrativas.
- `src/models`: schemas Mongoose. Valores monetários são inteiros em centavos.
- `src/lib`: conexão compartilhada, validações Zod, Auth.js, Cloudinary e tratamento de erros.
- `scripts`: provisionamento, criação de índices/configurações e limpeza explícita de mídia.

Next.js App Router em runtime Node.js e Vercel atendem ao requisito de MongoDB via Mongoose, inclusive transações. Não se adotou Cloudflare Workers/Sites, cujo runtime não oferece as conexões TCP exigidas por essa stack. Nenhum banco alternativo foi introduzido.

## Dados e integridade

Produtos referenciam categorias; imagens, atributos e combinações ficam em subdocumentos. Não são geradas combinações cartesianas. A coleção singleton `store_settings` usa chave única `main`. Coleções auxiliares `rate_limits` e `media_assets` cuidam de proteção e ciclo de vida das imagens. Não existem registros de pedidos, vendas ou estoque.

Operações de produto/categoria que dependem de mais de um documento usam transações. A criação/edição de um produto escreve uma versão na categoria; a exclusão da categoria disputa a mesma escrita e verifica referências. A edição do nome da categoria atualiza os tokens dos produtos na mesma transação. Em catálogos grandes, esse reindexador deverá ser movido para um job com migração controlada.

## Índices

- `users.email` único: identidade administrativa e login direto.
- `products.slug` e `categories.slug` únicos: URLs sem colisão.
- Produtos por `published/categoryId/createdAt`: listagem por categoria e paginação.
- Produtos por `published/featured/createdAt`: destaques recentes.
- Produtos por `published/searchTokens`: pesquisa por interseção de tokens normalizados.
- Produtos por `published/attributes.name/attributes.values`: filtros por atributos da categoria.
- Categorias por `published/sortOrder`: navegação pública.
- Configuração por `key` único; mídia por `publicId` único e `state/updatedAt` para limpeza.
- Limites por chave única e TTL em `expiresAt`: contadores compartilhados entre funções.

`autoIndex` está desativado. `npm run db:init` cria índices explicitamente, sem remover índices existentes. Alterações futuras exigem migrações versionadas e revisão dos dados antes de novos índices únicos.

## Busca e filtros

A escrita gera palavras sem acentos e prefixos limitados a 40 caracteres. Consultas fazem `$all` de termos normalizados e limitados, sem regex de entrada arbitrária. Relevância dá preferência ao nome. Os filtros aceitam somente nomes definidos na categoria e valores escalares; agregações produzem facetas antes da paginação. Preços são filtrados pelo preço promocional/base exibido; um preço específico de variação aparece na seleção do produto.

A implementação usa índices MongoDB comuns para funcionar em diferentes planos do Atlas. Atlas Search pode substituir esse mecanismo quando volume e relevância justificarem, usando um índice configurado e migrado explicitamente. Não há IA. Prefixos não oferecem correção ortográfica nem busca por trecho no meio da palavra. A paginação usa `skip` limitado a 1000 páginas de 12; crescimento além disso pede cursores.

## Autenticação e exposição

Auth.js estável (`next-auth` v4) usa Credentials + JWT criptografado com validade de 8h, cookies HttpOnly e cookies Secure em produção HTTPS. `AUTH_URL` é traduzido internamente para a configuração v4. Cada operação administrativa chama `requireAdmin`, que consulta novamente o usuário ativo no banco, permitindo revogar acesso imediatamente. Não há cadastro público de administradores. Argon2id usa 64 MiB, três iterações e paralelismo um. Limites por e-mail e IP persistem no MongoDB e não dependem da memória de uma função.

Server Actions têm a proteção de origem do Next.js; upload exige origem igual à requisição, sessão administrativa e limite compartilhado. Imagens aceitam assinaturas JPEG/PNG/WebP e até 3 MB; o corpo multipart tem teto de 4 MB antes do parsing. O Cloudinary decodifica e transforma as imagens no upload. A mídia precisa existir no registro interno para ser anexada, evitando URLs externas ou arquivos em exclusão. As respostas de erro não expõem URI, stack ou senha.

## Carrinho

Estado externo React persiste no LocalStorage, tem validação estrutural e sincroniza abas. Cada linha é identificada por produto + ID da variação; quantidades ficam entre 1 e 99 e há até 50 combinações. Dados no navegador não são confiáveis: a rota de validação recarrega produtos publicados e categorias públicas, resolve combinações e preços e gera a mensagem no servidor. Se os valores mudarem, o carrinho é atualizado e exige novo clique após a revisão. Nada é gravado como pedido.

## Imagens e falhas

Uploads recebem registro em `media_assets`. Remover uma imagem de um formulário remove sua referência ao salvar, sem apagar um arquivo compartilhado. A limpeza explícita espera sete dias, consulta produtos/categorias/configuração, disputa o registro de mídia em uma transação e só então exclui do Cloudinary. Uma imagem marcada para exclusão não pode ser anexada. Falhas ficam registradas e são tentadas novamente; um sucesso seguido de falha no MongoDB é idempotente graças à resposta `not found` do Cloudinary. Até 100 candidatos são processados por execução. Revisar também uploads na pasta Cloudinary caso uma falha simultânea de rede e banco impeça o registro/rollback inicial.

## Cache, implantação e reversão

Páginas que consultam dados são dinâmicas; React `cache` deduplica consultas dentro da renderização, sem manter preços antigos entre requisições. As mutações revalidam o layout. Next Image serve versões otimizadas das imagens Cloudinary. A validação do carrinho sempre ignora cache. O sitemap inclui apenas produtos e categorias publicados.

Deploys não mudam o banco automaticamente. Fazer backup antes de migrações; reverter código pela Vercel sem apagar dados. Rotação de AUTH_SECRET encerra sessões existentes. Não alterar variáveis nem provisionar dados em produção por scripts de build.

## Verificação e observabilidade

Vitest cobre regras puras, LocalStorage e integração com MongoDB real temporário em replica set. Testes de integração cobrem ações, autorização, busca, filtros, transações, limites e rotas. O Cloudinary é simulado nesse teste; a integração externa exige credenciais e validação manual. Playwright cobre navegação pública, responsividade, carrinho e bloqueio administrativo. Os logs do servidor usam nomes/códigos genéricos, sem conteúdo sensível. Monitorar falhas via Vercel e Cloudinary; adicionar alertas externos conforme a operação crescer.
