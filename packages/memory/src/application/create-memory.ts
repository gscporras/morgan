import type {
  Memory,
  MemorySource,
  MemoryType,
} from "../domain/memory.js";

import type { MemoryRepository } from "./ports/memory-repository.js";

export interface CreateMemoryInput {
  content: string;
  type: MemoryType;
  source: MemorySource;
  confidence?: number;
}

export interface CreateMemoryDependencies {
  repository: MemoryRepository;
  generateId: () => string;
  now: () => Date;
}

export class CreateMemory {
  constructor(
    private readonly dependencies: CreateMemoryDependencies,
  ) {}

  async execute(input: CreateMemoryInput): Promise<Memory> {
    const content = input.content.trim();

    if (!content) {
      throw new Error("Memory content cannot be empty");
    }

    const confidence = input.confidence ?? 1;

    if (confidence < 0 || confidence > 1) {
      throw new Error("Confidence must be between 0 and 1");
    }

    const now = this.dependencies.now();

    const memory: Memory = {
      id: this.dependencies.generateId(),
      content,
      type: input.type,
      status: "pending",
      source: input.source,
      confidence,
      createdAt: now,
      updatedAt: now,
    };

    await this.dependencies.repository.save(memory);

    return memory;
  }
}