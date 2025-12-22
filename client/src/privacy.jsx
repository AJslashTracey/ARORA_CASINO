import React from "react";

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-white">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-6">
        We value your privacy and are committed to protecting your personal information. This page explains what data we collect and how we use it.
      </p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Information We Collect</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Personal Information:</strong> Name, email, and account details.</li>
          <li><strong>Usage Data:</strong> Games played, time spent, and site interactions.</li>
          <li><strong>Cookies:</strong> Small files to enhance your experience.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">How We Use Your Data</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Provide and improve our services.</li>
          <li>Communicate updates and promotions.</li>
          <li>Analyze site performance.</li>
          <li>Prevent fraud and comply with legal requirements.</li>
        </ul>
      </section>

      <section className="mb-6">
    
        <ul className="list-disc list-inside space-y-1">
          <li>Payment processing</li>
          <li>Legal compliance and fraud prevention</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Security</h2>
        <p>We take steps to protect your data, but no system is completely secure.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Children’s Privacy</h2>
        <p>Our services are for users 18 and older. We do not knowingly collect data from minors.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Changes to This Policy</h2>
        <p>We may update this page occasionally. The latest version will always be available here.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
        <p>If you have questions, email us at <a href="mailto:support.aurora@gmail.com" className="underline text-blue-400">support.aurora@gmail.com</a>.</p>
      </section>
    </div>
  );
};

export default Privacy;