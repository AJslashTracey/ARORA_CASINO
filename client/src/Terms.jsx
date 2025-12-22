import Footer from './Footer';

export default function Terms() {
  return (
    <>
      <section className="border-b border-[rgb(var(--fg)/0.1)]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Terms & Conditions
          </h1>
          <p className="mt-1 text-softer text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-sm text-softer">
        <section>
          <h2 className="font-semibold">1. Introduction</h2>
          <p>By using this site, you agree to these terms.</p>
        </section>

        <section>
          <h2 className="font-semibold">2. Educational Project</h2>
          <p>This is an educational project. No real money is involved.</p>
        </section>

        <section>
          <h2 className="font-semibold">3. Eligibility</h2>
          <p>You must meet age and jurisdiction requirements.</p>
        </section>

        <section>
          <h2 className="font-semibold">4. Accounts</h2>
          <p>Keep your login information secure. You're responsible for all activity.</p>
        </section>

        <section>
          <h2 className="font-semibold">5. Fair Use & Liability</h2>
          <p>Do not misuse the site. The site is provided “as is”; creators are not liable for damages.</p>
        </section>

        <section>
          <h2 className="font-semibold">6. Updates</h2>
          <p>Terms may change at any time. Continued use means acceptance.</p>
        </section>

        <section>
          <h2 className="font-semibold">7. Contact</h2>
          <p>Questions? Contact the site administrator.</p>
        </section>
      </main>

      <Footer />
    </>
  );
}