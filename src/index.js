/**
 * Fail-Safe Email Worker with AI Agent
 *
 * Forwards incoming emails to configured target addresses based on recipient.
 * Uses an AI agent to analyze customer emails and generate helpful replies
 * before forwarding the email chain to the destination.
 * If delivery fails, saves email to R2 bucket and alerts Discord webhook.
 */

import { RetailEmailAgent } from "./agent.js";
import { sendWithMailgun } from "./mailgun.js";

// Export the agent class for Durable Objects
export { RetailEmailAgent };

// HTML content for the project description page
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fail-Safe Email Worker</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .header p {
            font-size: 1.2em;
            opacity: 0.95;
        }

        .content {
            padding: 40px;
        }

        .section {
            margin-bottom: 40px;
        }

        .section h2 {
            color: #667eea;
            font-size: 1.8em;
            margin-bottom: 15px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }

        .section p {
            margin-bottom: 15px;
            font-size: 1.1em;
            color: #555;
        }

        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .feature-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .feature-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .feature-card h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 1.2em;
        }

        .feature-card p {
            color: #666;
            font-size: 0.95em;
            margin: 0;
        }

        .tech-stack {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
        }

        .tech-badge {
            background: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
        }

        .code-block {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }

        .code-block code {
            color: #f8f8f2;
        }

        .status {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            margin-top: 10px;
        }

        ul {
            list-style-position: inside;
            margin-left: 20px;
        }

        ul li {
            margin-bottom: 8px;
            color: #555;
        }

        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #e9ecef;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Fail-Safe Email Worker</h1>
            <p>AI-Powered Email Forwarding with Intelligent Reply Generation</p>
            <div class="status">● Running</div>
        </div>

        <div class="content">
            <div class="section">
                <h2>About</h2>
                <p>
                    Fail-Safe Email Worker is a Cloudflare Email Worker that intelligently forwards incoming emails 
                    to configured target addresses. It uses an AI agent to analyze customer emails and generate 
                    helpful replies before forwarding the email chain to the destination. If delivery fails, 
                    emails are automatically saved to R2 bucket storage and alerts are sent via Discord webhook.
                </p>
            </div>

            <div class="section">
                <h2>Key Features</h2>
                <div class="features">
                    <div class="feature-card">
                        <h3>🤖 AI-Powered Analysis</h3>
                        <p>Uses Cloudflare AI agents to analyze incoming emails and generate intelligent, context-aware replies to customers.</p>
                    </div>
                    <div class="feature-card">
                        <h3>📧 Smart Email Routing</h3>
                        <p>Routes emails to different addresses based on recipient with support for exact matches, catch-all patterns, and global defaults.</p>
                    </div>
                    <div class="feature-card">
                        <h3>💾 Automatic Backup</h3>
                        <p>Automatically saves failed emails to R2 bucket storage with full metadata for later retrieval and analysis.</p>
                    </div>
                    <div class="feature-card">
                        <h3>🔔 Discord Alerts</h3>
                        <p>Real-time notifications via Discord webhook when email delivery fails, including full error details and email content.</p>
                    </div>
                    <div class="feature-card">
                        <h3>🔄 Fail-Safe Design</h3>
                        <p>Comprehensive error handling ensures emails are never lost, with multiple fallback mechanisms in place.</p>
                    </div>
                    <div class="feature-card">
                        <h3>📝 Email Threading</h3>
                        <p>Maintains proper email threading with In-Reply-To headers and quoted message formatting for seamless conversations.</p>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>How It Works</h2>
                <ol style="margin-left: 20px; color: #555;">
                    <li style="margin-bottom: 10px;"><strong>Email Reception:</strong> Incoming emails are received by the Cloudflare Email Worker.</li>
                    <li style="margin-bottom: 10px;"><strong>AI Analysis:</strong> The AI agent analyzes the email content to determine if an automated reply is appropriate.</li>
                    <li style="margin-bottom: 10px;"><strong>Reply Generation:</strong> If appropriate, the agent generates a helpful reply and sends it to the customer via Mailgun.</li>
                    <li style="margin-bottom: 10px;"><strong>Email Forwarding:</strong> The original email (or agent-replied chain) is forwarded to the configured target address.</li>
                    <li style="margin-bottom: 10px;"><strong>Error Handling:</strong> If forwarding fails, the email is saved to R2 storage and a Discord alert is sent.</li>
                </ol>
            </div>

            <div class="section">
                <h2>Technology Stack</h2>
                <div class="tech-stack">
                    <span class="tech-badge">Cloudflare Workers</span>
                    <span class="tech-badge">Cloudflare AI</span>
                    <span class="tech-badge">Durable Objects</span>
                    <span class="tech-badge">R2 Storage</span>
                    <span class="tech-badge">Mailgun</span>
                    <span class="tech-badge">Discord Webhooks</span>
                    <span class="tech-badge">Email Routing</span>
                </div>
            </div>

            <div class="section">
                <h2>Configuration</h2>
                <p>Email routing is configured via environment variables in <code>wrangler.jsonc</code>:</p>
                <div class="code-block">
