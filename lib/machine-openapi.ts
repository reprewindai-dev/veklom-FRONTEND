import { isCappoProxyPath, isCappoPublicPath } from "@/lib/cappo-proxy-paths";

/**
 * The public machine OpenAPI: CAPPO's own spec, reduced to the routes this site actually
 * forwards (the same allow-list the /api/cappo proxy enforces), at the paths they are
 * reachable on. Internal routes (licences, kill switch, budgets, legacy device adapters,
 * test endpoints, admin) are never published, and only the schemas the kept routes use remain.
 */
type Json = Record<string, unknown>;

const PUBLIC_PREFIX = "/api/cappo";

// A templated spec path ("/v1/capability/mounts/{mount_id}/execute") is matched against the
// allow-list with each parameter replaced by a concrete placeholder segment.
function concrete(path: string) {
  return path.replace(/\{[^/}]+\}/g, "x");
}

function collectRefs(node: unknown, out: Set<string>) {
  if (Array.isArray(node)) {
    for (const item of node) collectRefs(item, out);
  } else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node as Json)) {
      if (key === "$ref" && typeof value === "string" && value.startsWith("#/components/schemas/")) {
        out.add(value.slice("#/components/schemas/".length));
      } else {
        collectRefs(value, out);
      }
    }
  }
}

export function publicMachineSpec(spec: Json, origin = "https://veklom.com"): Json {
  const paths = (spec.paths ?? {}) as Record<string, Json>;
  const kept: Record<string, Json> = {};
  for (const [path, ops] of Object.entries(paths)) {
    const probe = concrete(path);
    if (!isCappoProxyPath(probe)) continue;
    const session = !isCappoPublicPath(probe);
    const marked: Json = {};
    for (const [method, op] of Object.entries(ops)) {
      marked[method] = {
        ...(op as Json),
        "x-veklom-access": session ? "signed-in session required" : "public read",
      };
    }
    kept[`${PUBLIC_PREFIX}${path}`] = marked;
  }

  const schemas = (((spec.components ?? {}) as Json).schemas ?? {}) as Record<string, unknown>;
  const needed = new Set<string>();
  collectRefs(kept, needed);
  // Follow schema-to-schema references until no new ones appear.
  for (let grew = true; grew; ) {
    grew = false;
    for (const name of Array.from(needed)) {
      const before = needed.size;
      collectRefs(schemas[name], needed);
      if (needed.size > before) grew = true;
    }
  }
  const keptSchemas: Record<string, unknown> = {};
  for (const name of Array.from(needed).sort()) if (schemas[name]) keptSchemas[name] = schemas[name];

  return {
    openapi: spec.openapi ?? "3.1.0",
    info: {
      title: "Veklom public machine API",
      version: ((spec.info ?? {}) as Json).version ?? "0.1.0",
      description:
        "Only the routes veklom.com forwards to the authority layer, at the paths they are reachable on. " +
        "Routes marked 'signed-in session required' refuse callers without a live session.",
    },
    servers: [{ url: origin }],
    paths: kept,
    components: { schemas: keptSchemas },
  };
}
