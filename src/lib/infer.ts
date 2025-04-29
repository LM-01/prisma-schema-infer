export type GenericObject = { [key: string]: any };

export interface InferenceOptions {
  normalizeArrays?: boolean;
}

export function inferPrismaSchemaModel(
  name: string,
  records: GenericObject[],
  options: InferenceOptions = {},
  generatedModels: Set<string> = new Set()
): string {
  const fieldMap = new Map<string, { type: string; optional: boolean; original: string }>();
  const relatedModels: string[] = [];

  for (const obj of records) {
    for (const [key, value] of Object.entries(obj)) {
      const isOptional = value === null || value === undefined;

      if (
        options.normalizeArrays &&
        Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === 'object' &&
        !Array.isArray(value[0])
      ) {
        const nestedModelName = `${capitalize(name)}${capitalize(key)}`;
        fieldMap.set(key, {
          type: `${nestedModelName}[]`,
          optional: isOptional,
          original: key
        });

        if (!generatedModels.has(nestedModelName)) {
          generatedModels.add(nestedModelName);
          for (const rec of value) rec[`${name.charAt(0).toLowerCase() + name.slice(1)}Id`] = 'placeholder';
          const nestedModel = inferPrismaSchemaModel(nestedModelName, value as GenericObject[], options, generatedModels);
          const parentKey = `${name.charAt(0).toLowerCase() + name.slice(1)}Id`;
          const withRelation = nestedModel.replace(
            new RegExp(`${parentKey} String`),
            `${parentKey} String\n  ${name.charAt(0).toLowerCase() + name.slice(1)} ${name} @relation(fields: [${parentKey}], references: [id])`
          );
          relatedModels.push(withRelation);
        }

        continue;
      }

      if (!fieldMap.has(key)) {
        fieldMap.set(key, {
          type: inferType(value, key),
          optional: isOptional,
          original: key
        });
      } else if (isOptional) {
        const existing = fieldMap.get(key)!;
        existing.optional = true;
      }
    }
  }

  const lines = [`model ${name} {`];

  if (!fieldMap.has('id')) {
    lines.push(`  id String @id @default(uuid())`);
  }

  for (const [key, { type, optional, original }] of fieldMap.entries()) {
    if (key === 'id' && lines.some((l) => l.includes('id '))) continue;

    const parts = [`  ${key} ${type}${optional ? '?' : ''}`];

    if (key === 'id') {
      if (type === 'String') parts.push('@id @default(uuid())');
      else if (type === 'Int') parts.push('@id @default(autoincrement())');
    }

    if (key === 'createdAt') parts.push('@default(now())');
    if (key === 'updatedAt') parts.push('@updatedAt');
    if (original !== key || isSnakeCase(original)) parts.push(`@map("${original}")`);

    lines.push(parts.join(' '));
  }

  lines.push('}');
  return [lines.join('\n'), ...relatedModels].join('\n\n');
}

function inferType(value: any, key?: string): string {
  if (value === null || value === undefined) {
    if (key?.toLowerCase().includes('id')) return 'String';
    return 'Json';
  }

  if (typeof value === 'string') {
    if (isISODateString(value)) return 'DateTime';
    return 'String';
  }
  if (typeof value === 'number') return Number.isInteger(value) ? 'Int' : 'Float';
  if (typeof value === 'boolean') return 'Boolean';
  if (Array.isArray(value)) return 'Json';
  if (typeof value === 'object') return 'Json';

  return 'Json';
}

function isISODateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/.test(value);
}

function isSnakeCase(str: string): boolean {
  return str.includes('_');
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}