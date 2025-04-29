# prisma-schema-infer

> Auto-generate Prisma schema models from JSON data

![npm](https://img.shields.io/npm/v/prisma-schema-infer)
![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
![license](https://img.shields.io/npm/l/prisma-schema-infer)
![issues](https://img.shields.io/github/issues/LM-01/prisma-schema-infer)

---

## 📦 Installation

```bash
npm install -D prisma-schema-infer
```

Or run directly:

```bash
npx prisma-schema-infer <ModelName> <path/to/sample.json>
```

---

## 🚀 Usage

```bash
npx prisma-schema-infer Car ./examples/sample.json
```

This will:
- Load the JSON array from `sample.json`
- Generate a Prisma model named `Car`
- Print the schema to the terminal

---

## 🧪 Example Input

```json
[
  {
    "vehicle_id": "CAR-001",
    "make": "Tesla",
    "model": "Model 3",
    "price": 45999,
    "features": [
      { "name": "Autopilot", "premium": true }
    ]
  },
  {
    "vehicle_id": "CAR-002",
    "make": "Toyota",
    "model": "Corolla",
    "features": []
  }
]
```

---

## 🧾 Output

```prisma
model Car {
  id         String         @id @default(uuid())
  vehicleId  String         @map("vehicle_id")
  make       String
  model      String
  price      Float?
  features   CarFeatures[]
}

model CarFeatures {
  id       String   @id @default(uuid())
  name     String
  premium  Boolean
  carId    String
  car      Car      @relation(fields: [carId], references: [id])
}
```

---

## 🛠 Dev Scripts

```bash
npm run example     # generate schema from example_01.json
npm run dev        # run CLI directly via tsx
npm run test       # run unit tests
npm run coverage   # view coverage report
```

---

## 🧰 Advanced CLI Usage

```bash
npx prisma-schema-infer <ModelName> <path/to/json> [optionalOutputFile]
```

```bash
npx prisma-schema-infer Car examples/cars.json generated/car.prisma
```

---

## ✅ Features

- Supports nested arrays as related models
- Adds `@id`, `@default`, `@map`, `@relation` as needed
- Optional fields are inferred across the full dataset
- Clean, readable Prisma schema output

---

## 📄 License

MIT
