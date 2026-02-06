"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ShieldCheck, ShieldAlert, ChevronLeft, Home, Trophy, Skull } from "lucide-react";

function ResultContent() {
    const params = useSearchParams();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const isAuth = params.get("authorized") === "true";
        const msg = params.get("msg") || "";
        setAuthorized(isAuth);
        setMessage(msg);
    }, [params]);

    const handleRetry = () => {
        router.push("/");
    };

    const handleChangeUser = () => {
        localStorage.removeItem("face_descriptor_demo");
        localStorage.removeItem("face_profile_thumb");
        router.push("/");
    };

    const handleLogout = () => {
        localStorage.clear(); // Clear history too for a fresh start
        router.push("/");
    };

    return (
        <div className="z-10 w-full max-w-2xl space-y-8 animate-in fade-in zoom-in slide-in-from-top-4 duration-700">
            <Card className="border-2 border-stone-800 bg-card/95 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)] relative overflow-hidden rounded-none">
                {/* Border Accent */}
                <div className={`absolute top-0 left-0 w-full h-[4px] ${authorized ? "bg-green-600 shadow-[0_0_20px_rgba(22,163,74,0.5)]" : "bg-primary shadow-[0_0_20px_rgba(153,27,27,0.5)]"}`}></div>

                <CardHeader className="text-center pt-16 pb-6 relative">
                    {/* Background Icon Watermark */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                        {authorized ? <Trophy className="w-64 h-64" /> : <Skull className="w-64 h-64" />}
                    </div>

                    <div className="flex justify-center mb-8 relative">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 border-double ${authorized ? "border-green-600 bg-green-950/20 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-pulse" : "border-primary bg-primary/20 text-primary shadow-[0_0_30px_rgba(153,27,27,0.3)] animate-shake"}`}>
                            {authorized ? <ShieldCheck className="w-16 h-16" /> : <ShieldAlert className="w-16 h-16" />}
                        </div>
                    </div>

                    <div className="space-y-2 relative">
                        <CardTitle className={`text-4xl md:text-5xl font-black uppercase tracking-[0.25em] ${authorized ? "text-green-500" : "text-primary text-glow-red"}`}>
                            {authorized ? "IDENTIDAD CONFIRMADA" : "ACCESO DENEGADO"}
                        </CardTitle>
                        <Badge variant={authorized ? "default" : "destructive"} className="px-6 py-1 tracking-[0.3em] uppercase text-[10px] rounded-none bg-stone-900 border-stone-700">
                            {authorized ? "ESPARTANO VERIFICADO" : "ENTIDAD DESCONOCIDA"}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="text-center px-8 md:px-16 space-y-8 pb-12">
                    <div className="py-8 border-y border-stone-800 relative">
                        {/* Decorative Greek Corners */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-stone-700" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-stone-700" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-stone-700" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-stone-700" />

                        <p className="text-stone-300 font-mono text-sm leading-loose tracking-wide uppercase italic">
                            {message || (authorized ? "Bienvenido de nuevo, Fantasma de Esparta. El Olimpo aguarda tu juicio." : "La geometría facial no coincide con los linajes autorizados. Regresa a las sombras.")}
                        </p>
                    </div>

                    <div className="flex justify-center gap-12">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-stone-600 uppercase tracking-widest mb-1">Clearance</span>
                            <span className={`text-xs font-bold uppercase ${authorized ? "text-secondary" : "text-stone-400"}`}>
                                {authorized ? "NIVEL_DIOS" : "NINGUNO"}
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-stone-600 uppercase tracking-widest mb-1">Protocolo</span>
                            <span className="text-xs font-bold uppercase text-stone-400">
                                {authorized ? "GHOST_OS/ACTIVO" : "BLOQUEADO"}
                            </span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 p-8 bg-black/40 border-t border-stone-800">
                    <Button
                        variant={authorized ? "default" : "kratos"}
                        size="lg"
                        className={`w-full h-14 rounded-none uppercase font-black tracking-widest text-md ${authorized ? "bg-green-700 hover:bg-green-600" : ""}`}
                        onClick={handleRetry}
                    >
                        <span className="flex items-center gap-3">
                            {authorized ? <Home className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                            {authorized ? "ENTRAR AL OLIMPO" : "REINTENTAR"}
                        </span>
                    </Button>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <Button
                            variant="outline"
                            className="rounded-none border-stone-800 text-stone-400 hover:text-stone-100 uppercase tracking-widest text-[10px] h-10"
                            onClick={handleChangeUser}
                        >
                            Cambiar Usuario
                        </Button>
                        <Button
                            variant="secondary"
                            className="rounded-none bg-stone-900 border-stone-800 text-stone-400 hover:text-primary uppercase tracking-widest text-[10px] h-10"
                            onClick={handleLogout}
                        >
                            Cerrar Sesión
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            <div className="text-center">
                <p className="text-[10px] text-stone-600 font-mono tracking-[0.4em] uppercase">
                    {authorized ? "SESSION://AUTHENTICATED" : "SECURITY_BREACH://REPORTED"}
                </p>
            </div>
        </div>
    );
}

export default function ResultPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden font-sans text-foreground">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-900/50 via-background to-black pointer-events-none"></div>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] pointer-events-none mix-blend-overlay"></div>

            <Suspense fallback={<div className="text-secondary animate-pulse uppercase tracking-widest">Consulting the Oracles...</div>}>
                <ResultContent />
            </Suspense>
        </main>
    );
}

