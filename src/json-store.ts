export interface JsonAdapter {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  remove(path: string): Promise<void>;
  mkdir(path: string): Promise<void>;
}

export class JsonStoreError extends Error {
  readonly cause?: unknown;

  constructor(
    message: string,
    readonly operation: "read" | "validation" | "write",
    options?: { cause?: unknown }
  ) {
    super(message);
    this.name = "JsonStoreError";
    this.cause = options?.cause;
  }
}

function parentDirectory(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const separator = normalized.lastIndexOf("/");
  return separator > 0 ? normalized.slice(0, separator) : "";
}

export class AtomicJsonStore<T> {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly adapter: JsonAdapter,
    private readonly path: string,
    private readonly validate: (value: unknown) => T
  ) {}

  private parseAndValidate(raw: string): T {
    try {
      return this.validate(JSON.parse(raw));
    } catch (error) {
      throw new JsonStoreError("JSON document validation failed", "validation", { cause: error });
    }
  }

  private serialize(value: T): string {
    let validated: T;
    try {
      validated = this.validate(value);
    } catch (error) {
      throw new JsonStoreError("JSON document validation failed", "validation", { cause: error });
    }
    return JSON.stringify(validated, null, 2) + "\n";
  }

  private async ensureParentDirectory(): Promise<void> {
    const directory = parentDirectory(this.path);
    if (!directory || (await this.adapter.exists(directory))) return;
    const parts = directory.split("/").filter(Boolean);
    let current = directory.startsWith("/") ? "/" : "";
    for (const part of parts) {
      current = current && current !== "/" ? `${current}/${part}` : `${current}${part}`;
      if (!(await this.adapter.exists(current))) await this.adapter.mkdir(current);
    }
  }

  private async readValidated(path: string): Promise<T> {
    const raw = await this.adapter.read(path);
    return this.parseAndValidate(raw);
  }

  async read(): Promise<T | null> {
    return this.readWithBackup();
  }

  async readWithBackup(): Promise<T | null> {
    const backupPath = `${this.path}.bak`;
    const primaryExists = await this.adapter.exists(this.path);
    if (primaryExists) {
      try {
        return await this.readValidated(this.path);
      } catch (error) {
        void error;
      }
    }
    if (!(await this.adapter.exists(backupPath))) {
      if (!primaryExists) return null;
      throw new JsonStoreError("JSON document and backup are unreadable", "read");
    }
    try {
      const backup = await this.readValidated(backupPath);
      await this.ensureParentDirectory();
      await this.adapter.write(this.path, this.serialize(backup));
      return backup;
    } catch (error) {
      if (error instanceof JsonStoreError) throw error;
      throw new JsonStoreError("JSON backup recovery failed", "read", { cause: error });
    }
  }

  write(value: T): Promise<void> {
    const operation = this.writeQueue.then(() => this.writeNow(value));
    this.writeQueue = operation.catch(() => undefined);
    return operation;
  }

  private async safeRemove(path: string): Promise<void> {
    try {
      if (await this.adapter.exists(path)) await this.adapter.remove(path);
    } catch (error) {
      void error;
    }
  }

  private async writeNow(value: T): Promise<void> {
    const serialized = this.serialize(value);
    const tempPath = `${this.path}.tmp`;
    const backupPath = `${this.path}.bak`;
    let rotatedPrimary = false;
    try {
      await this.ensureParentDirectory();
      await this.safeRemove(tempPath);
      await this.adapter.write(tempPath, serialized);
      await this.readValidated(tempPath);

      if (await this.adapter.exists(this.path)) {
        let primaryIsValid = false;
        try {
          await this.readValidated(this.path);
          primaryIsValid = true;
        } catch (error) {
          void error;
        }
        if (primaryIsValid) {
          await this.safeRemove(backupPath);
          await this.adapter.rename(this.path, backupPath);
          rotatedPrimary = true;
        } else {
          await this.safeRemove(this.path);
        }
      }

      await this.adapter.rename(tempPath, this.path);
      await this.readValidated(this.path);
    } catch (error) {
      if (rotatedPrimary && !(await this.adapter.exists(this.path)) && (await this.adapter.exists(backupPath))) {
        try {
          const backup = await this.readValidated(backupPath);
          await this.adapter.write(this.path, this.serialize(backup));
        } catch (restoreError) {
          void restoreError;
        }
      }
      await this.safeRemove(tempPath);
      if (error instanceof JsonStoreError) throw error;
      throw new JsonStoreError("Atomic JSON write or replace failed", "write", { cause: error });
    }
  }
}
