export function playgroundSections(pages){
 const sections=[];
 pages.forEach((page,start)=>{const marker=page.find(step=>step.kind==='section');if(marker&&!sections.some(s=>s.id===marker.id))sections.push({...marker,start});});
 return sections.map((section,index)=>({...section,end:(sections[index+1]?.start??pages.length)-1}));
}
