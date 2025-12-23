"use client";

import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Progress,
    Spinner,
    Chip,
} from "@heroui/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

interface QuizQuestion {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

type QuizState = "loading" | "ready" | "playing" | "review" | "complete" | "timeout" | "error";

const QUIZ_DURATION_SECONDS = 10 * 60; // 10 minutes

export default function QuizPlayPage() {
    const { user, session } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Quiz state
    const [quizState, setQuizState] = useState<QuizState>("loading");
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Map<number, number>>(new Map());
    const [showExplanation, setShowExplanation] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState("Preparando tu cuestionario...");
    const [scoreSaved, setScoreSaved] = useState(false);
    const [savingScore, setSavingScore] = useState(false);

    // Timer state
    const [timeRemaining, setTimeRemaining] = useState(QUIZ_DURATION_SECONDS);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Parse URL params
    const documentNames = searchParams.get("docs")?.split(",").filter(Boolean) || [];
    const knowledgeIds = searchParams.get("knowledge")?.split(",").filter(Boolean) || [];

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get timer color based on remaining time
    const getTimerColor = () => {
        if (timeRemaining <= 60) return "text-danger"; // Last minute - red
        if (timeRemaining <= 180) return "text-warning"; // Last 3 minutes - yellow
        return "text-white"; // Normal - white
    };

    // Timer effect - runs when quiz is playing
    useEffect(() => {
        if (quizState === "playing") {
            timerRef.current = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        // Time's up!
                        if (timerRef.current) {
                            clearInterval(timerRef.current);
                        }
                        setQuizState("timeout");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [quizState]);

    // Stop timer when quiz ends normally
    useEffect(() => {
        if (quizState === "complete" || quizState === "timeout") {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    }, [quizState]);

    const generateQuiz = useCallback(async () => {
        if (!user || !session?.access_token) return;

        setQuizState("loading");
        setLoadingMessage("Recopilando tu contenido...");

        try {
            // Short delay for UX
            await new Promise((resolve) => setTimeout(resolve, 500));
            setLoadingMessage("Analizando contenido con IA...");

            const response = await fetch("/api/quiz/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    documentNames,
                    knowledgeIds,
                    questionCount: 10,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al generar el cuestionario");
            }

            setLoadingMessage("Creando tus preguntas...");
            await new Promise((resolve) => setTimeout(resolve, 300));

            const data = await response.json();
            setQuestions(data.questions);
            setQuizState("ready");
        } catch (err: any) {
            setError(err.message || "Error al generar el cuestionario");
            setQuizState("error");
        }
    }, [user, session, documentNames, knowledgeIds]);

    useEffect(() => {
        if (documentNames.length === 0 && knowledgeIds.length === 0) {
            setError("No hay contenido seleccionado. Por favor, regresa y selecciona algún contenido.");
            setQuizState("error");
            return;
        }

        generateQuiz();
    }, []);

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    const handleAnswerSelect = (index: number) => {
        if (showExplanation) return;
        setSelectedAnswer(index);
    };

    const handleSubmitAnswer = () => {
        if (selectedAnswer === null) return;
        
        setAnswers((prev) => new Map(prev).set(currentQuestion.id, selectedAnswer));
        setShowExplanation(true);
    };

    const handleNextQuestion = () => {
        if (isLastQuestion) {
            setQuizState("complete");
        } else {
            setCurrentQuestionIndex((prev) => prev + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);
        }
    };

    const handleStartQuiz = () => {
        setQuizState("playing");
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setAnswers(new Map());
        setShowExplanation(false);
        setTimeRemaining(QUIZ_DURATION_SECONDS); // Reset timer
    };

    const handleRestartQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setAnswers(new Map());
        setShowExplanation(false);
        setScoreSaved(false);
        setTimeRemaining(QUIZ_DURATION_SECONDS); // Reset timer
        setQuizState("playing");
    };

    const calculateScore = useCallback(() => {
        let correct = 0;
        answers.forEach((answer, questionId) => {
            const question = questions.find((q) => q.id === questionId);
            if (question && answer === question.correctAnswer) {
                correct++;
            }
        });
        return correct;
    }, [answers, questions]);

    const saveScore = useCallback(async () => {
        if (!session?.access_token || scoreSaved || savingScore) return;

        setSavingScore(true);
        const score = calculateScore();
        const percentage = Math.round((score / questions.length) * 100);

        try {
            const response = await fetch("/api/quiz/save-score", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    score,
                    totalQuestions: questions.length,
                    percentage,
                    documentNames,
                    knowledgeIds,
                }),
            });

            if (response.ok) {
                setScoreSaved(true);
            }
        } catch (err) {
            // Score saving failed silently - don't disrupt the user experience
        } finally {
            setSavingScore(false);
        }
    }, [session, scoreSaved, savingScore, calculateScore, questions.length, documentNames, knowledgeIds]);

