"use client";

import {
    Button,
    Card,
    CardBody,
    Input,
    Tabs,
    Tab,
    Textarea,
    Progress,
} from "@heroui/react";
import { useState, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

const ACCEPTED_FILE_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/plain": ".txt",
};

const BUCKET_NAME = "LawyerPdf";

export default function LoadKnowledgePage() {
    const { user } = useAuth();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Text input state
    const [textTitle, setTextTitle] = useState("");
    const [textContent, setTextContent] = useState("");
    const [isSavingText, setIsSavingText] = useState(false);
    const [textError, setTextError] = useState<string | null>(null);
    const [textSuccess, setTextSuccess] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isValidType = Object.keys(ACCEPTED_FILE_TYPES).includes(file.type);
        if (!isValidType) {
            setUploadError("Tipo de archivo inválido. Por favor sube archivos PDF, DOCX o TXT.");
            setSelectedFile(null);
            return;
        }

        setUploadError(null);
        setUploadSuccess(false);
        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile || !user) return;

        setIsUploading(true);
        setUploadError(null);
        setUploadProgress(0);

        try {
            // Create a unique filename with user ID and timestamp
            const timestamp = Date.now();
            const fileExt = selectedFile.name.split(".").pop();
            const fileName = `${user.id}/${timestamp}-${selectedFile.name}`;

            // Simulate progress (Supabase doesn't provide upload progress natively)
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => Math.min(prev + 10, 90));
            }, 100);

            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(fileName, selectedFile, {
                    cacheControl: "3600",
                    upsert: false,
                });

            clearInterval(progressInterval);

            if (error) {
                throw error;
            }

            setUploadProgress(100);
            setUploadSuccess(true);
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error: any) {
            setUploadError(error.message || "Error al subir el archivo");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveText = async () => {
        if (!textContent.trim() || !textTitle.trim() || !user) return;

        setIsSavingText(true);
        setTextError(null);
        setTextSuccess(false);

        try {
            const { error } = await supabase
                .from("knowledge_info")
                .insert({
                    user_id: user.id,
                    title: textTitle.trim(),
                    content: textContent.trim(),
                });

            if (error) {
                throw error;
            }

            setTextSuccess(true);
            setTextTitle("");
            setTextContent("");
        } catch (error: any) {
            setTextError(error.message || "Error al guardar el contenido");
        } finally {
            setIsSavingText(false);
        }
    };

    const getFileIcon = () => (
        <svg
            className="w-12 h-12 text-white/40"
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
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
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
                        Cargar Conocimiento
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Agrega a tu Base de Conocimiento
                    </h2>
                    <p className="text-white/60">
                        Sube documentos o escribe contenido directamente
                    </p>
                </div>

                <Card className="bg-white/5 border border-white/10">
                    <CardBody className="p-0">
                        <Tabs
                            aria-label="Opciones de carga"
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
                            {/* Upload Document Tab */}
                            <Tab
                                key="upload"
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
                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                            />
                                        </svg>
                                        <span>Subir Documento</span>
                                    </div>
                                }
                            >
                                <div className="space-y-6">
                                    {/* Drop Zone */}
                                    <div
                                        className={`
                                            relative border-2 border-dashed rounded-xl p-12
                                            transition-colors duration-200 cursor-pointer
                                            ${selectedFile
                                                ? "border-secondary bg-secondary/10"
                                                : "border-white/20 hover:border-white/40 hover:bg-white/5"
                                            }
                                        `}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.docx,.txt"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <div className="flex flex-col items-center gap-4">
                                            {getFileIcon()}
                                            {selectedFile ? (
                                                <div className="text-center">
                                                    <p className="text-white font-medium">
                                                        {selectedFile.name}
                                                    </p>
                                                    <p className="text-white/40 text-sm">
                                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <p className="text-white/60 mb-1">
                                                        Haz clic para subir o arrastra y suelta
                                                    </p>
                                                    <p className="text-white/40 text-sm">
                                                        Archivos PDF, DOCX o TXT
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Upload Progress */}
                                    {isUploading && (
                                        <Progress
                                            value={uploadProgress}
                                            color="secondary"
                                            className="w-full"
                                            aria-label="Progreso de carga"
                                        />
                                    )}

                                    {/* Error Message */}
                                    {uploadError && (
                                        <div className="p-3 text-sm text-danger bg-danger/10 rounded-lg">
                                            {uploadError}
                                        </div>
                                    )}

                                    {/* Success Message */}
                                    {uploadSuccess && (
                                        <div className="p-3 text-sm text-success bg-success/10 rounded-lg">
                                            ¡Archivo subido exitosamente!
                                        </div>
                                    )}

                                    {/* Upload Button */}
                                    <Button
                                        color="secondary"
                                        size="lg"
                                        className="w-full"
                                        onPress={handleUpload}
                                        isLoading={isUploading}
                                        isDisabled={!selectedFile || isUploading}
                                    >
                                        {isUploading ? "Subiendo..." : "Subir Documento"}
                                    </Button>
                                </div>
                            </Tab>

                            {/* Write Text Tab */}
                            <Tab
                                key="write"
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
                                        <span>Escribir Contenido</span>
                                    </div>
                                }
                            >
                                <div className="space-y-6">
                                    <Input
                                        label="Título"
                                        placeholder="Dale un título a tu contenido..."
                                        value={textTitle}
                                        onValueChange={setTextTitle}
                                        variant="bordered"
                                        classNames={{
                                            input: "text-white placeholder:text-white/40",
                                            inputWrapper: "border-white/20 hover:border-white/40 bg-white/5",
                                        }}
                                    />

                                    <Textarea
                                        label="Contenido"
                                        placeholder="Escribe o pega tu contenido aquí..."
                                        value={textContent}
                                        onValueChange={setTextContent}
                                        minRows={10}
                                        maxRows={20}
                                        variant="bordered"
                                        classNames={{
                                            input: "text-white placeholder:text-white/40",
                                            inputWrapper: "border-white/20 hover:border-white/40 bg-white/5",
                                        }}
                                    />

                                    {/* Character Count */}
                                    <p className="text-white/40 text-sm text-right">
                                        {textContent.length} caracteres
                                    </p>

                                    {/* Error Message */}
                                    {textError && (
                                        <div className="p-3 text-sm text-danger bg-danger/10 rounded-lg">
                                            {textError}
                                        </div>
                                    )}

                                    {/* Success Message */}
                                    {textSuccess && (
                                        <div className="p-3 text-sm text-success bg-success/10 rounded-lg">
                                            ¡Contenido guardado exitosamente!
                                        </div>
                                    )}

                                    {/* Save Button */}
                                    <Button
                                        color="secondary"
                                        size="lg"
                                        className="w-full"
                                        onPress={handleSaveText}
                                        isLoading={isSavingText}
                                        isDisabled={!textContent.trim() || !textTitle.trim() || isSavingText}
                                    >
                                        {isSavingText ? "Guardando..." : "Guardar Contenido"}
                                    </Button>
                                </div>
                            </Tab>
                        </Tabs>
                    </CardBody>
                </Card>
            </main>
        </div>
    );
}
