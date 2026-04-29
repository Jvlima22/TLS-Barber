This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## SQUEMA

# README.md - Esquema do Banco de Dados da Barbearia

Este projeto utiliza **Prisma ORM** com **PostgreSQL** para gerenciar os dados de uma única barbearia. O sistema suporta:

- Configurações da barbearia
- Cadastro de serviços e produtos
- Agendamento de serviços com pagamento via Stripe
- Venda de produtos com pagamento via Stripe
- Autenticação de usuários (compatível com NextAuth.js)

## Tecnologias Utilizadas

- **Banco de dados**: PostgreSQL
- **ORM**: Prisma (Prisma Client JS)
- **Autenticação**: NextAuth.js
- **Pagamentos**: Stripe (integração via Checkout Sessions)
- **IDs**: UUID para entidades principais, CUID para usuários

## Esquema Completo de Tabelas

### `User`
Usuários do sistema (clientes e/ou administradores).

| Coluna            | Tipo                  | Descrição                              | Restrições                  |
|-------------------|-----------------------|----------------------------------------|-----------------------------|
| id                | String (@id, cuid())  | Identificador único do usuário         | Primary Key                 |
| name              | String?               | Nome do usuário                        | Opcional                    |
| email             | String                | E-mail único                           | @unique                     |
| emailVerified     | DateTime?             | Data de verificação do e-mail          | Opcional                    |
| image             | String?               | URL da foto de perfil                  | Opcional                    |
| createdAt         | DateTime              | Data de criação                        | @default(now())             |
| updatedAt         | DateTime              | Data de atualização                    | @updatedAt                  |

**Relações**: Possui bookings e purchases.

### `Account`
Contas de autenticação externa (OAuth, etc.) – NextAuth.js.

| Coluna              | Tipo     | Descrição                          | Restrições                          |
|---------------------|----------|------------------------------------|-------------------------------------|
| userId              | String   | Referência ao usuário              | Foreign Key → User                  |
| type                | String   | Tipo da conta                      |                                     |
| provider            | String   | Provedor (google, github, etc.)    |                                     |
| providerAccountId   | String   | ID da conta no provedor            |                                     |
| refresh_token       | String?  | Token de refresh                   | Opcional                            |
| access_token        | String?  | Token de acesso                    | Opcional                            |
| expires_at          | Int?     | Expiração do token                 | Opcional                            |
| ... (outros campos) |          |                                    |                                     |
| createdAt           | DateTime | Data de criação                    | @default(now())                     |
| updatedAt           | DateTime | Data de atualização                | @updatedAt                          |

**Chave composta**: @@id([provider, providerAccountId])

### `Session`
Sessões ativas dos usuários – NextAuth.js.

| Coluna       | Tipo     | Descrição                 | Restrições              |
|--------------|----------|---------------------------|-------------------------|
| sessionToken | String   | Token único da sessão     | @unique                 |
| userId       | String   | Referência ao usuário     | Foreign Key → User      |
| expires      | DateTime | Data de expiração         |                         |
| createdAt    | DateTime | Data de criação           | @default(now())         |
| updatedAt    | DateTime | Data de atualização       | @updatedAt              |

### `VerificationToken`
Tokens para verificação de e-mail ou reset de senha.

| Coluna     | Tipo     | Descrição             | Restrições                    |
|------------|----------|-----------------------|-------------------------------|
| identifier | String   | Identificador (e-mail)|                               |
| token      | String   | Token único           |                               |
| expires    | DateTime | Data de expiração     |                               |

**Chave composta**: @@id([identifier, token])

### `Settings`
Configurações únicas da barbearia (singleton – ID sempre 1).

