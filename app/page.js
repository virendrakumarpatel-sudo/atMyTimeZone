import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>@MyTimeZone</h1>
        <p className={styles.description}>
          A Slack bot that automatically converts times in your messages into
          localized Slack date tags — so everyone sees the time in their own timezone.
        </p>

        <section className={styles.features}>
          <h2>How It Works</h2>
          <ul>
            <li>
              <strong>Mention the bot:</strong> Tag <code>@MyTimeZone</code> in
              any channel with a time (e.g. "let's meet at 4pm tomorrow") and it
              replies with a Slack date tag everyone sees in their local time.
            </li>
            <li>
              <strong>Slash command:</strong> Use{" "}
              <code>/mytimezone let's sync at 3pm Friday</code> to post a
              timezone-aware message to the channel.
            </li>
          </ul>
        </section>

        <section className={styles.features}>
          <h2>Features</h2>
          <ul>
            <li>Natural language time parsing (powered by chrono-node)</li>
            <li>Respects each user's Slack timezone setting</li>
            <li>Forward-date aware — "Friday" means next Friday, not last</li>
            <li>Uses native Slack date formatting for universal display</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
