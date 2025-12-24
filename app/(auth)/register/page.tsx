"use client";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Checkbox,
    Input,
    Link,
} from "@heroui/react";
import { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [tosAccepted, setTosAccepted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { signUp } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        setError(null);
        
        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setIsLoading(true);

        const { error } = await signUp(email, password, { name, lastname });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            setSuccess(true);
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardBody className="flex flex-col gap-4 px-6 py-8 text-center">
                        <h1 className="text-2xl font-bold text-success">Revisa tu correo</h1>
                        <p className="text-default-500">
                            Te hemos enviado un enlace de confirmación. Por favor revisa tu correo para verificar tu cuenta.
                        </p>
                        <Button
                            color="secondary"
                            variant="flat"
                            onPress={() => router.push("/login")}
                        >
                            Volver al Inicio de Sesión
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="flex flex-col gap-1 px-6 pt-6 pb-0">
                    <div className="flex items-center gap-3 mb-2">
                        <img src="/logo.png" alt="Acertijos de Estudio" className="h-12 w-12 object-contain" />
                        <div>
                            <h1 className="text-2xl font-bold">Crear una cuenta</h1>
                        </div>
                    </div>
                    <p className="text-sm text-default-500">
                        Completa tus datos para comenzar
                    </p>
                </CardHeader>
                <CardBody className="flex flex-col gap-4 px-6 py-6">
                    {error && (
                        <div className="p-3 text-sm text-danger bg-danger/10 rounded-lg">
                            {error}
                        </div>
                    )}
                    <div className="flex gap-4">
                        <Input
                            type="text"
                            label="Nombre"
                            placeholder="Ingresa tu nombre"
                            variant="bordered"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input
                            type="text"
                            label="Apellido"
                            placeholder="Ingresa tu apellido"
                            variant="bordered"
                            value={lastname}
                            onChange={(e) => setLastname(e.target.value)}
                        />
                    </div>
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
                        placeholder="Crea una contraseña"
                        variant="bordered"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Input
                        type="password"
                        label="Confirmar Contraseña"
                        placeholder="Confirma tu contraseña"
                        variant="bordered"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Checkbox
                        size="sm"
                        isSelected={tosAccepted}
                        onValueChange={setTosAccepted}
                    >
                        <span className="text-sm text-default-500">
                            Acepto los{" "}
                            <Link href="/terms" size="sm" className="text-primary">
                                Términos de Servicio
                            </Link>{" "}
                            y la{" "}
                            <Link href="/privacy" size="sm" className="text-primary">
                                Política de Privacidad
                            </Link>
                        </span>
                    </Checkbox>
                    <Button
                        color="secondary"
                        size="lg"
                        className="w-full mt-2"
                        onPress={handleRegister}
                        isLoading={isLoading}
                        isDisabled={!tosAccepted || !email || !password || !confirmPassword}
                    >
                        Crear Cuenta
                    </Button>
                    <p className="text-center text-sm text-default-500">
                        ¿Ya tienes una cuenta?{" "}
                        <Link href="/login" className="text-primary cursor-pointer hover:underline">
                            Inicia sesión
                        </Link>
                    </p>
                </CardBody>
            </Card>
        </div>
    );
}
