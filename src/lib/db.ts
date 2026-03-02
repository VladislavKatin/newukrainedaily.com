import "server-only";
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { getDatabaseUrl } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __postgresPool__: Pool | undefined;
}

function createPool() {
  return new Pool({
    connectionString: getDatabaseUrl(),
    max: 5,
    connectionTimeoutMillis: 1500,
    idleTimeoutMillis: 5000
  });
}

export function getPool() {
  if (!global.__postgresPool__) {
    global.__postgresPool__ = createPool();
  }

  return global.__postgresPool__;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query("begin");
    const result = await callback(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
