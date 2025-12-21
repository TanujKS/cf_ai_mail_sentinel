# Google Calendar Tools Setup

This document explains how to configure the Google Calendar MCP tools in the FailSafeMail agent.

## Overview

The agent now includes 4 Google Calendar tools:
1. **getAvailability** - Check available time slots for scheduling
2. **createConsultation** - Create a new consultation/meeting
3. **rescheduleConsultation** - Reschedule an existing consultation
4. **cancelConsultation** - Cancel a scheduled consultation

These tools connect to your Google Calendar MCP Server to manage calendar events.

## Prerequisites

1. **Deployed Google Calendar MCP Server** - Your MCP server should be deployed and accessible
2. **OAuth Completed** - The MCP server should have completed OAuth setup (tokens stored)
3. **MCP Server URL** - The base URL of your deployed MCP server (e.g., `https://my-mcp-server.tanujsiripurapu.workers.dev`)

## Configuration

### Option 1: Environment Variables (Development)

Add to your `.dev.vars` file:

```bash
MCP_SERVER_URL=https://my-mcp-server.tanujsiripurapu.workers.dev
```

### Option 2: Wrangler Secrets (Production)

For production, use Wrangler secrets (recommended for security):

```bash
wrangler secret put MCP_SERVER_URL
# Enter: https://my-mcp-server.tanujsiripurapu.workers.dev
```

### Option 3: Wrangler Config (Not Recommended for Secrets)

You can also add it directly to `wrangler.jsonc` in the `vars` section, but this is not recommended for production:

```jsonc
"vars": {
  "MCP_SERVER_URL": "https://my-mcp-server.tanujsiripurapu.workers.dev"
}
```

## How It Works

1. The agent checks for `MCP_SERVER_URL` in the environment
2. If present, it connects to the MCP server using the Agent's built-in MCP client via the SSE endpoint
3. Once connected, it retrieves the calendar tools directly from the MCP server using `getAITools()`
4. The tools are automatically made available to the LLM when customers ask about scheduling

## Tool Usage Examples

### Customer Email: "I'd like to schedule a consultation"

The agent can:
1. Use `getAvailability` to check available slots
2. Use `createConsultation` to book the appointment
3. Reply to the customer with the scheduled time

### Customer Email: "Can I reschedule my appointment?"

The agent can:
1. Use `rescheduleConsultation` to change the appointment time
2. Reply with the new scheduled time

### Customer Email: "I need to cancel my appointment"

The agent can:
1. Use `cancelConsultation` to remove the appointment
2. Confirm cancellation with the customer

## Troubleshooting

### Tools Not Available

If calendar tools are not showing up:
- Check that `MCP_SERVER_URL` is set in your environment
- Verify the MCP server is deployed and accessible
- Check that the MCP server's `/sse` endpoint is working (this is what the agent connects to)
- Check the agent logs for initialization errors
- Ensure OAuth is completed on the MCP server (tokens stored in the MCP server's Durable Object)

### Connection Errors

If you see connection errors:
- Verify the MCP server is accessible at the URL specified in `MCP_SERVER_URL`
- Check that the MCP server's `/sse` endpoint is responding
- Ensure OAuth is completed on the MCP server (the agent uses the MCP server's stored OAuth tokens)

### OAuth Not Completed

If the MCP server hasn't completed OAuth:
1. Call `/oauth/start` with your admin bearer token
2. Complete the Google OAuth flow
3. Verify tokens are stored by checking the callback response

## Testing

You can test the calendar tools by sending an email to your agent that mentions scheduling, such as:

> "Hi, I'd like to schedule a consultation for next week. What times are available?"

The agent should use the `getAvailability` tool and respond with available time slots.