| Coluna      | Tipo       | Descrição                          | Restrições          |
|-------------|------------|------------------------------------|---------------------|
| id          | Int        | ID fixo (sempre 1)                  | @id @default(1)     |
| name        | String     | Nome da barbearia                   |                     |
| address     | String     | Endereço completo                  |                     |
| phones      | String[]   | Lista de telefones                 |                     |
| description | String     | Descrição da barbearia             |                     |
| imageUrl    | String     | URL da imagem principal            |                     |
| createdAt   | DateTime   | Data de criação                    | @default(now())     |
| updatedAt   | DateTime   | Data de atualização                | @updatedAt          |

### `Service`
Serviços oferecidos pela barbearia.

| Coluna      | Tipo              | Descrição                    | Restrições |
|-------------|-------------------|------------------------------|------------|
| id          | String (uuid)     | ID único                     | @id        |
| name        | String            | Nome do serviço              |            |
| description | String            | Descrição detalhada          |            |
| imageUrl    | String            | URL da imagem do serviço     |            |
| price       | Decimal(10,2)     | Preço do serviço             |            |

**Relações**: Possui vários bookings.

### `Product`
Produtos à venda na barbearia (ex: pomadas, shampoos).

| Coluna      | Tipo              | Descrição                    | Restrições |
|-------------|-------------------|------------------------------|------------|
| id          | String (uuid)     | ID único                     | @id        |
| name        | String            | Nome do produto              |            |
| description | String            | Descrição detalhada          |            |
| imageUrl    | String            | URL da imagem do produto     |            |
| price       | Decimal(10,2)     | Preço do produto             |            |

**Relações**: Possui várias purchases.

### `Booking`
Agendamentos de serviços.

| Coluna                  | Tipo              | Descrição                              | Restrições |
|-------------------------|-------------------|----------------------------------------|------------|
| id                      | String (uuid)     | ID único                               | @id        |
| userId                  | String            | Referência ao cliente                  | FK → User  |
| serviceId               | String            | Referência ao serviço                  | FK → Service |
| date                    | DateTime          | Data e hora do agendamento             |            |
| stripeCheckoutSessionId | String?           | ID da sessão de pagamento no Stripe    | Opcional   |
| paymentStatus           | PaymentStatus?    | Status do pagamento                    | Opcional   |
| createdAt               | DateTime          | Data de criação                        | @default(now()) |
| updatedAt               | DateTime          | Data de atualização                    | @updatedAt |

### `Purchase`
Compras de produtos.

| Coluna                  | Tipo              | Descrição                              | Restrições |
|-------------------------|-------------------|----------------------------------------|------------|
| id                      | String (uuid)     | ID único                               | @id        |
| userId                  | String            | Referência ao cliente                  | FK → User  |
| productId               | String            | Referência ao produto                  | FK → Product |
| quantity                | Int               | Quantidade comprada                    | @default(1) |
| stripeCheckoutSessionId | String?           | ID da sessão de pagamento no Stripe    | Opcional   |
| paymentStatus           | PaymentStatus?    | Status do pagamento                    | Opcional   |
| createdAt               | DateTime          | Data de criação                        | @default(now()) |
| updatedAt               | DateTime          | Data de atualização                    | @updatedAt |

### `PaymentStatus` (Enum)
Status possíveis de pagamento via Stripe.

- `PENDING`   → Aguardando pagamento
- `SUCCEEDED` → Pagamento concluído com sucesso
- `FAILED`    → Pagamento falhou

## Observações Finais

- O sistema foi simplificado para **uma única barbearia**, eliminando relacionamentos multi-estabelecimento.
- Pagamentos de **serviços** (via agendamento) e **produtos** estão totalmente integrados ao Stripe de forma segura e sincronizada.
- Todas as funcionalidades originais (autenticação, agendamento) foram preservadas e aprimoradas.

## Repositórios
Este projeto está conectado a dois repositórios remotos:
- **Principal (TGL Solutions):** `https://github.com/comercialtglsolutions-dev/TLS-Barber`
- **Pessoal (Backup):** `https://github.com/Jvlima22/TLS-Barber`

