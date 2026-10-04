import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Server Components e Server Actions não recebem cookies automaticamente
// como os Route Handlers — precisam pedir a sessão de novo a cada chamada.
// cache() reaproveita o resultado dentro do mesmo request (ex.: layout e
// page da mesma rota chamando isso cada um).
export const getSessaoAtual = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});
