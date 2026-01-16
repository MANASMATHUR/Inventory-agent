"use client";
import Image from "next/image";
import {
    Bell,
    RotateCw,
    Settings,
    Pause,
    Play,
    Circle,
    TrendingUp,
    BarChart3
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AgentHeader({ status, onToggleStatus, lastSync }) {
    return (
        <header className="border-b border-primary/20 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                            <Image src="/logo.png" alt="Logo" width={24} height={24} className="brightness-110" />
                        </div>
                        <div className={cn(
                            "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                            status === "active" ? "bg-success" : "bg-warning"
                        )} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-bold text-lg tracking-tight">
                                Inventory <span className="text-primary italic">Guardian</span>
                            </h1>
                            <span className="text-[10px] bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-widest">v2.1.0</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                            AI STOCK MONITOR • <span className={status === "active" ? "text-success font-bold" : "text-warning font-bold"}>{status}</span>
                        </p>
                    </div>
                </div>

                <nav className="hidden lg:flex items-center gap-6 flex-1 ml-10">
                    <Link href="/" className="text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
                        Inventory Audit
                    </Link>
                    <Link href="/competitive-pricing" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                        Pricing Intel
                    </Link>
                </nav>
                <div className="hidden md:flex items-center gap-1 bg-primary/5 border border-primary/10 rounded-lg px-3 py-1.5 mr-2 shadow-sm">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Last Sync</span>
                    <span className="text-xs font-mono font-bold">{lastSync}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors relative text-muted-foreground">
                        <Bell className="h-4 w-4" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border border-background" />
                    </button>
                    <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-muted-foreground">
                        <RotateCw className="h-4 w-4" />
                    </button>
                    <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-muted-foreground">
                        <Settings className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggleStatus}
                        className={cn(
                            "ml-2 flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg",
                            status === "active"
                                ? "bg-warning text-white hover:bg-warning/90 shadow-warning/20"
                                : "bg-success text-white hover:bg-success/90 shadow-success/20"
                        )}
                    >
                        {status === "active" ? (
                            <><Pause className="h-4 w-4" /> Pause Agent</>
                        ) : (
                            <><Play className="h-4 w-4 fill-current" /> Resume Agent</>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
