import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { db } from '../lib/firebase.ts';

export function AboutPage() {
  return (
    <PublicLayout>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <h1 className="font-display text-3xl font-bold text-[#18181B]">
          About LankaWorks
        </h1>
        <p className="text-base text-[#52525B] leading-relaxed">
          LankaWorks is built to connect households and businesses across all 9 provinces and 25 districts of Sri Lanka with verified, dependable local service providers.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-2">
            <h2 className="font-display text-lg font-semibold text-[#18181B]">
              For Customers
            </h2>
            <p className="text-sm text-[#52525B] leading-relaxed">
              Browse services freely without forced registration, book as a guest with a secure Reference and 6-digit PIN, or create a free customer account for history and reviews.
            </p>
          </div>
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-2">
            <h2 className="font-display text-lg font-semibold text-[#18181B]">
              For Local Providers
            </h2>
            <p className="text-sm text-[#52525B] leading-relaxed">
              Skilled professionals register, verify their email, undergo Admin approval, and enjoy their first 5 months free before switching to a transparent monthly subscription.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

export function HowItWorksPage() {
  return (
    <PublicLayout>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-[#18181B]">
            How LankaWorks Works
          </h1>
          <p className="text-base text-[#52525B]">
            Simple, transparent local service discovery and booking for Sri Lanka.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              step: '01. Search by Location & Category',
              body: 'Use the homepage or Browse Services page to filter across all 9 provinces, 25 districts, and major towns.',
            },
            {
              step: '02. Choose a Verified Service Provider',
              body: 'Every public provider is approved by LankaWorks Administrators before their profile or services appear in search.',
            },
            {
              step: '03. Book as a Guest or Registered Customer',
              body: 'Guests receive a unique booking reference and 6-digit PIN to check status or cancel securely. Registered customers can manage all bookings in one dashboard.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-1.5"
            >
              <h2 className="font-display text-lg font-semibold text-[#18181B]">
                {item.step}
              </h2>
              <p className="text-sm text-[#52525B] leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/services"
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59]"
          >
            Browse Services
          </Link>
          <Link
            to="/worker"
            className="px-5 py-2.5 text-sm font-medium rounded-lg border border-[#E4E4E7] bg-white hover:bg-[#F4F4F5]"
          >
            Join as a Service Provider
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}

export function ContactPage() {
  const { firebaseUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSubmittedId(null);
    const ticketId = `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      await setDoc(doc(db, 'support_tickets', ticketId), {
        senderName: name.trim().slice(0, 100),
        senderEmail: email.trim().slice(0, 254),
        userUid: firebaseUser?.uid ?? null,
        subject: subject.trim().slice(0, 150),
        message: message.trim().slice(0, 2000),
        status: 'open',
        createdAt: serverTimestamp(),
      });
      setSubmittedId(ticketId);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit inquiry.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicLayout>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-[#18181B]">
            Contact LankaWorks Support
          </h1>
          <p className="text-sm text-[#52525B]">
            Questions about a booking, service provider verification, or platform support? Send us a message.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-4"
        >
          {error && (
            <div role="alert" className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C]">
              {error}
            </div>
          )}
          {submittedId && (
            <div role="status" className="p-3 rounded-lg bg-[#F0FDFA] border border-[#CCFBF1] text-xs text-[#0F766E]">
              Inquiry received (Ticket <span className="font-mono">{submittedId}</span>). Our support team will review it shortly.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="cnt-name" className="block text-xs font-medium text-[#18181B]">
                Your Name
              </label>
              <input
                id="cnt-name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cnt-email" className="block text-xs font-medium text-[#18181B]">
                Email Address
              </label>
              <input
                id="cnt-email"
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cnt-subject" className="block text-xs font-medium text-[#18181B]">
              Subject
            </label>
            <input
              id="cnt-subject"
              type="text"
              required
              minLength={3}
              maxLength={150}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cnt-msg" className="block text-xs font-medium text-[#18181B]">
              Message (min 10 characters)
            </label>
            <textarea
              id="cnt-msg"
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E4E4E7]"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] disabled:opacity-50"
          >
            {busy ? 'Sending...' : 'Send Support Inquiry'}
          </button>
        </form>
      </section>
    </PublicLayout>
  );
}

export function FaqPage() {
  const faqs = [
    {
      q: 'Do customers have to register before booking?',
      a: 'No. Customers can browse services and book as guests using a booking reference and 6-digit PIN, or optionally create a free account.',
    },
    {
      q: 'Do customers pay any fee to use LankaWorks?',
      a: 'Customer browsing, booking, and account features are completely free.',
    },
    {
      q: 'How do workers get approved?',
      a: 'Workers register with email and password, verify their email address, complete their business profile, and await Administrator review.',
    },
    {
      q: 'How does the worker subscription work?',
      a: 'Approved workers receive their first 5 months free, followed by a monthly subscription plan.',
    },
  ];

  return (
    <PublicLayout>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <h1 className="font-display text-3xl font-bold text-[#18181B]">
          Help &amp; Frequently Asked Questions
        </h1>
        <div className="space-y-4">
          {faqs.map((item) => (
            <div key={item.q} className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-2">
              <h2 className="font-display text-base font-semibold text-[#18181B]">
                {item.q}
              </h2>
              <p className="text-sm text-[#52525B] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}

export function LegalPage({ type }: { type: 'terms' | 'privacy' }) {
  return (
    <PublicLayout>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-5">
        <h1 className="font-display text-3xl font-bold text-[#18181B]">
          {type === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
        </h1>
        <div className="bg-white border border-[#E4E4E7] rounded-xl p-6 space-y-4 text-sm text-[#52525B] leading-relaxed">
          {type === 'terms' ? (
            <>
              <p>
                LankaWorks operates as a local services marketplace connecting customers in Sri Lanka with independent service providers.
              </p>
              <p>
                Service providers are solely responsible for service quality, licensing, pricing accuracy, and adherence to confirmed appointment times.
              </p>
              <p>
                Customers remain free of platform fees. Service providers receive a 5-month free introductory period after approval before monthly subscription billing applies.
              </p>
            </>
          ) : (
            <>
              <p>
                Personal contact details (email, phone number, and service address) are isolated in access-controlled Firestore records accessible only to the account owner and authorized staff.
              </p>
              <p>
                Guest booking PINs are stored exclusively using salted cryptographic hashes and are never visible in plaintext on public pages.
              </p>
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
