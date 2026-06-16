const chrono = require('chrono-node');
const moment = require('moment-timezone');

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

function runTests(userTz, label) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${label} (${userTz})`);
  console.log(`${'='.repeat(60)}\n`);

  const testCases = [
    {
      input: "hey team, let's do a quick sync at 3pm",
      amsterdamSees: "hey team, let's do a quick sync today at 3:00 PM",
      indiaSees: "hey team, let's do a quick sync today at 6:30 PM",
      description: "single time replacement"
    },
    {
      input: "can we push the standup to 10:30am tomorrow?",
      amsterdamSees: "can we push the standup to tomorrow at 10:30 AM?",
      indiaSees: "can we push the standup to tomorrow at 2:00 PM?",
      description: "time with tomorrow"
    },
    {
      input: "pizza party on Friday at 6pm, don't miss it!",
      amsterdamSees: "pizza party Friday at 6:00 PM, don't miss it!",
      indiaSees: "pizza party Friday at 9:30 PM, don't miss it!",
      description: "weekday + time, surrounding text preserved"
    },
    {
      input: "I'll be free after 4pm, ping me then",
      amsterdamSees: "I'll be free after today at 4:00 PM, ping me then",
      indiaSees: "I'll be free after today at 7:30 PM, ping me then",
      description: "bare time without 'at'"
    },
    {
      input: "retro at 11am and then lunch at 12:30pm",
      amsterdamSees: "retro today at 11:00 AM and then lunch today at 12:30 PM",
      indiaSees: "retro today at 2:30 PM and then lunch today at 4:00 PM",
      description: "multiple times in one message"
    },
    {
      input: "the client demo is at 2pm on Wednesday",
      amsterdamSees: "the client demo is Wednesday at 2:00 PM",
      indiaSees: "the client demo is Wednesday at 5:30 PM",
      description: "time + specific weekday"
    },
    {
      input: "wake up call at 7am, flight is at 9:15am",
      amsterdamSees: "wake up call tomorrow at 7:00 AM, flight is tomorrow at 9:15 AM",
      indiaSees: "wake up call tomorrow at 10:30 AM, flight is tomorrow at 12:45 PM",
      description: "multiple times with commas"
    },
    {
      input: "happy hour starts at 5:30pm this Friday",
      amsterdamSees: "happy hour starts Friday at 5:30 PM",
      indiaSees: "happy hour starts Friday at 9:00 PM",
      description: "this + weekday"
    },
    {
      input: "can anyone do a quick call at 8pm tonight?",
      amsterdamSees: "can anyone do a quick call today at 8:00 PM?",
      indiaSees: "can anyone do a quick call today at 11:30 PM?",
      description: "tonight reference"
    },
    {
      input: "sprint planning Monday at 10am, bring your coffee",
      amsterdamSees: "sprint planning Monday at 10:00 AM, bring your coffee",
      indiaSees: "sprint planning Monday at 1:30 PM, bring your coffee",
      description: "future Monday (not past)"
    },
    {
      input: "deadline is midnight tomorrow, no excuses",
      amsterdamSees: "deadline is tomorrow at 12:00 AM, no excuses",
      indiaSees: "deadline is tomorrow at 3:30 AM, no excuses",
      description: "midnight keyword"
    },
    {
      input: "the release goes out at 3am, who's on call?",
      amsterdamSees: "the release goes out tomorrow at 3:00 AM, who's on call?",
      indiaSees: "the release goes out tomorrow at 6:30 AM, who's on call?",
      description: "early morning time"
    },
    {
      input: "submitted the PR yesterday at 11pm",
      amsterdamSees: "submitted the PR yesterday at 11:00 PM",
      indiaSees: "submitted the PR today at 2:30 AM",
      description: "past time stays in past (yesterday)"
    },
    {
      input: "birthday dinner on Saturday at 7:30pm, bring cake!",
      amsterdamSees: "birthday dinner Saturday at 7:30 PM, bring cake!",
      indiaSees: "birthday dinner Saturday at 11:00 PM, bring cake!",
      description: "weekend + time"
    },
  ];

  testCases.forEach(({ input, amsterdamSees, indiaSees, description }) => {
    const parsed = customChrono.parse(input, { instant: new Date(), timezone: moment.tz(userTz).utcOffset() }, { forwardDate: true });

    console.log(`Test: ${description}`);
    console.log(`  Input (user types):     "${input}"`);
    console.log(`  Amsterdam viewer sees:  "${amsterdamSees}"`);
    console.log(`  India viewer sees:      "${indiaSees}"`);

    if (parsed.length === 0) {
      console.log('  ⚠️  No time found!\n');
      return;
    }

    let message = input;
    for (let i = parsed.length - 1; i >= 0; i--) {
      const result = parsed[i];
      const refDate = moment.tz(result.start.date(), userTz);
      const unix = refDate.unix();
      const dateTag = `<!date^${unix}^{date_short_pretty} at {time}|${refDate.format('h:mm A')}>`;
      message = message.slice(0, result.index) + dateTag + message.slice(result.index + result.text.length);
    }

    console.log(`  Slack receives:         "${message}"`);
    console.log('');
  });
}

runTests('Europe/Amsterdam', 'Person in Amsterdam posting');
runTests('Asia/Kolkata', 'Person in India posting');

