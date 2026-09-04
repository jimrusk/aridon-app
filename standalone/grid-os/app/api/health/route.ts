export const dynamic='force-dynamic';
export async function GET(){return Response.json({ok:true,service:'aridon-gridos-utility',mode:process.env.NEXT_PUBLIC_DEPLOYMENT_MODE||'dedicated',controlActionsEnabled:process.env.GRIDOS_ALLOW_CONTROL_ACTIONS==='true'})}
