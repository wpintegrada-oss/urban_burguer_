# Urban Burguer — cardápio e pedidos online

Site de pedidos da hamburgueria: cardápio por categorias, personalização de itens, carrinho,
checkout com envio do pedido por WhatsApp, painel de pedidos (`/admin`) e rastreio (`/pedido/UB-XXXX`).

**Stack:** React 19 + Vite + Tailwind v4 (frontend) · Funções serverless da Vercel em `/api` · MongoDB Atlas.

## Rotas

| Rota | O que é |
|---|---|
| `/` | Cardápio, carrinho e checkout |
| `/pedido/UB-XXXX` | Acompanhamento do pedido (atualiza sozinho a cada 5 s) |
| `/admin` | Painel protegido por PIN: filtrar, mudar status, aviso sonoro de pedido novo |

## Publicar (GitHub + Vercel)

1. **Banco:** crie um cluster gratuito (M0) no [MongoDB Atlas](https://www.mongodb.com/atlas),
   crie um usuário e, em *Network Access*, libere `0.0.0.0/0` (a Vercel não tem IP fixo).
   Copie a string de conexão (`mongodb+srv://...`).
2. **GitHub:** neste diretório, rode
   ```bash
   npm install          # gera o package-lock.json — suba ele junto
   git init && git add . && git commit -m "Urban Burguer"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/urban-burguer.git
   git push -u origin main
   ```
3. **Vercel:** *Add New → Project* → importe o repositório (o preset Vite é detectado sozinho).
   Antes de clicar em *Deploy*, cadastre em *Environment Variables*:

   | Variável | Valor |
   |---|---|
   | `MONGODB_URI` | string de conexão do Atlas |
   | `ADMIN_PIN` | PIN do painel (**obrigatório trocar**; sem ela vale `1234`) |
   | `DB_NAME` | opcional, padrão `urban_burguer` |

4. Faça o deploy e teste: abra o site, faça um pedido, depois entre em `/admin`.

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local   # preencha MONGODB_URI e ADMIN_PIN
npx vercel dev               # sobe o frontend e a API juntos
```

`npm run dev` sobe só o frontend (o cardápio aparece, mas pedir/admin/rastreio precisam da API).

## Editar o cardápio

Tudo está em **`shared/menu.ts`**: categorias, itens, preços, adicionais, número do WhatsApp e formas
de pagamento. O servidor recalcula o total do pedido a partir desse mesmo arquivo, então um cliente
não consegue alterar preços pelo navegador.

> Os adicionais `molho-especial`, `molho-defumado`, `queijo-extra`, `cebola-roxa`, `maionese-verde`,
> `turbinar-refrigerante`, `dobro-de-bacon`, `molho-extra-alho` e `molho-extra-barbecue` eram citados
> nos itens, mas não tinham cadastro. Foram criados com **nomes e preços provisórios** — confira.

## Observações de segurança

- O PIN do admin trafega no cabeçalho `x-admin-pin` e não há limite de tentativas. Use um PIN longo
  e, se quiser mais proteção, ative o *Vercel Firewall / rate limiting*.
- O rastreio público mostra só nome (primeiro), itens e total — nunca telefone ou endereço.
- Não suba `.env*` para o GitHub (já está no `.gitignore`).

## Painel /admin (cardápio editável)

Abas: **Pedidos**, **Produtos**, **Categorias**, **Adicionais** e **Loja**. Dá para criar, editar, excluir e
ativar/desativar produtos (item desativado some do site e não pode ser pedido), trocar nome, descrição, preço
e foto (upload ou link), e definir **preço promocional** com data final opcional (aparece com o preço antigo
riscado e na seção "Promoções"). Na primeira abertura, o banco é preenchido com o cardápio inicial de
`shared/menu.ts`; depois disso tudo é editado pelo painel. Sem `ADMIN_PIN` na Vercel o painel fica trancado.
