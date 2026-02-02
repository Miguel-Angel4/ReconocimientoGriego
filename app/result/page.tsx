"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

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

    return (
        <div className="z-10 w-full max-w-lg space-y-8 animate-in fade-in zoom-in duration-500">
            <Card className="border-2 border-stone-800 bg-card/95 backdrop-blur shadow-2xl relative overflow-hidden">
                {/* Border Effects */}
                <div className={`absolute top-0 left-0 w-full h-2 ${authorized ? "bg-green-600" : "bg-red-600"}`}></div>

                <CardHeader className="text-center pt-12 pb-2">
                    <div className="flex justify-center mb-6">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${authorized ? "border-green-600 bg-green-900/20 text-green-500" : "border-red-600 bg-red-900/20 text-red-500"}`}>
                            <span className="text-5xl">{authorized ? "✓" : "✕"}</span>
                        </div>
                    </div>
                    <CardTitle className={`text-2xl uppercase tracking-widest ${authorized ? "text-green-500" : "text-destructive"}`}>
                        {authorized ? "ACCESS GRANTED" : "ACCESS DENIED"}
                    </CardTitle>
                    <Badge variant={authorized ? "outline" : "destructive"} className="mt-2 self-center">
                        {authorized ? "VERIFIED ID: SPARTAN" : "UNKNOWN ENTITY"}
                    </Badge>
                </CardHeader>

                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground font-mono text-sm leading-relaxed border-t border-b border-stone-800 py-4">
                        {message || (authorized ? "Welcome back. The system is ready for your command." : "Facial geometry does not match authorized personnel records.")}
                    </p>

                    {authorized && (
                        <div className="text-xs text-stone-500 uppercase tracking-widest">
                            Clearance Level: GOD
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pb-8">
                    <Button
                        variant={authorized ? "default" : "secondary"}
                        className="w-full"
                        onClick={() => router.push("/")}
                    >
                        {authorized ? "ENTER DASHBOARD" : "RETRY IDENTIFICATION"}
                    </Button>

                    {authorized && (
                        <Button
                            variant="ghost"
                            className="w-full text-xs text-stone-500"
                            onClick={() => router.push("/")}
                        >
                            LOCK TERMINAL
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <div className="text-center">
                <p className="text-[10px] text-stone-600 font-mono">
                    {authorized ? "SESSION: ACTIVE" : "SECURITY PROTOCOL: ENGAGED"}
                </p>
            </div>
        </div>
    );
}

export default function ResultPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden font-sans text-foreground">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-900 via-background to-black pointer-events-none"></div>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] pointer-events-none mix-blend-overlay"></div>

            <Suspense fallback={<div className="text-white">Loading Result...</div>}>
                <ResultContent />
            </Suspense>
        </main>
    );
}
