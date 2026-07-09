# Contributing

Thanks for helping improve MarketSense.

## Getting Started

1. Fork the repository.
2. Create a branch from `main`.
3. Install dependencies for the services you are changing.
4. Copy the example environment files:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

5. Make your change with focused commits.
6. Run the relevant checks before opening a pull request.

## Development

Frontend:

```bash
cd frontend
npm install
npm run dev
```

FastAPI backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Express auth backend:

```bash
cd backend
npm install
npm run dev
```

## Pull Requests

- Keep changes scoped to one feature, fix, or cleanup.
- Include screenshots for UI changes.
- Add or update tests when behavior changes.
- Update documentation when setup, configuration, or public behavior changes.
- Do not commit secrets, API keys, local database files, or `.env` files.

## Commit Style

Use clear, descriptive commit messages. Examples:

```text
Fix watchlist removal for missing symbols
Add frontend env example
Document local backend setup
```
