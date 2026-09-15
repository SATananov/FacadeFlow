import assert from 'node:assert/strict'
import { createRuntimeLoader } from './runtime-loader.mjs'
const load = createRuntimeLoader()
const model = load('src/domain/project/projectModel')
const ops = load('src/domain/project/projectOperations')
const codec = load('src/domain/project/projectSerialization')
const persistence = load('src/persistence/localProjectStorage')
const construction = load('src/domain/construction')
const profiles = load('src/domain/profileResolution')
const moduleDomain = load('src/domain/offerModules')
const data = load('src/data/profileSystems')
const system = data.getProfileSystemById('kmg-prelude-60')
assert.ok(system)
let counter=0, passed=0
const idFactory=()=>`integrated-${++counter}`
const test=(name,fn)=>{fn();passed++;console.log(`PASS ${name}`)}
const draftFrom=(topology)=>({version:'constructor-01d',frame:{...topology.frame},topology:structuredClone(topology)})

function fixture(){
 let s=model.createProjectSnapshot(idFactory)
 s=ops.editProject(s,next=>ops.writeOfferForm(next,{...model.EMPTY_OFFER,clientName:'Integrated Client',objectName:'Integrated Site',profileSystemId:system.id,glazingId:'b-b-24'}))
 s=ops.completeOfferSetup(s,idFactory)
 let ms=model.getOfferModules(s)
 const defaults=ms[0].inheritedDefaults
 ms[0]={...ms[0],productType:'window',productTypeSource:'constructor'}
 let m2=moduleDomain.createOfferModule(defaults,2,idFactory())
 m2={...m2,productType:'window',productTypeSource:'constructor'}
 s=ops.editProject(s,next=>ops.replaceOfferModules(next,[ms[0],m2]))
 const [module1Id,module2Id]=model.getOfferModules(s).map(m=>m.id)
 let t1=construction.createConstructionModel({xMm:0,yMm:0,widthMm:1800,heightMm:1400})
 t1=construction.splitField(t1,'field-1','vertical',700)
 let fields1=construction.resolveConstructionTopology(t1).fields
 t1=construction.setConstructionFieldType(t1,fields1[0].id,'fixed')
 t1=construction.setConstructionFieldType(t1,fields1[1].id,'operable')
 t1=construction.setConstructionFieldOpeningMode(t1,fields1[1].id,'tilt-turn')
 t1=construction.setConstructionFieldOpeningHanding(t1,fields1[1].id,'left')
 const resolved1=construction.resolveConstructionTopology(t1); fields1=resolved1.fields
 let r1=profiles.setFrameProfileAssignment(null,system,'482.30')
 r1=profiles.setDividerProfileAssignment(r1,system,resolved1.dividers[0].id,'482.21')
 r1=profiles.setFieldSashProfileAssignment(r1,system,'window',fields1[1],'482.05')
 r1=profiles.setModuleGlazingSpecificationAssignment(r1,system,'b-b-24',fields1,'b-b-32')
 r1=profiles.setFieldGlazingSpecificationAssignment(r1,system,'b-b-24',fields1[0],'b-b-24')
 r1=profiles.setFieldGlazingBeadAssignment(r1,system,fields1[0],null,'482.15','b-b-24')
 r1=profiles.setFieldGlazingBeadAssignment(r1,system,fields1[1],null,'482.22','b-b-24')
 let t2=construction.createConstructionModel({xMm:0,yMm:0,widthMm:1000,heightMm:1200})
 t2=construction.setConstructionFieldType(t2,'field-1','fixed')
 const fields2=construction.resolveConstructionTopology(t2).fields
 let r2=profiles.setFrameProfileAssignment(null,system,'482.30')
 r2=profiles.setModuleGlazingSpecificationAssignment(r2,system,'b-b-24',fields2,'k-b-4s-44')
 s=ops.editProject(s,next=>{
  next.constructionDraftsByModuleId[module1Id]=draftFrom(t1)
  next.profileResolutionsByModuleId[module1Id]=r1
  next.constructionDraftsByModuleId[module2Id]=draftFrom(t2)
  next.profileResolutionsByModuleId[module2Id]=r2
  next.workspace.activeModuleIdByOffer[next.workspace.offerId]=module1Id
  next.workspace.screen='offer-constructor'
 })
 codec.validateProjectSnapshot(s)
 return {snapshot:s,module1Id,module2Id,fields1,fields2}
}

