import type { ResearchAction, ResearchActionContext } from "./types";

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

export function createCompatibilityActionRegistry(defaultTranslatePrompt: string): ResearchActionRegistry {
  void defaultTranslatePrompt;
  return createResearchActionRegistry();
}

export function createResearchActionRegistry(): ResearchActionRegistry {
  return new ResearchActionRegistry().register({
    id: "translate",
    name: "Translate selection",
    async execute({ translate }) {
      await translate();
    },
  });
}
