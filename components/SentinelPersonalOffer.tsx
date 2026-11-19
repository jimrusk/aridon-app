export default function SentinelPersonalOffer() {
  return (
    <section
      aria-labelledby="sentinel-personal-heading"
      className="relative overflow-hidden bg-[#071525] px-5 py-20 text-white sm:px-8 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
            SENTINEL FOR EVERYDAY CUSTOMERS
          </p>

          <h2
            id="sentinel-personal-heading"
            className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl"
          >
            Your bank will not monitor your AI agent. We will.
          </h2>

          <p className="mt-7 text-base leading-8 text-slate-300 sm:text-lg">
            This week Citi rewrote its online user agreement to say customers
            are responsible for whatever their AI agents do, even if the tool
            leaks their credentials or gets hacked. JPMorgan, Bank of America,
            PNC, and Citizens have told their customers the same thing. The
            banks are not banning agents. They are handing you the watching
            job.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#0c2031] shadow-2xl shadow-black/30">
            <div className="border-b border-white/10 px-6 py-7 sm:px-9">
              <p className="text-sm font-semibold text-emerald-400">
                Sentinel Personal, founding cohort
              </p>

              <div className="mt-4 flex flex-wrap items-baseline gap-x-2">
                <span className="text-4xl font-bold tracking-tight sm:text-5xl">
                  $150
                </span>
                <span className="text-base text-slate-400">
                  setup, then $50 per month
                </span>
              </div>
            </div>

            <div className="space-y-8 px-6 py-8 sm:px-9">
              <div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                  What setup includes:
                </h3>

                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm leading-6 text-slate-300">
                    <span className="mt-1 text-emerald-400">✓</span>
                    <span>
                      One personal agent workflow wired through Sentinel
                    </span>
                  </li>
                  <li className="flex gap-3 text-sm leading-6 text-slate-300">
                    <span className="mt-1 text-emerald-400">✓</span>
                    <span>
                      A one-page action-exposure map of everything that agent
                      can reach and do
                    </span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-white/10 pt-7">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                  What the monthly plan does:
                </h3>

                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm leading-6 text-slate-300">
                    <span className="mt-1 text-emerald-400">✓</span>
                    <span>
                      Checks every action your agent attempts before it runs
                    </span>
                  </li>
                  <li className="flex gap-3 text-sm leading-6 text-slate-300">
                    <span className="mt-1 text-emerald-400">✓</span>
                    <span>
                      Holds anything outside the lines you set until you
                      approve it
                    </span>
                  </li>
                  <li className="flex gap-3 text-sm leading-6 text-slate-300">
                    <span className="mt-1 text-emerald-400">✓</span>
                    <span>
                      Sends you a monthly review of everything your agent did
                    </span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-white/10 pt-7">
                <a
                  href="mailto:jimrusk66@gmail.com?subject=Sentinel%20Personal%20founding%20cohort"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-400 px-6 py-4 text-sm font-bold text-[#071525] transition-colors hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#0c2031]"
                >
                  Join the founding cohort
                  <span className="ml-2" aria-hidden="true">
                    →
                  </span>
                </a>

                <p className="mt-5 text-xs leading-6 text-slate-400">
                  Sentinel is a development-stage product, currently in
                  internal testing (13 of 13 hostile actions held, 0 false
                  positives). Founding cohort members are onboarded personally,
                  in limited numbers. No mass checkout, no hype.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-16 max-w-3xl border-t border-white/10 pt-8 text-center">
        <p className="text-sm leading-7 text-slate-400">
          For businesses, nothing changes: the Sentinel design-partner pilot
          is $2,500 for 60 days, credited against the first year.
        </p>
      </div>
    </section>
  );
}
