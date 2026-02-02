"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import * as faceapi from "face-api.js";
import { cn } from "@/lib/utils";

// Types for our callbacks
export type ProFaceAuthHandle = {
    startCamera: () => Promise<void>;
    startVerification: () => Promise<void>;
    captureAndRegister: () => Promise<void>;
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

    // Propagate status changes
    useEffect(() => {
        onStatusChange(internalStatus);
    }, [internalStatus, onStatusChange]);

    // Load Models
    useEffect(() => {
        async function load() {
            setInternalStatus("loading");
            try {
                const MODEL_URL = "/models";
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
                if (!autoStart) setInternalStatus("idle");
            } catch (e) {
                console.error(e);
                setInternalStatus("error");
                onResult(false, "Failed to load models");
            }
        }
        load();
    }, [autoStart, onResult]);

    useEffect(() => {
        if (autoStart && modelsLoaded) {
            startCamera();
        }
    }, [autoStart, modelsLoaded]);

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

    function euclideanDistance(a: number[], b: number[]) {
        return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
    }

    async function getDescriptor() {
        const video = videoRef.current;
        if (!video || !cameraActive) throw new Error("Camera not ready");

        // Create a temporary detection on the video element directly or use internal canvas logic
        // The original code used a canvas to draw the image first. Let's replicate that for consistency.
        // But face-api can detect from video directly. Let's try direct detection for speed, or canvas if needed.

        const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        return detection;
    }

    async function startVerification() {
        if (!cameraActive) {
            await startCamera();
            // Wait a bit for camera to warm up?
            await new Promise(r => setTimeout(r, 1000));
        }

        setInternalStatus("detecting");

        // Simulate "Scanning" delay for effect (Kratos intensity)
        await new Promise(r => setTimeout(r, 1500));

        try {
            const detection = await getDescriptor();

            if (!detection) {
                setInternalStatus("ready"); // Go back to ready
                onResult(false, "No face detected. Look at the camera.");
                return;
            }

            const stored = localStorage.getItem("face_descriptor_demo");
            if (!stored) {
                setInternalStatus("error");
                onResult(false, "No registered face found. Please register first.");
                return;
            }

            const storedDescriptor = JSON.parse(stored) as number[];
            const currentDescriptor = Array.from(detection.descriptor);
            const distance = euclideanDistance(storedDescriptor, currentDescriptor);

            const THRESHOLD = 0.55;

            if (distance < THRESHOLD) {
                setInternalStatus("verified");
                onResult(true, "Identity Verified: Spartan Recognized", distance);
            } else {
                setInternalStatus("ready"); // Allow retry
                onResult(false, "Identity Mismatch: Imposter Detected", distance);
            }

        } catch (e) {
            console.error(e);
            setInternalStatus("error");
            onResult(false, "Detection error");
        }
    }

    async function captureAndRegister() {
        if (!cameraActive) await startCamera();

        setInternalStatus("detecting");
        try {
            const detection = await getDescriptor();
            if (!detection) {
                setInternalStatus("ready");
                onResult(false, "No face detected for registration.");
                return;
            }

            const descriptor = Array.from(detection.descriptor);
            localStorage.setItem("face_descriptor_demo", JSON.stringify(descriptor));
            setInternalStatus("ready");
            onResult(true, "Face Registered Successfully");
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
        <div className="relative w-full max-w-2xl mx-auto">
            {/* Greek Tempel Pediment Top (Decorative) */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[104%] h-8 bg-gradient-to-b from-stone-800 to-stone-900 border-x-4 border-t-4 border-secondary/60 rounded-t-lg z-0 flex items-center justify-center overflow-hidden">
                <div className="w-full h-1 bg-secondary/40 absolute bottom-1"></div>
                {/* Meander Pattern (approximate with dashes) */}
                <div className="w-full h-2 border-b-2 border-dashed border-secondary/30 opacity-50"></div>
            </div>

            {/* Main Frame (The "Temple") */}
            <div className="relative w-full aspect-video md:aspect-[4/3] bg-black rounded-sm overflow-hidden border-x-[12px] border-y-[12px] border-stone-800 shadow-2xl z-10">

                {/* Columns (Left and Right borders simulating fluted columns) */}
                <div className="absolute top-0 bottom-0 left-0 w-3 bg-[linear-gradient(90deg,rgba(0,0,0,0.5)_10%,transparent_20%,transparent_80%,rgba(0,0,0,0.5)_90%),linear-gradient(to_bottom,var(--secondary)_0%,var(--stone-800)_100%)] z-20 pointer-events-none border-r border-stone-900"></div>
                <div className="absolute top-0 bottom-0 right-0 w-3 bg-[linear-gradient(90deg,rgba(0,0,0,0.5)_10%,transparent_20%,transparent_80%,rgba(0,0,0,0.5)_90%),linear-gradient(to_bottom,var(--secondary)_0%,var(--stone-800)_100%)] z-20 pointer-events-none border-l border-stone-900"></div>

                {/* Video Element */}
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={cn("w-full h-full object-cover transform scale-x-[-1]", !cameraActive && "opacity-0")}
                />

                {/* Placeholder / Loading State */}
                {!cameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 bg-stone-950 text-stone-500">
                        <div className="w-16 h-16 border-4 border-t-primary border-stone-800 rounded-full animate-spin" />
                        <p className="uppercase tracking-widest text-xs font-serif text-secondary">Awaiting Optics...</p>
                    </div>
                )}

                {/* Overlays based on state */}
                {/* Kratos "Targeting" Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Scan lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20" />

                    {/* Greek Corner Ornamentation */}
                    <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-secondary opacity-80"></div>
                    <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-secondary opacity-80"></div>
                    <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-secondary opacity-80"></div>
                    <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-secondary opacity-80"></div>

                    {/* Status Hud */}
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-1 font-serif tracking-widest">
                        <div className="flex items-center gap-2 bg-black/50 px-2 py-1 rounded border border-stone-800">
                            <div className={cn("w-2 h-2 rounded-full", cameraActive ? "bg-green-500 animate-pulse" : "bg-red-900")} />
                            <span className="text-[10px] text-secondary">OLYMPUS_EYE: {cameraActive ? "OPEN" : "CLOSED"}</span>
                        </div>
                    </div>

                    {/* Detecting / Scanning Effect */}
                    {internalStatus === "detecting" && (
                        <div className="absolute inset-0 border-4 border-primary/50 animate-pulse">
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-primary/80 shadow-[0_0_15px_red] animate-[scan_1.5s_ease-in-out_infinite]" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-primary rounded-full animate-ping opacity-20" />
                        </div>
                    )}

                    {/* Verified Effect */}
                    {internalStatus === "verified" && (
                        <div className="absolute inset-0 border-8 border-green-500/50 bg-green-500/10 transition-all duration-500 flex items-center justify-center backdrop-blur-sm">
                            <div className="text-4xl font-bold text-green-400 uppercase tracking-widest drop-shadow-lg border-y-4 border-green-600/50 py-2 px-8 bg-black/50">
                                Spartan Verified
                            </div>
                        </div>
                    )}
                </div>

                {/* Hidden Canvas for face-api internal use if needed, but we used video directly */}
                <canvas ref={canvasRef} className="hidden" />

                <style jsx global>{`
            @keyframes scan {
                0% { top: 10%; opacity: 0; }
                50% { opacity: 1; }
                100% { top: 90%; opacity: 0; }
            }
        `}</style>
            </div>

            {/* Temple Base */}
            <div className="w-[104%] h-4 bg-stone-900 mx-auto -mt-1 rounded-b-sm border-x-2 border-b-2 border-stone-700"></div>
        </div>
    );
});

ProFaceAuth.displayName = "ProFaceAuth";
export default ProFaceAuth;
