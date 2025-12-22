// promotions.jsx
import Footer from './Footer';

export default function Promotions() {
  return (
    <>
      <section className="border-b border-[rgb(var(--fg)/0.1)]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Promotions
          </h1>
          <p className="mt-1 text-softer text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-sm text-white">
        <section>
          <h2 className="font-semibold">1. Welcome Bonus</h2>
          <p>
          Join now, get a 100% match on your first deposit up to $500. No strings attached.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">2. Weekly Rewards</h2>
          <p>
            Regular players can enjoy weekly rewards based on their activity. Keep an eye on your account dashboard to claim them.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">3. Special Tournaments</h2>
          <p>
            Participate in special tournaments for the chance to win extra prizes and bonuses. Terms and conditions apply.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">4. Seasonal Offers</h2>
          <p>
            From time to time, seasonal offers are available. These may include cashback, free spins, or bonus credits.
          </p>
        </section>

        <section>
          <h2 className="font-semibold">5. Responsible Gaming</h2>
          <p>
            Always gamble responsibly. For guidance, visit{' '}
            <a
              href="/responsible-gaming"
              className="text-blue-400 underline"
            >
              Responsible Gaming
            </a>.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}