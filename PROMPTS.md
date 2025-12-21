# Cursor Spec: Migrate Email Worker from `message.forward(targetEmail)` to Mailgun “Internal Transcript” Delivery

**Owner:** (you)  
**Date:** 2025-12-18  
**Repo Area:** Cloudflare Email Worker + Durable Object agent  
**Primary Files:** `index.js`, (shared) Mailgun helper

---

## Objective

Replace the current internal delivery mechanism (`message.forward(targetEmail)`) with an outbound Mailgun email that contains the **full support “chain”**:

1. **Agent-generated reply** (what the customer receives), and  
2. **Original customer email** (extracted body + key metadata, optionally raw headers).

This ensures the internal recipient (`targetEmail`) sees what the agent sent, without relying on forwarding an inbound message that cannot include the agent reply.

---

## Key Requirements

### Functional
- When an inbound email is processed and the agent returns `canReply: true` with `replyContent`:
  - Send reply to customer (existing behavior) **unchanged**.
  - Send an **internal transcript email** via Mailgun to `targetEmail` that includes:
    - customer address, original recipient, subject
    - agent reply text
    - original email body (extracted)
    - optional: message-id, date, and any parsing notes
  - Add Gmail-compatible threading headers on the internal transcript when possible:
    - `In-Reply-To` = inbound `Message-ID`
    - `References` = inbound `Message-ID`
- When `canReply: false`:
  - Send an internal transcript via Mailgun that includes:
    - why it was not answered (`analysis.reason`)
    - original email body (extracted)
  - (Optional policy decision, recommended): do **not** send anything to customer.
- If Mailgun fails:
  - Fail safe:
    - store transcript in R2 (or existing R2 save path)
    - notify Discord webhook
  - During migration rollout: **fallback to `message.forward(targetEmail)`** (feature-flagged) to prevent dropping internal visibility.

### Non-Functional
- No change to routing logic (recipient → targetEmail) in `index.js`.
- No change to agent analysis endpoint contract (`/internal/analyze`) aside from optional new fields.
- Maintain current fail-safe behavior (R2 backup + Discord alert) on errors.
- All new logic must be idempotent per inbound message (avoid duplicate internal sends on retries where possible).

---

## Non-Goals
- Full fidelity forwarding of attachments to internal recipients (unless already needed).
- Replacing the customer reply mechanism (`message.reply`) with Mailgun.
- Building a full ticketing system or storing full conversation state in R2/DB (beyond minimal safeguards).

---

## Proposed Design

### Delivery Model

- **Customer delivery:** Keep `sendReplyToCustomer(originalMessage, replyContent, originalSubject)` using Cloudflare Email Worker reply.
- **Internal delivery:** Replace `message.forward(targetEmail)` with a Mailgun outbound “transcript email” to `targetEmail`.

### Threading

For Gmail threading in the internal mailbox:
- Set custom headers on the Mailgun internal transcript:
  - `h:In-Reply-To: <inbound Message-ID>`
  - `h:References: <inbound Message-ID>`
- Use a normalized subject:
  - `"[AI Reply Sent] Re: <Original Subject>"` (or `"[AI Needs Human] <Original Subject>"`)

> Note: Gmail threading is heuristic; attaching `.eml` does not reliably thread. The headers above are the best available approach.

---

## Environment Variables

Add (or reuse) these bindings:
- `MAILGUN_DOMAIN` (e.g., `mg.example.com`)
- `MAILGUN_API_KEY`
- `INTERNAL_FROM_EMAIL` (e.g., `support@example.com`)
- **Feature flags** (recommended):
  - `INTERNAL_DELIVERY_MODE` = `"mailgun"` | `"forward"` | `"both"`
    - `"mailgun"`: only Mailgun internal transcript
    - `"forward"`: legacy behavior
    - `"both"`: send Mailgun transcript + forward as a safety net during rollout
  - `MAILGUN_TAG` (optional) to tag messages, e.g., `"ai-support"`

---

## Implementation Tasks

### Task 1 — Add Mailgun helper (shared utility)

Create `mailgun.ts` (or `mailgun.js`) with a helper consistent with your existing function, plus support for custom headers.

**Acceptance Criteria**
- Can send basic outbound messages with `text` and/or `html`.
- Can attach custom headers via `h:<Header-Name>` form fields.

**Implementation (reference)**

```ts
export async function sendWithMailgun(env, {
  to, from, subject, html, text, headers
}) {
  const url = `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;

  const params = new URLSearchParams();
  params.set("from", from);
  params.set("to", to);
  params.set("subject", subject);
  if (html) params.set("html", html);
  if (text) params.set("text", text);

  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      params.set(`h:${k}`, v);
    }
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa("api:" + env.MAILGUN_API_KEY),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Mailgun failed: ${res.status} ${errorText}`);
  }
}
```

---

### Task 2 — Build internal transcript content

Add a function in `index.js` (or `transcript.ts`) to build `subject`, `text`, and `html` for internal delivery.

**Inputs**
- `customerEmail` (message.from)
- `originalRecipient` (message.to)
- `originalSubject`
- `emailBody` (extracted)
- `analysis`: `{ canReply, replyContent, reason }`

**Outputs**
- `{ subject, text, html }`

**Guidelines**
- Keep transcript concise, readable, and copy/pasteable.
- Always include the agent reply if present.
- Always include the extracted original body.
- Include `analysis.reason` when `canReply === false`.

---

### Task 3 — Replace `message.forward(targetEmail)` with Mailgun internal send

In `index.js`, identify the two branches:

