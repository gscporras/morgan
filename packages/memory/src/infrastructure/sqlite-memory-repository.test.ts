import { afterEach, describe, expect, it } from "vitest";

import { SQLiteMemoryRepository } from "./sqlite-memory-repository.js";
import type { Memory } from "../domain/memory.js";

describe("SQLiteMemoryRepository", () => {
    let repository: SQLiteMemoryRepository;

    afterEach(() => {
        repository?.close();
    });

    it("persists and retrieves a memory", async () => {
        repository = new SQLiteMemoryRepository(":memory:");

        const now = new Date("2026-11-02T15:00:00Z");

        const memory: Memory = {
            id: "memory-001",
            content: "I prefer building software with TypeScript",
            type: "identity",
            status: "pending",
            source: {
                type: "manual",
                reference: "test",
            },
            confidence: 1,
            createdAt: now,
            updatedAt: now,
        };

        await repository.save(memory);

        const result = await repository.findById(memory.id);

        expect(result).toEqual(memory);
    });

    it("returns null when memory does not exist", async () => {
        repository = new SQLiteMemoryRepository(":memory:");

        const result = await repository.findById("unknown");

        expect(result).toBeNull();
    });

    it("updates an existing memory", async () => {
        repository = new SQLiteMemoryRepository(":memory:");

        const now = new Date("2026-11-02T15:00:00Z");

        const memory: Memory = {
            id: "memory-002",
            content: "Original content",
            type: "factual",
            status: "pending",
            source: { type: "manual" },
            confidence: 1,
            createdAt: now,
            updatedAt: now,
        };

        await repository.save(memory);

        const updated: Memory = {
            ...memory,
            content: "Corrected content",
            status: "corrected",
            updatedAt: new Date("2026-11-02T16:00:00Z"),
        };

        await repository.save(updated);

        expect(await repository.findById(memory.id)).toEqual(updated);
    });

    it("finds memories by status", async () => {
        repository = new SQLiteMemoryRepository(":memory:");

        const now = new Date();

        const memories: Memory[] = [
            {
                id: "memory-001",
                content: "Pending memory",
                type: "identity",
                status: "pending",
                source: { type: "manual" },
                confidence: 1,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: "memory-002",
                content: "Confirmed memory",
                type: "factual",
                status: "confirmed",
                source: { type: "manual" },
                confidence: 1,
                createdAt: now,
                updatedAt: now,
            },
        ];

        for (const memory of memories) {
            await repository.save(memory);
        }

        const pending = await repository.findByStatus("pending");

        expect(pending).toHaveLength(1);
        expect(pending[0].id).toBe("memory-001");
    });
});
