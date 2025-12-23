# cf_ai_mail_sentinel

An AI-powered email processing system built on Cloudflare's edge computing platform. This application uses Cloudflare AI agents with Durable Objects to analyze customer emails, generate intelligent replies, and integrate with external services like Google Calendar via MCP (Model Context Protocol).

## Project Origin

This project was built on top of [FailSafeMail](https://github.com/TanujKS/FailSafeMail), a production email worker that I use for my freelance projects. FailSafeMail provides the foundational email routing, forwarding, R2 backup, and Discord alerting infrastructure. 

**cf_ai_mail_sentinel** extends FailSafeMail by adding:
- AI-powered email analysis and automated reply generation
- Integration with Cloudflare's Agent framework and Durable Objects
- Google Calendar MCP server integration for scheduling consultations
- Product catalog tools for intelligent customer support
- Stateful conversation context across email threads

The core email processing, routing, error handling, and failover mechanisms from FailSafeMail remain intact, ensuring reliability while adding intelligent automation capabilities.

## Architecture & Technology Stack

This application demonstrates a complete AI-powered system using Cloudflare's platform:

### Core Components

1. **LLM (Large Language Model)**
   - Uses OpenAI GPT-4o via `@ai-sdk/openai` for email analysis and reply generation
   - Structured output with Zod schemas for reliable JSON responses
   - Tool calling for product catalog lookups and calendar operations

2. **Workflow & Coordination**
   - **Cloudflare Workers**: Main email processing worker handles incoming emails
   - **Durable Objects**: `RetailEmailAgent` class provides stateful, per-customer conversation context
   - **Agent Framework**: Uses Cloudflare's `agents` package for MCP server integration and tool orchestration

3. **User Input**
   - **Cloudflare Email Routing**: Receives incoming emails and routes them to the worker
   - Email-based interface (no traditional chat UI, but emails serve as the input mechanism)

4. **Memory & State**
   - **Durable Objects**: Maintains conversation context per customer email address
   - Each customer gets a unique Durable Object instance (`email-{customer-email}`)
   - State persists across email threads for context-aware replies

### Additional Cloudflare Services

- **Cloudflare R2 Storage**: Automatic backup of failed emails with full metadata
- **Cloudflare AI**: AI binding available for future Workers AI integration
- **Cloudflare Pages**: Serves the public-facing HTML interface

### External Integrations

- **Mailgun**: Sends outbound emails (replies to customers)
- **Google Calendar MCP Server**: Separate Cloudflare Worker providing calendar tools via MCP protocol
  - Repository: [google-calendar-mcp](https://github.com/TanujKS/google-calendar-mcp)
  - Provides tools: `getAvailability`, `createConsultation`, `rescheduleConsultation`, `cancelConsultation`
- **Discord Webhooks**: Real-time alerts for delivery failures

## Features

- ✅ AI-powered email analysis using GPT-4o with structured output
- ✅ Intelligent reply generation with product catalog integration
- ✅ Google Calendar integration via MCP server for scheduling consultations
- ✅ Stateful conversation context using Durable Objects
- ✅ Smart email routing based on recipient patterns
- ✅ Automatic backup to R2 bucket when delivery fails
- ✅ Discord webhook alerts for failed deliveries
- ✅ Email threading with proper In-Reply-To headers
- ✅ Comprehensive error handling and logging

## How It Works

### Email Processing Flow

1. **Email Reception**: Cloudflare Email Routing receives incoming emails and routes them to the Cloudflare Worker
2. **Agent Analysis**: The AI agent (powered by GPT-4o) analyzes the email content:
   - Extracts email body and metadata
   - Determines if an automated reply is appropriate
   - Uses product catalog tools to look up information if needed
   - Uses Google Calendar MCP tools for scheduling requests
3. **Reply Generation**: If appropriate, the agent generates a helpful reply using structured output
4. **Email Delivery**: 
   - Sends reply to customer via Mailgun (with proper threading headers)
   - Forwards original email chain to configured target address
5. **Error Handling**: If any step fails:
   - Email is saved to R2 bucket with full metadata
   - Discord alert is sent with error details

### Agent Architecture

The `RetailEmailAgent` class extends Cloudflare's `Agent` base class and provides:

- **Stateful Context**: Each customer email address gets a unique Durable Object instance
- **Tool Integration**: 
  - Product catalog tools (local functions)
  - Google Calendar tools (via MCP server)
- **MCP Server Connection**: Automatically connects to Google Calendar MCP server via SSE endpoint
- **Structured Output**: Uses Zod schemas to ensure reliable JSON responses from the LLM

### Tool System

The agent has access to two types of tools:

1. **Product Catalog Tools** (defined in `src/tools.js`):
   - `getProductInfo`: Get detailed information about a specific product
   - `searchProducts`: Search products by keyword
   - `getPricing`: Get pricing for a specific product
   - `getAllProducts`: List all available products

2. **Google Calendar Tools** (via MCP server):
   - `getAvailability`: Check available time slots for scheduling
   - `createConsultation`: Create a new calendar event
   - `rescheduleConsultation`: Update an existing event's time
   - `cancelConsultation`: Delete a calendar event

## Setup & Running Instructions

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account with Workers, R2, and Email Routing enabled
- Wrangler CLI: `npm install -g wrangler`
- OpenAI API key (for GPT-4o)
- Mailgun account and API credentials
- Discord webhook URL (optional but recommended)
- Google Calendar MCP server deployed (optional, for calendar features)
  - See: [google-calendar-mcp](https://github.com/TanujKS/google-calendar-mcp)

### Installation

```bash
# Clone the repository
git clone https://github.com/TanujKS/cf_ai_mail_sentinel.git
cd cf_ai_mail_sentinel

# Install dependencies
npm install
```

### Configuration

1. **Create R2 Bucket**:
```bash
wrangler r2 bucket create fail-safe-mail-storage
```

2. **Configure Email Routing** in `wrangler.jsonc`:
```json
"vars": {
  "EMAIL_ROUTING": {
    "user1@yourdomain.com": "user1@personal.com",
    "@yourdomain.com": "catchall@personal.com",
    "@default": "fallback@personal.com"
  }
}
```

3. **Set Secrets**:
```bash
# OpenAI API key (required for GPT-4o)
wrangler secret put OPENAI_API_KEY

# Mailgun credentials
wrangler secret put MAILGUN_API_KEY
wrangler secret put MAILGUN_DOMAIN

# Discord webhook (optional)
wrangler secret put DISCORD_WEBHOOK_URL

# Google Calendar MCP server URL (optional)
wrangler secret put MCP_SERVER_URL
```

4. **Configure Environment Variables** in `wrangler.jsonc`:
```json
"vars": {
  "INTERNAL_FROM_EMAIL": "agent@yourdomain.com",
  "MAILGUN_TAG": "ai-support"
}
```

### Local Development

```bash
# Start local development server
npm run dev
```

The worker will be available at `http://localhost:8787`. For local development, create a `.dev.vars` file:

```bash
OPENAI_API_KEY=your-openai-key
MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=your-mailgun-domain
INTERNAL_FROM_EMAIL=agent@yourdomain.com
MCP_SERVER_URL=https://your-mcp-server.workers.dev
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Deploy to Cloudflare

```bash
npm run deploy
```

### Configure Email Routing

1. Go to Cloudflare Dashboard → Email Routing
2. Add your domain
3. Configure the worker to handle incoming emails
4. Set up email forwarding rules

## Key Implementation Details

### AI Agent Implementation

The agent uses the Vercel AI SDK's `generateText` function with:
- **Model**: OpenAI GPT-4o (`gpt-4o-2024-11-20`)
- **Structured Output**: Zod schema ensures reliable JSON responses
- **Tool Calling**: LLM can directly call tools for product lookups and calendar operations
- **Step Limiting**: Maximum 5 steps (tool calls + final response) to control costs

### Durable Objects for State

Each customer email address gets a unique Durable Object:
- **ID Format**: `email-{customer-email-address}`
- **Purpose**: Maintains conversation context across email threads
- **State**: Stored in Durable Object's SQLite database
- **Isolation**: Each customer's context is completely isolated

### MCP Server Integration

The agent connects to a separate Google Calendar MCP server:
- **Transport**: Server-Sent Events (SSE) endpoint
- **Connection**: Automatic connection management with cleanup of stale connections
- **Tools**: Dynamically discovered and made available to the LLM
- **Repository**: [google-calendar-mcp](https://github.com/TanujKS/google-calendar-mcp)

### Email Threading

Proper email threading is maintained using:
- `In-Reply-To` header: References the original message ID
- `References` header: Maintains thread history
- Quoted message formatting: Includes original email in replies

## Project Structure

```
cf_ai_mail_sentinel/
├── src/
│   ├── index.js          # Main worker entry point, email handler
│   ├── agent.js          # RetailEmailAgent Durable Object class
│   ├── tools.js          # Product catalog tools
│   └── mailgun.js        # Mailgun email sending utility
├── public/
│   └── index.html        # Public-facing landing page
├── test/
│   ├── index.spec.js     # Test suite
│   └── sample.eml        # Sample email for testing
├── wrangler.jsonc        # Cloudflare Workers configuration
├── package.json          # Dependencies and scripts
├── PROMPTS.md            # AI prompts used in development
└── README.md             # This file
```

## Related Projects

- **FailSafeMail**: [github.com/TanujKS/FailSafeMail](https://github.com/TanujKS/FailSafeMail)
  - The base email worker that this project extends
  - Production-ready email routing, forwarding, R2 backup, and Discord alerting
  - Used in production for freelance projects

- **Google Calendar MCP Server**: [github.com/TanujKS/google-calendar-mcp](https://github.com/TanujKS/google-calendar-mcp)
  - Separate Cloudflare Worker providing calendar integration via MCP protocol
  - Required for calendar scheduling features

## Monitoring & Debugging

- **Cloudflare Workers Logs**: View real-time logs in Cloudflare Dashboard
- **Wrangler Tail**: `wrangler tail` for live log streaming
- **R2 Storage**: Check `fail-safe-mail-storage` bucket for failed email backups
- **Discord Alerts**: Real-time notifications for delivery failures

## License

This project is part of a Cloudflare internship application assignment.

## Troubleshooting

### Common Issues

1. **Emails not being processed**
   - Verify Cloudflare Email Routing is configured correctly
   - Check worker is deployed and active
   - Review worker logs in Cloudflare Dashboard

2. **AI agent not responding**
   - Verify `OPENAI_API_KEY` secret is set correctly
   - Check Durable Object bindings in `wrangler.jsonc`
   - Review agent logs for errors

3. **Calendar tools not available**
   - Verify `MCP_SERVER_URL` is set to your MCP server base URL
   - Check that Google Calendar MCP server is deployed: [google-calendar-mcp](https://github.com/TanujKS/google-calendar-mcp)
   - Ensure MCP server's `/sse` endpoint is accessible
   - Review agent logs for MCP connection errors

4. **R2 backup not working**
   - Verify R2 bucket exists: `wrangler r2 bucket list`
   - Check bucket binding in `wrangler.jsonc`
   - Review worker logs for R2 errors

5. **Discord alerts not sending**
   - Verify `DISCORD_WEBHOOK_URL` secret is set
   - Check Discord webhook URL is valid
   - Review worker logs for fetch errors

### Debug Commands

```bash
# View live logs
wrangler tail

# List R2 buckets
wrangler r2 bucket list

# Check deployed worker
wrangler deployments list
```