1) **Agent replied** (`analysis.canReply && analysis.replyContent`)
2) **Agent did not reply** (`else` branch)

For each branch:
- Send internal transcript via Mailgun to `targetEmail`.
- Apply threading headers if inbound `Message-ID` exists.

**Threading header extraction**
```js
const originalMessageId =
  message.headers.get("Message-ID") || message.headers.get("message-id");
```

**Headers**
```js
const headers = {};
if (originalMessageId) {
  headers["In-Reply-To"] = originalMessageId;
  headers["References"] = originalMessageId;
}
```

**Feature-flagged delivery**
- If `INTERNAL_DELIVERY_MODE === "forward"`: use existing forward
- If `"mailgun"`: only send Mailgun transcript
- If `"both"`: do both (Mailgun transcript first; forward second)

---

### Task 4 — Update error handling and fail-safes

When Mailgun internal send fails:
- Log error
- Save transcript to R2 (new object key prefix `transcript-...`)
- Alert Discord webhook (include reason and first ~1,000 chars)

**Important**
- Do not block customer reply if internal send fails.
- Do not throw and skip the rest of the handler; treat as recoverable.


---

## Test Plan

### Local / Staging
- Unit test transcript builder:
  - canReply=true with replyContent
  - canReply=false with reason
  - missing emailBody
- Integration test (staging):
  - Send test inbound email → confirm:
    - customer receives reply (existing)
    - targetEmail receives internal transcript (Mailgun)
    - subject formatting correct
    - `In-Reply-To` / `References` present when Message-ID exists
- Failure mode tests:
  - invalid Mailgun API key → internal transcript fails:
    - customer reply still sent
    - transcript saved to R2
    - Discord alert fires

### Gmail Threading Verification
- Ensure `targetEmail` inbox (Gmail) receives:
  - original inbound (only if `INTERNAL_DELIVERY_MODE` includes forward or if you separately deliver original)
  - internal transcript with `In-Reply-To` and `References`
- Verify Gmail groups them in same conversation.
  - If not threaded, confirm inbound `Message-ID` existed and headers were properly set.

---

## Rollout Plan

1) Deploy with `INTERNAL_DELIVERY_MODE="both"` for 48–72 hours.
2) Monitor:
   - Mailgun success rate
   - Discord alerts volume
   - R2 transcript backups volume
3) Switch to `INTERNAL_DELIVERY_MODE="mailgun"` once stable.

Rollback is instant by setting `INTERNAL_DELIVERY_MODE="forward"`.

---

## Acceptance Criteria

- Internal recipients reliably receive an email containing:
  - agent reply + original customer email body
- Customer reply behavior unchanged.
- No increase in dropped emails; failures are saved to R2 and alerted to Discord.
- Feature flag allows safe rollback.

---

## Notes / Edge Cases

- If inbound email has **no** `Message-ID`, threading may degrade; transcript still sent.
- If the original inbound email contains attachments, transcript will not include them unless explicitly implemented later.
- Email body parsing via regex is best-effort; if parsing fails, include the raw text excerpt.

---

# AI Agent System Prompt

The following system prompt is used in `src/agent.js` to instruct the GPT-4o model on how to analyze customer emails and generate replies.

## System Prompt Template

```
You are a customer service AI agent for a retail business.

Your task is to analyze incoming customer emails and decide whether you can fully and correctly answer or schedule a consultation for the customer using the available tools.

Available tools:
Product Catalog:
- getProductInfo: detailed info for a specific product
- searchProducts: search products by keyword
- getPricing: pricing for a specific product
- getAllProducts: list all products

Calendar/Scheduling (if MCP server is connected):
- getAvailability: check available time slots for scheduling consultations
- createConsultation: create a new consultation/meeting in the calendar
- rescheduleConsultation: reschedule an existing consultation
- cancelConsultation: cancel a scheduled consultation

Rules:
1. You may answer questions that can be resolved using:
   - Product catalog data (products, pricing, availability, categories, comparisons)
   - Calendar/scheduling tools (checking availability, creating/rescheduling/canceling consultations)
2. If the email asks about anything outside these capabilities — including but not limited to:
   - order status
   - shipping
   - returns or refunds
   - complaints
   - account issues
   - support issues (unless they involve scheduling)
   you MUST NOT answer and must indicate the email should be forwarded to a human.
3. If you need product information to answer, call the appropriate tools first.
4. If the customer wants to schedule, reschedule, or cancel a consultation, use the calendar tools.
5. When scheduling, first check availability using getAvailability, then create the consultation.
6. Be friendly, professional, and concise in replies.
7. Do NOT guess or hallucinate information.
8. Do NOT mention internal tools, policies, or that you are an AI.

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
- Customer Email: {customerEmail}
- Subject: {subject}

Email Content:
{emailContent}
```

## Implementation Details

- **Model**: OpenAI GPT-4o (`gpt-4o-2024-11-20`)
- **Framework**: Vercel AI SDK's `generateText` function
- **Structured Output**: Zod schema ensures reliable JSON responses
- **Tool Calling**: LLM can directly call tools during the generation process
- **Step Limiting**: Maximum 5 steps (tool calls + final response) to control costs
- **Temperature**: 0.0 for deterministic, consistent responses

## Prompt Engineering Notes

1. **Clear Boundaries**: The prompt explicitly defines what the agent can and cannot handle
2. **Structured Output**: JSON format with Zod validation ensures reliable parsing
3. **Tool Integration**: Dynamic tool list based on MCP server connection status
4. **Context Preservation**: Includes customer email and subject for context-aware replies
5. **Safety**: Explicit instructions to not hallucinate or mention internal systems
