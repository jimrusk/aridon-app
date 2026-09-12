import Link from 'next/link';

export default function OpportunityMapLayout({children}:{children:React.ReactNode}){
  return <>
    {children}
    <Link href="/opportunity-map/closing-guide" style={{position:'fixed',right:16,bottom:16,zIndex:40,textDecoration:'none',background:'#9EF0CF',color:'#052019',fontFamily:'Arial,sans-serif',fontWeight:950,fontSize:12,padding:'12px 15px',borderRadius:999,boxShadow:'0 12px 34px rgba(0,0,0,.35)'}}>50-State Closing Guide</Link>
  </>;
}
