import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { 
            score, 
            totalQuestions, 
            percentage,
            documentNames, 
            knowledgeIds 
        } = body;

        if (score === undefined || totalQuestions === undefined) {
            return NextResponse.json(
                { error: "Datos de puntuación incompletos" },
                { status: 400 }
            );
        }

        // Build the info_used object
        const infoUsed = {
            documents: documentNames || [],
            knowledge_ids: knowledgeIds || [],
            total_sources: (documentNames?.length || 0) + (knowledgeIds?.length || 0),
        };

        // Save the score
        const { data, error } = await supabase
            .from("user_score")
            .insert({
                user_id: user.id,
                score: score,
                total_questions: totalQuestions,
                percentage: percentage,
                info_used: infoUsed,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            scoreId: data.id,
        });

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Error al guardar la puntuación" },
            { status: 500 }
        );
    }
}


