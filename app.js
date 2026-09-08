const friends = [
  { id:"friend-01", name:"ДРУГ № 01", image:"assets/friends/friend-01.jpg" },
  { id:"friend-02", name:"ДРУГ № 02", image:"assets/friends/friend-02.jpg" },
  { id:"friend-03", name:"ДРУГ № 03", image:"assets/friends/friend-03.jpg" },
  { id:"friend-04", name:"ДРУГ № 04", image:"assets/friends/friend-04.jpg" },
  { id:"friend-05", name:"ДРУГ № 05", image:"assets/friends/friend-05.jpg" },
  { id:"friend-06", name:"ДРУГ № 06", image:"assets/friends/friend-06.jpg" },
  { id:"friend-07", name:"ДРУГ № 07", image:"assets/friends/friend-07.jpg" },
  { id:"friend-08", name:"ДРУГ № 08", image:"assets/friends/friend-08.jpg" }
];

const swans = [
  { id:"swan-01", name:"ЛЕБЕДЬ № 01", image:"assets/swans/swan-01.jpg" },
  { id:"swan-02", name:"ЛЕБЕДЬ № 02", image:"assets/swans/swan-02.jpg" },
  { id:"swan-03", name:"ЛЕБЕДЬ № 03", image:"assets/swans/swan-03.jpg" },
  { id:"swan-04", name:"ЛЕБЕДЬ № 04", image:"assets/swans/swan-04.jpg" },
  { id:"swan-05", name:"ЛЕБЕДЬ № 05", image:"assets/swans/swan-05.jpg" },
  { id:"swan-06", name:"ЛЕБЕДЬ № 06", image:"assets/swans/swan-06.jpg" },
  { id:"swan-07", name:"ЛЕБЕДЬ № 07", image:"assets/swans/swan-07.jpg" },
  { id:"swan-08", name:"ЛЕБЕДЬ № 08", image:"assets/swans/swan-08.jpg" }
];

// friendId -> swanId
const matches = new Map();
let selectedFriend = null;
let selectedSwan = null;

const $ = (s) => document.querySelector(s);
const friendsEl = $("#friends");
const swansEl = $("#swans");
const svg = $("#connections");
const statusEl = $("#status");
const messageEl = $("#message");

function card(item, type){
  const div = document.createElement("button");
  div.type = "button";
  div.className = "card";
  div.dataset.id = item.id;
  div.dataset.type = type;
  div.innerHTML = `
    <div class="visual">${item.image
      ? `<img src="${item.image}" alt="${item.name}" onerror="this.parentElement.innerHTML='<div class=&quot;placeholder&quot;>ВСТАВЬТЕ<br>ИЗОБРАЖЕНИЕ</div>'">`
      : `<div class="placeholder">ВСТАВЬТЕ<br>ИЗОБРАЖЕНИЕ</div>`}
    </div>
    <div class="label">${item.name}</div>`;
  div.addEventListener("click", () => select(type, item.id));
  return div;
}

function render(){
  friendsEl.innerHTML = ""; swansEl.innerHTML = "";
  friends.forEach(x => friendsEl.appendChild(card(x,"friend")));
  swans.forEach(x => swansEl.appendChild(card(x,"swan")));
  updateCards();
  updateStatus();
  requestAnimationFrame(drawLines);
}

function select(type,id){
  if(type==="friend"){
    selectedFriend = selectedFriend === id ? null : id;
  } else {
    selectedSwan = selectedSwan === id ? null : id;
  }

  if(selectedFriend && selectedSwan){
    assign(selectedFriend, selectedSwan);
    selectedFriend = null;
    selectedSwan = null;
  }
  updateCards();
  drawLines();
  updateStatus();
}

function assign(friendId,swanId){
  if(APP_CONFIG.ONE_TO_ONE){
    // Remove previous swan assigned to this friend.
    matches.delete(friendId);
    // If this swan already belongs to someone else, remove that old link.
    for(const [f,s] of matches.entries()){
      if(s===swanId) matches.delete(f);
    }
  }
  matches.set(friendId,swanId);
}