    // Save score when quiz is completed or times out
    useEffect(() => {
        if ((quizState === "complete" || quizState === "timeout") && !scoreSaved && !savingScore) {
            saveScore();
        }
    }, [quizState, scoreSaved, savingScore, saveScore]);

    const getOptionClass = (index: number) => {
        const baseClass = "w-full p-4 rounded-xl text-left transition-all duration-200 border-2";
        
        if (!showExplanation) {
            if (selectedAnswer === index) {
                return `${baseClass} bg-secondary/20 border-secondary text-white`;
            }
            return `${baseClass} bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20`;
        }

        // After submission
        if (index === currentQuestion.correctAnswer) {
            return `${baseClass} bg-success/20 border-success text-white`;
        }
        if (selectedAnswer === index && index !== currentQuestion.correctAnswer) {
            return `${baseClass} bg-danger/20 border-danger text-white`;
        }
        return `${baseClass} bg-white/5 border-white/10 text-white/40`;
    };

    const getOptionLabel = (index: number) => {
        return String.fromCharCode(65 + index); // A, B, C, D
    };

    // Loading State
    if (quizState === "loading") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <Card className="bg-white/5 border border-white/10 max-w-md w-full mx-4">
                    <CardBody className="p-12 text-center">
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <Spinner size="lg" color="secondary" className="w-20 h-20" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            Generando tu Cuestionario
                        </h2>
                        <p className="text-white/60 mb-6">{loadingMessage}</p>
                        <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            <span>Impulsado por IA</span>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // Error State
    if (quizState === "error") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <Card className="bg-white/5 border border-white/10 max-w-md w-full mx-4">
                    <CardBody className="p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            Algo Salió Mal
                        </h2>
                        <p className="text-white/60 mb-6">{error}</p>
                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="flat"
                                onPress={() => router.push("/dashboard/quiz")}
                            >
                                Volver
                            </Button>
                            <Button
                                color="secondary"
                                onPress={generateQuiz}
                            >
                                Reintentar
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // Ready State - Quiz Preview
    if (quizState === "ready") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <Card className="bg-white/5 border border-white/10 max-w-lg w-full">
                    <CardBody className="p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-purple-600 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            ¡Cuestionario Listo!
                        </h2>
                        <p className="text-white/60 mb-8">
                            Tu cuestionario personalizado ha sido generado basado en el contenido seleccionado.
                        </p>
                        
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-3xl font-bold text-secondary">{questions.length}</p>
                                <p className="text-white/40 text-sm">Preguntas</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-3xl font-bold text-cyan-400">
                                    {documentNames.length + knowledgeIds.length}
                                </p>
                                <p className="text-white/40 text-sm">Fuentes</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-3xl font-bold text-amber-400">10</p>
                                <p className="text-white/40 text-sm">Minutos</p>
                            </div>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-center gap-2 text-amber-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">Tienes 10 minutos para completar el cuestionario</span>
                            </div>
                            <p className="text-white/50 text-sm mt-1">
                                El tiempo comenzará cuando presiones el botón
                            </p>
                        </div>

