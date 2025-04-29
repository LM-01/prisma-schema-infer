// tests/infer.test.ts

import { inferPrismaSchemaModel } from '../src/lib/infer';

describe('inferPrismaSchemaModel', () => {
  it('should correctly infer a flat Prisma model', () => {
    const sample = [
      { id: 1, name: 'Alice', createdAt: '2024-01-01T00:00:00Z' },
      { id: 2, name: 'Bob', updatedAt: '2024-01-02T10:00:00Z' }
    ];

    const output = inferPrismaSchemaModel('User', sample);

    expect(output).toContain('model User');
    expect(output).toContain('id Int @id @default(autoincrement())');
    expect(output).toContain('name String');
    expect(output).toContain('createdAt DateTime @default(now())');
    expect(output).toContain('updatedAt DateTime @updatedAt');
  });

  it('should normalize arrays of objects into related models', () => {
    const sample = [
      {
        id: '1',
        name: 'Project A',
        tasks: [
          { title: 'Task 1', completed: false },
          { title: 'Task 2', completed: true }
        ]
      }
    ];

    const output = inferPrismaSchemaModel('Project', sample, { normalizeArrays: true });

    expect(output).toContain('model Project');
    expect(output).toContain('tasks ProjectTasks[]');
    expect(output).toContain('model ProjectTasks');
    expect(output).toContain('title String');
    expect(output).toContain('completed Boolean');
    expect(output).toContain('@relation(fields: [projectId], references: [id])');
  });

  it('should handle missing id fields and add default id if needed', () => {
    const sample = [{ name: 'NoIdHere' }];

    const output = inferPrismaSchemaModel('NoIdModel', sample);

    expect(output).toContain('id String @id @default(uuid())');
    expect(output).toContain('name String');
  });

  it('should infer types correctly for non-optional fields', () => {
    const sample = [{ score: 100 }, {}];

    const output = inferPrismaSchemaModel('ScoredModel', sample);

    expect(output).toContain('score Int');
  });
});
