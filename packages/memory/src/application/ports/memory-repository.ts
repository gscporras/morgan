import type { Memory, MemoryStatus } from "../../domain/memory.js";

export interface MemoryRepository {
  save(memory: Memory): Promise<void>;
  findById(id: string): Promise<Memory | null>;
  findByStatus(status: MemoryStatus): Promise<Memory[]>;
}