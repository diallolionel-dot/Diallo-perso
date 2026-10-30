/**
 * Faux client Supabase pour tester les Server Actions : enregistre chaque
 * appel (tables, filtres, charges utiles, RPC, stockage) et renvoie des
 * réponses configurables. Aucune requête réseau.
 */

export interface RecordedQuery {
  table: string;
  op: "select" | "insert" | "update" | "upsert" | "delete";
  payload?: unknown;
  options?: unknown;
  filters: Array<[string, string, unknown]>;
}

type Response = { data: unknown; error: unknown };

export interface FakeConfig {
  /** Réponse par « table.op » (ex. "weight_entries.insert"). */
  responses?: Record<string, Response>;
  rpc?: Record<string, Response>;
  uploadError?: unknown;
}

export function createFakeSupabase(config: FakeConfig = {}) {
  const queries: RecordedQuery[] = [];
  const rpcCalls: Array<{ fn: string; args: unknown }> = [];
  const uploads: Array<{ bucket: string; path: string; contentType?: string; size: number }> = [];
  const removed: string[] = [];

  function from(table: string) {
    const query: RecordedQuery = { table, op: "select", filters: [] };
    queries.push(query);
    const respond = (): Response => config.responses?.[`${table}.${query.op}`] ?? { data: null, error: null };

    const builder = {
      select() {
        return builder;
      },
      insert(payload: unknown) {
        query.op = "insert";
        query.payload = payload;
        return builder;
      },
      update(payload: unknown) {
        query.op = "update";
        query.payload = payload;
        return builder;
      },
      upsert(payload: unknown, options?: unknown) {
        query.op = "upsert";
        query.payload = payload;
        query.options = options;
        return builder;
      },
      delete() {
        query.op = "delete";
        return builder;
      },
      eq(column: string, value: unknown) {
        query.filters.push(["eq", column, value]);
        return builder;
      },
      gte(column: string, value: unknown) {
        query.filters.push(["gte", column, value]);
        return builder;
      },
      lt(column: string, value: unknown) {
        query.filters.push(["lt", column, value]);
        return builder;
      },
      order() {
        return builder;
      },
      limit() {
        return builder;
      },
      single: async () => respond(),
      maybeSingle: async () => respond(),
      then(resolve: (r: Response) => unknown, reject?: (e: unknown) => unknown) {
        return Promise.resolve(respond()).then(resolve, reject);
      },
    };
    return builder;
  }

  const client = {
    from,
    rpc: async (fn: string, args?: unknown) => {
      rpcCalls.push({ fn, args });
      return config.rpc?.[fn] ?? { data: null, error: null };
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, body: Uint8Array, options?: { contentType?: string }) => {
          uploads.push({ bucket, path, contentType: options?.contentType, size: body.byteLength });
          return { data: config.uploadError ? null : { path }, error: config.uploadError ?? null };
        },
        remove: async (paths: string[]) => {
          removed.push(...paths);
          return { data: [], error: null };
        },
        list: async () => ({ data: [], error: null }),
        createSignedUrls: async (paths: string[]) => ({
          data: paths.map((p) => ({ path: p, signedUrl: `https://signed.example/${p}` })),
          error: null,
        }),
      }),
    },
    auth: {
      signInWithPassword: async () => ({ data: {}, error: null }),
      signOut: async () => ({ error: null }),
      getClaims: async () => ({ data: null, error: null }),
    },
  };

  return { client, queries, rpcCalls, uploads, removed };
}

/** Octets d'un JPEG minimal (signature valide). */
export function jpegFile(size = 64): File {
  const bytes = new Uint8Array(size);
  bytes.set([0xff, 0xd8, 0xff, 0xe0]);
  return new File([bytes], "photo.jpg", { type: "image/jpeg" });
}
