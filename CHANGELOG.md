## [0.2.0] – 2025-04-29

### ✨ Features
- Inferred field optionality based on record set coverage
- Support for nested object arrays as related Prisma models
- Automatic CLI entrypoint (`prisma-schema-infer`) with `npx` or global install
- Auto-save to `/generated/schema.prisma` (via script)

### 🧪 Improvements
- Full test coverage for optionality and relations
- CLI-friendly usage instructions and help messaging

### 📦 Package
- Now ships as compiled CLI (`dist/index.js`)
- Only publishes production-ready files via `"files"` field
