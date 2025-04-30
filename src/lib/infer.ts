export type GenericObject = { [key: string]: any };

export interface InferenceOptions {
  normalizeArrays?: boolean;
  maxDepth?: number;
}

export function inferPrismaSchemaModel(
  name: string,
  records: GenericObject[],
  options: InferenceOptions = { maxDepth: 4 },
  generatedModels: Set<string> = new Set(),
  depth: number = 1
): string {
  const fieldPresence: Map<string, number> = new Map();
  const fieldMap = new Map<string, { type: string; optional: boolean; original: string }>();
  const relatedModels: string[] = [];
  const totalRecords = records.length;

  for (const obj of records) {
    for (const [key, value] of Object.entries(obj)) {
      const isOptional = value === null || value === undefined;
      const count = fieldPresence.get(key) ?? 0;
      fieldPresence.set(key, count + 1);

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
          const nestedModel = inferPrismaSchemaModel(nestedModelName, value as GenericObject[], options, generatedModels, depth + 1);
          const parentKey = `${name.charAt(0).toLowerCase() + name.slice(1)}Id`;
          const withRelation = nestedModel.replace(
            new RegExp(`${parentKey} String`),
            `${parentKey} String\n  ${name.charAt(0).toLowerCase() + name.slice(1)} ${name} @relation(fields: [${parentKey}], references: [id])`
          );
          relatedModels.push(withRelation);
        }
        continue;
      }

      const inferredType = inferType(value, key, name, options, generatedModels, relatedModels, depth);
      fieldMap.set(key, {
        type: inferredType,
        optional: isOptional,
        original: key
      });
    }
  }

  for (const [key, count] of fieldPresence.entries()) {
    if (count < totalRecords && fieldMap.has(key)) {
      fieldMap.get(key)!.optional = true;
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

function inferType(
  value: any,
  key: string | undefined,
  parentName: string,
  options: InferenceOptions,
  generatedModels: Set<string>,
  relatedModels: string[],
  depth: number
): string {
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

  if (typeof value === 'object') {
    if (depth >= (options.maxDepth ?? 4)) return 'Json';

    const nestedModelName = `${capitalize(parentName)}${capitalize(key ?? 'Nested')}`;
    value[`${parentName.charAt(0).toLowerCase() + parentName.slice(1)}Id`] = 'placeholder';

    if (!generatedModels.has(nestedModelName)) {
      generatedModels.add(nestedModelName);
      const nestedModel = inferPrismaSchemaModel(nestedModelName, [value], options, generatedModels, depth + 1);
      const parentKey = `${parentName.charAt(0).toLowerCase() + parentName.slice(1)}Id`;
      const withRelation = nestedModel.replace(
        new RegExp(`${parentKey} String`),
        `${parentKey} String\n  ${parentName.charAt(0).toLowerCase() + parentName.slice(1)} ${parentName} @relation(fields: [${parentKey}], references: [id])`
      );
      relatedModels.push(withRelation);
    }

    return nestedModelName;
  }

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
