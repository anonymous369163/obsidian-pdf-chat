import type { ResearchAction, ResearchActionContext } from "./types";

export class ActionRegistry {
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

export function createCompatibilityActionRegistry(defaultTranslatePrompt: string): ActionRegistry {
  return new ActionRegistry().register({
    id: "translate",
    name: "Translate selection",
    async execute({ settings, submit }) {
      const configured = settings.translatePrompt;
      const instruction = (
        (typeof configured === "string" ? configured : "") || defaultTranslatePrompt
      ).trim();
      if (!instruction) return;
      await submit({ question: instruction, skipContextAugmentation: true });
    },
  });
}
