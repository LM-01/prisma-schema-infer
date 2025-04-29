import fs from 'fs';
import path from 'path';
import { inferPrismaSchemaModel } from '../src/lib/infer';

async function main() {
  const samplePath = path.resolve(__dirname, '../examples/example_01.json');
  const outputPath = path.resolve(__dirname, '../generated/schema.prisma');

  const rawData = fs.readFileSync(samplePath, 'utf-8');
  const data = JSON.parse(rawData);

  if (!Array.isArray(data)) {
    console.error('example_01.json must contain an array of objects.');
    process.exit(1);
  }

  const prismaModel = inferPrismaSchemaModel('Car', data, { normalizeArrays: true });

  console.log('\n=== Prisma Model Generated ===\n');
  console.log(prismaModel);

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // Save generated schema to file
  fs.writeFileSync(outputPath, prismaModel);

  console.log(`\n✅ Prisma schema saved to: ${outputPath}\n`);
}

main().catch((err) => {
  console.error('Error generating schema:', err);
  process.exit(1);
});