<code>{
  "EMAIL_ROUTING": {
    "user@domain.com": "target@domain.com",
    "@domain.com": "catchall@domain.com",
    "@default": "fallback@domain.com"
  }
}</code>
                </div>
                <p>Supports:</p>
                <ul>
                    <li><strong>Exact matches:</strong> Route specific email addresses to target addresses</li>
                    <li><strong>Catch-all routing:</strong> Route all emails for a domain to a single address</li>
                    <li><strong>Global default:</strong> Fallback routing for unmatched emails</li>
                </ul>
            </div>

            <div class="section">
                <h2>Monitoring & Alerts</h2>
                <p>The worker provides comprehensive monitoring capabilities:</p>
                <ul>
                    <li>Cloudflare Workers logs for email processing status</li>
                    <li>R2 bucket storage for failed email backups</li>
                    <li>Discord webhook alerts with detailed error information</li>
                    <li>Real-time status tracking and error reporting</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <p>Built with ❤️ using Cloudflare Workers and AI</p>
            <p style="margin-top: 10px; font-size: 0.9em;">Fail-Safe Email Worker v1.0</p>
        </div>
    </div>
</body>
</html>`;

export default {
	async email(message, env, _ctx) {
		// Get email routing configuration (now a proper object)
		const emailRouting = env.EMAIL_ROUTING || {};
		console.log(`Processing email from ${message.from} to ${message.to}`);

		// Extract the recipient email from the 'to' field
		const recipient = message.to.toLowerCase();
		let targetEmail = emailRouting[recipient];

		// If no exact match, try catch-all routing (@domain.com)
		if (!targetEmail) {
			const domain = recipient.split('@')[1];
			if (domain) {
				targetEmail = emailRouting[`@${domain}`];
				if (targetEmail) {
					console.log(`Found catch-all rule @${domain} -> ${targetEmail}`);
				}
			}
		} else {
			console.log(`Found exact match: ${recipient} -> ${targetEmail}`);
		}

		// If still no match, try global default (@default)
		if (!targetEmail) {
			targetEmail = emailRouting['@default'];
			if (targetEmail) {
				console.log(`Using global default: @default -> ${targetEmail}`);
			}
		}

		// Check if we have a routing rule for this recipient
		if (!targetEmail) {
			console.error(`No routing rule found for recipient: ${recipient}`);
			await sendDiscordAlert(
				message,
				env,
				new Error(`No routing rule found for recipient: ${recipient}`),
				null,
				null, // No email content needed for routing rule errors
			);
			return;
		}

		try {
			// Extract email content for agent analysis
			let emailContent = null;
			let emailBody = null;
			let emailSubject = message.headers.get("subject") || "No Subject";
			
			try {
				const emailStream = await message.raw;
				emailContent = await new Response(emailStream).text();
				
				// Extract the email body, handling both simple and multipart MIME emails
				emailBody = extractPlainTextBody(emailContent);
			} catch (contentError) {
				console.error("Failed to extract email content:", contentError);
				// If we can't read the email, just forward it
				try {
					await message.forward(targetEmail);
					console.log(
						`Email from ${message.from} to ${recipient} forwarded to ${targetEmail} (no agent analysis due to content read error)`,
					);
				} catch (forwardError) {
					console.error("Failed to forward email:", forwardError);
					// Save email to R2 bucket as backup
					await saveEmailToR2(message, env, targetEmail, null);
					// Send Discord alert
					await sendDiscordAlert(message, env, forwardError, targetEmail, null);
				}
				return;
			}

			// Get or create agent instance
			const agentNamespace = env.RETAIL_EMAIL_AGENT;
			if (!agentNamespace) {
				console.warn("Agent namespace not configured, forwarding email without agent analysis");
				try {
					await message.forward(targetEmail);
					console.log(`Email forwarded to ${targetEmail} (no agent analysis)`);
				} catch (forwardError) {
					console.error("Failed to forward email:", forwardError);
					// Save email to R2 bucket as backup
					await saveEmailToR2(message, env, targetEmail, emailContent);
					// Send Discord alert
					await sendDiscordAlert(message, env, forwardError, targetEmail, emailContent);
				}
				return;
			}

			// Create a unique ID for this email thread (use customer email)
			// Using a consistent ID per customer allows the agent to maintain context
			const agentId = agentNamespace.idFromName(`email-${message.from}`);
			const agent = agentNamespace.get(agentId);
			agent.setName("retail-email");

			// Analyze email with agent by calling the method via fetch
			// Agents expose methods via HTTP endpoints
			console.log("Analyzing email with AI agent...");
			
			const analysisResponse = await agent.fetch(
				new Request("https://agent/internal/analyze", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						emailContent: emailBody,
						customerEmail: message.from,
						subject: emailSubject,
					}),
				}),
			);

			const analysis = await analysisResponse.json();

			if (analysis.canReply && analysis.replyContent) {
				console.log("Agent generated a reply, sending reply to customer...");
				
				// Send reply to customer via Mailgun with targetEmail CC'd to preserve the original chain
				try {
					await sendReplyToCustomer(
						env,
						message,
						analysis.replyContent,
						emailSubject,
						targetEmail, // CC targetEmail
						emailBody // Pass the already-extracted email body
					);
					console.log(`Reply sent successfully via Mailgun to customer (CC: ${targetEmail})`);
				} catch (replyError) {
					console.error("Failed to send reply via Mailgun:", replyError);
					// Try to forward the original message as fallback ONLY
					try {
						await message.forward(targetEmail);
						console.log("Forwarded original message as fallback after Mailgun reply failure");
					} catch (forwardError) {
						console.error("Failed to forward message as fallback:", forwardError);
						// Save email to R2 bucket as backup
						await saveEmailToR2(message, env, targetEmail, emailContent);
						// Send Discord alert
						await sendDiscordAlert(message, env, forwardError, targetEmail, emailContent);
					}
				}
				
				console.log(
					`Email from ${message.from} to ${recipient} processed by agent and reply sent (CC: ${targetEmail})`,
				);
			} else {
				console.log(`Agent determined email should be forwarded without reply: ${analysis.reason}`);
				
				// Forward the original message
				try {
					await message.forward(targetEmail);
					console.log(
						`Email from ${message.from} to ${recipient} forwarded to ${targetEmail} (no reply generated)`,
					);
				} catch (forwardError) {
					console.error("Failed to forward email:", forwardError);
					// Save email to R2 bucket as backup
					await saveEmailToR2(message, env, targetEmail, emailContent);
					// Send Discord alert
					await sendDiscordAlert(message, env, forwardError, targetEmail, emailContent);
				}
			}
		} catch (error) {
			console.error(
				`Failed to process email from ${message.from} to ${recipient}:`,
				error,
			);

			// Extract email content once to avoid ReadableStream disturbance
			let emailContent = null;
			try {
				const emailStream = await message.raw;
				emailContent = await new Response(emailStream).text();
			} catch (contentError) {
				console.error("Failed to extract email content:", contentError);
			}

			// Try to forward the original message as fallback
			try {
				await message.forward(targetEmail);
				console.log("Successfully forwarded email after agent error");
			} catch (forwardError) {
				console.error("Failed to forward email after agent error:", forwardError);
				
				// Save email to R2 bucket as backup
				await saveEmailToR2(message, env, targetEmail, emailContent);

				// Send Discord alert
				await sendDiscordAlert(message, env, error, targetEmail, emailContent);
			}
		}
	},

	async fetch(_request, _env, _ctx) {
		return new Response(HTML_CONTENT, {
			headers: {
				"Content-Type": "text/html; charset=UTF-8",
			},
		});
	},
};

/**
 * Extract plain text body from email content, handling both simple and multipart MIME emails
 */
function extractPlainTextBody(emailContent) {
	// Find the boundary between headers and body
	const headerBodySplit = emailContent.match(/(.*?)(?:\r?\n){2,}(.*)/s);
	if (!headerBodySplit) {
		return emailContent.trim();
	}
	
	const headers = headerBodySplit[1];
	const body = headerBodySplit[2];
	
	// Check if it's a multipart email by looking at headers
	const contentTypeMatch = headers.match(/Content-Type:\s*multipart\/[^;]+;\s*boundary="?([^"\r\n\s]+)"?/i);
	
	if (contentTypeMatch) {
		const boundary = contentTypeMatch[1].trim();
		// Escape special regex characters in boundary
		const escapedBoundary = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		
		// Split body by boundary markers (--boundary or --boundary--)
		const boundaryPattern = new RegExp(`--${escapedBoundary}(?:--)?`, 'g');
		const parts = body.split(boundaryPattern);
		
		// Look for text/plain part
		for (const part of parts) {
			// Skip empty parts
			if (!part.trim()) continue;
			
			// Check if this part is text/plain
			if (part.match(/Content-Type:\s*text\/plain/i)) {
				// Extract content after part headers (double newline or end of part)
				const partBodyMatch = part.match(/(?:.*?)(?:\r?\n){2,}(.*?)(?:\r?\n--|$)/s) || 
				                      part.match(/(?:.*?)(?:\r?\n){2,}(.*)/s);
				if (partBodyMatch) {
					const text = partBodyMatch[1].trim();
					// Remove trailing boundary markers if present
					const cleanedText = text.replace(/--\s*$/, '').trim();
					if (cleanedText) return cleanedText;
				}
			}
		}
		
		// If no text/plain found, try to extract from text/html and convert
		for (const part of parts) {
			if (!part.trim()) continue;
			
			if (part.match(/Content-Type:\s*text\/html/i)) {
				const partBodyMatch = part.match(/(?:.*?)(?:\r?\n){2,}(.*?)(?:\r?\n--|$)/s) || 
				                      part.match(/(?:.*?)(?:\r?\n){2,}(.*)/s);
				if (partBodyMatch) {
					// Basic HTML tag removal
					let text = partBodyMatch[1].trim();
					// Remove trailing boundary markers if present
					text = text.replace(/--\s*$/, '').trim();
					text = text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
					if (text) return text;
				}
			}
		}
		
		// If still nothing, try any text/* part
		for (const part of parts) {
			if (!part.trim()) continue;
			
			if (part.match(/Content-Type:\s*text\//i)) {
				const partBodyMatch = part.match(/(?:.*?)(?:\r?\n){2,}(.*?)(?:\r?\n--|$)/s) || 
				                      part.match(/(?:.*?)(?:\r?\n){2,}(.*)/s);
				if (partBodyMatch) {
					const text = partBodyMatch[1].trim();
					// Remove trailing boundary markers if present
					const cleanedText = text.replace(/--\s*$/, '').trim();
					if (cleanedText) return cleanedText;
				}
			}
		}
	}
	
	// For simple emails, return the body after headers
	return body.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
	const map = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#039;",
	};
	return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Format quoted plain text for email replies
 */
function formatQuotedPlain({ date, from, body }) {
	return `\n\nOn ${date}, ${from} wrote:\n\n${body.split("\n").map((line) => `> ${line}`).join("\n")}`;
}

/**
 * Format quoted HTML for email replies
 */
function formatQuotedHtml({ date, from, body }) {
	const escapedBody = escapeHtml(body).replaceAll("\n", "<br>");
	return `
    <div style="border-left: 3px solid #ccc; padding-left: 12px; margin-top: 20px; color: #666; font-size: 13px;">
      <div style="margin-bottom: 8px;">
        <strong>On ${escapeHtml(date)}, ${escapeHtml(from)} wrote:</strong>
      </div>
      <div style="white-space: pre-wrap;">${escapedBody}</div>
    </div>
  `.trim();
}

/**
 * Send reply email to customer using Mailgun
 * 
 * Sends a reply back to the customer with the agent's response via Mailgun.
 * The reply is properly formatted with In-Reply-To headers to maintain email threading.
 * CCs targetEmail to preserve the original chain.
 * Includes the original message in quoted format.
 * 
 * @param {Object} env - Environment variables (for Mailgun config)
 * @param {Object} originalMessage - Original email message
 * @param {string} replyContent - Agent-generated reply content
 * @param {string} originalSubject - Original email subject
 * @param {string} ccEmail - Email address to CC on the reply (targetEmail)
 * @param {string} originalBody - Original email body text (already extracted)
 */
async function sendReplyToCustomer(env, originalMessage, replyContent, originalSubject, ccEmail, originalBody) {
	const replyTo = originalMessage.from;
	const fromEmail = env.INTERNAL_FROM_EMAIL || originalMessage.to;

	const subject = originalSubject.toLowerCase().startsWith("re:")
		? originalSubject
		: `Re: ${originalSubject}`;

	const originalMessageId =
		originalMessage.headers.get("Message-ID") ||
		originalMessage.headers.get("message-id");

	const headers = {};
	if (originalMessageId) {
		headers["In-Reply-To"] = originalMessageId;
		headers["References"] = originalMessageId;
	}

	const originalDate =
		originalMessage.headers.get("Date") ||
		originalMessage.headers.get("date") ||
		new Date().toUTCString();

	// Use provided originalBody or fallback if not provided
	const bodyText = originalBody || "[Original message body unavailable in this reply context]";

	const quotedPlain = formatQuotedPlain({
		date: originalDate,
		from: replyTo,
		body: bodyText,
	});

	const htmlBody = `
    <div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.4;">
      <div>${escapeHtml(replyContent).replaceAll("\n", "<br>")}</div>
      ${formatQuotedHtml({ date: originalDate, from: replyTo, body: bodyText })}
    </div>
  `.trim();

	const textBody = `${replyContent}\n\n${quotedPlain}`;

	await sendWithMailgun(env, {
		to: replyTo,
		from: fromEmail,
		subject,
		text: textBody,
		html: htmlBody,
		headers,
		tag: env.MAILGUN_TAG,
		cc: ccEmail,
	});

	console.log(`Reply sent successfully via Mailgun to ${replyTo} (CC: ${ccEmail})`);
}

/**
 * Save email to R2 bucket as backup
 */
async function saveEmailToR2(message, env, targetEmail, emailContent) {
	try {
		const timestamp = new Date().toISOString();
		const filename = `email-backup-${timestamp}-${message.from.replace(/[^a-zA-Z0-9]/g, "_")}.eml`;

		// Convert email content to ArrayBuffer if provided, otherwise read from stream
		let emailBuffer;
		if (emailContent) {
			const encoder = new TextEncoder();
			emailBuffer = encoder.encode(emailContent).buffer;
		} else {
			// Fallback: read from stream if content not provided
			const emailStream = await message.raw;
			emailBuffer = await new Response(emailStream).arrayBuffer();
		}

		// Save to R2
		await env.EMAIL_STORAGE.put(filename, emailBuffer, {
			httpMetadata: {
				contentType: "message/rfc822",
			},
			customMetadata: {
				from: message.from,
				to: message.to,
				subject: message.headers.get("subject") || "No Subject",
				timestamp: timestamp,
				originalRecipient: message.to,
				targetEmail: targetEmail || "unknown",
			},
		});

		console.log(`Email saved to R2: ${filename}`);
	} catch (error) {
		console.error("Failed to save email to R2:", error);
	}
}

/**
 * Send Discord alert for failed email delivery
 */
async function sendDiscordAlert(message, env, error, targetEmail, emailContent) {
	try {
		const webhookUrl = env.DISCORD_WEBHOOK_URL;

		if (!webhookUrl) {
			console.error("DISCORD_WEBHOOK_URL not configured");
			return;
		}

		// Process email content for display
		let displayContent = "Unable to read email content";
		if (emailContent) {
			try {
				// Try to extract the body from the email content
				// Look for common email body patterns
				const bodyMatch = emailContent.match(/(?:\r?\n){2,}(.*)/s);
				if (bodyMatch) {
					displayContent = bodyMatch[1].trim();
					// Limit content to 1000 characters to avoid Discord field limits
					if (displayContent.length > 1000) {
						displayContent = displayContent.substring(0, 997) + "...";
					}
				} else {
					// If no body found, use a portion of the raw content
					displayContent = emailContent.length > 1000 
						? emailContent.substring(0, 997) + "..." 
						: emailContent;
				}
			} catch (contentError) {
				console.error("Failed to process email content:", contentError);
				displayContent = "Error processing email content";
			}
		}

		const embed = {
			title: "🚨 Email Delivery Failed",
			description: `Failed to forward email from **${message.from}** to **${targetEmail || "unknown target"}**`,
			color: 0xff0000, // Red color
			fields: [
				{
					name: "From",
					value: message.from,
					inline: true,
				},
				{
					name: "Original Recipient",
					value: message.to,
					inline: true,
				},
				{
					name: "Target Email",
					value: targetEmail || "No routing rule found",
					inline: true,
				},
				{
					name: "Subject",
					value: message.headers.get("subject") || "No Subject",
					inline: true,
				},
				{
					name: "Email Content",
					value: `\`\`\`${displayContent}\`\`\``,
					inline: false,
				},
				{
					name: "Error",
					value: `\`\`\`${error.message}\`\`\``,
					inline: false,
				},
				{
					name: "Timestamp",
					value: new Date().toISOString(),
					inline: true,
				},
				{
					name: "Status",
					value: targetEmail
						? "✅ Email saved to R2 backup"
						: "❌ No routing rule found",
					inline: true,
				},
			],
			timestamp: new Date().toISOString(),
		};

		const payload = {
			embeds: [embed],
		};

		const response = await fetch(webhookUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error(
				`Discord webhook failed: ${response.status} ${response.statusText}`,
			);
		}

		console.log("Discord alert sent successfully");
	} catch (error) {
		console.error("Failed to send Discord alert:", error);
	}
}
