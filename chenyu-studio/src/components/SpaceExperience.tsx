import { useEffect, useRef, useState } from 'react';
import type { SpaceAPI, Target, View } from '../lib/space/illustrated';
import '../styles/space.css';

const labels: Record<Target,string>={about:'认识严晨宇',work:'看看我的作品',notes:'打开笔记本'};
function Glyph({name}:{name:'orbit'|'camera'|'desk'|'close'|'arrow'|'light'|'reset'|'play'|'pause'|'plus'|'minus'}) {
  const paths={orbit:<><ellipse cx="12" cy="12" rx="10" ry="5"/><path d="m18 5 3 3-4 1"/><circle cx="12" cy="12" r="2"/></>,camera:<><path d="M3 7h5l2-3h4l2 3h5v13H3Z"/><circle cx="12" cy="13" r="4"/></>,desk:<><rect x="3" y="3" width="18" height="13" rx="1"/><path d="M12 16v5M7 21h10"/></>,close:<path d="m6 6 12 12M6 18 18 6"/>,arrow:<path d="M4 12h16m-6-6 6 6-6 6"/>,light:<><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></>,reset:<><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></>,play:<path d="m8 4 12 8-12 8Z"/>,pause:<path d="M8 4v16M16 4v16"/>,plus:<path d="M5 12h14M12 5v14"/>,minus:<path d="M5 12h14"/>};
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export default function SpaceExperience(){
  const host=useRef<HTMLDivElement>(null), api=useRef<SpaceAPI|null>(null), angleRef=useRef<HTMLSpanElement>(null),compassRef=useRef<SVGSVGElement>(null);
  const [ready,setReady]=useState(false),[error,setError]=useState(false),[selected,setSelected]=useState<Target|null>(null),[hover,setHover]=useState<Target|null>(null),[view,setView]=useState<View>('orbit'),[light,setLight]=useState(true),[tour,setTour]=useState(false),[interacted,setInteracted]=useState(false);
  const heading=useRef<HTMLHeadingElement>(null), returnFocus=useRef<HTMLElement|null>(null);
  const selectRef=useRef<(target:Target)=>void>(()=>{});
  function select(target:Target){returnFocus.current=document.activeElement as HTMLElement;setSelected(target);setInteracted(true);setTour(false);setView('orbit');api.current?.focus(target);}
  selectRef.current=select;
  useEffect(()=>{
    let cancelled=false;
    import('../lib/space/illustrated').then(({createSpace})=>{
      if(cancelled||!host.current)return;
      try{api.current=createSpace(host.current,{
        select:id=>selectRef.current(id),hover:setHover,
        angle:degrees=>{if(angleRef.current)angleRef.current.textContent=`${degrees>0?'+':''}${degrees}°`;if(compassRef.current)compassRef.current.style.transform=`rotate(${-degrees}deg)`;},
        ready:()=>setReady(true),interact:()=>{setInteracted(true);setTour(false);},fail:()=>{setError(true);setReady(false);}
      });}catch(err){console.error('Unable to initialize the illustrated studio',err);setError(true);}
    }).catch(()=>setError(true));
    return()=>{cancelled=true;api.current?.dispose();api.current=null;};
  },[]);
  useEffect(()=>{if(selected)heading.current?.focus({preventScroll:true});},[selected]);
  function close(){setHover(null);setSelected(null);api.current?.view('orbit');setView('orbit');requestAnimationFrame(()=>{if(returnFocus.current?.isConnected)returnFocus.current.focus({preventScroll:true});else host.current?.focus();});}
  useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setHover(null);setSelected(null);setView('orbit');setTour(false);api.current?.view('orbit');host.current?.focus({preventScroll:true});}};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[]);
  function changeView(next:View){setHover(null);setSelected(null);setView(next);setTour(false);setInteracted(true);api.current?.view(next);}
  function reset(){setHover(null);setSelected(null);setView('orbit');setTour(false);setLight(true);api.current?.light(true);api.current?.view('orbit');}
  return <main className={`space-app ${selected?'has-panel':''} ${ready?'space-ready':''} ${interacted?'has-explored':''}`}>
    <div className="space-stage" ref={host} tabIndex={0} role="region" aria-label="漫画空间操作区，左右方向键移动镜头" aria-describedby="space-instructions" onKeyDown={event=>{
      if(event.target!==host.current)return;
      const key=event.key;if(!['ArrowLeft','ArrowRight','+','=','-'].includes(key))return;event.preventDefault();setTour(false);setInteracted(true);
      if(key==='ArrowLeft'||key==='ArrowRight')api.current?.rotate(key==='ArrowLeft'?-.2:.2);else api.current?.zoom(key==='-'?1.12:.89);
    }}/>
    {!ready&&<div className="space-loading" role="status">
      <img src="/assets/studio-poster.webp" alt="白色漫画工作室预览"/>
      <div><span className="space-loading-mark"/>
      <h1>{error?'这个空间暂时无法打开':'正在推开工作室的门'}</h1>
      <p>{error?'插画资源暂时加载失败。可以刷新重试，或通过下方入口阅读内容。':'人物、桌搭和镜头，正在就位。'}</p>
      {error&&<a href="/">打开原版工作室 <Glyph name="arrow"/></a>}</div>
    </div>}
    <header className="space-header">
      <a className="space-signature" href="/" aria-label="严晨宇，返回原版网站"><span className="space-monogram">cy.</span><span>严晨宇<span className="space-signature-en">CHENYU YAN</span></span></a>
      <div className="space-edition"><span/>纸上工作室 <span className="space-edition-divider">/</span> ILLUSTRATED STUDIO</div>
      <a className="space-original" href="/">返回原版 <Glyph name="arrow"/></a>
    </header>
    <div className="space-title" aria-hidden="true"><h1>A room of<br/><em>my own.</em></h1><p>一张桌子。一个可以走进来的我。</p></div>
    {view==='camera'&&!selected&&ready&&<div className="space-camera-frame" aria-hidden="true"><i/><i/><i/><i/><span>CAMERA VIEW</span><span>视线相遇的地方。</span></div>}
    {hover&&!selected&&ready&&<div className="space-hover" aria-live="polite"><span/>{labels[hover]}<Glyph name="arrow"/></div>}
    <nav className="space-destinations" aria-label="空间内容入口">
      <span>在这里发现</span>
      {(['about','work','notes'] as Target[]).map((target,i)=><button key={target} className={selected===target?'active':''} onClick={()=>select(target)} aria-expanded={selected===target} aria-controls="space-detail"><span className="space-destination-dot"/>{['关于我','我的作品','文字笔记'][i]}<Glyph name="arrow"/></button>)}
    </nav>
    {selected&&<aside id="space-detail" className="space-detail" aria-labelledby="space-detail-title">
      <div className="space-detail-top"><span>{selected==='about'?'人物 · ABOUT':selected==='work'?'主屏幕 · WORK':'笔记本 · NOTES'}</span><button onClick={close} aria-label="关闭详情，回到空间"><Glyph name="close"/></button></div>
      {selected==='about'?<>
        <h2 id="space-detail-title" tabIndex={-1} ref={heading}>你好，<br/>我是严晨宇<span>。</span></h2>
        <p className="space-detail-english">A little closer.</p>
        <p className="space-detail-lead">欢迎来到我的工作室。桌子在身后，镜头在眼前，这里是我的一个小小分身。</p>
        <div className="space-detail-portrait"><img src="/assets/avatar.webp" alt="严晨宇的白色漫画形象"/></div>
        <h3>从一张桌子开始</h3><p>把每天使用的桌搭，变成一个可以探索的线上空间。轻轻左右移动镜头，看看前景、人物与桌面之间的层次。</p>
        <p className="space-pending">更完整的自我介绍，稍后补上。</p>
        <a href="/about/" className="space-detail-link">阅读关于我 <Glyph name="arrow"/></a>
      </>:selected==='work'?<>
        <h2 id="space-detail-title" tabIndex={-1} ref={heading}>正在做的<br/>事情<span>。</span></h2>
        <p className="space-detail-english">Work, in progress.</p>
        <a className="space-project" href="/work/online-studio/"><img src="/assets/studio-poster.webp" alt="线上工作室的漫画版本"/><div><h3>我的线上工作室</h3><Glyph name="arrow"/></div><p>从桌搭、漫画形象，到可以环绕的空间。</p><span>个人网站 · 进行中</span></a>
        <h3>屏幕里的下一件事</h3><p>更多作品会放在这里。每一件作品，都有自己的过程与故事。</p>
        <a href="/work/" className="space-detail-link">查看作品目录 <Glyph name="arrow"/></a>
      </>:<>
        <h2 id="space-detail-title" tabIndex={-1} ref={heading}>留一点<br/>空白<span>。</span></h2><p className="space-detail-english">Notes for later.</p>
        <div className="space-notebook"><span>Dear future me,</span><i/><i/><i/><small>第一篇，还在酝酿。</small></div>
        <p className="space-detail-lead">一些观察，一些灵感，还有日常里值得留下的片刻。</p><p>这里暂时没有文章。写好之后，再慢慢放进来。</p><a className="space-detail-link" href="/notes/">打开文字目录 <Glyph name="arrow"/></a>
      </>}
      <div className="space-detail-foot"><span>继续探索，故事还在空间里。</span><button onClick={close}>回到空间 <Glyph name="orbit"/></button></div>
    </aside>}
    <footer className="space-hud">
      <div className="space-instructions" id="space-instructions"><span className="space-drag-icon"><svg width="35" height="24" viewBox="0 0 35 24" fill="none" stroke="currentColor"><path d="M4 12h27M8 8l-4 4 4 4m19-8 4 4-4 4"/><rect x="13" y="2" width="9" height="20" rx="4.5" fill="#f5f5f1"/><path d="M17.5 6v4"/></svg></span><div><strong>左右拖动，轻轻环绕</strong><span>点击人物或屏幕 · 滚轮靠近 · Esc 返回</span></div></div>
      <div className="space-controls" aria-label="视角控制">
        {([{id:'orbit',icon:'orbit',label:'空间全景'},{id:'camera',icon:'camera',label:'相机视角'},{id:'desk',icon:'desk',label:'桌面视角'}] as const).map(item=><button key={item.id} disabled={!ready} aria-pressed={view===item.id&&!selected} onClick={()=>changeView(item.id)}><Glyph name={item.icon}/><span>{item.label}</span></button>)}
        <span className="space-control-rule"/>
        <button className="space-icon-button" disabled={!ready} onClick={()=>{setTour(!tour);api.current?.tour(!tour);setInteracted(true);}} aria-label={tour?'暂停自动轻摇':'自动轻摇'} aria-pressed={tour} title={tour?'暂停自动轻摇':'自动轻摇'}><Glyph name={tour?'pause':'play'}/></button>
        <button className="space-icon-button" disabled={!ready} onClick={()=>{setLight(!light);api.current?.light(!light);}} aria-label={light?'关闭摄影灯':'打开摄影灯'} aria-pressed={light} title="摄影灯开关"><Glyph name="light"/></button>
        <button className="space-icon-button" disabled={!ready} onClick={reset} aria-label="重置空间" title="重置空间"><Glyph name="reset"/></button>
      </div>
      <div className="space-compass" aria-label="当前环绕角度"><svg ref={compassRef} viewBox="0 0 40 40" width="34" height="34" fill="none"><circle cx="20" cy="20" r="17" stroke="#bcbdb3"/><path d="m20 5 4 15-4-2-4 2Z" fill="currentColor"/><path d="M20 25v9M6 20h4m20 0h4" stroke="currentColor"/></svg><span ref={angleRef}>0°</span></div>
    </footer>
    <div className="space-zoom"><button disabled={!ready} onClick={()=>api.current?.zoom(.85)} aria-label="靠近"><Glyph name="plus"/></button><button disabled={!ready} onClick={()=>api.current?.zoom(1.18)} aria-label="远离"><Glyph name="minus"/></button></div>
    <noscript><div className="space-noscript">互动空间需要 JavaScript。<a href="/">查看原版网站</a></div></noscript>
  </main>;
}
