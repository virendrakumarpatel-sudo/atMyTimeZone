# @MyTimeZone Slack Bot

A Slack bot that automatically converts times in your messages so every viewer sees the time in their own timezone.

## How It Works

When you type:
```
/mytimezone let's meet at 4pm tomorrow
```

The bot posts a message where each person sees the time in **their own timezone**:
- Amsterdam viewer sees: "let's meet at tomorrow at 4:00 PM"
- India viewer sees: "let's meet at tomorrow at 7:30 PM"

Uses Slack's `<!date^>` formatting which renders per-viewer based on their device timezone.

## Features

- **Slash command** (`/mytimezone`) — posts a message with auto-converting times
- **@mention** (`@MyTimeZone`) — reply with converted times
- **Multiple times** — handles "call at 2pm and again at 5pm"
- **Natural language** — "tomorrow", "this Friday", "Monday at 10am", "in 30 minutes"
- **Future-biased** — "Sunday" means next Sunday, not last Sunday
- **Message preserved** — only time strings are replaced, rest stays intact

## Setup

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Name it `MyTimeZone`, pick your workspace

### 2. Configure Bot Permissions

Go to **OAuth & Permissions** → Add these Bot Token Scopes:
- `app_mentions:read`
- `chat:write`
- `commands`
- `users:read`

### 3. Create Slash Command

Go to **Slash Commands** → **Create New Command**:
- Command: `/mytimezone`
- Request URL: `https://YOUR-URL/`
- Description: Post a time that shows in everyone's timezone
- Usage Hint: `let's meet at 4pm tomorrow`

### 4. Enable Events

Go to **Event Subscriptions** → Enable → Request URL: `https://YOUR-URL/`

Subscribe to bot events:
- `app_mention`

### 5. Install to Workspace

Go to **Install App** → Install. Copy the **Bot User OAuth Token**.

Also copy the **Signing Secret** from **Basic Information**.

### 6. Run Locally

```bash
cp .env.example .env
# Fill in SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET

npm install
npm start
```

### 7. Expose with ngrok (for local dev)

```bash
ngrok http 3000
```

Use the ngrok HTTPS URL as your Request URL in Slack app settings.

## Usage

```
/mytimezone let's meet at 4pm tomorrow
/mytimezone retro at 11am and then lunch at 12:30pm
/mytimezone pizza party on Friday at 6pm, don't miss it!
/mytimezone sprint planning Monday at 10am, bring your coffee
```

Or mention the bot in any channel:
```
@MyTimeZone standup at 9:30am tomorrow
```

## Testing

```bash
npm test
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SLACK_BOT_TOKEN` | Bot User OAuth Token (starts with `xoxb-`) |
| `SLACK_SIGNING_SECRET` | From Slack app Basic Information page |
| `PORT` | Server port (default: 3000) |
