"use client";

import { FormEvent, useState } from "react";

const PHONE_DISPLAY = "(505) 716-6773";
const PHONE = "+15057166773";
const EMAIL = "jasonb@r-beautiful.com";

export default function RBeautifulPage() {
  const [sent, setSent] = useState(false);

  function requestEstimate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "");
    const contact = String(form.get("contact") || "");
    const service = String(form.get("service") || "");
    const details = String(form.get("details") || "");

    const subject = encodeURIComponent("Free Landscaping Estimate Request");
    const body = encodeURIComponent(
      `Hi R Beautiful Landscaping,

I'd like a free estimate.

Name: ${name}
Contact: ${contact}
Service: ${service}
Details: ${details || "Not provided"}`
    );

    setSent(true);
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <main className="min-h-screen bg-[#fbf8f1] text-[#172019]">
      <header className="sticky top-0 z-20 border-b border-emerald-950/10 bg-[#fbf8f1]/95 backdrop-blur">
        <div className="mx-auto flex w-[92%] max-w-6xl items-center justify-between gap-5 py-4">
          <a href="#top" className="flex items-center gap-3 font-extrabold tracking-wide text-[#174c31]">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#d98336] text-2xl font-black text-white">R</span>
            <span>R Beautiful Landscaping Inc.</span>
          </a>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <a href="#services" className="hidden sm:inline">Services</a>
            <a href="#quote" className="hidden sm:inline">Estimate</a>
            <a href={`tel:${PHONE}`} className="rounded-full bg-[#2d7d3d] px-5 py-3 font-extrabold text-white shadow-lg shadow-green-900/10">
              Call Now
            </a>
          </nav>
        </div>
      </header>

      <section id="top" className="overflow-hidden py-16 md:py-24">
        <div className="mx-auto grid w-[92%] max-w-6xl items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-[#d98336]">Fall cleanup • lawn care • trimming</p>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              Ready for fall?
              <span className="mt-2 block text-[#2d7d3d]">We do the heavy lifting.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              Reliable landscape care from a small crew focused on clean work, clear communication, and fair prices.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`tel:${PHONE}`} className="rounded-full bg-[#2d7d3d] px-6 py-4 font-extrabold text-white shadow-xl shadow-green-900/15">
                Call {PHONE_DISPLAY}
              </a>
              <a href={`mailto:${EMAIL}?subject=Free%20Landscaping%20Estimate`} className="rounded-full border border-emerald-950/15 bg-white px-6 py-4 font-extrabold text-[#174c31]">
                Email for Estimate
              </a>
            </div>
          </div>

          <div className="relative rounded-[2rem] bg-[#174c31] p-8 text-white shadow-2xl shadow-green-950/20 md:p-12">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[18px] border-[#d98336]/80" />
            <div className="relative">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-300">R Beautiful Landscaping</p>
              <h2 className="mt-4 text-4xl font-black">A cleaner yard without giving up your weekend.</h2>
              <div className="mt-8 grid gap-4">
                {["Small crew", "Reliable service", "Fair prices"].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/10 px-5 py-4 font-bold">✓ {item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-16 md:py-20">
        <div className="mx-auto w-[92%] max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#d98336]">What we do</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight md:text-5xl">Keep the yard sharp through the season.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <article className="rounded-3xl border border-emerald-950/10 bg-white p-7 shadow-sm">
              <div className="text-3xl">🌿</div>
              <h3 className="mt-4 text-2xl font-extrabold">Lawn Mowing & Edging</h3>
              <p className="mt-3 text-slate-600">Clean mowing and crisp edges for a finished, cared-for look.</p>
            </article>
            <article className="rounded-3xl border border-emerald-950/10 bg-white p-7 shadow-sm">
              <div className="text-3xl">🍂</div>
              <h3 className="mt-4 text-2xl font-extrabold">Leaf & Debris Removal</h3>
              <p className="mt-3 text-slate-600">Clear leaves and yard debris before buildup smothers healthy grass.</p>
            </article>
            <article className="rounded-3xl border border-emerald-950/10 bg-white p-7 shadow-sm">
              <div className="text-3xl">✂️</div>
              <h3 className="mt-4 text-2xl font-extrabold">Light Trimming</h3>
              <p className="mt-3 text-slate-600">Tidy overgrown bushes, borders, and edges to bring the landscape back into shape.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[#174c31] py-16 text-white">
        <div className="mx-auto grid w-[92%] max-w-6xl gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-300">Straightforward service</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Professional curb appeal, minus the runaround.</h2>
          </div>
          <div className="grid gap-3 text-lg">
            <div className="rounded-2xl bg-white/10 p-5">✓ Seasonal cleanup when the workload piles up</div>
            <div className="rounded-2xl bg-white/10 p-5">✓ Dependable communication</div>
            <div className="rounded-2xl bg-white/10 p-5">✓ Practical, no-nonsense yard care</div>
            <div className="rounded-2xl bg-white/10 p-5">✓ Easy phone and email estimates</div>
          </div>
        </div>
      </section>

      <section id="quote" className="py-16 md:py-24">
        <div className="mx-auto grid w-[92%] max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#d98336]">Free estimate</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Tell us what your yard needs.</h2>
            <p className="mt-5 text-lg text-slate-600">Send the details and we’ll make it easy to get the conversation started.</p>
            <div className="mt-7 space-y-2 font-bold text-[#174c31]">
              <p><a href={`tel:${PHONE}`}>📞 {PHONE_DISPLAY}</a></p>
              <p><a href={`mailto:${EMAIL}`}>✉️ {EMAIL}</a></p>
            </div>
          </div>

          <form onSubmit={requestEstimate} className="rounded-3xl bg-white p-7 shadow-2xl shadow-green-950/10 md:p-9">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-[#174c31]">
                Name
                <input name="name" required className="rounded-xl border border-slate-200 px-4 py-3 text-[#172019] outline-none focus:border-[#2d7d3d]" placeholder="Your name" />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[#174c31]">
                Phone or Email
                <input name="contact" required className="rounded-xl border border-slate-200 px-4 py-3 text-[#172019] outline-none focus:border-[#2d7d3d]" placeholder="Best way to reach you" />
              </label>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-bold text-[#174c31]">
              Service
              <select name="service" className="rounded-xl border border-slate-200 px-4 py-3 text-[#172019] outline-none focus:border-[#2d7d3d]">
                <option>Lawn mowing & edging</option>
                <option>Leaf & debris removal</option>
                <option>Light trimming</option>
                <option>Multiple services</option>
                <option>Other yard work</option>
              </select>
            </label>
            <label className="mt-4 grid gap-2 text-sm font-bold text-[#174c31]">
              Job Details
              <textarea name="details" rows={5} className="rounded-xl border border-slate-200 px-4 py-3 text-[#172019] outline-none focus:border-[#2d7d3d]" placeholder="What needs done, yard size, timing, etc." />
            </label>
            <button type="submit" className="mt-5 w-full rounded-full bg-[#2d7d3d] px-6 py-4 font-extrabold text-white shadow-lg shadow-green-900/10">
              Email Quote Request
            </button>
            {sent && <p className="mt-3 text-sm text-slate-500">Opening your email app with the request filled in.</p>}
          </form>
        </div>
      </section>

      <footer className="bg-[#0e2f20] py-8 text-white">
        <div className="mx-auto flex w-[92%] max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-extrabold">R Beautiful Landscaping Inc.</p>
            <p className="mt-1 text-sm text-white/65">Small crew. Reliable service. Fair prices.</p>
          </div>
          <div className="text-right text-sm">
            <p><a href={`tel:${PHONE}`}>{PHONE_DISPLAY}</a></p>
            <p><a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
            <p className="mt-2 text-white/45">Hosted by Aridon</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
