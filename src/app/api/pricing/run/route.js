import { runPricingAnalysis } from "../../../../lib/pricing-intelligence";

export const dynamic = "force-dynamic";

export async function POST(req) {
    try {
        const { urls } = await req.json();

        if (!urls || !Array.isArray(urls)) {
            return new Response(JSON.stringify({ error: "URLs must be an array" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                const sendEvent = (data) => {
                    const event = `data: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(encoder.encode(event));
                };

                // Notify start
                sendEvent({ type: "info", message: `Initiating parallel analysis for ${urls.length} competitors...` });

                // Run all agents in parallel
                const agentPromises = urls.map(async (url) => {
                    try {
                        const agentStream = await runPricingAnalysis(url);
                        const reader = agentStream.getReader();

                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            const chunk = new TextDecoder().decode(value);
                            const lines = chunk.split("\n");

                            for (const line of lines) {
                                if (line.startsWith("data: ")) {
                                    try {
                                        const originalData = JSON.parse(line.slice(6));
                                        // Tag the data with the URL so the frontend knows which row to update
                                        sendEvent({
                                            ...originalData,
                                            competitor_url: url
                                        });
                                    } catch (e) {
                                        // Partial JSON or heartbeat
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        console.error(`Error processing ${url}:`, err);
                        sendEvent({
                            type: "error",
                            competitor_url: url,
                            message: `Failed to analyze ${url}: ${err.message}`
                        });
                    }
                });

                // Wait for all agents to complete
                await Promise.all(agentPromises);

                sendEvent({ type: "done", message: "All parallel tasks completed." });
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error) {
        console.error("Pricing API error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
