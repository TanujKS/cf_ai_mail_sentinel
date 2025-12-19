/**
 * Mailgun helper for sending outbound emails
 * 
 * Supports sending emails with custom headers for threading and other purposes.
 */

/**
 * Send an email via Mailgun API
 * 
 * @param {Object} env - Environment variables containing MAILGUN_DOMAIN and MAILGUN_API_KEY
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.from - Sender email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.html] - HTML content (optional)
 * @param {string} [options.text] - Plain text content (optional)
 * @param {Object} [options.headers] - Custom headers to set (will be prefixed with 'h:')
 * @param {string} [options.tag] - Optional tag for Mailgun tracking
 * @param {string} [options.cc] - Optional CC recipient email address
 * @returns {Promise<void>}
 */
export async function sendWithMailgun(env, {
	to,
	from,
	subject,
	html,
	text,
	headers,
	tag,
	cc,
}) {
	const domain = env.MAILGUN_DOMAIN;
	const apiKey = env.MAILGUN_API_KEY;

	if (!domain || !apiKey) {
		throw new Error("MAILGUN_DOMAIN and MAILGUN_API_KEY must be configured");
	}

	const url = `https://api.mailgun.net/v3/${domain}/messages`;

	const params = new URLSearchParams();
	params.set("from", from);
	params.set("to", to);
	params.set("subject", subject);
	
	if (html) {
		params.set("html", html);
	}
	if (text) {
		params.set("text", text);
	}

	// Add CC if provided
	if (cc) {
		params.set("cc", cc);
	}

	// Add custom headers (Mailgun requires 'h:' prefix)
	if (headers) {
		for (const [k, v] of Object.entries(headers)) {
			params.set(`h:${k}`, v);
		}
	}

	// Add optional tag
	if (tag) {
		params.set("o:tag", tag);
	}

	const response = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: "Basic " + btoa("api:" + apiKey),
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params,
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Mailgun failed: ${response.status} ${errorText}`);
	}

	return response.json();
}

