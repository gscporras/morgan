import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import type { Memory, MemoryStatus, MemoryType } from "../domain/memory.js";
import type { MemoryRepository } from "../application/ports/memory-repository.js";

interface MemoryRow {
  id: string;
  content: string;
  type: MemoryType;
  status: MemoryStatus;
  source_type: "conversation" | "manual" | "import";
  source_reference: string | null;
  confidence: number;
  created_at: string;
  updated_at: string;
}

export class SQLiteMemoryRepository implements MemoryRepository {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    mkdirSync(dirname(dbPath), { recursive: true });

    this.db = new Database(dbPath);

    this.db.pragma("journal_mode = WAL");

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        type TEXT NOT NULL CHECK (
          type IN ('identity', 'episodic', 'semantic', 'factual')
        ),
        status TEXT NOT NULL CHECK (
          status IN ('pending', 'confirmed', 'corrected', 'archived')
        ),
        source_type TEXT NOT NULL CHECK (
          source_type IN ('conversation', 'manual', 'import')
        ),
        source_reference TEXT,
        confidence REAL NOT NULL CHECK (
          confidence >= 0 AND confidence <= 1
        ),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_memories_type
      ON memories(type);

      CREATE INDEX IF NOT EXISTS idx_memories_status
      ON memories(status);
    `);
  }

  async save(memory: Memory): Promise<void> {
    this.db.prepare(`
      INSERT INTO memories (
        id, content, type, status,
        source_type, source_reference,
        confidence, created_at, updated_at
      )
      VALUES (
        @id, @content, @type, @status,
        @sourceType, @sourceReference,
        @confidence, @createdAt, @updatedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content,
        type = excluded.type,
        status = excluded.status,
        source_type = excluded.source_type,
        source_reference = excluded.source_reference,
        confidence = excluded.confidence,
        updated_at = excluded.updated_at
    `).run({
      id: memory.id,
      content: memory.content,
      type: memory.type,
      status: memory.status,
      sourceType: memory.source.type,
      sourceReference: memory.source.reference ?? null,
      confidence: memory.confidence,
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
    });
  }

  async findById(id: string): Promise<Memory | null> {
    const row = this.db.prepare(`
      SELECT * FROM memories WHERE id = ?
    `).get(id) as MemoryRow | undefined;

    if (!row) return null;

    return {
      id: row.id,
      content: row.content,
      type: row.type,
      status: row.status,
      source: {
        type: row.source_type,
        ...(row.source_reference ? { reference: row.source_reference } : {}),
      },
      confidence: row.confidence,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async findByStatus(status: MemoryStatus): Promise<Memory[]> {
    const rows = this.db.prepare(`
    SELECT * FROM memories
    WHERE status = ?
    ORDER BY created_at DESC, id ASC
  `).all(status) as MemoryRow[];

    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      type: row.type,
      status: row.status,
      source: {
        type: row.source_type,
        ...(row.source_reference ? { reference: row.source_reference } : {}),
      },
      confidence: row.confidence,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  close(): void {
    this.db.close();
  }
}
