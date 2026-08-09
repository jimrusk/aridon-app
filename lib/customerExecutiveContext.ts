type DbClient = any;

type Tenant = {
  id: string;
  business_name?: string | null;
  industry?: string | null;
  plan?: string | null;
  status?: string | null;
};

export async function loadCustomerExecutiveContext(db: DbClient, tenant: Tenant) {
  const [projectsResult, tasksResult, knowledgeResult] = await Promise.all([
    db.from('customer_projects').select('id,name,description,status,created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(20),
    db.from('customer_tasks').select('id,title,owner,priority,status,created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(40),
    db.from('customer_knowledge').select('id,title,category,content,created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(30),
  ]);

  if (projectsResult.error) throw projectsResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (knowledgeResult.error) throw knowledgeResult.error;

  const projects = projectsResult.data || [];
  const tasks = tasksResult.data || [];
  const knowledge = (knowledgeResult.data || []).map((item: any) => ({
    ...item,
    content: typeof item.content === 'string' ? item.content.slice(0, 3500) : '',
  }));

  const approvalPolicyItem = knowledge.find((item: any) => item.title === 'Aridon Approval Policy');
  const approvalPolicy = approvalPolicyItem?.content || 'Research, analysis, internal planning, and drafting are allowed. External sends, spending, signatures, commitments, consequential claims, and permanent deletion require owner approval.';

  const context = JSON.stringify({
    business: tenant.business_name || '',
    industry: tenant.industry || '',
    plan: tenant.plan || '',
    projects,
    tasks,
    knowledge,
    approvalPolicy,
  }, null, 2).slice(0, 36000);

  return { projects, tasks, knowledge, approvalPolicy, context };
}
