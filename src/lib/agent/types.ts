import type { Brand, Goal, Project } from "../model";
export type Json = Record<string, unknown>;
// What the browser sends: a read-only snapshot of the creator's workspace.
export type Workspace = {
  brief: string;
  today: string;
  profile: { name: string; niche: string };
  goal: Goal;
  brand: Brand;
  journal: string[];
  media: {
    id: string;
    name: string;
    type: string;
    collection: string;
    tags: string;
    own: boolean;
  }[];
  scheduled: string[];
};
export type ToolCall = { id: string; name: string; args: Json };
// One model turn. No calls means the model is finished and `thought` is its summary.
export type Turn = { thought: string; calls: ToolCall[] };
export type Transcript = { call: ToolCall; ok: boolean; output: unknown }[];
export type Field = {
  type: "string" | "number" | "array";
  required?: boolean;
  enum?: readonly string[];
  min?: number;
  max?: number;
  maxLength?: number;
  maxItems?: number;
  items?: Record<string, Field>;
  description?: string;
};
export type ToolSpec = {
  name: string;
  description: string;
  runsOn: "server" | "browser";
  schema: Record<string, Field>;
};
// Swap these two interfaces to connect a real LLM and a real video model.
export interface ModelProvider {
  id: string;
  label: string;
  next(input: {
    workspace: Workspace;
    tools: ToolSpec[];
    transcript: Transcript;
  }): Promise<Turn>;
}
export interface VideoProvider {
  id: string;
  label: string;
  generate(input: {
    prompt: string;
    seconds: number;
    ratio: string;
  }): Promise<{ mime: string; data: string }>;
}
export type Clip = {
  id: string;
  name: string;
  prompt: string;
  mime: string;
  data: string;
};
export type DraftScene = {
  beat: string;
  subtitle: string;
  source: string;
  mediaId: string;
  prompt: string;
  seconds: number;
  transition: string;
  motion: string;
};
// The agent's working document. Tools are the only way to change it.
export type Draft = {
  idea?: { title: string; hook: string; reason: string };
  scenes: DraftScene[];
  style?: Json;
  copy?: { caption: string; hashtags: string; cta: string; coverTitle: string };
  date: string;
  verified: boolean;
};
export type Context = {
  workspace: Workspace;
  draft: Draft;
  clips: Clip[];
  video: VideoProvider;
};
export type AgentEvent =
  | {
      type: "run";
      model: string;
      video: string;
      tools: ToolSpec[];
      maxSteps: number;
    }
  | { type: "step"; step: number; thought: string; ms: number }
  | {
      type: "tool";
      step: number;
      id: string;
      name: string;
      runsOn: string;
      args: Json;
      ok: boolean;
      output: unknown;
      ms: number;
    }
  | {
      type: "done";
      summary: string;
      project: Project;
      clips: Clip[];
      steps: number;
      toolCalls: number;
      rejected: number;
      ms: number;
    }
  | { type: "error"; message: string };
