"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as faceapi from "face-api.js";
import { cn } from "@/lib/utils";
import { History, ShieldCheck, ShieldAlert, Cpu } from "lucide-react";
import { Button } from "./ui/button";

// Types for our callbacks
export type ProFaceAuthHandle = {
    startCamera: () => Promise<void>;
    startVerification: () => Promise<void>;
    captureAndRegister: () => Promise<void>;
};

type Attempt = {
    id: string;
    timestamp: Date;
    success: boolean;
    distance: number;
    confidence: number;
    thumbnail?: string;
};

type ProFaceAuthProps = {
    onStatusChange: (status: "idle" | "loading" | "ready" | "detecting" | "verified" | "error") => void;
    onResult: (success: boolean, message: string, distance?: number) => void;
    autoStart?: boolean;
};

const ProFaceAuth = forwardRef<ProFaceAuthHandle, ProFaceAuthProps>(({ onStatusChange, onResult, autoStart = false }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [internalStatus, setInternalStatus] = useState<"idle" | "loading" | "ready" | "detecting" | "verified" | "error">("idle");
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [confidence, setConfidence] = useState(0);
    const [registeredProfile, setRegisteredProfile] = useState<string | null>(null);

    // Initialize attempts and profile from localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem("face_history_demo");
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                const formatted = parsed.map((a: any) => ({
                    ...a,
                    timestamp: new Date(a.timestamp)
                }));
                setAttempts(formatted);
            } catch (e) {
                console.error("Failed to load history", e);
            }
        }

        const savedProfile = localStorage.getItem("face_profile_thumb");
        if (savedProfile) {
            setRegisteredProfile(savedProfile);
        }
    }, []);

    // Helper to update and persist attempts
    const updateAttempts = (newAttempt: Attempt) => {
        setAttempts(prev => {
            const updated = [newAttempt, ...prev].slice(0, 5);
            localStorage.setItem("face_history_demo", JSON.stringify(updated));
            return updated;
        });
    };

    // Propagate status changes
    useEffect(() => {
        onStatusChange(internalStatus);
    }, [internalStatus, onStatusChange]);

    async function startCamera() {
        if (!modelsLoaded) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setCameraActive(true);
                setInternalStatus("ready");
            }
        } catch (e) {
            console.error(e);
            setInternalStatus("error");
            onResult(false, "Camera permission denied");
        }
    }

    // Load Models
    useEffect(() => {
        async function load() {
            setInternalStatus("loading");
            const minLoadingTime = new Promise(r => setTimeout(r, 1500));

            try {
                const MODEL_URL = "/models";
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    minLoadingTime
                ]);

                setModelsLoaded(true);
                setInternalStatus("ready");
            } catch (e) {
                console.error("Critical: Model loading failed", e);
                setInternalStatus("error");
                onResult(false, "Failed to load models");
            }
        }
        load();
    }, []);

    const cameraTriggered = useRef(false);
    useEffect(() => {
        if (autoStart && modelsLoaded && !cameraTriggered.current) {
            cameraTriggered.current = true;
            startCamera();
        }
    }, [autoStart, modelsLoaded]);

    function euclideanDistance(a: number[], b: number[]) {
        return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
    }

    async function captureThumbnail(detection: any) {
        const video = videoRef.current;
        if (!video) return undefined;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return undefined;

        const { x, y, width, height } = detection.detection.box;
        canvas.width = 100;
        canvas.height = 100;

        ctx.drawImage(video, x, y, width, height, 0, 0, 100, 100);
        return canvas.toDataURL("image/jpeg", 0.7);
    }

    useEffect(() => {
        let interval: NodeJS.Timeout;
        const isActiveState = internalStatus === "ready" || (internalStatus as any) === "detected";

        if (cameraActive && isActiveState) {
            interval = setInterval(async () => {
                const video = videoRef.current;
                if (!video) return;

                const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());

                if (detection && internalStatus === "ready") {
                    setInternalStatus("detected" as any);
                } else if (!detection && (internalStatus as any) === "detected") {
                    setInternalStatus("ready");
                }
            }, 500);
        }
        return () => clearInterval(interval);
    }, [cameraActive, internalStatus]);

    async function getDescriptor() {
        const video = videoRef.current;
        if (!video || !cameraActive) throw new Error("Camera not ready");
        return await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();
    }

    async function startVerification() {
        if (!cameraActive) {
            await startCamera();
            await new Promise(r => setTimeout(r, 1000));
        }

        setInternalStatus("detecting");
        setConfidence(0);

        const steps = 40;
        for (let i = 0; i <= 100; i += (100 / steps)) {
            setConfidence(i);
            await new Promise(r => setTimeout(r, 2000 / steps));
        }

        try {
            const detection = await getDescriptor();
            if (!detection) {
                setInternalStatus("ready");
                onResult(false, "No face detected.");
                return;
            }

            const thumbnail = await captureThumbnail(detection);
            const stored = localStorage.getItem("face_descriptor_demo");
            if (!stored) {
                setInternalStatus("error");
                onResult(false, "No registered face found.");
                return;
            }

            const storedDescriptor = JSON.parse(stored) as number[];
            const currentDescriptor = Array.from(detection.descriptor);
            const distance = euclideanDistance(storedDescriptor, currentDescriptor);

            const THRESHOLD = 0.55;
            const success = distance < THRESHOLD;
            const confValue = Math.max(0, Math.min(100, (1 - distance / 0.8) * 100));
            setConfidence(confValue);

            const newAttempt: Attempt = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date(),
                success,
                distance,
                confidence: confValue,
                thumbnail
            };
            updateAttempts(newAttempt);

            if (success) {
                setInternalStatus("verified");
                onResult(true, "Identity Verified", distance);
            } else {
                setInternalStatus("error");
                setTimeout(() => setInternalStatus("ready"), 2000);
                onResult(false, "Identity Mismatch", distance);
            }
        } catch (e) {
            setInternalStatus("error");
            onResult(false, "Detection error");
        }
    }

    async function captureAndRegister() {
        if (!cameraActive) await startCamera();
        setInternalStatus("detecting");
        setConfidence(0);
        const steps = 40;
        for (let i = 0; i <= 100; i += (100 / steps)) {
            setConfidence(i);
            await new Promise(r => setTimeout(r, 1500 / steps));
        }

        try {
            const detection = await getDescriptor();
            if (!detection) {
                setInternalStatus("ready");
                onResult(false, "No face detected.");
                return;
            }

            const thumbnail = await captureThumbnail(detection);
            if (thumbnail) {
                localStorage.setItem("face_profile_thumb", thumbnail);
                setRegisteredProfile(thumbnail);
            }
            localStorage.setItem("face_descriptor_demo", JSON.stringify(Array.from(detection.descriptor)));

            const newAttempt: Attempt = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date(),
                success: true,
                distance: 0,
                confidence: 100,
                thumbnail
            };
            updateAttempts(newAttempt);
            setInternalStatus("ready");
            onResult(true, "Face Registered");
        } catch (e) {
            onResult(false, "Registration Failed");
        }
    }

    useImperativeHandle(ref, () => ({
        startCamera,
        startVerification,
        captureAndRegister
    }));

    return (
        <div className="relative w-full flex flex-col items-center gap-6">
            <div className="relative w-full max-w-2xl mx-auto">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[102%] h-8 bg-stone-900 border-x-4 border-t-4 border-secondary/40 rounded-t-sm z-0 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-[2px] bg-secondary/20 absolute bottom-1"></div>
                </div>

                <div className={cn(
                    "relative w-full aspect-video md:aspect-[4/3] bg-black rounded-sm overflow-hidden border-8 border-stone-800 shadow-2xl z-10 transition-all duration-300",
                    internalStatus === "verified" && "border-green-600/50 scale-[1.02]",
                    internalStatus === "error" && "animate-shake border-red-600/50"
                )}>
                    <div className={cn("absolute inset-0 z-50 transition-opacity duration-500", internalStatus === "verified" ? "opacity-100 divine-white" : "opacity-0")} />
                    <div className={cn("absolute inset-0 z-50 transition-opacity duration-500", internalStatus === "error" ? "opacity-100 hades-blood" : "opacity-0")} />
                    <div className={cn("absolute inset-0 z-10 animate-rage transition-opacity duration-300", (internalStatus === "error" || internalStatus === "detecting") ? "opacity-100" : "opacity-0")} />

                    {registeredProfile && (
                        <div className="absolute top-4 left-4 z-40 bg-black/60 backdrop-blur-md p-1.5 border border-stone-700/50 rounded-sm flex items-center gap-3">
                            <img src={registeredProfile} alt="Target" className="w-12 h-12 object-cover border border-stone-800 grayscale opacity-80" />
                            <div className="flex flex-col pr-2">
                                <span className="text-[8px] text-stone-500 uppercase tracking-widest font-mono">Authorized</span>
                                <span className="text-[10px] text-secondary font-black tracking-widest uppercase">Spartan Profile</span>
                            </div>
                        </div>
                    )}

                    {cameraActive && internalStatus !== "verified" && (
                        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center opacity-20">
                            <div className="w-64 h-64 border-2 border-secondary/30 rounded-full flex items-center justify-center">
                                <div className="w-full h-full omega-mask bg-secondary/40" />
                            </div>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        playsInline
                        muted
                        className={cn("w-full h-full object-cover transform scale-x-[-1] transition-all duration-300", !cameraActive && "opacity-0", internalStatus === "detecting" && "animate-heat")}
                        aria-label="Escáner facial en vivo"
                        role="img"
                    />

                    {internalStatus === "loading" && (
                        <div className="absolute inset-0 z-40 flex items-center justify-center bg-stone-950" role="status" aria-live="polite">
                            <div className="relative w-48 h-48 flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-dashed border-secondary/20 rounded-full animate-rune" aria-hidden="true" />
                                <div className="flex flex-col items-center gap-2">
                                    <Cpu className="w-8 h-8 text-secondary animate-pulse" aria-hidden="true" />
                                    <span className="text-[10px] text-secondary font-bold tracking-[0.3em] uppercase">Invocando a las Moirai</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {!cameraActive && internalStatus !== "loading" && internalStatus !== "error" && (
                        <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-stone-950/80 backdrop-blur-sm text-stone-500" role="presentation">
                            <Cpu className="w-12 h-12 text-secondary animate-pulse" aria-hidden="true" />
                            <p className="uppercase tracking-[0.3em] text-[10px] font-mono text-secondary">Iniciando Ocular del Olimpo...</p>
                        </div>
                    )}

                    <div className="absolute inset-0 pointer-events-none">
                        {/* Omega Framing Guide */}
                        <div className="absolute inset-0 opacity-20 omega-mask bg-white transition-opacity duration-1000" aria-hidden="true" />

                        {/* Scan Line Animation */}
                        {cameraActive && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary/40 to-transparent animate-scan-line z-50 shadow-[0_0_15px_rgba(198,163,76,0.6)]" aria-hidden="true" />
                        )}

                        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 border border-stone-700 rounded-sm flex items-center gap-2" role="status">
                            <div className={cn("w-2 h-2 rounded-full", cameraActive ? "bg-green-500 animate-pulse" : "bg-red-900")} aria-hidden="true" />
                            <span className="text-[10px] text-stone-300 uppercase tracking-widest">Estado Feed: {cameraActive ? "Activo" : "Inactivo"}</span>
                        </div>

                        {internalStatus === "detecting" && (
                            <div className="absolute inset-0 animate-blades" role="status" aria-live="assertive">
                                <div className="absolute inset-0 bg-red-900/10 backdrop-brightness-125 transition-all" />
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pt-20">
                                    <div className="text-[10px] text-primary font-bold tracking-[0.5em] uppercase animate-pulse">Analizando Log Biométrico...</div>
                                    <div className="w-48 h-1 bg-stone-800 overflow-hidden border border-stone-700 transition-all">
                                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${confidence}%` }} aria-valuenow={confidence} aria-valuemin={0} aria-valuemax={100} role="progressbar" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {internalStatus === "detected" as any && (
                            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-green-500/20 px-4 py-1 border border-green-500/50 rounded-full">
                                <span className="text-[10px] text-green-400 font-black tracking-[0.2em] uppercase">Rostro Detectado</span>
                            </div>
                        )}
                    </div>

                    <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="w-[102%] h-4 bg-stone-900 mx-auto -mt-1 rounded-b-sm border-x-2 border-b-2 border-stone-800 shadow-xl"></div>
            </div>

            <div className="w-full max-w-2xl bg-card/60 backdrop-blur-xl border border-stone-800/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-2">
                    <History className="w-4 h-4 text-secondary" />
                    <h3 className="text-xs uppercase tracking-widest font-bold text-stone-300">Historial de Identidad</h3>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {attempts.length === 0 ? (
                        <p className="text-[10px] text-stone-600 text-center py-4 font-mono uppercase tracking-widest">No hay registros previos</p>
                    ) : (
                        attempts.map((attempt) => (
                            <div key={attempt.id} className="flex items-center justify-between p-2 bg-black/40 border border-stone-800/50 rounded-sm">
                                <div className="flex items-center gap-3">
                                    <img src={attempt.thumbnail} alt="Rostro" className="w-10 h-10 object-cover border border-stone-700" />
                                    <div className="flex flex-col">
                                        <span className={cn("text-[10px] font-bold uppercase", attempt.success ? "text-green-500" : "text-primary")}>
                                            {attempt.success ? "Acceso Permitido" : "Acceso Denegado"}
                                        </span>
                                        <span className="text-[8px] font-mono text-stone-500">{attempt.timestamp.toLocaleTimeString()}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-stone-300">{attempt.confidence.toFixed(1)}%</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
});

ProFaceAuth.displayName = "ProFaceAuth";
export default ProFaceAuth;
