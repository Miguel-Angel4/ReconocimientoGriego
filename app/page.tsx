"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProFaceAuth, { ProFaceAuthHandle } from "./components/ProFaceAuth";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Progress } from "./components/ui/progress";
import { Sword, Shield, Lock, Info } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const authRef = useRef<ProFaceAuthHandle>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "detected" | "detecting" | "verified" | "error">("loading");
  const [message, setMessage] = useState("Initializing System...");
  const [progress, setProgress] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleStatusChange = (newStatus: "idle" | "loading" | "ready" | "detected" | "detecting" | "verified" | "error") => {
    setStatus(newStatus);
    if (newStatus === "loading") {
      setMessage("Invocando a las Moirai: Preparando el Ocular del Olimpo...");
      setProgress(30);
    } else if (newStatus === "ready") {
      setMessage("Ocular listo: Mira fijamente a la cámara para proceder.");
      setProgress(100);
    } else if (newStatus === "detected") {
      setMessage("Rostro percibido: El portal reconoce tu presencia.");
      setProgress(100);
    } else if (newStatus === "detecting") {
      setMessage("Analizando linaje: No te muevas mientras extraemos tu esencia.");
      setProgress(100);
    } else if (newStatus === "error") {
      setMessage("Acceso denegado: El Olimpo no reconoce tu ADN.");
      setProgress(0);
    }
  };

  const handleResult = (success: boolean, msg: string) => {
    if (success) {
      setMessage("¡Éxito! El Reino de los Dioses se abre ante ti.");
      setTimeout(() => {
        router.push(`/result?authorized=true&msg=${encodeURIComponent(msg)}`);
      }, 1500);
    } else {
      setMessage(msg);
    }
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-10 bg-background relative overflow-hidden font-sans text-foreground selection:bg-primary/30">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-900/50 via-background to-black pointer-events-none"></div>

      {/* Spartan Rage Vignette */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-opacity duration-1000",
        status === "detecting" ? "opacity-30" : "opacity-0"
      )}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,rgba(153,27,27,0.3)_100%)]"></div>
      </div>

      <div className="z-10 w-full max-w-5xl flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">

        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-stone-900/80 border border-stone-800 rounded-full shadow-xl mb-2">
            <Lock className="w-3 h-3 text-secondary animate-pulse" />
            <span className="text-[9px] md:text-[10px] text-stone-400 tracking-[0.3em] uppercase font-bold">Terminal de Seguridad Espartana</span>
          </div>
          <h1 className="text-4xl md:text-8xl font-black tracking-[0.2em] text-primary uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] flex items-center justify-center gap-3 md:gap-6">
            <Sword className="w-8 h-8 md:w-16 md:h-16 -rotate-45 text-secondary hidden sm:block" />
            KRATOS<span className="text-foreground">AUTH</span>
            <Sword className="w-8 h-8 md:w-16 md:h-16 rotate-45 text-secondary hidden sm:block" />
          </h1>
          <p className="max-w-md mx-auto text-[10px] md:text-sm text-stone-500 tracking-[0.4em] uppercase opacity-80 font-mono">
            Portal Biométrico // Nivel: <span className="text-secondary font-black">DIOS</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 md:gap-10 items-start">
          {/* Main Verification Card */}
          <Card className="border-2 border-stone-800 bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden relative group rounded-none">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80"></div>

            <CardHeader className="border-b border-stone-800/50 pb-6">
              <div className="flex justify-between items-center mb-2">
                <Badge variant="outline" className="tracking-widest rounded-none border-stone-700 bg-stone-900/80 text-[9px] px-3 py-1">
                  ESTADO: {status.toUpperCase()}
                </Badge>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary/20"></div>
                  <div className="w-2 h-2 rounded-full bg-primary/40"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                </div>
              </div>
              <CardTitle className="text-xl md:text-3xl uppercase tracking-[0.25em] font-black text-foreground">Verificación de Sangre</CardTitle>
              <CardDescription className="text-[10px] md:text-xs text-stone-500 tracking-widest uppercase">Escáner ocular de alta fidelidad activo</CardDescription>
            </CardHeader>

            <CardContent className="pt-8 space-y-8 px-4 md:px-8">
              <ProFaceAuth
                ref={authRef}
                autoStart={true}
                onStatusChange={handleStatusChange}
                onResult={handleResult}
              />

              {/* Status Message Area - Using Alert for better hierarchy */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-[2px] flex-1 bg-stone-800"></div>
                  <span className="text-[10px] text-stone-600 font-black tracking-widest uppercase">Respuesta del Sistema</span>
                  <div className="h-[2px] flex-1 bg-stone-800"></div>
                </div>

                <div className={cn(
                  "p-5 border-l-4 transition-all duration-300 flex items-center gap-5",
                  status === "error" ? "bg-primary/10 border-primary animate-shake" : "bg-stone-900/40 border-secondary"
                )}>
                  {status === "error" ? (
                    <Shield className="w-6 h-6 text-primary flex-shrink-0" />
                  ) : (
                    <Info className="w-6 h-6 text-secondary flex-shrink-0" />
                  )}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono uppercase text-stone-500 tracking-widest">Protocolo de Voz:</span>
                    <p className={cn(
                      "text-sm md:text-base font-black tracking-widest uppercase",
                      status === "error" ? "text-primary italic" : "text-foreground"
                    )}>
                      "{message}"
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-6 border-t border-stone-800 pb-10 pt-8 px-4 md:px-8">
              <Button
                variant="kratos"
                size="lg"
                className="w-full h-16 md:h-20 text-lg md:text-xl relative shadow-2xl"
                onClick={() => authRef.current?.startVerification()}
                disabled={status === "loading" || status === "detecting"}
              >
                <span className="relative z-10 font-black tracking-[0.3em]">INICIAR IDENTIFICACIÓN</span>
              </Button>

              <div className="grid grid-cols-2 w-full gap-4">
                <Button
                  variant="outline"
                  className="rounded-none border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800 text-[10px] uppercase font-bold tracking-[0.2em] h-12"
                  onClick={() => authRef.current?.startCamera()}
                >
                  Reiniciar Cámara
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-none text-[10px] uppercase font-bold tracking-[0.2em] h-12"
                  onClick={() => authRef.current?.captureAndRegister()}
                >
                  Registrar ADN
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Lore / Instructions Sidebar */}
          <div className="space-y-6">
            <div className="p-6 bg-stone-950/80 border border-stone-800 rounded-none space-y-5 shadow-inner">
              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-secondary flex items-center gap-3">
                <Shield className="w-4 h-4" />
                Ley de los Dioses
              </h4>
              <ul className="space-y-4">
                {[
                  "Posiciona tu rostro en el Ocular Omega.",
                  "Asegúrate de que la luz del Olimpo sea clara.",
                  "Mantén la calma durante la extracción.",
                  "Solo los espartanos de pura cepa pasarán."
                ].map((text, i) => (
                  <li key={i} className="flex gap-4 text-[10px] md:text-[11px] text-stone-500 leading-relaxed font-bold group">
                    <span className="text-primary font-black">{i + 1}.</span>
                    <span className="group-hover:text-stone-300 transition-colors uppercase tracking-widest">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 border border-stone-800 bg-stone-900/30 rounded-none opacity-60 flex flex-col gap-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] text-stone-600 font-black uppercase tracking-widest">Estado Servidor</span>
                <span className="text-[8px] text-green-700 font-bold uppercase animate-pulse tracking-widest">En Línea</span>
              </div>
              <p className="text-[9px] text-stone-600 font-mono uppercase tracking-[0.3em] leading-loose">
                Ghost_OS v4.1<br />
                Kernel: Leviathan_X<br />
                Ubicación: Templo de Ares
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-10 border-t border-stone-900">
          <p className="text-[9px] md:text-[10px] text-stone-700 font-mono tracking-[0.6em] uppercase">
            © 2026 Santa Monica Biometrics // El acceso no autorizado se paga con sangre
          </p>
        </div>
      </div>
    </main>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

