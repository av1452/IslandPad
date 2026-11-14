const $ = (id) => document.getElementById(id);
const audio = $('audio');
let deferredInstall = null;
let tracks = [], trackIndex = -1, audioContext = null, analyser = null, sourceNode = null, visualFrame = null;
let mode = 'timer', timerDuration = 25 * 60, timerEnd = null, remaining = timerDuration, timerInterval = null, stopwatchStart = null, stopwatchElapsed = 0, stopwatchInterval = null, timerRunning = false, timerPaused = false;
const bars = Array.from({length:35},()=>{const b=document.createElement('b');$('visualizer').appendChild(b);return b;});

function setIsland(title, subtitle, icon='•', label='ACTIVITY', detail='Your activities, one place') {
  $('islandTitle').textContent=title; $('islandSubtitle').textContent=subtitle;
  $('islandIcon').innerHTML = icon === 'music' ? '♫' : icon === 'timer' ? '◷' : icon === 'weather' ? '☼' : '<span class="live-dot"></span>';
  $('heroLabel').textContent=label; $('heroTitle').textContent=title; $('heroDetail').textContent=detail;
  $('heroArt').innerHTML=`<span class="art-symbol">${icon==='music'?'♫':icon==='timer'?'◷':icon==='weather'?'☼':'✦'}</span>`;
  $('panelMode').textContent=label;
}
function showTab(name){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.open)));
$('island').addEventListener('click',()=>{
  const open=$('island').getAttribute('aria-expanded')==='true';
  $('island').setAttribute('aria-expanded',String(!open));
  $('islandPanel').classList.toggle('collapsed',open);
  $('islandTrailing').textContent=open?'⌄':'⌃';
});
function tickClock(){
  const now=new Date();$('clock').textContent=now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  $('dateChip').textContent=now.toLocaleDateString([], {weekday:'short',month:'short',day:'numeric'}).toUpperCase();
}
tickClock();setInterval(tickClock,1000);

$('audioFiles').addEventListener('change',e=>{
  const selected=[...e.target.files].filter(f=>f.type.startsWith('audio/'));
  tracks=selected.map(file=>({file,url:URL.createObjectURL(file),name:file.name.replace(/\.[^.]+$/,''),artist:'Local audio'}));
  trackIndex=tracks.length?0:-1;renderPlaylist();if(trackIndex>=0)loadTrack(trackIndex,true);
});
function renderPlaylist(){
  const list=$('playlist');list.innerHTML='';
  if(!tracks.length){list.innerHTML='<div class="empty-state">Your selected tracks will appear here.</div>';return;}
  tracks.forEach((t,i)=>{const b=document.createElement('button');b.className='playlist-row'+(i===trackIndex?' current':'');b.innerHTML=`<span>${i===trackIndex?'♫':'♪'}</span><span><strong></strong><small>Local audio</small></span>`;b.querySelector('strong').textContent=t.name;b.addEventListener('click',()=>loadTrack(i,true));list.appendChild(b);});
}
function loadTrack(i,autoplay){
  if(i<0||i>=tracks.length)return;trackIndex=i;const t=tracks[i];audio.src=t.url;$('trackTitle').textContent=t.name;$('trackArtist').textContent=t.artist;$('albumArt').innerHTML='<div class="album-glow"></div><div class="album-placeholder">♫</div>';
  $('heroArt').innerHTML='<span class="art-symbol">♫</span>';setIsland(t.name,'Music selected','music','NOW PLAYING','Local audio • Ready to play');
  renderPlaylist();if(autoplay)audio.play().then(()=>{updatePlayButton();startVisualizer();}).catch(()=>updatePlayButton());
}
$('playBtn').addEventListener('click',()=>{
  if(!tracks.length){$('audioFiles').click();return;}
  if(audio.paused){audio.play().then(()=>{updatePlayButton();startVisualizer();}).catch(()=>{});}else{audio.pause();updatePlayButton();stopVisualizer();}
});
$('prevBtn').addEventListener('click',()=>{if(tracks.length)loadTrack((trackIndex-1+tracks.length)%tracks.length,true);});
$('nextBtn').addEventListener('click',()=>{if(tracks.length)loadTrack((trackIndex+1)%tracks.length,true);});
audio.addEventListener('ended',()=>{if(tracks.length)loadTrack((trackIndex+1)%tracks.length,true);});
audio.addEventListener('timeupdate',()=>{
  $('currentTime').textContent=formatTime(audio.currentTime);$('duration').textContent=formatTime(audio.duration||0);
  $('seek').value=audio.duration?audio.currentTime/audio.duration*1000:0;
});
$('seek').addEventListener('input',()=>{if(audio.duration)audio.currentTime=Number($('seek').value)/1000*audio.duration;});
function updatePlayButton(){$('playBtn').textContent=audio.paused?'▶':'Ⅱ';$('sessionStat').textContent=audio.paused?'Music ready':'Playing';if(!audio.paused)setIsland($('trackTitle').textContent,'Now playing','music','NOW PLAYING','Audio is playing in IslandPad');}
function formatTime(s){if(!Number.isFinite(s))return'0:00';return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;}
function startVisualizer(){
  $('visualizer').classList.add('playing');
  try{
    if(!audioContext){audioContext=new (window.AudioContext||window.webkitAudioContext)();analyser=audioContext.createAnalyser();analyser.fftSize=128;sourceNode=audioContext.createMediaElementSource(audio);sourceNode.connect(analyser);analyser.connect(audioContext.destination);}
    if(audioContext.state==='suspended')audioContext.resume();
    const data=new Uint8Array(analyser.frequencyBinCount);
    const draw=()=>{analyser.getByteFrequencyData(data);bars.forEach((b,i)=>{const v=data[i%data.length]||0;b.style.height=`${5+v/255*29}px`;});visualFrame=requestAnimationFrame(draw);};cancelAnimationFrame(visualFrame);draw();
  }catch(e){bars.forEach((b,i)=>b.style.height=`${8+Math.abs(Math.sin(Date.now()/180+i))*20}px`);}
}
function stopVisualizer(){$('visualizer').classList.remove('playing');cancelAnimationFrame(visualFrame);bars.forEach(b=>b.style.height='6px');}

