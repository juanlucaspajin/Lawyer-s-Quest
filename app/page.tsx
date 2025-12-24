"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] animate-pulse rounded-full bg-violet-500/20 blur-[120px]" />
        <div className="absolute -bottom-20 -right-20 h-[400px] w-[400px] animate-pulse rounded-full bg-rose-500/15 blur-[100px]" style={{ animationDelay: "1s" }} />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-amber-500/10 blur-[80px]" style={{ animationDelay: "2s" }} />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12 lg:px-20">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl overflow-hidden">
            <img src="/logo.png" alt="Acertijos de Estudio" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white">Acertijos de Estudio</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Aprende sin llorar</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-10 w-32 animate-pulse rounded-full bg-zinc-800" />
          ) : isAuthenticated ? (
            <Button
              as={Link}
              href="/dashboard"
              className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 font-medium text-white shadow-lg shadow-violet-500/25"
              radius="full"
            >
              Ir al Panel
            </Button>
          ) : (
            <>
              <Button
                as={Link}
                href="/login"
                variant="light"
                className="font-medium text-zinc-300 hover:text-white"
              >
                Entrar
              </Button>
              <Button
                as={Link}
                href="/register"
                className="bg-white font-medium text-zinc-900 hover:bg-zinc-100"
                radius="full"
              >
                ¡Empezar gratis!
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex min-h-[calc(100vh-88px)] flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-700/50 bg-zinc-900/50 px-4 py-2 backdrop-blur-sm"
          >
            <span className="text-base">📚</span>
            <span className="text-sm font-medium text-zinc-400">Sube tu material → Te hacemos el quiz → Triunfas en la vida</span>
          </motion.div>

          {/* Main headline */}
          <h1 className="mb-6 bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-5xl font-bold leading-tight tracking-tight text-transparent md:text-6xl lg:text-7xl">
            Estudiar no tiene que
            <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">
              ser aburrido 🎉
            </span>
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl"
          >
            Sube tus apuntes, PDFs, o ese documento que llevas semanas ignorando. 
            Nuestra IA los convierte en quizzes personalizados para que 
            <span className="font-medium text-zinc-200"> realmente aprendas</span> (sin quedarte dormido).
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {isAuthenticated ? (
              <Button
                as={Link}
                href="/dashboard"
                size="lg"
                className="group relative w-full overflow-hidden bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 px-8 py-6 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-fuchsia-500/30 sm:w-auto"
                radius="full"
              >
                <span className="relative z-10">Ir a mi Panel 🚀</span>
                <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-rose-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </Button>
            ) : (
              <>
                <Button
                  as={Link}
                  href="/register"
                  size="lg"
                  className="group relative w-full overflow-hidden bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 px-8 py-6 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-fuchsia-500/30 sm:w-auto"
                  radius="full"
                >
                  <span className="relative z-10">Crear cuenta gratis 🚀</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-rose-400 opacity-0 transition-opacity group-hover:opacity-100" />
                </Button>
                <Button
                  as={Link}
                  href="/login"
                  size="lg"
                  variant="bordered"
                  className="w-full border-zinc-700 px-8 py-6 text-base font-semibold text-white transition-all hover:border-zinc-500 hover:bg-zinc-800/50 sm:w-auto"
                  radius="full"
                >
                  Ya tengo cuenta 😎
                </Button>
              </>
            )}
          </motion.div>

          {/* Fun disclaimer */}
          {!isAuthenticated && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-6 text-sm text-zinc-600"
            >
              * No requiere tarjeta de crédito. Solo motivación (y algo de Wi-Fi).
            </motion.p>
          )}
        </motion.div>

        {/* Features preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3"
        >
          {[
            { 
              icon: "📤", 
              title: "Sube tu material", 
              desc: "PDFs, notas, documentos... lo que tengas",
              funNote: "(hasta esos apuntes ilegibles)"
            },
            { 
              icon: "🤖", 
              title: "La IA hace magia", 
              desc: "Genera preguntas inteligentes al instante",
              funNote: "(más rápido que tu excusa para no estudiar)"
            },
            { 
              icon: "🏆", 
              title: "Domina el tema", 
              desc: "Practica y ve tu progreso real",
              funNote: "(tu yo del futuro te lo agradecerá)"
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
              className="group rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <div className="mb-3 text-3xl">{feature.icon}</div>
              <h3 className="mb-1 font-semibold text-white">{feature.title}</h3>
              <p className="text-sm text-zinc-400">{feature.desc}</p>
              <p className="mt-2 text-xs text-zinc-600 italic">{feature.funNote}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Social proof / fun stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-center"
        >
          <div>
            <div className="text-2xl font-bold text-white">10,000+</div>
            <div className="text-sm text-zinc-500">Quizzes generados</div>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div>
            <div className="text-2xl font-bold text-white">∞</div>
            <div className="text-sm text-zinc-500">Excusas eliminadas</div>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div>
            <div className="text-2xl font-bold text-white">99%</div>
            <div className="text-sm text-zinc-500">Menos lágrimas al estudiar</div>
          </div>
        </motion.div>
      </main>

      {/* Bottom gradient fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
    </div>
  );
}