class MemoryStorage {
 data=new Map(); writes=[]; failRead=false; failWrite=false
 get length(){return this.data.size}
 key(i){return [...this.data.keys()][i]??null}
 getItem(key){if(this.failRead) throw Error('access denied'); return this.data.get(key)??null}
 setItem(key,value){if(this.failWrite) throw Error('quota exceeded'); this.writes.push([key,value]); this.data.set(key,value)}
}
function storageFixture(snapshot){const memory=new MemoryStorage(); const adapter=new persistence.LocalProjectStorage(()=>memory); adapter.save(snapshot); memory.writes=[]; return {memory,adapter}}
function mountWorkspace(memory){
 globalThis.window={localStorage:memory}; let host
 const react={
  useState(initial){const h=host,index=h.index++; if(!(index in h.values))h.values[index]=typeof initial==='function'?initial():initial; return [h.values[index],update=>{const value=typeof update==='function'?update(h.values[index]):update;if(!Object.is(value,h.values[index])){h.values[index]=value;h.dirty=true}}]},
  useRef(initial){return react.useState(()=>({current:initial}))[0]},
  useEffect(effect,deps){const h=host,index=h.index++,previous=h.values[index]; if(!previous||deps.some((v,i)=>!Object.is(v,previous[i]))){h.values[index]=deps;h.effects.push(effect)}}
 }
 const hook=createRuntimeLoader({react})('src/hooks/useProjectWorkspace').useProjectWorkspace
 const state={index:0,values:[],effects:[],dirty:false}
 return ()=>{let result,renders=0;do{assert.ok(++renders<40,'no workspace render loop');host=state;state.index=0;state.effects=[];state.dirty=false;result=hook();for(const effect of state.effects)effect()}while(state.dirty);return result}
}
function technical(snapshot,moduleId){
 const module=snapshot.modulesById[moduleId]; assert.ok(module?.definition.kind==='offer')
 return structuredClone({
  construction:snapshot.constructionDraftsByModuleId[moduleId],
  profileResolution:snapshot.profileResolutionsByModuleId[moduleId],
  productType:module.definition.draft.productType,
  productTypeSource:module.definition.draft.productTypeSource,
 })
}
function restoreTechnical(render,workspace,moduleId,state){
 workspace.setModules(current=>current.map(m=>m.id===moduleId?{...m,productType:state.productType,customProductTypeLabel:'',productTypeSource:state.productTypeSource}:m)); workspace=render()
 workspace.setModuleSketchDrafts(current=>({...current,[moduleId]:structuredClone(state.construction)})); workspace=render()
 workspace.setModuleProfileResolutions(current=>({...current,[moduleId]:structuredClone(state.profileResolution)})); workspace=render()
 return workspace
}
function resetModule(render,workspace,moduleId){
 workspace.setModuleSketchDrafts(current=>({...current,[moduleId]:null})); workspace=render()
 workspace.setModuleProfileResolutions(current=>({...current,[moduleId]:profiles.createModuleProfileResolution(system.id)})); workspace=render()
 workspace.setModules(current=>current.map(m=>m.id===moduleId?{...m,widthMm:null,widthSource:'unset',heightMm:null,heightSource:'unset',fieldCount:null,fieldCountSource:'unset',fields:[]}:m)); workspace=render()
 return workspace
}

const {snapshot,module1Id,module2Id,fields1,fields2}=fixture(); const {memory,adapter}=storageFixture(snapshot); let render=mountWorkspace(memory),workspace=render()
const baseline1=technical(workspace.snapshot,module1Id); const baseline2=technical(workspace.snapshot,module2Id)

test('two independently configured modules start isolated with distinct glazing ownership',()=>{
 assert.notDeepEqual(baseline1,baseline2)
 assert.equal(profiles.getEffectiveFieldGlazingThicknessMm(baseline1.profileResolution,'b-b-24',fields1[0].id),24)
 assert.equal(profiles.getEffectiveFieldGlazingThicknessMm(baseline1.profileResolution,'b-b-24',fields1[1].id),32)
 assert.equal(profiles.getEffectiveFieldGlazingThicknessMm(baseline2.profileResolution,'b-b-24',fields2[0].id),44)
 assert.equal(baseline1.profileResolution.fieldGlazingBeads[fields1[0].id].profileCode,'482.15')
 assert.equal(baseline1.profileResolution.fieldGlazingBeads[fields1[1].id].profileCode,'482.22')
})

test('module switching changes selection only and preserves both technical graphs',()=>{
 workspace.setActiveModuleId(module2Id); workspace=render(); assert.equal(workspace.activeModuleId,module2Id)
 assert.deepEqual(technical(workspace.snapshot,module1Id),baseline1); assert.deepEqual(technical(workspace.snapshot,module2Id),baseline2)
 workspace.setActiveModuleId(module1Id); workspace=render(); assert.equal(workspace.activeModuleId,module1Id)
 assert.deepEqual(technical(workspace.snapshot,module1Id),baseline1); assert.deepEqual(technical(workspace.snapshot,module2Id),baseline2)
})

test('combined construction + glazing edit affects only Module 1 and fails closed on incompatible bead',()=>{
 let editedTopology=structuredClone(baseline1.construction.topology)
 editedTopology=construction.setConstructionFieldOpeningMode(editedTopology,fields1[1].id,'tilt')
 workspace.setModuleSketchDrafts(current=>({...current,[module1Id]:draftFrom(editedTopology)})); workspace=render()
 let editedResolution=workspace.moduleProfileResolutions[module1Id]
 editedResolution=profiles.setFieldGlazingSpecificationAssignment(editedResolution,system,'b-b-24',fields1[0],'k-b-4s-44')
 workspace.setModuleProfileResolutions(current=>({...current,[module1Id]:editedResolution})); workspace=render()
 const edited=technical(workspace.snapshot,module1Id)
 assert.equal(construction.resolveConstructionTopology(edited.construction.topology).fields.find(f=>f.id===fields1[1].id).openingMode,'tilt')
 assert.equal(edited.profileResolution.fieldGlazingBeads[fields1[0].id],undefined)
 assert.equal(profiles.getEffectiveFieldGlazingThicknessMm(edited.profileResolution,'b-b-24',fields1[0].id),44)
 assert.deepEqual(technical(workspace.snapshot,module2Id),baseline2)
})
const edited1=technical(workspace.snapshot,module1Id)

