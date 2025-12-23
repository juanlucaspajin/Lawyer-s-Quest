"use client";

import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Spinner,
    Chip,
    Progress,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface ScoreEntry {
    id: string;
    score: number;
    total_questions: number;
    percentage: number;
    info_used: {
        documents: string[];
        knowledge_ids: string[];
        total_sources: number;
    };
    created_at: string;
}

interface Summary {
    totalQuizzes: number;
    totalCorrect: number;
    totalQuestions: number;
    overallPercentage: number;
}

export default function ResultsPage() {
    const { session } = useAuth();
    const router = useRouter();
    const [scores, setScores] = useState<ScoreEntry[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            if (!session?.access_token) return;

            try {
                const response = await fetch("/api/quiz/results", {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Error al cargar los resultados");
                }

                const data = await response.json();
                setScores(data.scores);
                setSummary(data.summary);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [session]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return "success";
        if (percentage >= 60) return "warning";
        return "danger";
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 80) return "success";
        if (percentage >= 60) return "warning";
        return "danger";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
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
                        <h1 className="text-xl font-bold text-white tracking-tight">
                            Mis Resultados
                        </h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Spinner size="lg" color="secondary" />
                        <p className="text-white/60 mt-4">Cargando resultados...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-400 mb-4">{error}</p>
                        <Button
                            color="secondary"
                            onPress={() => router.push("/dashboard")}
                        >
                            Volver al Panel
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Summary Card */}
                        {summary && (
                            <Card className="bg-white/5 border border-white/10 mb-8">
                                <CardHeader className="pb-0 pt-6 px-8">
                                    <h2 className="text-2xl font-bold text-white">
                                        Resumen General
                                    </h2>
                                </CardHeader>
                                <CardBody className="px-8 pb-8">
                                    <div className="grid md:grid-cols-4 gap-6 mt-4">
                                        <div className="text-center p-4 rounded-xl bg-white/5">
                                            <p className="text-4xl font-bold text-white mb-1">
                                                {summary.totalQuizzes}
                                            </p>
                                            <p className="text-white/60 text-sm">
                                                Cuestionarios Completados
                                            </p>
                                        </div>
                                        <div className="text-center p-4 rounded-xl bg-white/5">
                                            <p className="text-4xl font-bold text-white mb-1">
                                                {summary.totalCorrect}
                                            </p>
                                            <p className="text-white/60 text-sm">
                                                Respuestas Correctas
                                            </p>
                                        </div>
                                        <div className="text-center p-4 rounded-xl bg-white/5">
                                            <p className="text-4xl font-bold text-white mb-1">
                                                {summary.totalQuestions}
                                            </p>
                                            <p className="text-white/60 text-sm">
                                                Preguntas Totales
                                            </p>
                                        </div>
                                        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30">
                                            <p className="text-4xl font-bold text-emerald-400 mb-1">
                                                {summary.overallPercentage}%
                                            </p>
                                            <p className="text-white/60 text-sm">
                                                Puntuación Global
                                            </p>
                                        </div>
                                    </div>

                                    {summary.totalQuestions > 0 && (
                                        <div className="mt-6">
                                            <Progress
                                                value={summary.overallPercentage}
                                                color={getProgressColor(summary.overallPercentage)}
                                                className="h-3"
                                                aria-label="Puntuación global"
                                            />
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        )}

                        {/* Quiz History */}
                        <h2 className="text-xl font-bold text-white mb-4">
                            Historial de Cuestionarios
                        </h2>

                        {scores.length === 0 ? (
                            <Card className="bg-white/5 border border-white/10">
                                <CardBody className="py-12 text-center">
                                    <svg
                                        className="w-16 h-16 text-white/20 mx-auto mb-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                    <p className="text-white/60 mb-4">
                                        Aún no has completado ningún cuestionario.
                                    </p>
                                    <Button
                                        color="secondary"
                                        onPress={() => router.push("/dashboard/quiz")}
                                    >
                                        Iniciar un Cuestionario
                                    </Button>
                                </CardBody>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {scores.map((score) => (
                                    <Card
                                        key={score.id}
                                        className="bg-white/5 border border-white/10"
                                    >
                                        <CardBody className="px-6 py-4">
                                            <div className="flex items-center justify-between flex-wrap gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
                                                        <span className="text-lg font-bold text-emerald-400">
                                                            {score.percentage}%
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">
                                                            {score.score} de {score.total_questions} correctas
                                                        </p>
                                                        <p className="text-white/40 text-sm">
                                                            {formatDate(score.created_at)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <Chip
                                                        size="sm"
                                                        color={getScoreColor(score.percentage)}
                                                        variant="flat"
                                                    >
                                                        {score.percentage >= 80
                                                            ? "Excelente"
                                                            : score.percentage >= 60
                                                            ? "Bien"
                                                            : "Necesita Práctica"}
                                                    </Chip>

                                                    {score.info_used?.documents?.length > 0 && (
                                                        <Chip
                                                            size="sm"
                                                            variant="flat"
                                                            className="bg-white/10 text-white/60"
                                                        >
                                                            {score.info_used.documents.length} documento
                                                            {score.info_used.documents.length !== 1 ? "s" : ""}
                                                        </Chip>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-3">
                                                <Progress
                                                    value={score.percentage}
                                                    color={getProgressColor(score.percentage)}
                                                    className="h-2"
                                                    aria-label="Puntuación"
                                                />
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