document.querySelectorAll('.mode').forEach(b=>b.addEventListener('click',()=>{
  if(timerRunning)resetTimer();mode=b.dataset.mode;document.querySelectorAll('.mode').forEach(x=>x.classList.toggle('active',x===b));
  $('presets').style.display=mode==='timer'?'grid':'none';$('customMinutes').parentElement.style.display=mode==='timer'?'flex':'none';
  $('timerCaption').textContent=mode==='timer'?'READY TO FOCUS':'STOPWATCH';$('timerStart').textContent=mode==='timer'?'Start focus':'Start stopwatch';renderTimer();
}));
document.querySelectorAll('#presets button').forEach(b=>b.addEventListener('click',()=>{
  if(timerRunning)return;timerDuration=Number(b.dataset.min)*60;remaining=timerDuration;$('customMinutes').value=b.dataset.min;
  document.querySelectorAll('#presets button').forEach(x=>x.classList.toggle('selected',x===b));renderTimer();
}));
$('customMinutes').addEventListener('change',()=>{
  const m=Math.max(1,Math.min(180,Number($('customMinutes').value)||25));$('customMinutes').value=m;
  if(!timerRunning){timerDuration=m*60;remaining=timerDuration;document.querySelectorAll('#presets button').forEach(x=>x.classList.toggle('selected',Number(x.dataset.min)===m));renderTimer();}
});
$('timerStart').addEventListener('click',()=>{
  if(mode==='timer'){
    if(timerRunning&&!timerPaused){pauseTimer();return;}
    if(timerPaused){resumeTimer();return;}
    startTimer();
  }else{
    if(stopwatchInterval){clearInterval(stopwatchInterval);stopwatchInterval=null;$('timerStart').textContent='Resume';}
    else{stopwatchStart=Date.now()-stopwatchElapsed;stopwatchInterval=setInterval(()=>{stopwatchElapsed=Date.now()-stopwatchStart;renderTimer();},200);$('timerStart').textContent='Pause';setIsland('Stopwatch running',formatTime(stopwatchElapsed/1000),'timer','STOPWATCH','Elapsed time');$('sessionStat').textContent='Stopwatch';}
  }
});
$('timerReset').addEventListener('click',resetTimer);
function startTimer(){timerRunning=true;timerPaused=false;remaining=timerDuration;timerEnd=Date.now()+remaining*1000;timerInterval=setInterval(timerTick,200);$('timerStart').textContent='Pause';$('timerCaption').textContent='FOCUS IN PROGRESS';$('sessionStat').textContent='Focus timer';setIsland('Focus timer started',formatTime(remaining),'timer','FOCUS SESSION','Countdown running');timerTick();}
function timerTick(){remaining=Math.max(0,(timerEnd-Date.now())/1000);renderTimer();$('islandSubtitle').textContent=`${formatTime(remaining)} remaining`;if(remaining<=0){clearInterval(timerInterval);timerInterval=null;timerRunning=false;timerPaused=false;$('timerStart').textContent='Start again';$('timerCaption').textContent='SESSION COMPLETE';setIsland('Focus complete','Nice work. Take a break.','timer','SESSION COMPLETE','Your countdown has finished.');$('sessionStat').textContent='Complete';if('Notification'in window&&Notification.permission==='granted')new Notification('IslandPad',{body:'Your focus timer is complete.'});}}
function pauseTimer(){remaining=Math.max(0,(timerEnd-Date.now())/1000);clearInterval(timerInterval);timerInterval=null;timerPaused=true;$('timerStart').textContent='Resume';$('timerCaption').textContent='PAUSED';setIsland('Timer paused',formatTime(remaining),'timer','FOCUS SESSION','Countdown paused');}
function resumeTimer(){timerEnd=Date.now()+remaining*1000;timerPaused=false;timerInterval=setInterval(timerTick,200);$('timerStart').textContent='Pause';$('timerCaption').textContent='FOCUS IN PROGRESS';setIsland('Focus timer resumed',formatTime(remaining),'timer','FOCUS SESSION','Countdown running');}
function resetTimer(){clearInterval(timerInterval);timerInterval=null;clearInterval(stopwatchInterval);stopwatchInterval=null;timerRunning=false;timerPaused=false;stopwatchElapsed=0;remaining=timerDuration;timerEnd=null;$('timerStart').textContent=mode==='timer'?'Start focus':'Start stopwatch';$('timerCaption').textContent=mode==='timer'?'READY TO FOCUS':'STOPWATCH';$('sessionStat').textContent='Standby';setIsland('IslandPad ready','Your activities, one place');renderTimer();}
function renderTimer(){const s=mode==='timer'?remaining:stopwatchElapsed/1000;$('timerDisplay').textContent=formatTime(s);$('timerRing').style.borderTopColor=mode==='timer'&&timerRunning?'#8ff5d0':'#8ff5d077';}
renderTimer();

