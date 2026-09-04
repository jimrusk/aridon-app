export const dynamic='force-dynamic';
export async function GET(){return Response.json({utilityName:process.env.NEXT_PUBLIC_UTILITY_NAME||'Aridon GridOS Utility',utilityId:process.env.NEXT_PUBLIC_UTILITY_ID||'demo',region:process.env.NEXT_PUBLIC_REGION||'',deploymentMode:process.env.NEXT_PUBLIC_DEPLOYMENT_MODE||'dedicated',controlActionsEnabled:process.env.GRIDOS_ALLOW_CONTROL_ACTIONS==='true'})}