function updateCards(){
  document.querySelectorAll(".card").forEach(el => {
    const {id,type} = el.dataset;
    el.classList.toggle("selected",
      (type==="friend" && selectedFriend===id) ||
      (type==="swan" && selectedSwan===id)
    );
    el.classList.toggle("matched",
      type==="friend" ? matches.has(id) : [...matches.values()].includes(id)
    );
  });
}

function drawLines(){
  svg.innerHTML="";
  const board = document.querySelector(".matching-board");
  if(!board) return;
  const boardRect = board.getBoundingClientRect();
  const leftCards = [...friendsEl.querySelectorAll(".card")];
  const rightCards = [...swansEl.querySelectorAll(".card")];

  for(const [friendId,swanId] of matches.entries()){
    const a = leftCards.find(x=>x.dataset.id===friendId);
    const b = rightCards.find(x=>x.dataset.id===swanId);
    if(!a || !b) continue;
    const ar=a.getBoundingClientRect(), br=b.getBoundingClientRect();
    const x1=ar.right-boardRect.left, y1=ar.top+ar.height/2-boardRect.top;
    const x2=br.left-boardRect.left, y2=br.top+br.height/2-boardRect.top;
    const dx=Math.max(25,(x2-x1)*.35);
    const path=document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d",`M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`);
    path.setAttribute("class","connection-line");
    svg.appendChild(path);
  }
}

function updateStatus(){
  statusEl.textContent = `${matches.size} / ${friends.length}`;
}

function getPayload(){
  return {
    participant: ($("#participantName").value || "Анонимный эксперт").trim().slice(0,40),
    submittedAt: new Date().toISOString(),
    matches: friends.map(f => ({
      friendId:f.id,
      friendName:f.name,
      swanId:matches.get(f.id) || null,
      swanName:swans.find(s=>s.id===matches.get(f.id))?.name || null
    }))
  };
}

async function submit(){
  messageEl.textContent="";
  const name=($("#participantName").value||"").trim();
  if(!name){ messageEl.textContent="Сначала представьтесь экспертизе."; $("#participantName").focus(); return; }
  if(matches.size < friends.length){
    messageEl.textContent=`Экспертиза не завершена: соединено ${matches.size} из ${friends.length}.`;
    return;
  }

  const btn=$("#submitBtn");
  btn.disabled=true; btn.textContent="ФИКСИРУЕМ ВЕРДИКТ…";
  const payload=getPayload();

  try{
    const endpoint=APP_CONFIG.STATS_ENDPOINT;
    if(!endpoint || endpoint.includes("PASTE_YOUR")){
      // Demo mode: keep the result locally so the interaction can still be tested.
      localStorage.setItem("lastVerdict",JSON.stringify(payload));
      showThanks("Демо-режим: URL статистики пока не подключён.");
      return;
    }

    await fetch(endpoint,{
      method:"POST",
      mode:"no-cors",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(payload)
    });

    showThanks();
  }catch(err){
    console.error(err);
    messageEl.textContent="Не удалось отправить результат. Проверьте интернет и попробуйте ещё раз.";
    btn.disabled=false; btn.innerHTML='ПРЕДЪЯВИТЬ ВЕРДИКТ <span>→</span>';
  }
}

function showThanks(extra=""){
  $("#matchingPanel").classList.add("hidden");
  $(".intro").classList.add("hidden");
  $(".submit-panel").classList.add("hidden");
  $("#thanks").classList.remove("hidden");
  if(extra) $("#thanks .small").textContent=extra;
  window.scrollTo({top:0,behavior:"smooth"});
}

$("#submitBtn").addEventListener("click",submit);
$("#againBtn").addEventListener("click",()=>{
  matches.clear(); selectedFriend=null; selectedSwan=null;
  $("#thanks").classList.add("hidden");
  $(".intro").classList.remove("hidden");
  $(".submit-panel").classList.remove("hidden");
  $("#matchingPanel").classList.remove("hidden");
  render();
});

window.addEventListener("resize",drawLines);
render();
