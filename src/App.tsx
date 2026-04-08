import { useState, useEffect, useMemo, useRef } from "react";
import { readTextFile, writeTextFile, BaseDirectory, exists } from "@tauri-apps/plugin-fs";
import "./App.css";

type Status = "Planning" | "Applied" | "Interview" | "Offer" | "Rejected" | "Waitlist";
type Priority = "Low" | "Medium" | "High";
type RefStatus = "Not asked" | "Requested" | "Submitted";

interface Referee { id:string; name:string; email:string }
interface AppRef { refId:string; status:RefStatus }
interface Application {
  id:string; university:string; department:string; program:string; deadline:string;
  status:Status; priority:Priority; funding:string; supervisor:string; email:string;
  link:string; notes:string; tags:string[]; refs:AppRef[]; createdAt:string; updatedAt:string;
}

const EMPTY = { university:"",department:"",program:"",deadline:"",status:"Planning" as Status,priority:"Medium" as Priority,
  funding:"",supervisor:"",email:"",link:"",notes:"",tags:[] as string[],refs:[] as AppRef[] };

const DATA_FILE = "phd-tracker-data.json";

export default function App(){
  const [apps,setApps]=useState<Application[]>([]);
  const [refs,setRefs]=useState<Referee[]>([]);
  const [form,setForm]=useState(EMPTY);
  const [editing,setEditing]=useState<string|null>(null);
  const [q,setQ]=useState(""); const [fStatus,setFStatus]=useState<Status|"All">("All");
  const [fPriority,setFPriority]=useState<Priority|"All">("All");
  const [theme,setTheme]=useState<"dark"|"light">("dark");
  const [newRef,setNewRef]=useState({name:"",email:""});
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    (async ()=>{
      try{
        const ok = await exists(DATA_FILE, { baseDir: BaseDirectory.Document });
        if(ok){
          const txt = await readTextFile(DATA_FILE, { baseDir: BaseDirectory.Document });
          const data = JSON.parse(txt);
          setApps(data.apps||[]); setRefs(data.refs||[]);
        } else {
          const a = localStorage.getItem("phd-apps-v4"); if(a) setApps(JSON.parse(a));
          const r = localStorage.getItem("phd-refs"); if(r) setRefs(JSON.parse(r)); else setRefs([
            {id:"1",name:"Prof. A. Smith",email:"smith@uni.ac.uk"},
            {id:"2",name:"Dr. B. Lee",email:"lee@inst.edu"}
          ]);
        }
      }catch{}
      const t = localStorage.getItem("phd-theme") as any; if(t) setTheme(t);
    })();
  },[]);

  useEffect(()=>{
    writeTextFile(DATA_FILE, JSON.stringify({apps,refs},null,2), { baseDir: BaseDirectory.Document }).catch(()=>{});
  },[apps,refs]);
  useEffect(()=>{ localStorage.setItem("phd-theme",theme); document.documentElement.setAttribute("data-theme",theme); },[theme]);

  const daysLeft=(d:string)=> d? Math.ceil((new Date(d).getTime()-Date.now())/86400000):null;
  const dlText=(d:string)=>{ const dl=daysLeft(d); return dl===null?"":dl<0?`${Math.abs(dl)}d overdue`:dl===0?"Today":`${dl}d left`; };

  const filtered=useMemo(()=>{ let l=[...apps]; if(q){const qq=q.toLowerCase(); l=l.filter(a=> [a.university,a.department,a.program,a.supervisor,a.notes,...a.tags,...a.refs.map(r=>refs.find(x=>x.id===r.refId)?.name||"")].join(" ").toLowerCase().includes(qq));} if(fStatus!=="All") l=l.filter(a=>a.status===fStatus); if(fPriority!=="All") l=l.filter(a=>a.priority===fPriority); l.sort((a,b)=>(a.deadline||"9999").localeCompare(b.deadline||"9999")); return l; },[apps,q,fStatus,fPriority,refs]);
  const stats=useMemo(()=>{ const by=Object.fromEntries((["Planning","Applied","Interview","Offer","Rejected","Waitlist"] as Status[]).map(s=>[s,apps.filter(a=>a.status===s).length])); const due7=apps.filter(a=>{const dl=daysLeft(a.deadline); return dl!==null&&dl>=0&&dl<=7}).length; return {total:apps.length,by,due7}; },[apps]);

  const toggleRef=(refId:string)=>{ const ex=form.refs.find(r=>r.refId===refId); setForm({...form, refs: ex? form.refs.filter(r=>r.refId!==refId) : [...form.refs,{refId,status:"Not asked"}] }); };
  const setRefStatus=(refId:string,s:RefStatus)=> setForm({...form, refs: form.refs.map(r=>r.refId===refId?{...r,status:s}:r)});

  const save=()=>{ if(!form.university.trim()) return; const now=new Date().toISOString(); if(editing){ setApps(apps.map(a=>a.id===editing?{...a,...form,updatedAt:now}:a)); setEditing(null);} else { setApps([{...form,id:Date.now().toString(),createdAt:now,updatedAt:now},...apps]); } setForm(EMPTY); };

  const edit=(a:Application)=>{
    setEditing(a.id);
    setForm({
      university:a.university, department:a.department||"", program:a.program||"", deadline:a.deadline||"",
      status:a.status, priority:a.priority, funding:a.funding||"", supervisor:a.supervisor||"",
      email:a.email||"", link:a.link||"", notes:a.notes||"", tags:a.tags||[], refs:a.refs||[]
    });
    setTimeout(()=> formRef.current?.scrollIntoView({behavior:"smooth", block:"start"}), 80);
  };

  const del=(id:string)=>{ if(confirm("Delete?")) setApps(apps.filter(a=>a.id!==id)); };
  const addRef=()=>{ if(!newRef.name.trim()) return; setRefs([...refs,{id:Date.now().toString(),...newRef}]); setNewRef({name:"",email:""}); };
  const delRef=(id:string)=>{ if(confirm("Delete referee?")){ setRefs(refs.filter(r=>r.id!==id)); setApps(apps.map(a=>({...a,refs:a.refs.filter(r=>r.refId!==id)}))); } };

  const exportJSON=async()=>{
    const data = JSON.stringify({apps,refs},null,2);
    try{ await navigator.clipboard.writeText(data); alert("Copied to clipboard"); }catch{ prompt("Copy this:", data); }
  };
  const importJSON=()=>{
    const txt = prompt("Paste JSON"); if(!txt) return;
    try{ const d=JSON.parse(txt); setApps(d.apps||[]); setRefs(d.refs||[]); alert("Imported"); }catch{ alert("Invalid JSON"); }
  };

  return (
    <div className="wrap">
      <header><h1>PhD Tracker</h1><button className="theme" onClick={()=>setTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?"☀️":"🌙"}</button></header>

      <section className="refs-global">
        <div className="rg-head"><h2>Referees</h2><span>{refs.length} total</span></div>
        <div className="rg-list">{refs.map(r=><div key={r.id} className="rg-item"><div><b>{r.name}</b><span>{r.email}</span></div><button className="x" onClick={()=>delRef(r.id)}>×</button></div>)}</div>
        <div className="rg-add"><input placeholder="Name" value={newRef.name} onChange={e=>setNewRef({...newRef,name:e.target.value})}/><input placeholder="Email" value={newRef.email} onChange={e=>setNewRef({...newRef,email:e.target.value})}/><button onClick={addRef}>Add</button></div>
      </section>

      <section className="dash">
        <div className="stat"><b>{stats.total}</b><span>Total</span></div>
        {Object.entries(stats.by).map(([s,c])=><div key={s} className="stat"><b>{c}</b><span>{s}</span></div>)}
        <div className="stat warn"><b>{stats.due7}</b><span>Due ≤7d</span></div>
      </section>

      <section className="toolbar">
        <input placeholder="Search..." value={q} onChange={e=>setQ(e.target.value)} />
        <div className="filters">
          <button onClick={exportJSON}>Export JSON</button>
          <button onClick={importJSON}>Import JSON</button>
          <select value={fStatus} onChange={e=>setFStatus(e.target.value as any)}><option>All</option><option>Planning</option><option>Applied</option><option>Interview</option><option>Waitlist</option><option>Offer</option><option>Rejected</option></select>
          <select value={fPriority} onChange={e=>setFPriority(e.target.value as any)}><option>All</option><option>High</option><option>Medium</option><option>Low</option></select>
        </div>
      </section>

      <section className="form" ref={formRef}>
        {editing && <div className="editing-banner">Editing: {form.university}</div>}
        <input placeholder="University *" value={form.university} onChange={e=>setForm({...form,university:e.target.value})} />
        <div className="grid2"><input placeholder="Department" value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/><input placeholder="Program" value={form.program} onChange={e=>setForm({...form,program:e.target.value})}/></div>
        <div className="grid3"><input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/><select value={form.status} onChange={e=>setForm({...form,status:e.target.value as Status})}><option>Planning</option><option>Applied</option><option>Interview</option><option>Waitlist</option><option>Offer</option><option>Rejected</option></select><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value as Priority})}><option>Low</option><option>Medium</option><option>High</option></select></div>

        <div className="sec">Assign Referees</div>
        <div className="ref-pick">
          {refs.map(r=>{ const sel=form.refs.find(x=>x.refId===r.id); return (
            <div key={r.id} className={`rp ${sel?"on":""}`}>
              <label className="rp-main">
                <input type="checkbox" checked={!!sel} onChange={()=>toggleRef(r.id)}/>
                <span className="rp-name" title={r.email}>{r.name}</span>
              </label>
              {sel && <select className="rp-status" value={sel.status} onChange={e=>setRefStatus(r.id,e.target.value as RefStatus)}><option>Not asked</option><option>Requested</option><option>Submitted</option></select>}
            </div>
          )})}
        </div>

        <div className="grid2"><input placeholder="Funding" value={form.funding} onChange={e=>setForm({...form,funding:e.target.value})}/><input placeholder="Supervisor" value={form.supervisor} onChange={e=>setForm({...form,supervisor:e.target.value})}/></div>
        <input placeholder="Tags (comma separated)" value={form.tags.join(", ")} onChange={e=>setForm({...form,tags:e.target.value.split(",").map(t=>t.trim()).filter(Boolean)})}/>
        <textarea placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={3}/>
        <div className="form-actions"><button className="primary" onClick={save}>{editing?"Update Application":"Add Application"}</button>{editing&&<button onClick={()=>{setEditing(null);setForm(EMPTY);}}>Cancel</button>}</div>
      </section>

      <section className="list">
        {filtered.map(a=>{ const sub=a.refs.filter(r=>r.status==="Submitted").length; return (
          <div key={a.id} className={`card p-${a.priority.toLowerCase()}`}>
            <div className="head"><div><strong>{a.university}</strong><div className="sub">{[a.department,a.program].filter(Boolean).join(" • ")}</div></div><span className={`badge ${a.status.toLowerCase()}`}>{a.status}</span></div>
            {a.deadline&&<div className="meta">Deadline: {a.deadline} • {dlText(a.deadline)}</div>}
            {a.refs.length>0&&<div className="meta">Referees: {sub}/{a.refs.length} submitted</div>}
            <div className="actions"><button onClick={()=>edit(a)}>Edit</button><button onClick={()=>del(a.id)} className="danger">Delete</button></div>
          </div>
        )})}
      </section>
    </div>
  );
}
