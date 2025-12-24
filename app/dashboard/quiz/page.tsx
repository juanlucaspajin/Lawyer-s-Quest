"use client";

import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Checkbox,
    Chip,
    Spinner,
    Tabs,
    Tab,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

interface StorageFile {
    id: string;
    name: string;
    created_at: string;
    metadata: Record<string, any> | null;
}

interface KnowledgeEntry {
    id: string;
    title: string;
    content: string;
    created_at: string;
}

const BUCKET_NAME = "LawyerPdf";

export default function QuizPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Documents state
    const [documents, setDocuments] = useState<StorageFile[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);
    const [docsError, setDocsError] = useState<string | null>(null);
    const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

    // Knowledge entries state
    const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
    const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(true);
    const [knowledgeError, setKnowledgeError] = useState<string | null>(null);
    const [selectedKnowledge, setSelectedKnowledge] = useState<Set<string>>(new Set());

    // Quiz count state
    const [quizCount, setQuizCount] = useState<number>(0);
    const [isLoadingQuizCount, setIsLoadingQuizCount] = useState(true);

    // Custom quiz settings (unlocked after 3 quizzes)
    const [customQuestionCount, setCustomQuestionCount] = useState<number>(10);
    const [customTimeMinutes, setCustomTimeMinutes] = useState<number>(10);

    // Fetch quiz count from results
    useEffect(() => {
        const fetchQuizCount = async () => {
            if (!user) return;

            setIsLoadingQuizCount(true);

            try {
                const session = await supabase.auth.getSession();
                const accessToken = session.data.session?.access_token;

                if (!accessToken) return;

                const response = await fetch("/api/quiz/results", {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setQuizCount(data.summary.totalQuizzes || 0);
                }
            } catch (error: any) {
                // Silently fail - quiz count is not critical
            } finally {
                setIsLoadingQuizCount(false);
            }
        };

        fetchQuizCount();
    }, [user]);

    // Fetch documents from storage
    useEffect(() => {
        const fetchDocuments = async () => {
            if (!user) return;

            setIsLoadingDocs(true);
            setDocsError(null);

            try {
                const { data, error } = await supabase.storage
                    .from(BUCKET_NAME)
                    .list(user.id, {
                        sortBy: { column: "created_at", order: "desc" },
                    });

                if (error) throw error;

                setDocuments(data || []);
            } catch (error: any) {
                setDocsError(error.message || "Error al cargar documentos");
            } finally {
                setIsLoadingDocs(false);
            }
        };

        fetchDocuments();
    }, [user]);

    // Fetch knowledge entries from database
    useEffect(() => {
        const fetchKnowledge = async () => {
            if (!user) return;

            setIsLoadingKnowledge(true);
            setKnowledgeError(null);

            try {
                const { data, error } = await supabase
                    .from("knowledge_info")
                    .select("id, title, content, created_at")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                setKnowledgeEntries(data || []);
            } catch (error: any) {
                setKnowledgeError(error.message || "Error al cargar contenido");
            } finally {
                setIsLoadingKnowledge(false);
            }
        };

        fetchKnowledge();
    }, [user]);

    const toggleDocSelection = (id: string) => {
        setSelectedDocs((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleKnowledgeSelection = (id: string) => {
        setSelectedKnowledge((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const selectAllDocs = () => {
        if (selectedDocs.size === documents.length) {
            setSelectedDocs(new Set());
        } else {
            setSelectedDocs(new Set(documents.map((d) => d.name)));
        }
    };

    const selectAllKnowledge = () => {
        if (selectedKnowledge.size === knowledgeEntries.length) {
            setSelectedKnowledge(new Set());
        } else {
            setSelectedKnowledge(new Set(knowledgeEntries.map((k) => k.id)));
        }
    };

    const totalSelected = selectedDocs.size + selectedKnowledge.size;

    const getFileExtension = (filename: string) => {
        return filename.split(".").pop()?.toUpperCase() || "FILE";
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split(".").pop()?.toLowerCase();
        if (ext === "pdf") {
            return (
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 text-xs font-bold">PDF</span>
                </div>
            );
        }
        if (ext === "docx") {
            return (
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 text-xs font-bold">DOC</span>
                </div>
            );
        }
        return (
            <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
                <span className="text-gray-400 text-xs font-bold">TXT</span>
            </div>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    };

    const handleStartQuiz = () => {
        const params = new URLSearchParams();
        
        if (selectedDocs.size > 0) {
            params.set("docs", Array.from(selectedDocs).join(","));
        }
        if (selectedKnowledge.size > 0) {
            params.set("knowledge", Array.from(selectedKnowledge).join(","));
        }
        
        // Add custom parameters if unlocked
        if (quizCount >= 3) {
            params.set("questionCount", customQuestionCount.toString());
            params.set("timeMinutes", customTimeMinutes.toString());
        }
        
        router.push(`/dashboard/quiz/play?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Button
                        isIconOnly
                        variant="light"
                        onPress={() => router.push("/dashboard")}
                        className="text-white/60 hover:text-white"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </Button>
                    <img src="/logo.png" alt="Acertijos de Estudio" className="h-8 w-8 object-contain" />
                    <h1 className="text-xl font-bold text-white tracking-tight">
                        Iniciar Cuestionario
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Selecciona tus Fuentes de Conocimiento
                    </h2>
                    <p className="text-white/60">
                        Elige los documentos y contenido sobre los que quieres ser evaluado
                    </p>
                </div>

                {/* Premium Feature Banner - Shows when user has 3+ quizzes */}
                {!isLoadingQuizCount && quizCount >= 3 && (
                    <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 mb-6">
                        <CardBody className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-amber-400 mb-2 flex items-center gap-2">
                                        🎉 ¡Función Premium Desbloqueada!
                                    </h3>
                                    <p className="text-white/90 mb-3">
                                        Has completado <span className="font-bold text-amber-400">{quizCount} cuestionarios</span>. Ahora puedes personalizar:
                                    </p>
                                    <ul className="text-white/80 space-y-1 mb-4">
                                        <li className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Cantidad de preguntas (máximo 30)</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Tiempo límite personalizado (ponete un tiempo acorde, no seas miedoso 👀)</span>
                                        </li>
                                    </ul>
                                    
                                    {/* Custom Settings */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div>
                                            <label className="block text-white/90 text-sm font-medium mb-2">
                                                Cantidad de Preguntas
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min="5"
                                                    max="30"
                                                    step="5"
                                                    value={customQuestionCount}
                                                    onChange={(e) => setCustomQuestionCount(parseInt(e.target.value))}
                                                    className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                                />
                                                <span className="text-2xl font-bold text-amber-400 min-w-[3rem] text-right">
                                                    {customQuestionCount}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-white/90 text-sm font-medium mb-2">
                                                Tiempo Límite (minutos)
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min="5"
                                                    max="60"
                                                    step="5"
                                                    value={customTimeMinutes}
                                                    onChange={(e) => setCustomTimeMinutes(parseInt(e.target.value))}
                                                    className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                                />
                                                <span className="text-2xl font-bold text-amber-400 min-w-[3rem] text-right">
                                                    {customTimeMinutes}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}

                <Card className="bg-white/5 border border-white/10 mb-6">
                    <CardBody className="p-0">
                        <Tabs
                            aria-label="Fuentes de contenido"
                            color="secondary"
                            variant="underlined"
                            classNames={{
                                tabList: "gap-6 w-full relative px-6 border-b border-white/10",
                                cursor: "w-full bg-secondary",
                                tab: "max-w-fit px-2 h-12 text-white/60 data-[selected=true]:text-white",
                                tabContent: "group-data-[selected=true]:text-white",
                                panel: "p-6",
                            }}
                        >
                            {/* Documents Tab */}
                            <Tab
                                key="documents"
                                title={
                                    <div className="flex items-center gap-2">
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <span>Documentos</span>
                                        {documents.length > 0 && (
                                            <Chip size="sm" variant="flat" color="secondary">
                                                {documents.length}
                                            </Chip>
                                        )}
                                    </div>
                                }
                            >
                                {isLoadingDocs ? (
                                    <div className="flex justify-center py-12">
                                        <Spinner color="secondary" />
                                    </div>
                                ) : docsError ? (
                                    <div className="p-4 text-sm text-danger bg-danger/10 rounded-lg">
                                        {docsError}
                                    </div>
                                ) : documents.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                            <svg
                                                className="w-8 h-8 text-white/30"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                        </div>
                                        <p className="text-white/40 mb-4">Aún no hay documentos subidos</p>
                                        <Button
                                            color="secondary"
                                            variant="flat"
                                            onPress={() => router.push("/dashboard/load")}
                                        >
                                            Subir Documentos
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Select All */}
                                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                            <Checkbox
                                                isSelected={selectedDocs.size === documents.length && documents.length > 0}
                                                isIndeterminate={selectedDocs.size > 0 && selectedDocs.size < documents.length}
                                                onValueChange={selectAllDocs}
                                                color="secondary"
                                            >
                                                <span className="text-white/60 text-sm">
                                                    Seleccionar todos ({documents.length})
                                                </span>
                                            </Checkbox>
                                            {selectedDocs.size > 0 && (
                                                <Chip size="sm" color="secondary">
                                                    {selectedDocs.size} seleccionados
                                                </Chip>
                                            )}
                                        </div>

                                        {/* Document List */}
                                        {documents.map((doc) => (
                                            <div
                                                key={doc.name}
                                                className={`
                                                    flex items-center gap-4 p-4 rounded-xl cursor-pointer
                                                    transition-all duration-200
                                                    ${selectedDocs.has(doc.name)
                                                        ? "bg-secondary/20 border border-secondary/50"
                                                        : "bg-white/5 border border-transparent hover:bg-white/10"
                                                    }
                                                `}
                                                onClick={() => toggleDocSelection(doc.name)}
                                            >
                                                <Checkbox
                                                    isSelected={selectedDocs.has(doc.name)}
                                                    onValueChange={() => toggleDocSelection(doc.name)}
                                                    color="secondary"
                                                />
                                                {getFileIcon(doc.name)}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium truncate">
                                                        {doc.name.split("-").slice(1).join("-") || doc.name}
                                                    </p>
                                                    <p className="text-white/40 text-sm">
                                                        {formatFileSize(doc.metadata?.size || 0)} • {formatDate(doc.created_at)}
                                                    </p>
                                                </div>
                                                <Chip size="sm" variant="flat" className="bg-white/10 text-white/60">
                                                    {getFileExtension(doc.name)}
                                                </Chip>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Tab>

                            {/* Knowledge Entries Tab */}
                            <Tab
                                key="knowledge"
                                title={
                                    <div className="flex items-center gap-2">
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                            />
                                        </svg>
                                        <span>Contenido Escrito</span>
                                        {knowledgeEntries.length > 0 && (
                                            <Chip size="sm" variant="flat" color="secondary">
                                                {knowledgeEntries.length}
                                            </Chip>
                                        )}
                                    </div>
                                }
                            >
                                {isLoadingKnowledge ? (
                                    <div className="flex justify-center py-12">
                                        <Spinner color="secondary" />
                                    </div>
                                ) : knowledgeError ? (
                                    <div className="p-4 text-sm text-danger bg-danger/10 rounded-lg">
                                        {knowledgeError}
                                    </div>
                                ) : knowledgeEntries.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                            <svg
                                                className="w-8 h-8 text-white/30"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                        </div>
                                        <p className="text-white/40 mb-4">Aún no hay contenido escrito</p>
                                        <Button
                                            color="secondary"
                                            variant="flat"
                                            onPress={() => router.push("/dashboard/load")}
                                        >
                                            Agregar Contenido
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Select All */}
                                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                            <Checkbox
                                                isSelected={selectedKnowledge.size === knowledgeEntries.length && knowledgeEntries.length > 0}
                                                isIndeterminate={selectedKnowledge.size > 0 && selectedKnowledge.size < knowledgeEntries.length}
                                                onValueChange={selectAllKnowledge}
                                                color="secondary"
                                            >
                                                <span className="text-white/60 text-sm">
                                                    Seleccionar todos ({knowledgeEntries.length})
                                                </span>
                                            </Checkbox>
                                            {selectedKnowledge.size > 0 && (
                                                <Chip size="sm" color="secondary">
                                                    {selectedKnowledge.size} seleccionados
                                                </Chip>
                                            )}
                                        </div>

                                        {/* Knowledge List */}
                                        {knowledgeEntries.map((entry) => (
                                            <div
                                                key={entry.id}
                                                className={`
                                                    flex items-start gap-4 p-4 rounded-xl cursor-pointer
                                                    transition-all duration-200
                                                    ${selectedKnowledge.has(entry.id)
                                                        ? "bg-secondary/20 border border-secondary/50"
                                                        : "bg-white/5 border border-transparent hover:bg-white/10"
                                                    }
                                                `}
                                                onClick={() => toggleKnowledgeSelection(entry.id)}
                                            >
                                                <Checkbox
                                                    isSelected={selectedKnowledge.has(entry.id)}
                                                    onValueChange={() => toggleKnowledgeSelection(entry.id)}
                                                    color="secondary"
                                                    className="mt-1"
                                                />
                                                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                                                    <svg
                                                        className="w-5 h-5 text-cyan-400"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium">
                                                        {entry.title}
                                                    </p>
                                                    <p className="text-white/40 text-sm line-clamp-2 mt-1">
                                                        {entry.content}
                                                    </p>
                                                    <p className="text-white/30 text-xs mt-2">
                                                        {formatDate(entry.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Tab>
                        </Tabs>
                    </CardBody>
                </Card>

                {/* Start Quiz Button */}
                <Card className="bg-white/5 border border-white/10">
                    <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">
                                    {totalSelected > 0
                                        ? `${totalSelected} elemento${totalSelected > 1 ? "s" : ""} seleccionado${totalSelected > 1 ? "s" : ""}`
                                        : "Ningún elemento seleccionado"}
                                </p>
                                <p className="text-white/40 text-sm">
                                    {totalSelected > 0
                                        ? "Listo para generar tu cuestionario"
                                        : "Selecciona al menos una fuente para comenzar"}
                                </p>
                            </div>
                            <Button
                                color="secondary"
                                size="lg"
                                isDisabled={totalSelected === 0}
                                onPress={handleStartQuiz}
                                className="px-8"
                            >
                                <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                                Iniciar Cuestionario
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </main>
        </div>
    );
}
