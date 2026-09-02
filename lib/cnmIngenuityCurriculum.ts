export type CnmSource = {
  id: string;
  title: string;
  url: string;
  note: string;
};

export type CnmModule = {
  id: string;
  title: string;
  promise: string;
  lessons: string[];
  sourceIds: string[];
  aridonExtension: string;
};

export const cnmSources: CnmSource[] = [
  {
    id: 'home',
    title: 'CNM Ingenuity — Skills Training',
    url: 'https://www.cnmingenuity.org/',
    note: 'CNM Ingenuity positions itself around accelerated workforce skills, innovation and economic development. Its public site highlights technology, quantum careers, business, trades, healthcare and other workforce pathways.',
  },
  {
    id: 'training',
    title: 'CNM Ingenuity — Training Programs',
    url: 'https://www.cnmingenuity.org/training-programs/',
    note: 'Public program overview describing project-based Deep Dive technology bootcamps, including Quantum Technician, Full Stack Web Development, Java + Android, Digital Media, Internet of Things, Data Science and UX/UI.',
  },
  {
    id: 'ai-ready',
    title: 'AI READY: A Practical Introduction for Professionals',
    url: 'https://www.cnmingenuity.org/program/ai-ready/',
    note: 'Beginner-friendly two-session program covering generative AI basics, prompting, guardrails, responsible use, practical workplace use and change management.',
  },
  {
    id: 'excel',
    title: 'Unlock the Power of Excel',
    url: 'https://www.cnmingenuity.org/program/unlock-the-power-of-excel/',
    note: 'Beginner workshop covering spreadsheet structure, data entry, formatting, formulas, functions, simple charts and tables.',
  },
  {
    id: 'leadership',
    title: 'Leadership & Business Management',
    url: 'https://www.cnmingenuity.org/program/leadership-business-management/',
    note: 'Public overview of professional-skills and leadership training, including emotional intelligence, critical thinking, communication and management development.',
  },
  {
    id: 'professional-skills',
    title: 'Professional Skills Academy',
    url: 'https://www.cnmingenuity.org/program/professional-skills-academy/',
    note: 'Professional development program that includes workplace skills such as emotional intelligence and effective collaboration.',
  },
  {
    id: 'funding',
    title: 'CNM Ingenuity — Funding Resources',
    url: 'https://www.cnmingenuity.org/funding-resources/',
    note: 'Public funding guidance for workforce programs, including Training for Your Future Funds and Job Training Albuquerque.',
  },
];

