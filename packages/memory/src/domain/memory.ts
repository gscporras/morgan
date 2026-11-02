export type MemoryType =
  | "identity"
  | "episodic"
  | "semantic"
  | "factual";

export type MemoryStatus =
  | "pending"
  | "confirmed"
  | "corrected"
  | "archived";

export interface MemorySource {
  type: "conversation" | "manual" | "import";
  reference?: string;
}

export interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  status: MemoryStatus;
  source: MemorySource;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}