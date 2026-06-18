if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const { App, ExpressReceiver } = require('@slack/bolt');
const chrono = require('chrono-node');
const moment = require('moment-timezone');

// Custom chrono instance that prefers future dates for weekday references
const customChrono = chrono.casual.clone();
customChrono.refiners.push({
  refine: (context, results) => {
    const now = new Date();
    results.forEach(result => {
      if (result.start.date() < now) {
        const day = result.start.get('weekday');
        if (day !== undefined) {
          result.start.imply('day', result.start.get('day') + 7);
        }
      }
    });
    return results;
  },
});

// Slack receiver setup
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: '/',
});

// Handle Slack URL verification challenge before signature check
receiver.app.use(express.json());
receiver.app.post('/', (req, res, next) => {
  if (req.body && req.body.type === 'url_verification') {
    return res.status(200).type('text/plain').send(req.body.challenge);
  }
  next();
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

/**
 * Parses time strings from text and replaces them with Slack's <!date^> tags.
 * Each viewer sees the time rendered in their own device timezone.
 */
function replaceTimesWithDateTags(text, userTz) {
  const parsed = customChrono.parse(
    text,
    { instant: new Date(), timezone: moment.tz(userTz).utcOffset() },
    { forwardDate: true }
  );

  if (parsed.length === 0) return null;

  let message = text;
  // Replace from end to preserve indices
  for (let i = parsed.length - 1; i >= 0; i--) {
    const result = parsed[i];
    const refDate = moment.tz(result.start.date(), userTz);
    const unix = refDate.unix();
    const dateTag = `<!date^${unix}^{date_short_pretty} at {time}|${refDate.format('h:mm A')}>`;
    message = message.slice(0, result.index) + dateTag + message.slice(result.index + result.text.length);
  }

  return message;
}

// Slash command: /mytimezone let's meet at 4pm tomorrow
app.command('/mytimezone', async ({ command, ack, client }) => {
  await ack();

  const text = command.text.trim();
  if (!text) {
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: "Usage: /mytimezone let's meet at 4pm tomorrow",
    });
    return;
  }

  const userInfo = await client.users.info({ user: command.user_id });
  const userTz = userInfo.user.tz || 'UTC';

  const message = replaceTimesWithDateTags(text, userTz);
  if (!message) {
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: "Couldn't find a time in your message. Try: /mytimezone let's meet at 4pm tomorrow",
    });
    return;
  }

  await client.chat.postMessage({
    channel: command.channel_id,
    text: `<@${command.user_id}>: ${message}`,
  });
});

// @mention: @MyTimeZone let's meet at 6pm
app.event('app_mention', async ({ event, client }) => {
  try {
    const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();

    const userInfo = await client.users.info({ user: event.user });
    const userTz = userInfo.user.tz || 'UTC';

    const message = replaceTimesWithDateTags(text, userTz);
    if (!message) return;

    await client.chat.postMessage({
      channel: event.channel,
      text: message,
    });
  } catch (error) {
    console.error('Error handling app_mention:', error);
  }
});

// For local development: start the server
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3000;
  (async () => {
    await app.start(port);
    console.log(`⚡ @MyTimeZone bot running on port ${port}`);
  })();
}

// Export for Vercel serverless
module.exports = receiver.app;
