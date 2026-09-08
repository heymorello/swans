const friends = Array.from({length:8}, (_,i) => ({
  id:`friend-${String(i+1).padStart(2,'0')}`,
  name:`ДРУГ № ${String(i+1).padStart(2,'0')}`,
  image:`assets/friends/friend-${String(i+1).padStart(2,'0')}.jpg`
}));

const swans = Array.from({length:8}, (_,i) => ({
  id:`swan-${String(i+1).padStart(2,'0')}`,
  name:`ЛЕБЕДЬ № ${String(i+1).padStart(2,'0')}`,
  image:`assets/swans/swan-${String(i+1).padStart(2,'0')}.jpg`
}));

const matches = new Map();
let drag = null;
let selectedFriend = null;
let selectedSwan = null;
const $ = s => document.querySelector(s);

function makeCard(item,type){
  const el=document.createElement('div');
  el.className='card';
  el.dataset.id=item.id;
  el.dataset.type=type;
  el.innerHTML=`<div class="visual"><img src="${item.image}" alt="${item.name}"><div class="placeholder">ВСТАВЬТЕ<br>ИЗОБРАЖЕНИЕ</div></div><div class="label">${item.name}</div>`;
  const img=el.querySelector('img');
  img.addEventListener('error',()=>{img.style.display='none';});
  el.addEventListener('pointerdown',startDrag);
  el.addEventListener('pointermove',moveDrag);
  el.addEventListener('pointerup',endDrag);
  el.addEventListener('pointercancel',cancelDrag);
  el.addEventListener('dragstart',e=>e.preventDefault());
  return el;
}

function render(){
  $('#friends').replaceChildren(...friends.map(x=>makeCard(x,'friend')));
  $('#swans').replaceChildren(...swans.map(x=>makeCard(x,'swan')));
  updateCards(); updateStatus();
}

function startDrag(e){
  if(e.pointerType==='mouse' && e.button!==0) return;
  const source=e.currentTarget;
  drag={pointerId:e.pointerId,type:source.dataset.type,id:source.dataset.id,source,ghost:null,target:null,moved:false};
  source.setPointerCapture?.(e.pointerId);
  drag.ghost=source.cloneNode(true);
  drag.ghost.classList.add('drag-ghost');
  drag.ghost.style.width=`${source.getBoundingClientRect().width}px`;
  drag.ghost.style.height=`${source.getBoundingClientRect().height}px`;
  document.body.appendChild(drag.ghost);
  source.classList.add('dragging');
  document.body.classList.add('is-dragging');
  moveGhost(e);
  e.preventDefault();
}

function moveGhost(e){
  if(!drag?.ghost) return;
  const r=drag.source.getBoundingClientRect();
  drag.ghost.style.left=`${e.clientX-r.width/2}px`;
  drag.ghost.style.top=`${e.clientY-r.height/2}px`;
}

function moveDrag(e){
  if(!drag || e.pointerId!==drag.pointerId) return;
  drag.moved=true; moveGhost(e);
  drag.ghost.style.display='none';
  const under=document.elementFromPoint(e.clientX,e.clientY);
  drag.ghost.style.display='';
  document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'));
  drag.target=null;
  const target=under?.closest('.card');
  if(target && target!==drag.source && target.dataset.type!==drag.type){
    drag.target=target;
    target.classList.add('drop-target');
  }
  e.preventDefault();
}

function endDrag(e){
  if(!drag || e.pointerId!==drag.pointerId) return;
  const state=drag;
  if(state.target){
    const friendId=state.type==='friend'?state.id:state.target.dataset.id;
    const swanId=state.type==='swan'?state.id:state.target.dataset.id;
    assign(friendId,swanId);
  } else if(!state.moved){
    // Tap/click fallback.
    select(state.type,state.id);
  }
  cleanupDrag(); updateCards(); updateStatus();
  e.preventDefault();
}

function cancelDrag(){ cleanupDrag(); updateCards(); }
function cleanupDrag(){
  if(!drag) return;
  drag.source.classList.remove('dragging');
  document.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'));
  drag.ghost?.remove();
  document.body.classList.remove('is-dragging');
  drag=null;
}

