/**
 * `node:sqlite` の最小限の型。
 *
 * Node 22 に同梱されている実験的モジュールだが、このリポジトリが使っている
 * `@types/node@20` にはまだ型が無い。テスト（`src/lib/__tests__/inventory.test.ts`）で
 * drizzle が生成した実際の SQL を走らせるためだけに使うので、
 * @types/node を上げる代わりに、使っている API だけをここで宣言する。
 *
 * 本番コード（Workers）では使わない。D1 が SQLite を提供する。
 */
declare module "node:sqlite" {
  type SqlValue = string | number | bigint | null | Uint8Array;

  class StatementSync {
    all(...params: SqlValue[]): unknown[];
    get(...params: SqlValue[]): unknown;
    run(...params: SqlValue[]): { changes: number; lastInsertRowid: number };
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
