"use client";
import { Button, Card, CardBody, CardHeader, Input, Link } from "@heroui/react";
import { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    
    const { signIn } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        setIsLoading(true);
        setError(null);
        
        const { error } = await signIn(email, password);
        
        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="flex flex-col gap-1 px-6 pt-6 pb-0">
                    <h1 className="text-2xl font-bold">Bienvenido de nuevo</h1>
                    <p className="text-sm text-default-500">Inicia sesión en tu cuenta</p>
                </CardHeader>
                <CardBody className="flex flex-col gap-4 px-6 py-6">
                    {error && (
                        <div className="p-3 text-sm text-danger bg-danger/10 rounded-lg">
                            {error}
                        </div>
                    )}
                    <Input
                        type="email"
                        label="Correo electrónico"
                        placeholder="Ingresa tu correo"
                        variant="bordered"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        type="password"
                        label="Contraseña"
                        placeholder="Ingresa tu contraseña"
                        variant="bordered"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        color="secondary"
                        size="lg"
                        className="w-full mt-2"
                        onPress={handleLogin}
                        isLoading={isLoading}
                        isDisabled={!email || !password}
                    >
                        Iniciar Sesión
                    </Button>
                    <p className="text-center text-sm text-default-500">
                        ¿No tienes una cuenta?{" "}
                        <Link href="/register" className="text-primary cursor-pointer hover:underline">
                            Regístrate
                        </Link>
                    </p>
                </CardBody>
            </Card>
        </div>
    );
}