function select(type,id){
  if(type==='friend') selectedFriend=selectedFriend===id?null:id;
  else selectedSwan=selectedSwan===id?null:id;
  if(selectedFriend && selectedSwan){assign(selectedFriend,selectedSwan);selectedFriend=null;selectedSwan=null;}
  updateCards(); updateStatus();
}

function assign(friendId,swanId){
  matches.set(friendId,swanId);
  if(APP_CONFIG.ONE_TO_ONE){
    for(const [f,s] of [...matches]) if(f!==friendId && s===swanId) matches.delete(f);
  }
}

function updateCards(){
  document.querySelectorAll('.card').forEach(el=>{
    const id=el.dataset.id,type=el.dataset.type;
    el.classList.toggle('selected',(type==='friend'&&selectedFriend===id)||(type==='swan'&&selectedSwan===id));
    el.classList.toggle('matched',type==='friend'?matches.has(id):[...matches.values()].includes(id));
    const badge=el.querySelector('.match-badge'); badge?.remove();
    let other=null;
    if(type==='friend' && matches.has(id)) other=swans.find(s=>s.id===matches.get(id));
    if(type==='swan') { const pair=[...matches.entries()].find(([,s])=>s===id); if(pair) other=friends.find(f=>f.id===pair[0]); }
    if(other){const b=document.createElement('div');b.className='match-badge';b.textContent=other.name;b.title='Перетащите карточку ещё раз, чтобы изменить';el.appendChild(b);}
  });
}

function updateStatus(){ $('#status').textContent=`${matches.size} / ${friends.length}`; }

function getPayload(){
  return {
    participant:($('#participantName').value||'Анонимный эксперт').trim().slice(0,40),
    submittedAt:new Date().toISOString(),
    matches:friends.map(f=>({friendId:f.id,friendName:f.name,swanId:matches.get(f.id)||null,swanName:swans.find(s=>s.id===matches.get(f.id))?.name||null}))
  };
}

async function submit(){
  const msg=$('#message'), btn=$('#submitBtn');
  msg.textContent='';
  if(!($('#participantName').value||'').trim()){msg.textContent='Сначала представьтесь экспертизе.';$('#participantName').focus();return;}
  if(matches.size<friends.length){msg.textContent=`Соединено ${matches.size} из ${friends.length}. Перетащите оставшиеся карточки.`;return;}
  btn.disabled=true; btn.textContent='ФИКСИРУЕМ ВЕРДИКТ…';
  const payload=getPayload();
  try{
    if(!APP_CONFIG.STATS_ENDPOINT || APP_CONFIG.STATS_ENDPOINT.includes('PASTE_YOUR')){
      localStorage.setItem('lastVerdict',JSON.stringify(payload));
      showThanks('Демо-режим: URL статистики ещё не подключён.'); return;
    }
    await fetch(APP_CONFIG.STATS_ENDPOINT,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    showThanks();
  }catch(err){msg.textContent='Не удалось отправить результат. Попробуйте ещё раз.';btn.disabled=false;btn.innerHTML='ПРЕДЪЯВИТЬ ВЕРДИКТ <span>→</span>';}
}

function showThanks(extra=''){
  $('#matchingPanel').classList.add('hidden');$('.intro').classList.add('hidden');$('.submit-panel').classList.add('hidden');$('#thanks').classList.remove('hidden');
  if(extra) $('#thanks .small').textContent=extra;
  window.scrollTo({top:0,behavior:'smooth'});
}

$('#submitBtn').addEventListener('click',submit);
$('#againBtn').addEventListener('click',()=>{matches.clear();selectedFriend=null;selectedSwan=null;$('#thanks').classList.add('hidden');$('.intro').classList.remove('hidden');$('.submit-panel').classList.remove('hidden');$('#matchingPanel').classList.remove('hidden');$('#submitBtn').disabled=false;$('#submitBtn').innerHTML='ПРЕДЪЯВИТЬ ВЕРДИКТ <span>→</span>';render();});
window.addEventListener('resize',()=>{});
render();
