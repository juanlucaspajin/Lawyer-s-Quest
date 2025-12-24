"use client";

import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    // Get display name from user metadata
    const displayName = user?.user_metadata?.name 
        ? `${user.user_metadata.name}${user.user_metadata.lastname ? ' ' + user.user_metadata.lastname : ''}`
        : user?.email;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Acertijos de Estudio" className="h-10 w-10 object-contain" />
                        <h1 className="text-xl font-bold text-white tracking-tight">
                            Panel Principal
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-white/60">
                            {displayName}
                        </span>
                        <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            onPress={handleSignOut}
                        >
                            Cerrar Sesión
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-3">
                        Bienvenido de nuevo{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}
                    </h2>
                    <p className="text-white/60 text-lg">
                        ¿Qué te gustaría hacer hoy?
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Begin Quiz Card */}
                    <Card
                        isPressable
                        className="group bg-white/5 border border-white/10 hover:border-secondary/50 hover:bg-white/10 transition-all duration-300"
                        onPress={() => router.push("/dashboard/quiz")}
                    >
                        <CardHeader className="pb-0 pt-8 px-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <svg
                                    className="w-8 h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                    />
                                </svg>
                            </div>
                        </CardHeader>
                        <CardBody className="px-8 pb-8">
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Iniciar Cuestionario
                            </h3>
                            <p className="text-white/60">
                                Pon a prueba tu conocimiento con una sesión interactiva basada en tu contenido cargado.
                            </p>
                        </CardBody>
                    </Card>

                    {/* Load Knowledge Card */}
                    <Card
                        isPressable
                        className="group bg-white/5 border border-white/10 hover:border-secondary/50 hover:bg-white/10 transition-all duration-300"
                        onPress={() => router.push("/dashboard/load")}
                    >
                        <CardHeader className="pb-0 pt-8 px-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <svg
                                    className="w-8 h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                    />
                                </svg>
                            </div>
                        </CardHeader>
                        <CardBody className="px-8 pb-8">
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Cargar Conocimiento
                            </h3>
                            <p className="text-white/60">
                                Sube documentos o agrega contenido para construir tu base de conocimiento personal.
                            </p>
                        </CardBody>
                    </Card>

                    {/* View Results Card */}
                    <Card
                        isPressable
                        className="group bg-white/5 border border-white/10 hover:border-secondary/50 hover:bg-white/10 transition-all duration-300"
                        onPress={() => router.push("/dashboard/results")}
                    >
                        <CardHeader className="pb-0 pt-8 px-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <svg
                                    className="w-8 h-8 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                            </div>
                        </CardHeader>
                        <CardBody className="px-8 pb-8">
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Ver mis Resultados
                            </h3>
                            <p className="text-white/60">
                                Revisa tu historial de cuestionarios y tu puntuación general.
                            </p>
                        </CardBody>
                    </Card>
                </div>
            </main>
        </div>
    );
}
