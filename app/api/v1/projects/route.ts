import { createApiResponse, parseJsonBody } from "@/lib/api";
import { authenticatedContext } from "@/lib/server-auth";
import { projectCreateSchema } from "@/lib/validators";
import type { ResearchProject } from "@/lib/types";

export async function GET() {
  try {
    const { supabase, user } = await authenticatedContext();
    if (!user) return createApiResponse(null, { code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu." }, 401);

    const { data, error } = await supabase
      .from("research_projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;

    return createApiResponse((data ?? []) as ResearchProject[], null);
  } catch {
    return createApiResponse(null, { code: "PROJECTS_UNAVAILABLE", message: "Ruang riset belum dapat dimuat." }, 503);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await authenticatedContext();
    if (!user) return createApiResponse(null, { code: "UNAUTHENTICATED", message: "Silakan masuk terlebih dahulu." }, 401);

    const body = projectCreateSchema.safeParse(await parseJsonBody(request));
    if (!body.success) {
      return createApiResponse(
        null,
        { code: "INVALID_INPUT", message: "Periksa kembali isi ruang riset.", details: body.error.issues.map((issue) => issue.message) },
        422
      );
    }

    const { data, error } = await supabase.rpc("create_research_project", {
      p_title: body.data.title,
      p_research_field: body.data.researchField,
      p_research_question: body.data.researchQuestion
    });
    if (error) throw error;

    return createApiResponse(data as ResearchProject, null, 201);
  } catch {
    return createApiResponse(null, { code: "PROJECT_CREATE_FAILED", message: "Ruang riset belum dapat dibuat." }, 500);
  }
}

