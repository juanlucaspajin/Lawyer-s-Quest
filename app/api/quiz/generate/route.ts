import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

const BUCKET_NAME = "LawyerPdf";

interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

export async function POST(request: NextRequest) {
    try {
        // Get the authorization header
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Missing authorization token" },
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
                { error: "Invalid or expired session" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { documentNames, knowledgeIds, questionCount = 10 } = body;

        if (
            (!documentNames || documentNames.length === 0) &&
            (!knowledgeIds || knowledgeIds.length === 0)
        ) {
            return NextResponse.json(
                { error: "No content selected" },
                { status: 400 }
            );
        }

        // Gather all content
        const contentParts: string[] = [];

        // Fetch knowledge entries from database
        if (knowledgeIds && knowledgeIds.length > 0) {
            const { data: knowledgeData, error: knowledgeError } = await supabase
                .from("knowledge_info")
                .select("title, content")
                .in("id", knowledgeIds);

            if (knowledgeError) {
                throw new Error(`Failed to fetch knowledge: ${knowledgeError.message}`);
            }

            if (knowledgeData) {
                for (const entry of knowledgeData) {
                    contentParts.push(`## ${entry.title}\n${entry.content}`);
                }
            }
        }

        // Fetch document contents from storage (for text files)
        if (documentNames && documentNames.length > 0) {
            for (const docName of documentNames) {
                const filePath = `${user.id}/${docName}`;
                
                // Only process text files for now
                if (docName.endsWith(".txt")) {
                    const { data, error } = await supabase.storage
                        .from(BUCKET_NAME)
                        .download(filePath);

                    if (!error && data) {
                        const text = await data.text();
                        contentParts.push(`## Document: ${docName}\n${text}`);
                    }
                } else {
                    // For PDF/DOCX, add a placeholder - you'd need a parsing library
                    contentParts.push(`## Document: ${docName}\n[Binary document - content extraction not implemented]`);
                }
            }
        }

        if (contentParts.length === 0) {
            return NextResponse.json(
                { error: "No readable content found" },
                { status: 400 }
            );
        }

        const combinedContent = contentParts.join("\n\n---\n\n");

        // Limit content length to avoid token limits
        const maxContentLength = 12000;
        const truncatedContent = combinedContent.length > maxContentLength
            ? combinedContent.slice(0, maxContentLength) + "\n\n[Content truncated...]"
            : combinedContent;

        // Generate quiz questions using OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Eres un experto generador de cuestionarios. Crea preguntas de opción múltiple basadas en el contenido proporcionado. 
                    
Reglas:
- Genera exactamente ${questionCount} preguntas
- Cada pregunta debe tener exactamente 4 opciones (A, B, C, D)
- Las preguntas deben evaluar comprensión, no solo memorización
- Incluye una breve explicación para cada respuesta correcta
- Varía los niveles de dificultad
- Asegúrate de que todas las respuestas se deriven claramente del contenido proporcionado
- IMPORTANTE: Todas las preguntas, opciones y explicaciones deben estar en ESPAÑOL

Responde ÚNICAMENTE con JSON válido en este formato exacto:
{
    "questions": [
        {
            "id": 1,
            "question": "¿Texto de la pregunta aquí?",
            "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
            "correctAnswer": 0,
            "explanation": "Breve explicación de por qué esta es la respuesta correcta"
        }
    ]
}`
                },
                {
                    role: "user",
                    content: `Genera un cuestionario basado en este contenido:\n\n${truncatedContent}`
                }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0]?.message?.content;
        
        if (!responseContent) {
            throw new Error("No response from OpenAI");
        }

        const quizData = JSON.parse(responseContent);

        return NextResponse.json({
            questions: quizData.questions as QuizQuestion[],
            totalQuestions: quizData.questions.length,
        });

    } catch (error: any) {
        if (error?.status === 401) {
            return NextResponse.json(
                { error: "Invalid OpenAI API key" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to generate quiz" },
            { status: 500 }
        );
    }
}
