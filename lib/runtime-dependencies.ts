export type RuntimeDependency = {
  name: string;
  url: string | undefined;
  healthPath?: string;
};

type RuntimeEnvironment = Record<string, string | undefined>;

export function runtimeDependencies(
  env: RuntimeEnvironment = process.env,
): RuntimeDependency[] {
  return [
    {
      name: "cappo",
      url: env.CAPPO_BACKEND_URL || env.CAPPO_URL,
    },
    {
      name: "capi",
      url: env.CAPI_BACKEND_URL || env.INTERLINK_CAPI_URL || env.CAPI_URL,
    },
    {
      name: "gnomledger",
      url: env.PGL_URL || env.GNOMLEDGER_URL,
    },
    {
      name: "lockerphycer",
      url: env.LOCKERPHYCER_URL,
    },
    {
      name: "vlink",
      url: env.VLINK_URL,
      healthPath: "/api/health",
    },
  ];
}
