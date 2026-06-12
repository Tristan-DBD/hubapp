export interface DB {
  clear(): void;
  delete(key: string): void;
  get(key: string): any;
  set(key: string, value: any): void;
}

export interface DBManager {
  clearAll(): void;
  getDB(moduleId: string): DB;
  registerModule(moduleId: string): void;
  unregisterModule(moduleId: string): void;
}
