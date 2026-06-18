import { WebClient } from '@slack/web-api';
import { replaceTimesWithDateTags } from '../../../lib/timezone';
import crypto from 'crypto';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

function verifySlackSignature(req, body) {
  const timestamp = req.headers.get('x-slack-request-timestamp');
  const signature = req.headers.get('x-slack-signature');
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!timestamp || !signature || !signingSecret) return false;

  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature));
}

async function handleEvent(event) {
  if (event.type === 'app_mention') {
    const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
    const userInfo = await slack.users.info({ user: event.user });
    const userTz = userInfo.user.tz || 'UTC';

    const message = replaceTimesWithDateTags(text, userTz);
    if (!message) return;

    await slack.chat.postMessage({
      channel: event.channel,
      text: message,
    });
  }
}

async function handleCommand(payload) {
  const text = payload.text.trim();

  if (!text) {
    await slack.chat.postEphemeral({
      channel: payload.channel_id,
      user: payload.user_id,
      text: "Usage: /mytimezone let's meet at 4pm tomorrow",
    });
    return;
  }

  const userInfo = await slack.users.info({ user: payload.user_id });
  const userTz = userInfo.user.tz || 'UTC';

  const message = replaceTimesWithDateTags(text, userTz);
  if (!message) {
    await slack.chat.postEphemeral({
      channel: payload.channel_id,
      user: payload.user_id,
      text: "Couldn't find a time in your message. Try: /mytimezone let's meet at 4pm tomorrow",
    });
    return;
  }

  await slack.chat.postMessage({
    channel: payload.channel_id,
    text: `<@${payload.user_id}>: ${message}`,
  });
}

export async function POST(request) {
  const body = await request.text();
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(body);
    const payload = Object.fromEntries(params);

    if (payload.command === '/mytimezone') {
      handleCommand(payload).catch(console.error);
      return new Response('', { status: 200 });
    }

    return new Response('Unknown command', { status: 400 });
  }

  const payload = JSON.parse(body);

  if (payload.type === 'url_verification') {
    return Response.json({ challenge: payload.challenge });
  }

  if (!verifySlackSignature(request, body)) {
    return new Response('Invalid signature', { status: 401 });
  }

  if (payload.type === 'event_callback') {
    handleEvent(payload.event).catch(console.error);
    return new Response('', { status: 200 });
  }

  return new Response('OK', { status: 200 });
}

export async function GET() {
  return Response.json({ status: 'ok', app: '@MyTimeZone bot' });
}
