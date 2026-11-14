const routes = {
  balanced:{name:'Balanced exploration',distance:'4.1',duration:'2h 35m',risk:25,science:75,stops:2,points:'250,580 300,510 355,350 470,345 610,412 690,480'},
  shortest:{name:'Shortest path',distance:'3.2',duration:'2h 05m',risk:65,science:40,stops:1,points:'250,580 330,520 455,465 570,435 690,480'},
  science:{name:'Science priority',distance:'5.3',duration:'3h 20m',risk:48,science:95,stops:3,points:'250,580 300,475 355,350 470,345 610,412 510,565 690,480'}
};
let selected='balanced';
function draw(){
 const r=routes[selected];
 document.getElementById('routeName').textContent=r.name;
 document.getElementById('distance').innerHTML=r.distance+' <small>km</small>';
 document.getElementById('duration').textContent=r.duration;
 document.getElementById('risk').innerHTML=r.risk+' <small>/ 100</small>';
 document.getElementById('stops').innerHTML=r.stops+' <small>stops</small>';
 document.getElementById('scienceScore').textContent=r.science+'%';
 document.getElementById('riskScore').textContent=r.risk+'%';
 document.getElementById('scienceBar').style.width=r.science+'%';
 document.getElementById('riskBar').style.width=r.risk+'%';
 document.getElementById('routeGlow').setAttribute('points',r.points);
 document.getElementById('routeLine').setAttribute('points',r.points);
 document.querySelectorAll('.route-choice').forEach(b=>b.classList.toggle('active',b.dataset.route===selected));
 document.querySelectorAll('.marker').forEach((m,i)=>m.style.opacity=(i===2&&selected!=='science')?'.27':'1');
}
document.querySelectorAll('.route-choice').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.route;draw()}));
['hazards','science','route'].forEach(k=>document.getElementById(k).addEventListener('change',e=>{
 document.getElementById(k==='hazards'?'hazardLayer':k==='science'?'scienceLayer':'routeLayer').style.display=e.target.checked?'':'none';
}));
document.getElementById('terrain').addEventListener('change',e=>document.querySelector('.map-image').style.opacity=e.target.checked?'1':'.1');
document.querySelectorAll('.marker').forEach(m=>m.addEventListener('click',()=>{
 const tip=document.getElementById('mapTooltip');tip.hidden=false;tip.innerHTML='<strong>'+m.dataset.name+'</strong>'+m.dataset.description;
}));
document.getElementById('mapWrap').addEventListener('click',e=>{if(!e.target.closest('.marker'))document.getElementById('mapTooltip').hidden=true});
draw();