                        <Button
                            color="secondary"
                            size="lg"
                            className="w-full"
                            onPress={handleStartQuiz}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Comenzar Cuestionario
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // Timeout State - Time's Up
    if (quizState === "timeout") {
        const score = calculateScore();
        const answeredQuestions = answers.size;
        const percentage = answeredQuestions > 0 ? Math.round((score / answeredQuestions) * 100) : 0;

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <Card className="bg-white/5 border border-white/10 max-w-lg w-full">
                    <CardBody className="p-8 text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-amber-400 mb-2">
                            ⏰ ¡Se acabó el tiempo!
                        </h2>
                        <p className="text-white/60 mb-8">
                            Respondiste {answeredQuestions} de {questions.length} preguntas
                        </p>

                        {/* Score Breakdown */}
                        <div className="bg-white/5 rounded-xl p-4 mb-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-white/60">Respondidas</span>
                                <span className="text-white font-medium">{answeredQuestions}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-white/60">Correctas</span>
                                <span className="text-success font-medium">{score}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-white/60">Incorrectas</span>
                                <span className="text-danger font-medium">{answeredQuestions - score}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Sin responder</span>
                                <span className="text-white/40 font-medium">{questions.length - answeredQuestions}</span>
                            </div>
                        </div>

                        {answeredQuestions > 0 && (
                            <div className="bg-white/5 rounded-xl p-4 mb-6">
                                <p className="text-white/60 text-sm">Precisión en preguntas respondidas</p>
                                <p className="text-3xl font-bold text-secondary">{percentage}%</p>
                            </div>
                        )}

                        {/* Score Saved Indicator */}
                        <div className="flex items-center justify-center gap-2 mb-6 text-sm">
                            {savingScore ? (
                                <>
                                    <Spinner size="sm" color="secondary" />
                                    <span className="text-white/40">Guardando resultado...</span>
                                </>
                            ) : scoreSaved ? (
                                <>
                                    <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-success">Resultado guardado</span>
                                </>
                            ) : null}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="flat"
                                className="flex-1"
                                onPress={() => router.push("/dashboard/quiz")}
                            >
                                Nuevo Cuestionario
                            </Button>
                            <Button
                                color="secondary"
                                className="flex-1"
                                onPress={handleRestartQuiz}
                            >
                                Reintentar
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // Complete State - Results
    if (quizState === "complete") {
        const score = calculateScore();
        const percentage = Math.round((score / questions.length) * 100);
        
        const getResultMessage = () => {
            if (percentage >= 90) return { text: "¡Excelente!", color: "text-success" };
            if (percentage >= 70) return { text: "¡Muy Bien!", color: "text-secondary" };
            if (percentage >= 50) return { text: "¡Buen Esfuerzo!", color: "text-warning" };
            return { text: "¡Sigue Aprendiendo!", color: "text-danger" };
        };
        
        const result = getResultMessage();
        const timeUsed = QUIZ_DURATION_SECONDS - timeRemaining;

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <Card className="bg-white/5 border border-white/10 max-w-lg w-full">
                    <CardBody className="p-8 text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-secondary to-purple-600 flex items-center justify-center mx-auto mb-6">
                            <span className="text-3xl font-bold text-white">{percentage}%</span>
                        </div>
                        <h2 className={`text-2xl font-bold mb-2 ${result.color}`}>
                            {result.text}
                        </h2>
                        <p className="text-white/60 mb-2">
                            Obtuviste {score} de {questions.length} respuestas correctas
                        </p>
                        <p className="text-white/40 text-sm mb-8">
                            Tiempo usado: {formatTime(timeUsed)} de 10:00
                        </p>

                        {/* Score Breakdown */}
                        <div className="bg-white/5 rounded-xl p-4 mb-4">
                            <div className="flex justify-between mb-2">
                                <span className="text-white/60">Correctas</span>
                                <span className="text-success font-medium">{score}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/60">Incorrectas</span>
                                <span className="text-danger font-medium">{questions.length - score}</span>
                            </div>
                        </div>

                        {/* Score Saved Indicator */}
                        <div className="flex items-center justify-center gap-2 mb-8 text-sm">
                            {savingScore ? (
                                <>
                                    <Spinner size="sm" color="secondary" />
                                    <span className="text-white/40">Guardando resultado...</span>
                                </>
                            ) : scoreSaved ? (
                                <>
                                    <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-success">Resultado guardado</span>
                                </>
                            ) : null}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="flat"
                                className="flex-1"
                                onPress={() => router.push("/dashboard/quiz")}
                            >
                                Nuevo Cuestionario
                            </Button>
                            <Button
                                color="secondary"
                                className="flex-1"
                                onPress={handleRestartQuiz}
                            >
                                Reintentar
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // Playing State - Questions
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-10 bg-slate-900/80">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <Button
                            isIconOnly
                            variant="light"
                            onPress={() => router.push("/dashboard/quiz")}
                            className="text-white/60 hover:text-white"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </Button>
                        
                        {/* Timer */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                            timeRemaining <= 60 
                                ? "bg-danger/20 border border-danger/30" 
                                : timeRemaining <= 180 
                                ? "bg-warning/20 border border-warning/30"
                                : "bg-white/5 border border-white/10"
                        }`}>
                            <svg className={`w-5 h-5 ${getTimerColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className={`font-mono font-bold text-lg ${getTimerColor()}`}>
                                {formatTime(timeRemaining)}
                            </span>
                        </div>

                        <Chip color="secondary" variant="flat">
                            {currentQuestionIndex + 1}/{questions.length}
                        </Chip>
                    </div>
                    <Progress
                        value={progress}
                        color="secondary"
                        size="sm"
                        className="w-full"
                        aria-label="Progreso del cuestionario"
                    />
                </div>
            </header>

            {/* Question */}
            <main className="max-w-3xl mx-auto px-6 py-8">
                <Card className="bg-white/5 border border-white/10 mb-6">
                    <CardHeader className="px-6 pt-6 pb-2">
                        <p className="text-white/40 text-sm uppercase tracking-wide">
                            Pregunta {currentQuestionIndex + 1}
                        </p>
                    </CardHeader>
                    <CardBody className="px-6 pb-6">
                        <h2 className="text-xl text-white font-medium leading-relaxed">
                            {currentQuestion?.question}
                        </h2>
                    </CardBody>
                </Card>

                {/* Options */}
                <div className="space-y-3 mb-6">
                    {currentQuestion?.options.map((option, index) => (
                        <button
                            key={index}
                            className={getOptionClass(index)}
                            onClick={() => handleAnswerSelect(index)}
                            disabled={showExplanation}
                        >
                            <div className="flex items-start gap-4">
                                <span className={`
                                    w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-medium
                                    ${selectedAnswer === index && !showExplanation
                                        ? "bg-secondary text-white"
                                        : showExplanation && index === currentQuestion.correctAnswer
                                        ? "bg-success text-white"
                                        : showExplanation && selectedAnswer === index
                                        ? "bg-danger text-white"
                                        : "bg-white/10 text-white/60"
                                    }
                                `}>
                                    {getOptionLabel(index)}
                                </span>
                                <span className="pt-1">{option}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Explanation */}
                {showExplanation && (
                    <Card className={`mb-6 ${
                        selectedAnswer === currentQuestion.correctAnswer
                            ? "bg-success/10 border-success/30"
                            : "bg-danger/10 border-danger/30"
                    } border`}>
                        <CardBody className="p-4">
                            <div className="flex items-start gap-3">
                                <div className={`
                                    w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5
                                    ${selectedAnswer === currentQuestion.correctAnswer
                                        ? "bg-success"
                                        : "bg-danger"
                                    }
                                `}>
                                    {selectedAnswer === currentQuestion.correctAnswer ? (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </div>
                                <div>
                                    <p className={`font-medium mb-1 ${
                                        selectedAnswer === currentQuestion.correctAnswer
                                            ? "text-success"
                                            : "text-danger"
                                    }`}>
                                        {selectedAnswer === currentQuestion.correctAnswer
                                            ? "¡Correcto!"
                                            : "Incorrecto"}
                                    </p>
                                    <p className="text-white/70 text-sm">
                                        {currentQuestion.explanation}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* Action Button */}
                <Button
                    color="secondary"
                    size="lg"
                    className="w-full"
                    onPress={showExplanation ? handleNextQuestion : handleSubmitAnswer}
                    isDisabled={selectedAnswer === null && !showExplanation}
                >
                    {showExplanation
                        ? isLastQuestion
                            ? "Ver Resultados"
                            : "Siguiente Pregunta"
                        : "Enviar Respuesta"
                    }
                </Button>
            </main>
        </div>
    );
}
