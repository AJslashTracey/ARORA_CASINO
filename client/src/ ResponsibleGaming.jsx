import Footer from './Footer';

export default function ResponsibleGaming() {
  return (
    <>
      <section className="border-b border-[rgb(var(--fg)/0.1)]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Responsible Gaming
          </h1>
          <p className="mt-1 text-softer text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-sm text-white">
        <section>
          <h2 className="font-semibold">1. Play Responsibly</h2>
          <p>
            Gambling should be fun and entertaining. Always set limits and never gamble more than you can afford to lose.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">2. Set Limits</h2>
          <p>
            Decide on a budget and time limit before you start playing. Stick to your limits to maintain control.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">3. Take Breaks</h2>
          <p>
            Take regular breaks to avoid excessive play. Gaming should be a balanced activity.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">4. Avoid Chasing Losses</h2>
          <p>
            Do not try to win back lost money. Accept losses as part of the game and stop if necessary.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">5. Signs of Problem Gambling</h2>
          <p>
            Be aware of signs like gambling beyond your means, neglecting responsibilities, or feeling distressed about gambling.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">6. Seek Help</h2>
          <p>
            If you feel gambling is becoming a problem, seek professional support from organizations such as{' '}
            <a
              href="https://www.gamblersanonymous.org/ga/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              Gamblers Anonymous
            </a>.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}