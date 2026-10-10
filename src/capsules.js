// Only categories with complete, usable gameplay assets are sold.
export const CAPSULE_COLORS=Object.freeze([
  {name:'Cyan',file:'cyan',color:'#65e8ff'},
  {name:'Violet',file:'violet',color:'#bd73ff'},
  {name:'Or',file:'or',color:'#ffcf65'},
  {name:'Rouge',file:'rouge',color:'#ff4b4b'}
]);
export const CAPSULE_CATALOG=Object.freeze([
  {id:'noyau',label:'Noyau',type:'ball',models:[['epine','Épine'],['orbital','Orbital'],['reacteur','Réacteur']]},
  {id:'propulsion',label:'Propulsion',type:'propulsion',models:[['aile','Aile'],['comete','Comète'],['orbite','Orbite'],['triple','Triple']]},
  {id:'impact',label:'Impact',type:'impact',models:[['fracture','Fracture'],['orbite','Orbite'],['percee','Percée'],['vortex','Vortex']]},
  {id:'style',label:'Style',type:'style',models:[['aura','Aura'],['crete','Crête'],['epaulieres','Épaulières'],['halo','Halo']]}
].map(category=>Object.freeze({...category,price:200,image:`assets/capsules/capsule_${category.id}.png`,models:Object.freeze(category.models.map(([model,label])=>Object.freeze({id:`capsule-${category.id}-${model}`,model,label,type:category.type,capsuleCategory:category.id})))})));
export function capsuleCategory(id){return CAPSULE_CATALOG.find(category=>category.id===id);}
export function capsuleModel(item){return capsuleCategory(item?.capsuleCategory)?.models.find(model=>model.id===item.id);}
export function capsuleImage(item,palette=item?.palette??0){
  const model=capsuleModel(item),color=CAPSULE_COLORS[palette]?.file;
  if(!model||!color)return null;
  // Existing asset has a double dot; keep its exact name without renaming user art.
  const suffix=model.capsuleCategory==='style'&&model.model==='aura'&&color==='cyan'?'..png':'.png';
  return `assets/capsules/${model.capsuleCategory}/${model.capsuleCategory}_${model.model}_${color}${suffix}`;
}
export function capsuleAssetKey(item){return capsuleModel(item)?`${item.id}-${item.palette??0}`:null;}
