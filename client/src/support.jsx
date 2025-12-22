import React from "react";
import { Link } from "react-router-dom";
import Footer from "./Footer";

export default function SupportPage() {
  const supportInfo = [
    { label: "Buisness Name", value: 'Aurora Casino' },
    { label: "Phone", value: '+41 79 187 67 69' },
    { label: "Email", value: 'support.aurora@gmail.com' },
    { label: "Address", value: '420 Lucky Street, Suite 67, Las Vegas, NV 88901' }
  ];

  return (
    <>
      <section className="border-b border-[rgb(var(--fg)/0.1)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight">Support</h1>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ul className="space-y-2 mb-6">
          {supportInfo.map(info => (
            <li key={info.label}><strong>{info.label}:</strong> {info.value}</li>
          ))}
        </ul>
        <p className="mb-6">
          Our team is dedicated to resolving any issues you may encounter. Whether
          you need help with account access, payment questions, or general platform guidance, 
          we’re here to help at any time of the day.
        </p>
        <Link to="/" className="btn-ghost">← Back to Home</Link>
      </div>
      <Footer />
    </>
  );
}