export const cnmModules: CnmModule[] = [
  {
    id: 'ai-ready',
    title: 'AI Ready: Get a Better Answer from AI',
    promise: 'Learn one simple prompting pattern, test it immediately and see where human judgment still matters.',
    lessons: [
      'Generative AI is most useful when the learner gives it a clear goal, useful context and a specific output format.',
      'A practical prompt can be built from four parts: task, context, constraints and desired output.',
      'AI output should be checked rather than trusted automatically, especially when accuracy, privacy or business consequences matter.',
      'Responsible use means knowing what information should not be shared and where a human decision must stay in control.',
    ],
    sourceIds: ['ai-ready'],
    aridonExtension: 'Turn the lesson into a guided practice lab: the AI teacher asks what job the learner does, builds a safe real-world exercise, critiques the learner’s prompt and generates a reusable prompt card for their role.',
  },
  {
    id: 'full-stack',
    title: 'Full Stack: How a Web App Actually Works',
    promise: 'Follow one click from the browser through the application and back again.',
    lessons: [
      'Full-stack development connects what a user sees in the browser with application logic, data and services behind the interface.',
      'A useful beginner mental model is: interface → request → server logic → data → response → updated interface.',
      'Projects help learners connect individual coding concepts into a working product instead of learning syntax in isolation.',
    ],
    sourceIds: ['training'],
    aridonExtension: 'The AI teacher can create a tiny project brief matched to the learner’s experience, explain each layer in plain language, quiz the learner and progressively reveal code only when the concept is understood.',
  },
  {
    id: 'iot',
    title: 'Internet of Things: From Sensor to Decision',
    promise: 'Understand how a physical measurement becomes useful digital information.',
    lessons: [
      'An IoT system starts with something in the physical world that can be measured or controlled.',
      'A sensor produces data, software interprets it, and a network can move that information to another device or service.',
      'The value is not the sensor alone. The value comes from turning measurements into alerts, automation, visualization or decisions.',
    ],
    sourceIds: ['training'],
    aridonExtension: 'The AI teacher can ask the learner to choose a real Albuquerque problem, such as heat, water, traffic or greenhouse conditions, then walk them through a sensor-to-dashboard project concept and quiz them on each system component.',
  },
  {
    id: 'data-science',
    title: 'Data Science: Ask the Question Before Touching the Data',
    promise: 'Turn a vague problem into a question that data can actually help answer.',
    lessons: [
      'Useful data work starts with a decision or question, not with a chart.',
      'The learner should identify what outcome matters, what observations could support it and what missing data could distort the conclusion.',
      'A chart or model is evidence for a decision, not a substitute for understanding the context behind the data.',
    ],
    sourceIds: ['training', 'excel'],
    aridonExtension: 'The AI teacher can provide a small synthetic dataset, have the learner form a question, choose a calculation or visualization, explain the result and receive instant feedback on whether the evidence supports the conclusion.',
  },
  {
    id: 'ux-ui',
    title: 'UX/UI: Design the Problem Before the Screen',
    promise: 'Learn why a beautiful interface can still fail the person using it.',
    lessons: [
      'UX begins with the person, the task they are trying to complete and the friction standing in their way.',
      'UI is the visible interaction layer, but layout, wording and controls should support a real user goal.',
      'A strong design loop is: understand the user → define the problem → prototype → test → revise.',
    ],
    sourceIds: ['training'],
    aridonExtension: 'The AI teacher can role-play a user, challenge a learner’s assumptions, generate a simple design brief and score a proposed flow for clarity, friction and accessibility before any code is written.',
  },
  {
    id: 'quantum-tech',
    title: 'Quantum Technician: Meet the Hardware Behind the Buzzword',
    promise: 'Explore the practical technician skills that support emerging quantum systems.',
    lessons: [
      'CNM Ingenuity publicly highlights practical quantum-career skills including optics, photonics and vacuum systems.',
      'Technician work in advanced technology depends on careful measurement, repeatable procedures, equipment knowledge and disciplined troubleshooting.',
      'A beginner does not need to solve advanced quantum theory to start understanding the physical systems and laboratory practices around the field.',
    ],
    sourceIds: ['home', 'training'],
    aridonExtension: 'The AI teacher can run an interactive virtual lab orientation: identify components, explain why vacuum or optical alignment matters, present a troubleshooting scenario and adapt the explanation to the learner’s math and science background.',
  },
  {
    id: 'excel',
    title: 'Excel: Make a Spreadsheet Answer a Question',
    promise: 'Use a formula, a table and a chart to turn raw rows into a useful answer.',
    lessons: [
      'Spreadsheets organize information into cells, rows, columns, worksheets and workbooks.',
      'Basic formulas and functions such as SUM, AVERAGE and IF turn stored values into calculated information.',
      'Tables make data easier to organize, while charts can make patterns easier to see when the visualization matches the question.',
    ],
    sourceIds: ['excel'],
    aridonExtension: 'The AI teacher can generate a practice dataset for the learner’s job, ask them which formula to use, diagnose mistakes and then move from formula → table → chart → business interpretation.',
  },
  {
    id: 'professional-skills',
    title: 'Professional Skills: Handle a Hard Conversation',
    promise: 'Practice emotional intelligence, critical thinking and communication in a realistic workplace scenario.',
    lessons: [
      'Technical skill alone does not remove the need to communicate clearly and work effectively with other people.',
      'Emotional intelligence includes noticing one’s own reaction while also paying attention to what another person may need from the conversation.',
      'A useful workplace response separates the observable problem from assumptions, then moves toward a specific next action.',
    ],
    sourceIds: ['leadership', 'professional-skills'],
    aridonExtension: 'The AI teacher can role-play a coworker, supervisor or customer, let the learner practice the conversation by voice and provide coaching on clarity, listening, assumptions and the next question to ask.',
  },
];

export const cnmPublicCorpusSummary = cnmModules
  .map((module) => `${module.title}: ${module.lessons.join(' ')} ARIDON EXTENSION: ${module.aridonExtension}`)
  .join('\n\n');

export function cnmModule(id: string) {
  return cnmModules.find((module) => module.id === id) || cnmModules[0];
}
