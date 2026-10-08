(function(){
  'use strict';
  const $=(s,c=document)=>c.querySelector(s);
  const $$=(s,c=document)=>[...c.querySelectorAll(s)];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=window.matchMedia('(pointer:fine)').matches;

  /* Navigation */
  const toggle=$('.menu-toggle'), mobile=$('.mobile-menu');
  if(toggle&&mobile){
    toggle.addEventListener('click',()=>{
      const open=mobile.classList.toggle('open');
      toggle.setAttribute('aria-expanded',String(open));
      document.body.classList.toggle('no-scroll',open);
    });
    $$('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>{
      mobile.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
      document.body.classList.remove('no-scroll');
    }));
  }
  const year=$('#year'); if(year) year.textContent=new Date().getFullYear();

  /* Scroll reveals */
  const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target)}
  }),{threshold:.12,rootMargin:'0px 0px -30px'});
  $$('.reveal').forEach(el=>revealObserver.observe(el));

  /* Navigation state + progress */
  const nav=$('.nav');
  let ticking=false;
  const progress=document.createElement('div');
  progress.className='scroll-progress';
  document.body.appendChild(progress);
  const updateScroll=()=>{
    const max=document.documentElement.scrollHeight-window.innerHeight;
    const ratio=max>0?window.scrollY/max:0;
    if(nav) nav.classList.toggle('scrolled',window.scrollY>8);
    progress.style.width=(ratio*100)+'%';
    ticking=false;
  };
  window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateScroll);ticking=true}},{passive:true});
  updateScroll();

  /* Counters */
  $$('.counter').forEach(el=>{
    const target=parseInt(el.dataset.target||el.textContent,10);
    if(!Number.isFinite(target)) return;
    const run=()=>{let start=0;const step=()=>{start+=Math.max(1,Math.ceil(target/35));el.textContent=Math.min(start,target)+(el.dataset.suffix||'');if(start<target)requestAnimationFrame(step)};step()};
    const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){run();obs.disconnect()}}),{threshold:.7});
    obs.observe(el);
  });

  /* Cursor system: one reusable engine for the entire site. */
  if(fine&&!reduced){
    document.body.classList.add('cursor-ready');
    const cursor=document.createElement('div'); cursor.className='astral-cursor'; cursor.setAttribute('aria-hidden','true');
    const dot=document.createElement('div'); dot.className='astral-cursor-dot'; dot.setAttribute('aria-hidden','true');
    const label=document.createElement('div'); label.className='astral-cursor-label'; label.setAttribute('aria-hidden','true');
    const wipe=document.createElement('div'); wipe.className='page-wipe'; wipe.setAttribute('aria-hidden','true');
    document.body.append(cursor,dot,label,wipe);

    let mx=window.innerWidth/2,my=window.innerHeight/2,dx=mx,dy=my,tx=mx,ty=my,active=true;
    const render=()=>{
      dx+=(mx-dx)*.19; dy+=(my-dy)*.19;
      tx+=(mx-tx)*.48; ty+=(my-ty)*.48;
      cursor.style.transform=`translate3d(${dx}px,${dy}px,0) translate3d(-50%,-50%,0)`;
      label.style.transform=`translate3d(${tx}px,${ty+28}px,0) translate3d(-50%,-50%,0)`;
      dot.style.transform=`translate3d(${tx}px,${ty}px,0) translate3d(-50%,-50%,0)`;
      if(active) requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    const show=()=>{cursor.classList.add('is-visible');dot.classList.add('is-visible');active=true};
    const hide=()=>{cursor.classList.remove('is-visible','is-hover','is-click');dot.classList.remove('is-visible');label.classList.remove('is-visible')};
    window.addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;show()},{passive:true});
    document.addEventListener('mouseleave',hide);
    document.addEventListener('mousedown',()=>cursor.classList.add('is-click'));
    document.addEventListener('mouseup',()=>cursor.classList.remove('is-click'));

    const interactive=$$('a,button,[role="button"],input,select,textarea');
    interactive.forEach(el=>{
      el.addEventListener('pointerenter',()=>cursor.classList.add('is-hover'));
      el.addEventListener('pointerleave',()=>{cursor.classList.remove('is-hover');label.classList.remove('is-visible')});
    });

    /* Magnetic controls — strongest on primary calls to action. */
    $$('.btn,.nav-cta,.brand').forEach(el=>{
      el.classList.add('cursor-magnetic');
      el.addEventListener('pointermove',e=>{
        const r=el.getBoundingClientRect(), x=e.clientX-(r.left+r.width/2), y=e.clientY-(r.top+r.height/2);
        el.style.transform=`translate3d(${Math.max(-10,Math.min(10,x*.12))}px,${Math.max(-8,Math.min(8,y*.12))}px,0)`;
      });
      el.addEventListener('pointerleave',()=>el.style.transform='');
    });

    /* Cards and visual panels respond to pointer position. */
    $$('.card,.case,.band,.paper-stack,.bot-window,.stat').forEach(el=>{
      if(el.closest('.footer')) return;
      el.classList.add('cursor-tilt','cursor-spotlight');
      el.addEventListener('pointermove',e=>{
        const r=el.getBoundingClientRect(), px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
        const rx=(.5-py)*3.5, ry=(px-.5)*4.5;
        el.style.setProperty('--mx',(px*100)+'%');el.style.setProperty('--my',(py*100)+'%');
        el.style.setProperty('--spot-x',(px*100)+'%');el.style.setProperty('--spot-y',(py*100)+'%');
        el.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
        el.classList.add('is-tilting');
      });
      el.addEventListener('pointerleave',()=>{el.style.transform='';el.classList.remove('is-tilting')});
    });

    /* Optional label system: elements can opt into a contextual cursor pill. */
    $$('[data-cursor-label]').forEach(el=>{
      el.addEventListener('pointerenter',()=>{label.textContent=el.dataset.cursorLabel;label.classList.add('is-visible')});
      el.addEventListener('pointerleave',()=>label.classList.remove('is-visible'));
    });

    /* Internal page transition. External links, downloads and new tabs stay normal. */
    $$('a[href]').forEach(link=>{
      const href=link.getAttribute('href');
      if(!href||href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('tel:')||link.target==='_blank') return;
      if(new URL(link.href,location.href).origin!==location.origin) return;
      link.addEventListener('click',e=>{
        if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
        const dest=new URL(link.href,location.href);
        if(dest.pathname===location.pathname&&dest.search===location.search) return;
        e.preventDefault();
        wipe.classList.remove('run'); void wipe.offsetWidth; wipe.classList.add('run');
        window.setTimeout(()=>{location.href=dest.href},310);
      });
    });
  }

  /* Add tasteful interaction labels without editing every HTML file. */
  $$('.hero .btn.primary').forEach(el=>el.dataset.cursorLabel='Start');
  $$('.card-link').forEach(el=>el.dataset.cursorLabel='Open');
  $$('.nav-cta').forEach(el=>el.dataset.cursorLabel='Build');
})();
