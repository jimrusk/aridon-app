"use client";

import { FormEvent } from "react";

const PHONE_DISPLAY = "(505) 716-6773";
const PHONE = "+15057166773";
const EMAIL = "jasonb@r-beautiful.com";

const photos = [
  {
    src: "https://images.unsplash.com/photo-1764208637294-49d0eccacf40?auto=format&fit=crop&fm=jpg&q=80&w=1400",
    alt: "Manicured green lawn and mature trees",
  },
  {
    src: "https://images.unsplash.com/photo-1734079692160-fcbe4be6ab96?auto=format&fit=crop&fm=jpg&q=80&w=1400",
    alt: "Landscaping crew with a wheelbarrow",
  },
  {
    src: "https://images.unsplash.com/photo-1458245201577-fc8a130b8829?auto=format&fit=crop&fm=jpg&q=80&w=1400",
    alt: "Lawn mower working on a landscaped lawn",
  },
];

export default function RBeautifulPage() {
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

    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-[#183126]">
      <div className="w-full max-w-[980px] px-5 py-8 sm:px-8 md:pl-14 md:pr-8 lg:pl-20">
        <section className="max-w-[850px]">
          <div className="mb-5">
            <div className="inline-flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#d9853d] text-3xl font-black text-white">R</div>
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">R Beautiful</h1>
                <p className="text-lg uppercase tracking-[0.12em] text-[#365b45]">Landscaping Inc.</p>
              </div>
            </div>
          </div>

          <div className="grid max-w-[820px] grid-cols-1 gap-3 sm:grid-cols-3">
            {photos.map((photo, i) => (
              <div key={photo.src} className={`overflow-hidden rounded-2xl border-[5px] ${i === 2 ? "border-[#6f452e]" : "border-[#d9853d]"} bg-white shadow-sm`}>
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="h-52 w-full object-cover sm:h-48"
                />
              </div>
            ))}
          </div>

          <div className="mt-9 max-w-[760px]">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#d16f29]">Ready for fall?</p>
            <h2 className="mt-3 text-5xl font-black leading-[0.95] tracking-[-0.045em] sm:text-6xl">
              Let us do the <span className="text-[#238244]">heavy lifting.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52665a]">
              Small crew. Reliable service. Fair prices. Straightforward lawn care and seasonal cleanup without the runaround.
            </p>
          </div>

          <div className="mt-7 flex max-w-[700px] flex-col gap-3 sm:flex-row">
            <a href={`tel:${PHONE}`} className="rounded-xl bg-[#238244] px-6 py-4 text-center text-lg font-black text-white shadow-sm">
              Call {PHONE_DISPLAY}
            </a>
            <a href={`mailto:${EMAIL}?subject=Free%20Landscaping%20Estimate`} className="rounded-xl border-2 border-[#238244] bg-white px-6 py-4 text-center text-lg font-black text-[#1d6636]">
              Email for a Free Estimate
            </a>
          </div>
        </section>

        <section className="mt-14 max-w-[760px]">
          <h3 className="text-3xl font-black tracking-tight">Services</h3>
          <div className="mt-5 space-y-4">
            <div className="border-l-4 border-[#d9853d] pl-5">
              <h4 className="text-xl font-extrabold">Lawn Mowing & Edging</h4>
              <p className="mt-1 text-[#5b6c62]">Keep the lawn clean, even, and crisp around sidewalks, drives, and borders.</p>
            </div>
            <div className="border-l-4 border-[#d9853d] pl-5">
              <h4 className="text-xl font-extrabold">Leaf & Debris Removal</h4>
              <p className="mt-1 text-[#5b6c62]">Clear out seasonal buildup before it smothers grass or turns into a bigger cleanup.</p>
            </div>
            <div className="border-l-4 border-[#d9853d] pl-5">
              <h4 className="text-xl font-extrabold">Light Trimming</h4>
              <p className="mt-1 text-[#5b6c62]">Clean up overgrown bushes, edges, and problem spots so the property looks cared for.</p>
            </div>
          </div>
        </section>

        <section className="mt-14 max-w-[760px] rounded-3xl bg-[#174c31] p-6 text-white sm:p-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#f2a45e]">Free estimate</p>
          <h3 className="mt-2 text-3xl font-black">Tell us what your yard needs.</h3>
          <form onSubmit={requestEstimate} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="name" required placeholder="Your name" className="rounded-xl bg-white px-4 py-3 text-[#183126] outline-none" />
              <input name="contact" required placeholder="Phone or email" className="rounded-xl bg-white px-4 py-3 text-[#183126] outline-none" />
            </div>
            <select name="service" className="w-full rounded-xl bg-white px-4 py-3 text-[#183126] outline-none">
              <option>Lawn mowing & edging</option>
              <option>Leaf & debris removal</option>
              <option>Light trimming</option>
              <option>Multiple services</option>
              <option>Other yard work</option>
            </select>
            <textarea name="details" rows={5} placeholder="What needs done? Yard size, timing, or anything else." className="w-full rounded-xl bg-white px-4 py-3 text-[#183126] outline-none" />
            <button type="submit" className="rounded-xl bg-[#d9853d] px-6 py-4 text-lg font-black text-white">
              Send Estimate Request
            </button>
          </form>

          <div className="mt-7 border-t border-white/20 pt-5 text-sm leading-7 text-white/80">
            <p><a href={`tel:${PHONE}`} className="font-bold text-white">{PHONE_DISPLAY}</a></p>
            <p><a href={`mailto:${EMAIL}`} className="font-bold text-white">{EMAIL}</a></p>
          </div>
        </section>
      </div>
    </main>
  );
}
