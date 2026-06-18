import * as chrono from 'chrono-node';
import moment from 'moment-timezone';

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

export function replaceTimesWithDateTags(text, userTz) {
  const parsed = customChrono.parse(
    text,
    { instant: new Date(), timezone: moment.tz(userTz).utcOffset() },
    { forwardDate: true }
  );

  if (parsed.length === 0) return null;

  let message = text;
  for (let i = parsed.length - 1; i >= 0; i--) {
    const result = parsed[i];
    const refDate = moment.tz(result.start.date(), userTz);
    const unix = refDate.unix();
    const dateTag = `<!date^${unix}^{date_short_pretty} at {time}|${refDate.format('h:mm A')}>`;
    message = message.slice(0, result.index) + dateTag + message.slice(result.index + result.text.length);
  }

  return message;
}
