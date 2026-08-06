// The three-step "How it works" explainer, shown on the /how-it-works page.
const steps = [
  {
    n: "1",
    title: "Verify with your school email",
    body: "Sign up with your .edu email so everyone listing or messaging is a real student on your campus.",
  },
  {
    n: "2",
    title: "Browse or list an item",
    body: "Post something you're selling in under a minute, or browse what's around campus right now.",
  },
  {
    n: "3",
    title: "Meet up and swap",
    body: "Arrange it over Instagram or GroupMe, meet in a public campus spot, and pay in person.",
  },
];

// The three numbered cards on their own (no heading/section wrapper).
export function HowItWorksSteps() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {steps.map((step) => (
        <div
          key={step.n}
          className="rounded-[14px] border border-line bg-paper-soft p-6"
        >
          <div className="mb-4 flex size-9 items-center justify-center rounded-full bg-marigold font-mono text-sm font-medium text-ink">
            {step.n}
          </div>
          <h3 className="font-display mb-2 text-lg font-semibold">
            {step.title}
          </h3>
          <p className="text-sm text-ink/65">{step.body}</p>
        </div>
      ))}
    </div>
  );
}
