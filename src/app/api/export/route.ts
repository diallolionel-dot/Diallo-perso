import { getSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Export complet des données de l'utilisateur connecté, au format JSON. */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Mode démonstration : aucune donnée à exporter." }, { status: 404 });
  }

  const { supabase } = await getSession();
  const { data, error } = await supabase.rpc("export_my_data");
  if (error) return Response.json({ error: "Export impossible." }, { status: 500 });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="diallo-coaching-export-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
