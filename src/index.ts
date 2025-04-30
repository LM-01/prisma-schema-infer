#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { inferPrismaSchemaModel } from './lib/infer';

export { inferPrismaSchemaModel }; 

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npx prisma-schema-infer <ModelName> <path/to/sample.json>');
    process.exit(1);
  }

  const [modelName, jsonPath] = args;

  try {
    const data = JSON.parse(fs.readFileSync(path.resolve(jsonPath), 'utf-8'));

    if (!Array.isArray(data)) {
      throw new Error('Expected input JSON to be an array of objects.');
    }

    const result = inferPrismaSchemaModel(modelName, data, { normalizeArrays: true });
    console.log(result);
  } catch (err: any) {
    console.error('Failed to generate schema:', err.message);
    process.exit(1);
  }
}
