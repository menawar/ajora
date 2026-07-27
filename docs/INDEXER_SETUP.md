# Ajora Indexer & Middleware Setup Guide

The indexer is powered by [Ponder](https://ponder.sh), indexing Celo blockchain events and serving indexed data to the Ajora web application.

## Prerequisites

- Node.js >= 18.14
- Celo RPC URL (e.g. `https://forno.celo.org` or custom RPC node)

## Configuration

The indexer configuration lives in `ponder.config.ts` and `ponder.schema.ts`.

### Environment Variables

Create `.env.local` in `indexer/`:

```env
PONDER_RPC_URL_42220=https://forno.celo.org
DATABASE_URL=postgresql://user:password@localhost:5432/ajora_indexer
```

## Running the Indexer

```bash
cd indexer
npm install
npm run dev
```

## Event Validation

Runtime event payload validation is enforced using Zod schemas located in `indexer/src/validation.ts`.

Schemas validate:
- **EVM Addresses**: Validated via strict regex (`/^0x[a-fA-F0-9]{40}$/`).
- **Amounts & Balances**: Non-negative `bigint` values.
- **Draw Numbers**: Integer range between 0 and 9.
