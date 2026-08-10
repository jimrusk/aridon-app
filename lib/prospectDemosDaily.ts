export type DailyProspectDemo = {
  slug: string;
  active: boolean;
  expiresAt: string;
  companyName: string;
  industry: string;
  location: string;
  website: string;
  contactEmail: string;
  publicSummary: string;
  services: string[];
  opportunities: string[];
  sampleBrief: string[];
  starterQuestions: string[];
};

type Kind = 'roofing' | 'hvac' | 'construction' | 'landscape';
const expiresAt = '2026-08-25T23:59:59-06:00';

const presets = {
  roofing: {
    services: ['Roof inspections and estimates', 'Repair and replacement', 'Residential and commercial roofing', 'Customer follow-up'],
    opportunities: ['Create one follow-up queue for every inspection, estimate and open proposal.','Rank open opportunities by urgency, job value, probability and next action.','Turn completed jobs into maintenance, review and referral campaigns.','Give the owner a daily brief of new leads, overdue follow-ups, jobs at risk and next actions.'],
    sampleBrief: ['Priority: identify estimates older than 48 hours that have not received a follow-up.','Revenue: rank open roofing opportunities by value, urgency and close probability.','Operations: flag active jobs with unresolved scheduling, material or customer dependencies.','Retention: prepare review, referral and maintenance follow-up for recently completed jobs.'],
    starterQuestions: ['We get inspection and estimate requests but follow-up can slip. Build a better process.','How should we prioritize open roofing opportunities so the best jobs get attention first?','Create a 30-day plan to turn completed roofing jobs into reviews, referrals and repeat business.'],
  },
  hvac: {
    services: ['Heating and cooling service', 'Installation and replacement', 'Repair', 'Maintenance and customer follow-up'],
    opportunities: ['Route quote and service requests into a same-day follow-up queue with clear ownership.','Turn one-time repairs and installations into seasonal maintenance campaigns.','Track pricing objections and lost-job reasons so sales decisions become more deliberate.','Give the owner a morning service-and-sales brief covering urgent jobs, open quotes and callbacks.'],
    sampleBrief: ['Priority: contact unclosed quote requests from the last 24 hours before they age out.','Revenue: identify repair customers who may be candidates for replacement or maintenance plans.','Operations: group today’s callbacks by urgency, service type and promised response time.','Retention: prepare seasonal maintenance reminders for prior installation and repair customers.'],
    starterQuestions: ['Build a follow-up system for quote requests, repairs and maintenance customers.','How can we improve conversion without competing only on price?','What should the owner see every morning to keep service calls and sales moving?'],
  },
  construction: {
    services: ['Construction or specialty contracting', 'Estimating and project qualification', 'Project management', 'Client and partner coordination'],
    opportunities: ['Score inbound projects by budget, fit, timing and next milestone before estimator time is committed.','Create an executive view spanning qualification, estimating, dependencies and project handoffs.','Maintain a follow-up clock for proposals, customer decisions, field information and partner commitments.','Give leadership a CEO brief of pipeline movement, project risk, cash exposure and next approvals.'],
    sampleBrief: ['Pipeline: rank new inquiries by strategic fit, budget clarity and probability of reaching proposal.','Operations: flag jobs waiting on customer decisions, field information or partner commitments.','Finance: surface proposals or commitments with meaningful cash-flow exposure before approval.','Growth: identify project types and referral sources producing the strongest qualified opportunities.'],
    starterQuestions: ['How should we qualify incoming projects before investing estimating time?','Create an executive handoff process from inquiry to proposal to active project.','What should leadership review weekly to spot project risk earlier?'],
  },
  landscape: {
    services: ['Landscape design or maintenance', 'Project estimates', 'Scheduling and operations', 'Customer follow-up'],
    opportunities: ['Create a simple lead board from consultation request through estimate, decision, scheduling and completion.','Automate quote follow-up so warm prospects do not disappear during busy field weeks.','Turn completed work into a repeatable review, referral and marketing pipeline.','Give the owner a weekly view of booked work, open estimates, schedule gaps and next revenue actions.'],
    sampleBrief: ['Priority: follow up with open estimates before filling lower-value schedule gaps.','Revenue: identify project or service categories with the strongest close rate and average value.','Operations: compare booked work against crew capacity for the next four weeks.','Marketing: select recent completed work for testimonial, referral and portfolio follow-up.'],
    starterQuestions: ['We are busy in the field and quotes can go cold. Build a simple follow-up system.','How should we balance booked work, crew capacity and new estimates over the next month?','Turn our completed work into a repeatable referral and marketing process.'],
  },
} as const;

function demo(slug:string, kind:Kind, companyName:string, industry:string, location:string, website:string, contactEmail:string, publicSummary:string): DailyProspectDemo {
  const p = presets[kind];
  return { slug, active:true, expiresAt, companyName, industry, location, website, contactEmail, publicSummary, services:[...p.services], opportunities:[...p.opportunities], sampleBrief:[...p.sampleBrief], starterQuestions:[...p.starterQuestions] };
}

