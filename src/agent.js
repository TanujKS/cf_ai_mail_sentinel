/**
 * Retail Email Agent
 * 
 * An AI-powered agent that analyzes customer emails, looks up product information,
 * and generates helpful replies before forwarding emails to their destination.
 * 
 * Uses Vercel AI SDK's generateText with Zod-schema tools for proper agentic tool use.
 */

import { Agent } from "agents";
import { generateText, stepCountIs, Output } from "ai";
import { productTools } from "./tools.js";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
const model = openai("gpt-4o-2024-11-20");


export class RetailEmailAgent extends Agent {
	/**
	 * Handle HTTP requests to the agent
	 */
	async fetch(request) {
		const url = new URL(request.url);
		
		// Handle analyze request
		if (url.pathname === "/internal/analyze" && request.method === "POST") {
			const body = await request.json();
			const analysis = await this.analyzeAndReply(
				body.emailContent,
				body.customerEmail,
				body.subject,
			);
			return new Response(JSON.stringify(analysis), {
				headers: { "Content-Type": "application/json" },
			});
		}
		
		return new Response("Not Found", { status: 404 });
	}


	/**
	 * Analyze customer email and generate a reply using Vercel AI SDK's generateText
	 * Returns: { canReply: boolean, replyContent: string, reason: string }
	 * 
	 * Uses generateText with Zod-schema tools - the LLM can directly call tools
	 * to get product information and generate a reply.
	 */
	async analyzeAndReply(emailContent, customerEmail, subject) {
		try {
			// Access AI binding through env (Durable Objects have env available)
			if (!this.env || !this.env.AI) {
				throw new Error("AI binding not available. Make sure 'ai' binding is configured in wrangler.jsonc");
			}

			// Create the system prompt for the agent
			const systemPrompt = `You are a customer service AI agent for a retail business.

Your task is to analyze incoming customer emails and decide whether you can fully and correctly answer the customer using ONLY the available product catalog tools.

Available tools:
- getProductInfo: detailed info for a specific product
- searchProducts: search products by keyword
- getPricing: pricing for a specific product
- getAllProducts: list all products

Rules:
1. You may ONLY answer questions that can be resolved using product catalog data (products, pricing, availability, categories, comparisons).
2. If the email asks about anything outside the product catalog — including but not limited to:
   - order status
   - shipping
   - returns or refunds
   - complaints
   - account issues
   - support issues
   you MUST NOT answer and must indicate the email should be forwarded to a human.
3. If you need product information to answer, call the appropriate tools first.
4. Be friendly, professional, and concise in replies.
5. Do NOT guess or hallucinate information.
6. Do NOT mention internal tools, policies, or that you are an AI.

OUTPUT FORMAT (MANDATORY):
You MUST respond with valid JSON and nothing else.

If you CAN answer using the product catalog:
{
  "canReply": true,
  "reply": "<a complete, customer-ready reply>"
}

If you CANNOT answer using the product catalog:
{
  "canReply": false,
  "reason": "<short reason such as 'order status', 'returns', 'complaint', 'account issue'>"
}

Do not include any additional text outside this JSON.

Customer Email Metadata:
- Customer Email: ${customerEmail}
- Subject: ${subject}

Email Content:
${emailContent}`;

			// Define the response schema using Zod
			const responseSchema = z.object({
				canReply: z.boolean().describe("Whether the agent can reply to this email using product catalog information"),
				reply: z.string().optional().describe("The complete customer-ready reply (required if canReply is true)"),
				reason: z.string().optional().describe("Reason why the email cannot be answered (required if canReply is false)"),
			});

			// Use generateText with tools and structured output
			const result = await generateText({
				model: model,
				system: systemPrompt,
				prompt: `Please analyze this customer email and provide a helpful response. Use the available tools to look up any product information you need. If you can answer the customer's question, write a friendly reply. If you cannot (e.g., order status, returns, complaints), explain that the email will be forwarded to a human agent.`,
				tools: productTools,
				experimental_output: Output.object({
					schema: responseSchema,
				}),
				stopWhen: stepCountIs(5), // allow up to 5 steps total (tool calls + final)
				temperature: 0.0,
			});

			console.log("Result:", JSON.stringify(result.resolvedOutput, null, 2));

			// Extract the structured output from the result
			const parsedResponse = result.resolvedOutput;

			// Validate the parsed response structure
			if (typeof parsedResponse?.canReply !== "boolean") {
				return {
					canReply: false,
					replyContent: null,
					reason: "Invalid response format: missing or invalid 'canReply' field",
				};
			}

			// Return based on the parsed JSON response
			if (parsedResponse.canReply) {
				if (!parsedResponse.reply || typeof parsedResponse.reply !== "string") {
					return {
						canReply: false,
						replyContent: null,
						reason: "Invalid response format: missing or invalid 'reply' field",
					};
				}
				return {
					canReply: true,
					replyContent: parsedResponse.reply.trim(),
					reason: "Agent generated a helpful reply using product information",
				};
			} else {
				return {
					canReply: false,
					replyContent: null,
					reason: parsedResponse.reason || "Email requires human attention",
				};
			}
		} catch (error) {
			console.error("Error in AI analysis:", error);
			return {
				canReply: false,
				replyContent: null,
				reason: `Error during analysis: ${error.message}`,
			};
		}
	}
}

