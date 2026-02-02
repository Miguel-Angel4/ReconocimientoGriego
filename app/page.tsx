"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ProFaceAuth, { ProFaceAuthHandle } from "./components/ProFaceAuth";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Progress } from "./components/ui/progress";

export default function Page() {
  const router = useRouter();
  const authRef = useRef<ProFaceAuthHandle>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "detecting" | "verified" | "error">("loading");
  const [message, setMessage] = useState("Initializing System...");
  const [progress, setProgress] = useState(0);

  const handleStatusChange = (newStatus: "idle" | "loading" | "ready" | "detecting" | "verified" | "error") => {
    setStatus(newStatus);
    if (newStatus === "loading") {
      setMessage("Loading Neural Models...");
      setProgress(30);
    } else if (newStatus === "ready") {
      setMessage("Awaiting Input (Spartan ID Required)");
      setProgress(100);
    } else if (newStatus === "detecting") {
      setMessage("Scanning Facial Geometry...");
      setProgress(100); // Pulse effect handled by CSS?
    }
  };

  const handleResult = (success: boolean, msg: string) => {
    if (success) {
      // Navigate to success page
      router.push(`/result?authorized=true&msg=${encodeURIComponent(msg)}`);
    } else {
      setMessage(msg);
      // Optional: Navigate to failure page or show error toast
      // For now, show on screen
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden font-sans text-foreground">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-900 via-background to-black pointer-events-none"></div>
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] pointer-events-none mix-blend-overlay"></div>

      <div className="z-10 w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-[0.2em] text-primary uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Spartan<span className="text-foreground">Gate</span>
          </h1>
          <p className="text-sm text-secondary tracking-widest uppercase opacity-80">Secure Entrypoint // Face ID</p>
        </div>

        {/* Main Card */}
        <Card className="border-2 border-primary/20 bg-card/95 backdrop-blur shadow-2xl overflow-hidden relative group">
          {/* Top decorative bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <Badge variant={status === "ready" ? "default" : "secondary"} className="tracking-widest">
                STATUS: {status.toUpperCase()}
              </Badge>
              {status === "loading" && <span className="text-xs text-muted-foreground animate-pulse">LOADING...</span>}
            </div>
            <CardTitle className="text-xl uppercase tracking-wide text-foreground">Identity Verification</CardTitle>
            <CardDescription className="text-muted-foreground font-mono text-xs">
              Face the camera to proceed.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Camera Component */}
            <div className="rounded-lg overflow-hidden border border-stone-800 bg-black shadow-inner">
              <ProFaceAuth
                ref={authRef}
                autoStart={true}
                onStatusChange={handleStatusChange}
                onResult={handleResult}
              />
            </div>

            {/* Progress Bar (Visible during loading or detecting) */}
            {(status === "loading" || status === "detecting") && (
              <div className="space-y-1">
                <Progress value={status === "detecting" ? 100 : progress} className="h-1" />
                <p className="text-[10px] text-muted-foreground text-center font-mono uppercase">{message}</p>
              </div>
            )}

            {/* Messages */}
            {status !== "loading" && status !== "detecting" && (
              <div className="p-3 bg-secondary/5 border border-secondary/10 rounded-md">
                <p className="text-sm text-center text-foreground">{message}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              variant="kratos"
              size="lg"
              className="w-full relative overflow-hidden group"
              onClick={() => authRef.current?.startVerification()}
              disabled={status === "loading" || status === "detecting"}
            >
              <span className="relative z-10 flex items-center gap-2">
                INICIAR IDENTIFICACIÓN
              </span>
              {/* Button Hover Glow */}
              <div className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Button>

            <div className="flex justify-between w-full gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs border-stone-700 text-stone-400 hover:text-white"
                onClick={() => authRef.current?.startCamera()}
              >
                REINICIAR CÁMARA
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 text-xs bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white border border-stone-600"
                onClick={() => authRef.current?.captureAndRegister()}
              >
                REGISTRAR ROSTRO
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-[10px] text-stone-600 font-mono">
            SECURE SECTOR 4 // BIOMETRICS REQUIRED
          </p>
        </div>
      </div>
    </main>
  );
}