export const dailyProspectDemos: DailyProspectDemo[] = [
  demo('relentless-nm-a10r','construction','Relentless Industries','Multi-trade contractor','Northern and Central New Mexico','https://relentlessnm.com/','info@relentlessnm.com','Public website information describes Relentless Industries as a licensed New Mexico contractor coordinating roofing, plumbing, HVAC and construction work for homeowners, builders and general contractors.'),
  demo('castillo-solutions-a10c','hvac','Castillo Solutions LLC','HVAC and plumbing services','Santa Fe, New Mexico','https://www.castillosolutionsllc.com/','info@castillosolutionsllc.com','Public website information describes Castillo Solutions LLC as a Santa Fe HVAC and plumbing company providing heating, cooling, maintenance and plumbing-related services with direct customer booking and support.'),
  demo('del-rio-enterprises-a10d','construction','Del Rio Enterprises, Inc.','General and electrical contractor','Albuquerque, New Mexico','https://www.drei-nm.com/','info@drei-nm.com','Public website information describes Del Rio Enterprises as a locally owned, woman-owned and Hispanic-owned New Mexico general and electrical contractor serving commercial and industrial customers with construction, renovations, upgrades and installations.'),
  demo('zema-electrical-a10z','construction','Zema Electrical LLC','Electrical contractor','Albuquerque, New Mexico','https://www.zemaelectric.com/','info@zemaelectric.com','Public website information describes Zema Electrical as a locally owned Albuquerque electrical contractor serving the greater Rio Grande Valley with panel, wiring, generator, backup-power and lighting services.'),

  demo('msw-roofing-a10m','roofing','MSW Contracting, LLC','Roofing contractor','Chandler / Phoenix Metro, Arizona','https://www.roofarizona.com/','info@roofarizona.com','Public website information describes MSW Contracting as an Arizona roofing contractor serving the Phoenix metro with residential and commercial roof installation, repair, replacement, coatings, gutters and related services.'),
  demo('gps-roofing-a10g','roofing','GPS Remodeling','Roofing and remodeling contractor','Chandler, Arizona','https://gpsroofingaz.com/','info@gpsroofingaz.com','Public website information describes GPS Remodeling as an owner-operated Arizona roofing company providing roof installation, repair, maintenance, inspection and re-roofing services.'),
  demo('dhr-family-a10h','construction','DHR Family of Companies','Property maintenance and construction services','Phoenix, Arizona','https://dhrcontracting.com/','info@licensedtofix.com','Public website information describes DHR Family of Companies as a Phoenix one-source property-services provider offering construction, HVAC, plumbing, janitorial, porter and landscaping services for property and facility managers.'),
  demo('hansel-landscape-a10l','landscape','Hansel Landscape & Construction','Landscape design and construction','Phoenix Metro, Arizona','https://hanselaz.com/','info@hanselaz.com','Public website information describes Hansel Landscape & Construction as a family-owned Arizona landscape design and construction company with more than 30 years of experience serving Phoenix-area communities.'),

  demo('jenkins-roofing-a10j','roofing','Jenkins Roofing','Roofing and construction','Arlington / DFW, Texas','https://jenkinsroofing.com/','info@jenkinsroofing.com','Public website information describes Jenkins Roofing as a locally owned, third-generation DFW roofing and construction company serving residential and commercial customers with more than five decades in business.'),
  demo('west-texas-climate-a10w','hvac','West Texas Climate Control and Refrigeration LLC','HVAC services','Midland, Texas','https://www.wtxcoolingandheating.com/','info@wtxcoolingandheating.com','Public website information describes West Texas Climate Control and Refrigeration as a locally owned HVAC company with more than 20 years of experience providing inspections, maintenance, installations, duct services and related comfort services.'),
  demo('texas-construction-co-a10t','construction','Texas Construction Company','General contractor','McKinney, Texas','https://texasconstructioncompany.net/','info@texasconstructioncompany.com','Public website information describes Texas Construction Company as a general contractor with more than 18 years of experience providing renovations, improvements, concrete, plumbing, painting, drywall and related construction services.'),
  demo('plus-services-a10p','landscape','Plus Services','Commercial facility and landscape services','Austin, Texas','https://www.plustexas.com/','info@plustexas.com','Public website information describes Plus Services as an Austin commercial-services company providing landscaping, janitorial, building maintenance, lighting, repairs and related property-support services.'),

  demo('cig-construction-a10i','roofing','CIG Construction','Roofing contractor','Westminster / Fort Collins, Colorado','https://cigconstruction.com/','info@cigconstruction.com','Public website information describes CIG Construction as a Colorado roofing company led by husband-and-wife co-founders serving residential, commercial and multifamily customers along the Front Range.'),
  demo('victory-ci-a10v','hvac','Victory Construction and Refrigeration, LLC','Commercial HVAC, refrigeration and construction','Aurora, Colorado','https://victoryci.com/','info@victoryci.com','Public website information describes Victory as a Colorado company providing commercial refrigeration and HVAC installation and service alongside general construction, plumbing, flooring and electrical work.'),
  demo('mwc-colorado-a10b','construction','MWC Construction','Commercial construction and site services','Denver, Colorado','https://mwccolorado.com/','Info@MWCcolorado.com','Public website information describes MWC Construction as a Denver commercial construction company providing concrete, landscaping, hydroseed and site services with a client-focused project-management approach.'),
  demo('sunrise-services-co-a10s','landscape','Sunrise Services','Landscape and construction services','Denver and Vail Valley, Colorado','https://sunriseservices.co/','info@sunriseservices.co','Public website information describes Sunrise Services as a full-service Colorado landscape company with more than 20 years of experience in landscaping, construction, maintenance, consultation, snow removal and grounds care.'),
];
