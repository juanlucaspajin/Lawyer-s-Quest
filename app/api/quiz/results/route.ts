import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export async function GET(request: NextRequest) {
    try {
        // Get the authorization header
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Token de autorización faltante" },
                { status: 401 }
            );
        }

        const accessToken = authHeader.split(" ")[1];

        // Create Supabase client with user's access token
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        });

        // Verify the user
        const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
        
        if (userError || !user) {
            return NextResponse.json(
                { error: "Sesión inválida o expirada" },
                { status: 401 }
            );
        }

        // Fetch all scores for this user
        const { data: scores, error } = await supabase
            .from("user_score")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        // Calculate overall statistics
        const totalQuizzes = scores?.length || 0;
        const totalCorrect = scores?.reduce((sum, s) => sum + (s.score || 0), 0) || 0;
        const totalQuestions = scores?.reduce((sum, s) => sum + (s.total_questions || 0), 0) || 0;
        const overallPercentage = totalQuestions > 0 
            ? Math.round((totalCorrect / totalQuestions) * 100) 
            : 0;

        return NextResponse.json({
            scores: scores || [],
            summary: {
                totalQuizzes,
                totalCorrect,
                totalQuestions,
                overallPercentage,
            },
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Error al obtener los resultados" },
            { status: 500 }
        );
    }
}

