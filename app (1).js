(function(){
  "use strict";

  const CATEGORIES = ["Roads & Potholes","Water Supply","Street Lighting","Sanitation & Waste","Electricity","Drainage & Sewage","Stray Animals","Parks & Public Spaces","Public Safety","Other"];

  const OFFICERS = [
    {name:"Rakesh Meena", designation:"Junior Engineer", dept:"Roads & Infrastructure", phone:"+91 98290 11234", email:"r.meena@jaipurmc.gov.in"},
    {name:"Sunita Rathore", designation:"Assistant Engineer", dept:"Water Supply", phone:"+91 98280 22345", email:"s.rathore@jaipurmc.gov.in"},
    {name:"Vikram Choudhary", designation:"Field Inspector", dept:"Electricity & Lighting", phone:"+91 97991 33456", email:"v.choudhary@jaipurmc.gov.in"},
    {name:"Anjali Sharma", designation:"Sanitation Officer", dept:"Sanitation & Waste", phone:"+91 94140 44567", email:"a.sharma@jaipurmc.gov.in"},
    {name:"Devendra Singh", designation:"Junior Engineer", dept:"Drainage & Sewage", phone:"+91 98870 55678", email:"d.singh@jaipurmc.gov.in"},
    {name:"Pooja Yadav", designation:"Ward Officer", dept:"Public Spaces & Safety", phone:"+91 93520 66789", email:"p.yadav@jaipurmc.gov.in"},
  ];

  function pad(n){ return String(n).padStart(5,"0"); }
  let ticketSeq = 4821;

  function makeTimeline(status){
    const base = [
      {key:"filed", title:"Filed", note:"Grievance registered by citizen."},
      {key:"ack", title:"Acknowledged", note:"Reviewed and assigned to ward office."},
      {key:"progress", title:"In progress", note:"Field team scheduled for inspection."},
      {key:"resolved", title:"Resolved", note:"Issue fixed and verified on site."}
    ];
    const order = ["filed","ack","progress","resolved"];
    const cutoff = order.indexOf(status);
    return base.map((step,i)=>{
      let cls = "";
      if(i < cutoff) cls = "done";
      else if(i === cutoff) cls = status==="resolved" ? "done" : "active";
      return {...step, cls};
    });
  }

  function daysAgo(n){
    const d = new Date(2026,9,15);
    d.setDate(d.getDate()-n);
    return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  }

  function officerFor(index, status){
    if(status === "filed") return null; // not yet assigned
    return OFFICERS[index % OFFICERS.length];
  }

  // seed data
  let ledger = [
    {id:"SNW-2026-04821", title:"Deep pothole blocking left lane", cat:"Roads & Potholes", loc:"Vaishali Nagar", status:"progress", supports:34, filedAgo:5},
    {id:"SNW-2026-04790", title:"No water supply for 4 days", cat:"Water Supply", loc:"Mansarovar", status:"ack", supports:61, filedAgo:7},
    {id:"SNW-2026-04655", title:"Streetlight pole fallen after storm", cat:"Street Lighting", loc:"Malviya Nagar", status:"resolved", supports:19, filedAgo:14},
    {id:"SNW-2026-04702", title:"Garbage not collected for a week", cat:"Sanitation & Waste", loc:"Jagatpura", status:"filed", supports:27, filedAgo:2},
    {id:"SNW-2026-04588", title:"Open drain near school gate", cat:"Drainage & Sewage", loc:"C-Scheme", status:"resolved", supports:48, filedAgo:20},
    {id:"SNW-2026-04733", title:"Transformer sparking on main road", cat:"Electricity", loc:"Raja Park", status:"progress", supports:52, filedAgo:4},
    {id:"SNW-2026-04810", title:"Stray dog pack near park entrance", cat:"Stray Animals", loc:"Sanganer", status:"filed", supports:15, filedAgo:1},
    {id:"SNW-2026-04670", title:"Park benches broken, unsafe for kids", cat:"Parks & Public Spaces", loc:"Civil Lines", status:"ack", supports:22, filedAgo:9},
  ];
  ledger.forEach((g,i)=>{ g.officer = officerFor(i, g.status); });

  let votedIds = new Set();

  const statusLabel = {filed:"Filed", ack:"Acknowledged", progress:"In progress", resolved:"Resolved"};
  const statusPillClass = {filed:"filed", ack:"filed", progress:"progress", resolved:"resolved"};

  // ---- stats ----
  function renderStats(){
    document.getElementById("statTotal").textContent = ledger.length;
    document.getElementById("statResolved").textContent = ledger.filter(g=>g.status==="resolved").length;
  }

  // ---- filters state ----
  let activeStatus = "all";
  let activeCat = "all";
  let searchTerm = "";

  function buildFilters(){
    const statusWrap = document.getElementById("statusFilters");
    const statuses = [["all","All statuses"],["filed","Filed"],["ack","Acknowledged"],["progress","In progress"],["resolved","Resolved"]];
    statusWrap.innerHTML = statuses.map(([key,label])=>
      `<button class="chip${key===activeStatus?' active':''}" data-status="${key}">${label}</button>`
    ).join("");
    statusWrap.querySelectorAll(".chip").forEach(btn=>{
      btn.addEventListener("click",()=>{ activeStatus = btn.dataset.status; buildFilters(); renderLedger(); });
    });

    const catWrap = document.getElementById("categoryFilters");
    const cats = ["all", ...CATEGORIES];
    catWrap.innerHTML = cats.map(c=>
      `<button class="chip${c===activeCat?' active':''}" data-cat="${c}">${c==="all"?"All categories":c}</button>`
    ).join("");
    catWrap.querySelectorAll(".chip").forEach(btn=>{
      btn.addEventListener("click",()=>{ activeCat = btn.dataset.cat; buildFilters(); renderLedger(); });
    });
  }

  function officerCellHTML(g){
    if(!g.officer){
      return `<span class="officer-unassigned">Unassigned</span>`;
    }
    return `
      <button class="officer-btn" data-id="${g.id}">
        <span class="officer-name">${g.officer.name}</span>
        <span class="officer-dept">${g.officer.dept}</span>
      </button>
    `;
  }

  function renderLedger(){
    const body = document.getElementById("ledgerBody");
    const headRow = document.getElementById("ledgerHeadRow");
    let rows = ledger.filter(g=>{
      if(activeStatus !== "all" && g.status !== activeStatus) return false;
      if(activeCat !== "all" && g.cat !== activeCat) return false;
      if(searchTerm){
        const t = (g.title+" "+g.loc).toLowerCase();
        if(!t.includes(searchTerm.toLowerCase())) return false;
      }
      return true;
    });

    if(rows.length === 0){
      headRow.style.display = "none";
      body.innerHTML = `<div class="empty-state">No grievances match these filters yet.</div>`;
      return;
    }
    headRow.style.display = "block";
    body.innerHTML = rows.map(g=>`
      <div class="ledger-row">
        <div class="col-id">${g.id}</div>
        <div class="col-title">${g.title}</div>
        <div class="col-loc">${g.loc}</div>
        <div><span class="status-pill ${statusPillClass[g.status]}">${statusLabel[g.status]}</span></div>
        <div class="col-officer">${officerCellHTML(g)}</div>
        <button class="support-btn${votedIds.has(g.id)?' voted':''}" data-id="${g.id}">▲ ${g.supports}</button>
      </div>
    `).join("");

    body.querySelectorAll(".support-btn").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const id = btn.dataset.id;
        const entry = ledger.find(g=>g.id===id);
        if(votedIds.has(id)){
          votedIds.delete(id); entry.supports--;
        } else {
          votedIds.add(id); entry.supports++;
        }
        renderLedger();
      });
    });

    body.querySelectorAll(".officer-btn").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const id = btn.dataset.id;
        const entry = ledger.find(g=>g.id===id);
        if(entry && entry.officer) openOfficerModal(entry);
      });
    });
  }

  document.getElementById("searchInput").addEventListener("input",(e)=>{
    searchTerm = e.target.value;
    renderLedger();
  });

  // ---- officer detail modal ----
  const officerModal = document.getElementById("officerModal");
  const officerModalBody = document.getElementById("officerModalBody");

  function openOfficerModal(entry){
    const o = entry.officer;
    officerModalBody.innerHTML = `
      <div class="officer-modal-head">
        <div class="officer-avatar">${o.name.split(" ").map(p=>p[0]).join("").slice(0,2)}</div>
        <div>
          <h3>${o.name}</h3>
          <div class="officer-role">${o.designation} · ${o.dept}</div>
        </div>
      </div>
      <dl class="officer-detail-list">
        <div><dt>Assigned ticket</dt><dd>${entry.id}</dd></div>
        <div><dt>Phone</dt><dd>${o.phone}</dd></div>
        <div><dt>Email</dt><dd>${o.email}</dd></div>
        <div><dt>Department</dt><dd>${o.dept}</dd></div>
      </dl>
    `;
    officerModal.classList.add("show");
    officerModal.setAttribute("aria-hidden","false");
  }
  function closeOfficerModal(){
    officerModal.classList.remove("show");
    officerModal.setAttribute("aria-hidden","true");
  }
  officerModal.addEventListener("click",(e)=>{
    if(e.target === officerModal || e.target.closest("[data-close-modal]")) closeOfficerModal();
  });
  document.addEventListener("keydown",(e)=>{
    if(e.key === "Escape") closeOfficerModal();
  });

  // ---- filing form ----
  const fileForm = document.getElementById("fileForm");
  const confirmPanel = document.getElementById("confirmPanel");

  fileForm.addEventListener("submit", function(e){
    e.preventDefault();
    const category = document.getElementById("category").value;
    const title = document.getElementById("title").value.trim();
    const locality = document.getElementById("locality").value.trim();
    const landmark = document.getElementById("landmark").value.trim();
    const desc = document.getElementById("desc").value.trim();
    const priority = fileForm.querySelector('input[name="priority"]:checked').value;
    if(!category || !title || !locality || !desc) return;

    ticketSeq += 1;
    const id = `SNW-2026-${pad(ticketSeq)}`;
    ledger.unshift({
      id, title, cat: category, loc: locality, status: "filed",
      supports: 0, filedAgo: 0, desc, landmark, priority, officer: null
    });

    document.getElementById("confirmTicket").textContent = id;
    document.getElementById("confirmCopy").textContent =
      `Save this number to track progress. It's now listed in the public ledger under ${locality}.`;
    fileForm.style.display = "none";
    confirmPanel.classList.add("show");

    renderStats();
    buildFilters();
    renderLedger();
  });

  document.getElementById("confirmReset").addEventListener("click", function(){
    fileForm.reset();
    fileForm.style.display = "flex";
    confirmPanel.classList.remove("show");
  });

  // ---- tracking ----
  const trackInput = document.getElementById("trackInput");
  const trackResult = document.getElementById("trackResult");

  function renderTrack(idRaw){
    const id = idRaw.trim().toUpperCase();
    const entry = ledger.find(g=>g.id === id);
    if(!entry){
      trackResult.className = "track-result show";
      trackResult.innerHTML = `<p class="not-found">No grievance found for <strong>${id || "—"}</strong>. Double-check the ticket number, or file a new one above.</p>`;
      return;
    }
    const steps = makeTimeline(entry.status);
    const officerBlock = entry.officer ? `
      <div class="track-officer">
        <div class="track-officer-label">Assigned officer</div>
        <div class="track-officer-row">
          <div class="officer-avatar small">${entry.officer.name.split(" ").map(p=>p[0]).join("").slice(0,2)}</div>
          <div>
            <div class="officer-name">${entry.officer.name}</div>
            <div class="officer-dept">${entry.officer.designation} · ${entry.officer.dept}</div>
          </div>
          <button class="officer-contact-btn" data-track-officer="${entry.id}">Contact details</button>
        </div>
      </div>
    ` : `
      <div class="track-officer unassigned">
        <div class="track-officer-label">Assigned officer</div>
        <div class="officer-unassigned">Not yet assigned — pending acknowledgement.</div>
      </div>
    `;

    trackResult.className = "track-result show";
    trackResult.innerHTML = `
      <div class="meta-line">
        <span><strong>${entry.id}</strong></span>
        <span>${entry.cat}</span>
        <span>${entry.loc}</span>
        <span>Filed ${entry.filedAgo===0?'today':daysAgo(entry.filedAgo)}</span>
      </div>
      <h3 style="font-size:18px;margin-bottom:16px;">${entry.title}</h3>
      ${officerBlock}
      <ul class="timeline">
        ${steps.map(s=>`
          <li class="${s.cls}">
            <div class="t-title">${s.title}</div>
            ${s.cls ? `<div class="t-date">${s.cls==='active' ? 'Current stage' : 'Complete'}</div>` : `<div class="t-date">Pending</div>`}
            <div class="t-note">${s.note}</div>
          </li>
        `).join("")}
      </ul>
    `;

    const contactBtn = trackResult.querySelector("[data-track-officer]");
    if(contactBtn){
      contactBtn.addEventListener("click", ()=> openOfficerModal(entry));
    }
  }

  document.getElementById("trackBtn").addEventListener("click",()=> renderTrack(trackInput.value));
  trackInput.addEventListener("keydown",(e)=>{ if(e.key==="Enter") renderTrack(trackInput.value); });

  // ---- highlight current section in sidebar nav on scroll ----
  const sideNav = document.getElementById("sideNav");
  if(sideNav){
    const sideLinks = Array.from(sideNav.querySelectorAll("a"));
    const sectionEls = sideLinks.map(a=>document.querySelector(a.getAttribute("href")));
    function updateActiveNav(){
      let current = sectionEls[0];
      for(const el of sectionEls){
        if(el && el.getBoundingClientRect().top <= 140) current = el;
      }
      sideLinks.forEach(a=>{
        a.classList.toggle("current", document.querySelector(a.getAttribute("href")) === current);
      });
    }
    window.addEventListener("scroll", updateActiveNav, {passive:true});
  }

  // ---- init ----
  renderStats();
  buildFilters();
  renderLedger();
})();
