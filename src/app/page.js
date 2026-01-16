"use client";
import { useState, useEffect } from "react";
import {
    Package,
    AlertTriangle,
    CheckCircle,
    Clock,
    Activity,
    Shield,
    Zap,
    TrendingUp,
    Boxes,
    RefreshCw,
    ShieldCheck,
    Bot,
    Search,
    Globe
} from "lucide-react";
import { AgentHeader } from "../components/AgentHeader";
import { MetricCard } from "../components/MetricCard";
import { ActivityFeed } from "../components/ActivityFeed";
import { RiskAssessment } from "../components/RiskAssessment";
import { ActionPanel } from "../components/ActionPanel";
import { InventoryAlert } from "../components/InventoryAlert";
import { LiveStream } from "../components/LiveStream";
import { DecisionReasoning } from "../components/DecisionReasoning";
import { MinoAgentAesthetics } from "../components/MinoAgentAesthetics";
import { InventoryInput } from "../components/InventoryInput";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

const mockActivities = [];
const mockRiskItems = [];
const mockAlerts = [];

export default function Index() {
    const [agentStatus, setAgentStatus] = useState("active");
    const [alerts, setAlerts] = useState([]);
    const [isMounted, setIsMounted] = useState(false);
    const [sku, setSku] = useState("");
    const [intendedUpdate, setIntendedUpdate] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [streamEvents, setStreamEvents] = useState([]);
    const [currentPhase, setCurrentPhase] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [lossesPrevented, setLossesPrevented] = useState(0);
    const [inventorySource, setInventorySource] = useState(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleRunAgent = async (e) => {
        e.preventDefault();
        if (!sku) {
            toast({ title: "Error", description: "Please provide a SKU." });
            return;
        }

        setIsRunning(true);
        setStreamEvents([]);
        setCurrentPhase("SURFACE_SCAN");
        setLastResult(null);
        toast({ title: "Mission Started", description: `Deep Audit initiated for ${sku}...` });

        try {
            // Check if we have a live URL connected
            const contextUrl = inventorySource?.type === 'url' ? inventorySource.name : null;

            const response = await fetch("/api/agent/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sku, intendedUpdate, contextUrl }),
            });

            if (!response.ok) throw new Error("Agent failed to start");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            // Handle Phase Updates
                            if (data.phase) {
                                setCurrentPhase(data.phase);
                                setStreamEvents(prev => [...prev, {
                                    type: "phase_start",
                                    message: `>>> ENTERING PHASE: ${data.phase}`,
                                    timestamp: new Date().toLocaleTimeString()
                                }]);
                            }

                            setStreamEvents(prev => [...prev, {
                                type: data.type || "observation",
                                message: data.message || data.text || "Scanning environment...",
                                timestamp: new Date().toLocaleTimeString()
                            }]);

                            // If final result is found in the stream
                            if (data.final_result) {
                                const result = data.final_result;
                                setLastResult(result);

                                if (result.recommended_action !== "PROCEED") {
                                    setLossesPrevented(prev => prev + 1500); // Simulated value
                                }

                                setAlerts(prev => [{
                                    id: `audit-${Date.now()}`,
                                    type: "deep-audit",
                                    severity: result.recommended_action === "ESCALATE" ? "critical" : result.recommended_action === "PAUSE" ? "high" : "medium",
                                    itemName: `Audit Result: ${sku}`,
                                    itemSku: sku,
                                    message: result.reasoning,
                                    currentStock: result.current_stock || 0,
                                    expectedStock: result.audit_trail_valid ? "Matched" : "Mismatch",
                                    detectedAt: "Just now",
                                }, ...prev]);
                            }
                        } catch (e) {
                            // Partial chunk
                        }
                    }
                }
            }

            setIsRunning(false);
            setCurrentPhase(null);
            toast({
                title: "Audit Complete",
                description: "Deep integrity check finished. See reasoning below."
            });

        } catch (err) {
            setIsRunning(false);
            setCurrentPhase(null);
            toast({ title: "Audit Failed", description: err.message });
            setStreamEvents(prev => [...prev, { type: "error", message: err.message }]);
        }
    };

    const handleToggleStatus = () => {
        setAgentStatus(prev => prev === "active" ? "paused" : "active");
        toast({
            title: agentStatus === "active" ? "Agent Paused" : "Agent Activated",
            description: agentStatus === "active"
                ? "Monitoring has been temporarily suspended."
                : "Real-time inventory monitoring resumed.",
        });
    };

    const handleAlertAction = (id, action) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
        toast({
            title: `Action: ${action.toUpperCase()}`,
            description: `Alert has been ${action === "proceed" ? "approved" : action === "pause" ? "paused for review" : "escalated to supervisor"}.`,
        });
    };

    const handleQuickAction = (action) => {
        toast({
            title: `${action} Action Triggered`,
            description: `All pending items have been ${action.toLowerCase()}ed.`,
        });
    };

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/30">
            {/* Subtle grid pattern overlay */}
            <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-[0.03]" />
            <div className="fixed inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-info/5 pointer-events-none" />

            <AgentHeader
                status={agentStatus}
                onToggleStatus={handleToggleStatus}
                lastSync="14:32:08"
            />

            <main className="container mx-auto px-4 md:px-6 py-8 relative">
                <InventoryInput onInventoryLoaded={setInventorySource} />

                {/* Agent Trigger Form */}
                <section className="mb-8 p-6 rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-sm relative overflow-hidden group shadow-xl shadow-primary/5">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap className="h-24 w-24 text-primary" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" /> Analyze New Stock Update
                        </h2>
                        <form onSubmit={handleRunAgent} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">SKU ID</label>
                                <input
                                    type="text"
                                    placeholder="e.g. WH-2024-PRO"
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                    className="w-full bg-background border border-primary/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono shadow-inner"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Intended Update</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Set stock to 20 units"
                                    value={intendedUpdate}
                                    onChange={(e) => setIntendedUpdate(e.target.value)}
                                    className="w-full bg-background border border-primary/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    disabled={isRunning}
                                    className={cn(
                                        "w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0",
                                        isRunning && "animate-pulse"
                                    )}
                                >
                                    {isRunning ? (
                                        <><RefreshCw className="h-4 w-4 animate-spin" /> Investigating...</>
                                    ) : (
                                        <><Zap className="h-4 w-4 fill-current" /> Start Deep Audit</>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <LiveStream events={streamEvents} isRunning={isRunning} currentPhase={currentPhase} />
                            <MinoAgentAesthetics
                                isActive={isRunning}
                                targetUrl={inventorySource?.type === 'url' ? inventorySource.name : "https://inventory-demo-dashboard.com"}
                                currentAction={streamEvents[streamEvents.length - 1]?.message}
                            />
                        </div>

                        {/* Educational Insight Card */}
                        {!isRunning && !lastResult && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-8 p-6 rounded-2xl border border-primary/10 bg-primary/5 flex gap-6 items-start shadow-inner"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                    <Bot className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-primary">What is the Mino API doing?</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Unlike normal scripts, Mino launches a **headless autonomous browser**. It literally "reads" your inventory dashboard's UI.
                                        If the site has no API, Mino finds the data by navigating menus, scrolling tables, and understanding the page structure like a human would—but at machine speed.
                                    </p>
                                    <div className="flex gap-4 pt-2">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                                            <div className="w-1 h-1 rounded-full bg-primary" /> Visual Recognition
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                                            <div className="w-1 h-1 rounded-full bg-primary" /> DOM Navigation
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                                            <div className="w-1 h-1 rounded-full bg-primary" /> Natural Reasoning
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {lastResult && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <DecisionReasoning result={lastResult} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* Status banner */}
                <div className={cn(
                    "mb-8 rounded-2xl border p-5 flex items-center justify-between transition-all duration-700 shadow-2xl",
                    agentStatus === "active"
                        ? "bg-success/5 border-success/20 shadow-success/5"
                        : "bg-warning/5 border-warning/20 shadow-warning/5"
                )}>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-500",
                            agentStatus === "active" ? "bg-success/15 scale-110" : "bg-warning/15"
                        )}>
                            <Zap className={cn(
                                "h-6 w-6 transition-all",
                                agentStatus === "active" ? "text-success animate-pulse" : "text-warning"
                            )} />
                        </div>
                        <div>
                            <p className="font-bold text-base tracking-tight mb-0.5">
                                {agentStatus === "active" ? "Agent is actively monitoring" : "Agent is paused"}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium">
                                {agentStatus === "active"
                                    ? "Real-time detection and automated decisions enabled"
                                    : "Manual review mode - all decisions require approval"}
                            </p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground mr-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <span className="font-mono font-bold tracking-widest uppercase">System Online</span>
                        </div>
                        <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                            <Boxes className="h-3 w-3 text-info" />
                            <span className="font-mono font-bold tracking-widest uppercase text-info">Listening</span>
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
                    <MetricCard
                        title="Monitored"
                        value={inventorySource?.count ? inventorySource.count : "Active"}
                        subtitle={inventorySource ? (inventorySource.type === 'url' ? "Live Feed Link" : "Items from Manifest") : "System Listening"}
                        icon={Package}
                    />
                    <MetricCard
                        title="Active Alerts"
                        value={alerts.length}
                        subtitle={alerts.length > 0 ? "Requires attention" : "System stable"}
                        icon={AlertTriangle}
                        variant={alerts.length > 0 ? "warning" : "default"}
                    />
                    <MetricCard
                        title="Auto-Approved"
                        value="-- "
                        subtitle="Last 24 hours"
                        icon={CheckCircle}
                        variant="success"
                    />
                    <MetricCard
                        title="Avg Response"
                        value="~1.2s"
                        subtitle="Est. Latency"
                        icon={Clock}
                        variant="info"
                    />
                    <MetricCard
                        title="Losses Prevented"
                        value={lossesPrevented > 0 ? `$${lossesPrevented.toLocaleString()}` : "$0"}
                        subtitle="Session Impact"
                        icon={Shield}
                        variant="primary"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Alerts */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/20">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold tracking-tight">Pending Alerts</h2>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Items requiring immediate decision and risk mitigation
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {alerts.map(alert => (
                                    <InventoryAlert
                                        key={alert.id}
                                        {...alert}
                                        onProceed={(id) => handleAlertAction(id, "proceed")}
                                        onPause={(id) => handleAlertAction(id, "pause")}
                                        onEscalate={(id) => handleAlertAction(id, "escalate")}
                                    />
                                ))}
                                {alerts.length === 0 && (
                                    <div className="text-center py-20 rounded-2xl border-2 border-dashed border-success/30 bg-success/5 flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4 border border-success/20">
                                            <CheckCircle className="h-8 w-8 text-success" />
                                        </div>
                                        <p className="text-xl font-bold tracking-tight">All Clear</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            No pending alerts. Start an audit above to analyze stock.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Activity Feed */}
                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center border border-info/20">
                                    <Activity className="h-5 w-5 text-info" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold tracking-tight">Activity Feed</h2>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Real-time agent decisions and sync events
                                    </p>
                                </div>
                            </div>
                            {streamEvents.length > 0 ? (
                                <div className="space-y-4">
                                    {streamEvents.slice(-5).reverse().map((event, i) => (
                                        <div key={i} className="flex gap-4 p-4 rounded-xl border border-primary/10 bg-background/50">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Activity className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold">{event.message}</p>
                                                <p className="text-[10px] text-muted-foreground">{event.timestamp}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border border-dashed border-primary/10 rounded-xl">
                                    <p className="text-xs text-muted-foreground italic">Waiting for agent activity...</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-8">
                        <ActionPanel
                            pendingActions={alerts.length}
                            onProceed={() => handleQuickAction("Proceed")}
                            onPause={() => handleQuickAction("Pause")}
                            onEscalate={() => handleQuickAction("Escalate")}
                            onReset={() => handleQuickAction("Reset")}
                        />

                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <Shield className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold tracking-tight">Risk Assessment</h2>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Analysis of high-value inventory batches
                                    </p>
                                </div>
                            </div>
                            {lastResult ? (
                                <RiskAssessment items={[{
                                    id: "current-1",
                                    name: `Audit: ${sku}`,
                                    category: "ON-DEMAND",
                                    riskScore: lastResult.audit_trail_valid ? 10 : 90,
                                    factors: [lastResult.reasoning],
                                    recommendation: lastResult.recommended_action.toLowerCase()
                                }]} />
                            ) : (
                                <div className="text-center py-12 border border-dashed border-primary/10 rounded-xl bg-background/50">
                                    <p className="text-xs text-muted-foreground italic">No active risk assessments.</p>
                                </div>
                            )}
                        </section>

                        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-info/10 border border-primary/20">
                            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary" /> System Health
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-medium mb-4 leading-relaxed uppercase tracking-wider">
                                Agentic integrity checks are ready. Warehouse nodes connected.
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-success uppercase">Agent: Ready</span>
                                <span className="text-[10px] font-bold text-success uppercase">Network: Stable</span>
                            </div>
                        </div>
                    </aside>
                </div>
                <section className="mt-20 border-t border-primary/10 pt-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black tracking-tight mb-4 lowercase">how it actually works</h2>
                        <p className="text-sm text-muted-foreground max-w-xl mx-auto font-medium">
                            The Inventory Guardian isn't just a dashboard—it's a fleet of autonomous researchers powered by the <span className="text-primary font-bold">Mino API</span>.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-primary/10 z-0" />

                        <div className="relative z-10 space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-background border-2 border-primary/50 flex items-center justify-center mx-auto shadow-xl group hover:scale-110 transition-transform">
                                <Search className="h-8 w-8 text-primary group-hover:animate-bounce" />
                            </div>
                            <div className="text-center">
                                <h4 className="text-sm font-black uppercase tracking-widest mb-2">1. The Mission</h4>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    You provide a simple intent (e.g. "Audit SKU-124"). We formulate a complex natural language goal for the agent.
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary border-2 border-primary/50 flex items-center justify-center mx-auto shadow-xl group hover:scale-110 transition-transform">
                                <Globe className="h-8 w-8 text-primary-foreground group-hover:rotate-12 transition-transform" />
                            </div>
                            <div className="text-center">
                                <h4 className="text-sm font-black uppercase tracking-widest mb-2">2. Autonomous Browsing</h4>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    The Mino API launches a headless browser. It handles auth, navigates complex menus, and "sees" the UI like a human expert.
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-background border-2 border-primary/50 flex items-center justify-center mx-auto shadow-xl group hover:scale-110 transition-transform">
                                <ShieldCheck className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="text-center">
                                <h4 className="text-sm font-black uppercase tracking-widest mb-2">3. Strategic Decision</h4>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    Findings are synthesized into a structured risk report. The system decides whether to Proceed, Pause, or Escalate.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main >
        </div >
    );
}
