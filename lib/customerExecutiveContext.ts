type DbClient = any;

type Tenant = {
  id: string;
  business_name?: string | null;
  industry?: string | null;
  plan?: string | null;
  status?: string | null;
};

export async function loadCustomerExecutiveContext(db: DbClient, tenant: Tenant) {
  const [projectsResult, tasksResult, knowledgeResult, memoriesResult, reflectionsResult] = await Promise.all([
    db.from('customer_projects').select('id,name,description,status,created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(20),
    db.from('customer_tasks').select('id,title,owner,priority,status,created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(40),
    db.from('customer_knowledge').select('id,title,category,content,created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(30),
    db.from('customer_executive_memories').select('executive_id,memory_type,summary,confidence,source,last_reinforced_at').eq('tenant_id', tenant.id).order('last_reinforced_at', { ascending: false }).limit(30),
    db.from('customer_executive_reflections').select('executive_id,reflection,confidence,created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(20),
  ]);

  if (projectsResult.error) throw projectsResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (knowledgeResult.error) throw knowledgeResult.error;
  if (memoriesResult.error) throw memoriesResult.error;
  if (reflectionsResult.error) throw reflectionsResult.error;

  const projects = projectsResult.data || [];
  const tasks = tasksResult.data || [];
  const knowledge = (knowledgeResult.data || []).map((item: any) => ({
    ...item,
    content: typeof item.content === 'string' ? item.content.slice(0, 3500) : '',
  }));
  const executiveMemories = (memoriesResult.data || []).map((item: any) => ({
    ...item,
    summary: typeof item.summary === 'string' ? item.summary.slice(0, 1800) : '',
  }));
  const executiveReflections = (reflectionsResult.data || []).map((item: any) => ({
    ...item,
    reflection: typeof item.reflection === 'string' ? item.reflection.slice(0, 1800) : '',
  }));

  const approvalPolicyItem = knowledge.find((item: any) => item.title === 'Aridon Approval Policy');
  const approvalPolicy = approvalPolicyItem?.content || 'Research, analysis, internal planning, drafting, prioritization, and reversible internal work are allowed without owner approval. Use reasonable business judgment and proceed instead of asking clarifying questions when a safe assumption is available. External sends, spending, signatures, commitments, consequential claims, security changes, public publishing, destructive changes, and permanent deletion require owner approval.';

  const context = JSON.stringify({
    business: tenant.business_name || '',
    industry: tenant.industry || '',
    plan: tenant.plan || '',
    projects,
    tasks,
    knowledge,
    executiveMemories,
    executiveReflections,
    approvalPolicy,
  }, null, 2).slice(0, 44000);

  return { projects, tasks, knowledge, executiveMemories, executiveReflections, approvalPolicy, context };
}