$('weatherRefresh').addEventListener('click',()=>{
  if(!navigator.geolocation){$('weatherDesc').textContent='Location is not available in this browser.';return;}
  $('weatherRefresh').textContent='Locating…';
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const {latitude,longitude}=pos.coords;
      const url=`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
      const r=await fetch(url);if(!r.ok)throw new Error('Weather request failed');const d=await r.json(),c=d.current;
      const desc=weatherDescription(c.weather_code),icon=weatherEmoji(c.weather_code,c.is_day);
      $('weatherPlace').textContent='CURRENT CONDITIONS';$('weatherTemp').textContent=`${Math.round(c.temperature_2m)}°`;$('weatherDesc').textContent=desc;$('weatherIcon').textContent=icon;
      $('feelsLike').textContent=`${Math.round(c.apparent_temperature)}°`;$('wind').textContent=`${Math.round(c.wind_speed_10m)} mph`;$('humidity').textContent=`${c.relative_humidity_2m}%`;$('weatherStat').textContent=`${Math.round(c.temperature_2m)}°`;
      setIsland(`${Math.round(c.temperature_2m)}° • ${desc}`, 'Current local weather','weather','WEATHER','Updated just now');
    }catch(e){$('weatherDesc').textContent='Could not load weather. Try again.';}
    $('weatherRefresh').textContent='Refresh weather';
  },err=>{$('weatherDesc').textContent=err.code===1?'Location permission was not granted.':'Could not determine location.';$('weatherRefresh').textContent='Try again';},{enableHighAccuracy:false,timeout:12000});
});
function weatherDescription(code){if(code===0)return'Clear sky';if([1,2,3].includes(code))return'Partly cloudy';if([45,48].includes(code))return'Fog';if([51,53,55,56,57].includes(code))return'Drizzle';if([61,63,65,66,67,80,81,82].includes(code))return'Rain';if([71,73,75,77,85,86].includes(code))return'Snow';if([95,96,99].includes(code))return'Thunderstorm';return'Current conditions';}
function weatherEmoji(code,day){if([95,96,99].includes(code))return'⛈';if([71,73,75,77,85,86].includes(code))return'❄';if([61,63,65,80,81,82,51,53,55].includes(code))return'🌧';if([45,48].includes(code))return'🌫';if(code===0)return day?'☀':'☾';return'⛅';}

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('installBtn').hidden=false;});
$('installBtn').addEventListener('click',async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$('installBtn').hidden=true;});
if('serviceWorker'in navigator && (location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
if('Notification'in window && Notification.permission==='default'){
  // No permission prompt until the user explicitly starts a timer; avoid surprise prompts.
}
