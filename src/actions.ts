import type {
  ResearchAction,
  ResearchActionContext,
  ResearchActionOperations,
  ResearchActionSlot,
} from "./types";
import type { ResearchCapabilityRegistry } from "./research-capabilities";

export interface ResearchCapabilityActionHandlers {
  onRelatedPapers(adapterId: string, context: ResearchActionContext): Promise<void> | void;
  onPresentation(adapterId: string, context: ResearchActionContext): Promise<void> | void;
}

export class ResearchActionRegistry {
  private readonly actions = new Map<string, ResearchAction>();

  register(action: ResearchAction): this {
    this.actions.set(action.id, action);
    return this;
  }

  get(id: string): ResearchAction | undefined {
    return this.actions.get(id);
  }

  list(): ResearchAction[] {
    return Array.from(this.actions.values());
  }

  async execute(id: string, context: ResearchActionContext): Promise<void> {
    const action = this.get(id);
    if (!action) throw new Error(`Unknown research action: ${id}`);
    await action.execute(context);
  }
}

export { ResearchActionRegistry as ActionRegistry };

export function listResearchActionsForSlot(
  actions: ResearchActionOperations,
  slot: ResearchActionSlot
): ResearchAction[] {
  return actions.list ? actions.list().filter((action) => action.slot === slot) : [];
}

export function createCompatibilityActionRegistry(defaultTranslatePrompt: string): ResearchActionRegistry {
  void defaultTranslatePrompt;
  return createResearchActionRegistry();
}

export function createResearchActionRegistry(): ResearchActionRegistry {
  return new ResearchActionRegistry().register({
    id: "translate",
    name: "Translate selection",
    slot: "composer",
    async execute({ translate }) {
      await translate();
    },
  });
}

export async function registerAvailableResearchCapabilityActions(
  actions: ResearchActionRegistry,
  capabilities: ResearchCapabilityRegistry,
  handlers: ResearchCapabilityActionHandlers
): Promise<ResearchActionRegistry> {
  for (const capability of await capabilities.listAvailable()) {
    if (capability.kind === "related-papers") {
      actions.register({
        id: `related-papers:${capability.id}`,
        name: capability.label,
        slot: "context",
        execute: (context) => handlers.onRelatedPapers(capability.id, context),
      });
    } else {
      actions.register({
        id: `presentation:${capability.id}`,
        name: capability.label,
        slot: "context",
        execute: (context) => handlers.onPresentation(capability.id, context),
      });
    }
  }
  return actions;
}