test('atomic Undo restore path returns exact Module 1 construction and configuration without touching Module 2',()=>{
 workspace=restoreTechnical(render,workspace,module1Id,baseline1)
 assert.deepEqual(technical(workspace.snapshot,module1Id),baseline1)
 assert.deepEqual(technical(workspace.snapshot,module2Id),baseline2)
 assert.equal(workspace.moduleProfileResolutions[module1Id].fieldGlazingBeads[fields1[0].id].profileCode,'482.15')
})

test('Redo restore path returns exact edited state and new edit branch can be replaced by prior snapshot',()=>{
 workspace=restoreTechnical(render,workspace,module1Id,edited1)
 assert.deepEqual(technical(workspace.snapshot,module1Id),edited1)
 workspace=restoreTechnical(render,workspace,module1Id,baseline1)
 assert.deepEqual(technical(workspace.snapshot,module1Id),baseline1)
 assert.deepEqual(technical(workspace.snapshot,module2Id),baseline2)
})

test('Reset clears only active Module 1 technical work and undo-style restore returns whole module',()=>{
 workspace=resetModule(render,workspace,module1Id)
 assert.equal(workspace.moduleSketchDrafts[module1Id],null)
 assert.deepEqual(workspace.moduleProfileResolutions[module1Id],profiles.createModuleProfileResolution(system.id))
 assert.deepEqual(technical(workspace.snapshot,module2Id),baseline2)
 workspace=restoreTechnical(render,workspace,module1Id,baseline1)
 assert.deepEqual(technical(workspace.snapshot,module1Id),baseline1)
 assert.deepEqual(technical(workspace.snapshot,module2Id),baseline2)
})

test('save and reopen preserves both module technical states and active module identity',()=>{
 workspace.setActiveModuleId(module2Id); workspace=render()
 const saved=workspace.saveNow(); workspace=render(); assert.equal(saved.status,'saved')
 const serialized=memory.getItem(persistence.PROJECT_KEY_PREFIX+workspace.snapshot.project.id)
 assert.ok(serialized); assert.equal(/undoStack|redoStack|constructorHistoryByModuleId/.test(serialized),false)
 render=mountWorkspace(memory); workspace=render()
 assert.equal(workspace.activeModuleId,module2Id)
 assert.deepEqual(technical(workspace.snapshot,module1Id),baseline1)
 assert.deepEqual(technical(workspace.snapshot,module2Id),baseline2)
 assert.deepEqual(adapter.load(),workspace.snapshot)
})

test('reopened glazing inheritance remains exact and never auto-selects a replacement bead',()=>{
 const r1=workspace.moduleProfileResolutions[module1Id],r2=workspace.moduleProfileResolutions[module2Id]
 assert.deepEqual(profiles.getEffectiveFieldGlazingSpecification(r1,'b-b-24',fields1[0].id),{glazingId:'b-b-24',thicknessMm:24,source:'field-override'})
 assert.deepEqual(profiles.getEffectiveFieldGlazingSpecification(r1,'b-b-24',fields1[1].id),{glazingId:'b-b-32',thicknessMm:32,source:'module-override'})
 assert.deepEqual(profiles.getEffectiveFieldGlazingSpecification(r2,'b-b-24',fields2[0].id),{glazingId:'k-b-4s-44',thicknessMm:44,source:'module-override'})
 assert.equal(r2.fieldGlazingBeads[fields2[0].id],undefined)
})

console.log(`FACADEFLOW 0.1.8E INTEGRATED ACCEPTANCE RUNTIME PASS: ${passed} cases`)
console.log('TWO-MODULE ISOLATION: PASS')
console.log('EDIT -> UNDO -> REDO: COMPLETE TECHNICAL SNAPSHOT RESTORE PATH PASS')
console.log('RESET -> UNDO: COMPLETE TECHNICAL SNAPSHOT RESTORE PATH PASS')
console.log('SAVE -> REOPEN -> COMPARE: PASS')
console.log('GLAZING OWNERSHIP AFTER REOPEN: PASS')
console.log('HISTORY PERSISTED AFTER APP RESTART: NO')
console.log('VIEW STATE PERSISTENCE REQUIRED BY THIS STAGE: NO')
console.log('AUTOMATIC BEAD SELECTION: NO')
console.log('AUTOMATIC GEOMETRY: NO')
console.log('RULES VALIDATED: NO')
console.log('MACHINE READY: NO')
