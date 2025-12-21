/**
 * Google Calendar Tools for Retail Email Agent
 * 
 * These tools use the Google Calendar MCP Server to manage calendar events.
 * They wrap MCP tool calls using the Agent's MCP client.
 */

import { tool } from "ai";
import { z } from "zod";

/**
 * Get calendar tools from MCP client
 * This function should be called with the agent's MCP client instance
 */
export function createCalendarTools(mcpClient) {
	if (!mcpClient) {
		console.warn("MCP client not available. Calendar tools will not work.");
		return {};
	}

	// Get the AI tools from the MCP client
	// The MCP client should have already connected to the server
	const mcpTools = mcpClient.getAITools();
	
	if (!mcpTools || Object.keys(mcpTools).length === 0) {
		console.warn("No MCP tools available. Make sure MCP server is connected.");
		return {};
	}

	// Return the MCP tools directly - they're already in the correct format
	return mcpTools;
}

/**
 * Initialize calendar tools by connecting to the MCP server
 * This should be called during agent initialization
 */
export async function initializeCalendarTools(agent, mcpServerUrl) {
	if (!agent.mcp) {
		console.warn("Agent does not have MCP client. Calendar tools will not be available.");
		return {};
	}

	try {
		// Connect to the MCP server
		await agent.mcp.connect(mcpServerUrl);
		
		// Get the tools from the connected MCP client
		const mcpTools = agent.mcp.getAITools();
		
		console.log("Calendar MCP tools initialized:", Object.keys(mcpTools));
		
		return mcpTools;
	} catch (error) {
		console.error("Failed to initialize calendar tools:", error);
		return {};
	}
}

/**
 * Manual wrapper tools (alternative approach if MCP client doesn't work directly)
 * These make direct HTTP calls to the MCP server
 */
async function callMcpTool(mcpServerUrl, toolName, args, env) {
	const timestamp = Math.floor(Date.now() / 1000).toString();
	const body = JSON.stringify({
		method: "tools/call",
		params: {
			name: toolName,
			arguments: args
		}
	});

	// Create HMAC signature for authentication
	const enc = new TextEncoder();
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		enc.encode(env.MCP_SHARED_SECRET),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	);
	const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(`${timestamp}.${body}`));
	const arr = new Uint8Array(sig);
	let s = "";
	for (const b of arr) s += String.fromCharCode(b);
	const signature = btoa(s);

	const response = await fetch(`${mcpServerUrl}/mcp`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-MCP-Timestamp": timestamp,
			"X-MCP-Signature": signature
		},
		body
	});

	if (!response.ok) {
		throw new Error(`MCP tool call failed: ${response.status} ${await response.text()}`);
	}

	return await response.json();
}

/**
 * Alternative: Direct HTTP-based calendar tools
 * Use these if the MCP client approach doesn't work
 */
export function createDirectCalendarTools(mcpServerUrl, env) {
	if (!mcpServerUrl || !env?.MCP_SHARED_SECRET) {
		console.warn("MCP server URL or secret not configured. Calendar tools will not work.");
		return {};
	}

	return {
		getAvailability: tool({
			description: "Get available time slots in the calendar for scheduling consultations. Use this to check when the calendar is free.",
			inputSchema: z.object({
				startISO: z.string().describe("Start date/time in ISO 8601 format (e.g., '2025-01-27T09:00:00-08:00')"),
				endISO: z.string().describe("End date/time in ISO 8601 format (e.g., '2025-01-27T17:00:00-08:00')"),
				durationMinutes: z.number().int().min(5).max(240).describe("Duration of the meeting in minutes (5-240)"),
				timeZone: z.string().optional().default("America/Los_Angeles").describe("Timezone (e.g., 'America/Los_Angeles')"),
				calendarId: z.string().optional().describe("Calendar ID (defaults to 'primary')"),
			}),
			execute: async (args) => {
				try {
					const result = await callMcpTool(mcpServerUrl, "getAvailability", args, env);
					return JSON.stringify(result);
				} catch (error) {
					return JSON.stringify({ error: error.message });
				}
			},
		}),

		createConsultation: tool({
			description: "Create a new consultation/meeting in the calendar. Use this when a customer wants to schedule a consultation.",
			inputSchema: z.object({
				customerName: z.string().describe("Name of the customer"),
				customerEmail: z.string().email().optional().describe("Email address of the customer"),
				startISO: z.string().describe("Start date/time in ISO 8601 format"),
				endISO: z.string().describe("End date/time in ISO 8601 format"),
				timeZone: z.string().optional().default("America/Los_Angeles").describe("Timezone"),
				notes: z.string().optional().describe("Additional notes about the consultation"),
				calendarId: z.string().optional().describe("Calendar ID (defaults to 'primary')"),
			}),
			execute: async (args) => {
				try {
					const result = await callMcpTool(mcpServerUrl, "createConsultation", args, env);
					return JSON.stringify(result);
				} catch (error) {
					return JSON.stringify({ error: error.message });
				}
			},
		}),

		rescheduleConsultation: tool({
			description: "Reschedule an existing consultation to a new time. Use this when a customer wants to change their appointment time.",
			inputSchema: z.object({
				eventId: z.string().describe("The event ID from the original consultation (get this from createConsultation response)"),
				newStartISO: z.string().describe("New start date/time in ISO 8601 format"),
				newEndISO: z.string().describe("New end date/time in ISO 8601 format"),
				timeZone: z.string().optional().default("America/Los_Angeles").describe("Timezone"),
				calendarId: z.string().optional().describe("Calendar ID (defaults to 'primary')"),
			}),
			execute: async (args) => {
				try {
					const result = await callMcpTool(mcpServerUrl, "rescheduleConsultation", args, env);
					return JSON.stringify(result);
				} catch (error) {
					return JSON.stringify({ error: error.message });
				}
			},
		}),

		cancelConsultation: tool({
			description: "Cancel a scheduled consultation. Use this when a customer wants to cancel their appointment.",
			inputSchema: z.object({
				eventId: z.string().describe("The event ID from the original consultation"),
				calendarId: z.string().optional().describe("Calendar ID (defaults to 'primary')"),
			}),
			execute: async (args) => {
				try {
					const result = await callMcpTool(mcpServerUrl, "cancelConsultation", args, env);
					return JSON.stringify(result);
				} catch (error) {
					return JSON.stringify({ error: error.message });
				}
			},
		}),
	};
}

