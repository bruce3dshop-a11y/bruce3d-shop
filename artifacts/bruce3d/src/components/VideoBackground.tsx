import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
//  VideoBackground — LOCAL hero canvas (абсолютный, в секции)
// ─────────────────────────────────────────────────────────────
interface VideoBackgroundProps { subtle?: boolean; }

export function VideoBackground({ subtle = false }: VideoBackgroundProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let id: number;
    let w = (c.width = c.offsetWidth || window.innerWidth);
    let h = (c.height = c.offsetHeight || window.innerHeight);
    const onResize = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight; };
    window.addEventListener("resize", onResize);

    const COLS = ["#9333ea","#7c3aed","#a855f7","#c084fc","#d946ef"];
    const pts = Array.from({ length: subtle ? 55 : 110 }, () => ({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-0.5)*0.38, vy: (Math.random()-0.5)*0.38,
      r: Math.random()*2.4+0.3, a: Math.random()*0.55+0.1,
      c: COLS[Math.floor(Math.random()*COLS.length)],
      tw: Math.random()*Math.PI*2,
    }));

    const orbs = [
      { xF:.18, yF:.4, r: subtle?180:320, c:"#9333ea", ph:0, spd:.005 },
      { xF:.80, yF:.6, r: subtle?150:260, c:"#7c3aed", ph:2.1, spd:.004 },
      { xF:.50, yF:.1, r: subtle?130:210, c:"#a855f7", ph:4.2, spd:.007 },
    ].map(o => ({ ...o, x:w*o.xF, y:h*o.yF }));

    let t = 0;
    const draw = () => {
      t += 0.016;
      ctx.clearRect(0,0,w,h);
      orbs.forEach(o => {
        const pulse = 1+0.15*Math.sin(t*o.spd*55+o.ph);
        const ox=o.x+Math.sin(t*o.spd*2.5+o.ph)*55, oy=o.y+Math.cos(t*o.spd*2+o.ph)*32;
        for (let l=0;l<4;l++) {
          const lr=o.r*pulse*(1-l*0.2);
          const lx=ox+Math.sin(t*0.6+l*1.1+o.ph)*42, ly=oy+Math.cos(t*0.4+l*0.9+o.ph)*30;
          const ops=["50","28","14","08"][l], fad=["1c","0e","07","03"][l];
          const g=ctx.createRadialGradient(lx,ly,0,lx,ly,lr);
          g.addColorStop(0,o.c+ops); g.addColorStop(0.4,o.c+fad); g.addColorStop(1,"transparent");
          ctx.beginPath(); ctx.arc(lx,ly,lr,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        }
      });
      const DIST=100;
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.tw+=0.025;
        if(p.x<0)p.x=w; if(p.x>w)p.x=0; if(p.y<0)p.y=h; if(p.y>h)p.y=0;
        const a=p.a*(0.4+0.6*Math.sin(p.tw));
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.globalAlpha=a; ctx.fillStyle=p.c; ctx.fill(); ctx.globalAlpha=1;
      });
      for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++) {
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if (d<DIST) {
          ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=`rgba(147,51,234,${0.2*(1-d/DIST)})`; ctx.lineWidth=0.5; ctx.stroke();
        }
      }
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize",onResize); };
  }, [subtle]);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex:0 }} />;
}

// ─────────────────────────────────────────────────────────────
//  GlobalBackground — FIXED fullscreen canvas, z-index: -1
//  Все 6 эффектов: Grid · Particles · Neon Smoke · Mesh Waves · BRUCE 3D Rain · Космос
// ─────────────────────────────────────────────────────────────
export function GlobalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x:-9999, y:-9999 });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let animId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const isMobile = w < 768;

    // ══ 1. "BRUCE 3D" RAIN ══
    const BRUCE = "BRUCE 3D ";
    const FS = isMobile ? 12 : 15;
    const COL = FS * 2.5;
    interface RCol { x:number;y:number;speed:number;alpha:number;len:number;offset:number; }
    let rain: RCol[] = [];
    const initRain = () => {
      const n = Math.floor(w/COL);
      rain = Array.from({ length:n }, (_,i) => ({
        x: i*COL+COL/2,
        y: i%3!==0 ? Math.random()*h : -Math.random()*h*1.5,
        speed: 0.55+Math.random()*1.8,
        alpha: 0.14+Math.random()*0.28,
        len: 14+Math.floor(Math.random()*16),
        offset: Math.floor(Math.random()*BRUCE.length),
      }));
    };
    initRain();

    // ══ 2. PARTICLES ══
    const PCOLS = ["#9333ea","#7c3aed","#a855f7","#c084fc","#d946ef","#e879f9","#8b5cf6"];
    const NP = isMobile ? 70 : 190;
    interface P { x:number;y:number;vx:number;vy:number;bvx:number;bvy:number;r:number;a:number;c:string;tw:number; }
    const pts: P[] = Array.from({ length:NP }, () => {
      const vx=(Math.random()-0.5)*0.44, vy=(Math.random()-0.5)*0.44;
      return { x:Math.random()*w, y:Math.random()*h, vx, vy, bvx:vx, bvy:vy,
        r:Math.random()*2.8+0.3, a:Math.random()*0.55+0.12,
        c:PCOLS[Math.floor(Math.random()*PCOLS.length)], tw:Math.random()*Math.PI*2 };
    });

    // ══ 3. STARS ══
    const NS = isMobile ? 220 : 480;
    interface St { x:number;y:number;r:number;a:number;tw:number;spd:number;bright:boolean; }
    const stars: St[] = Array.from({ length:NS }, () => ({
      x:Math.random()*w, y:Math.random()*h,
      r:Math.random()*1.7+0.1, a:Math.random()*0.8+0.05,
      tw:Math.random()*Math.PI*2, spd:0.008+Math.random()*0.03,
      bright:Math.random()>0.92,
    }));

    // ══ 4. BOKEH ══
    interface Bk { x:number;y:number;r:number;a:number;c:string;ang:number;spd:number; }
    const bokeh: Bk[] = Array.from({ length:isMobile?12:24 }, () => ({
      x:Math.random()*w, y:Math.random()*h, r:28+Math.random()*105,
      a:0.025+Math.random()*0.065, c:PCOLS[Math.floor(Math.random()*3)],
      ang:Math.random()*Math.PI*2, spd:0.0004+Math.random()*0.0012,
    }));

    // ══ 5. NEON SMOKE ══
    interface Sm { x:number;y:number;xF:number;yF:number;r:number;c:string;ph:number;spd:number; }
    const smoke: Sm[] = [
      { xF:.10,yF:.20,r:370,c:"#7c3aed",ph:0,   spd:.003  },
      { xF:.88,yF:.68,r:320,c:"#9333ea",ph:2.1, spd:.0025 },
      { xF:.50,yF:.05,r:280,c:"#a855f7",ph:4.2, spd:.005  },
      { xF:.94,yF:.18,r:250,c:"#6d28d9",ph:1.0, spd:.004  },
      { xF:.04,yF:.88,r:290,c:"#c026d3",ph:3.3, spd:.003  },
      { xF:.65,yF:.94,r:230,c:"#7c3aed",ph:5.1, spd:.006  },
      { xF:.38,yF:.48,r:215,c:"#8b5cf6",ph:1.8, spd:.0035 },
      { xF:.72,yF:.30,r:240,c:"#a855f7",ph:2.7, spd:.0045 },
      { xF:.25,yF:.75,r:200,c:"#6d28d9",ph:0.8, spd:.005  },
      { xF:.55,yF:.14,r:185,c:"#c084fc",ph:3.8, spd:.004  },
      { xF:.15,yF:.55,r:175,c:"#7c3aed",ph:2.2, spd:.0055 },
      { xF:.78,yF:.82,r:165,c:"#9333ea",ph:4.5, spd:.0038 },
    ].map(o => ({ ...o, x:w*o.xF, y:h*o.yF }));

    // ══ 6. MESH GRADIENT ══
    interface Mg { x:number;y:number;xF:number;yF:number;r:number;ph:number;spd:number; }
    const mesh: Mg[] = [
      { xF:.20,yF:.25,r:520,ph:0,          spd:.002  },
      { xF:.80,yF:.75,r:470,ph:Math.PI,    spd:.0018 },
      { xF:.50,yF:.50,r:420,ph:Math.PI/2,  spd:.0025 },
      { xF:.15,yF:.85,r:370,ph:Math.PI*1.5,spd:.003  },
      { xF:.75,yF:.15,r:340,ph:Math.PI*.75,spd:.0022 },
      { xF:.30,yF:.60,r:300,ph:Math.PI*.25,spd:.0035 },
    ].map(o => ({ ...o, x:w*o.xF, y:h*o.yF }));

    // ══ 7. COMETS ══
    interface Cm { x:number;y:number;vx:number;vy:number;a:number;len:number;active:boolean;timer:number; }
    const comets: Cm[] = Array.from({ length:8 }, () => ({ x:0,y:0,vx:0,vy:0,a:0,len:0,active:false,timer:100+Math.random()*350 }));
    const resetComet = (c:Cm) => {
      const side=Math.floor(Math.random()*3);
      if (side===0){c.x=Math.random()*w;c.y=0;}
      else if (side===1){c.x=w;c.y=Math.random()*h*0.5;}
      else {c.x=Math.random()*w*0.6;c.y=0;}
      const ang=Math.PI/5+Math.random()*Math.PI/4, spd=7+Math.random()*14;
      c.vx=Math.cos(ang)*spd; c.vy=Math.sin(ang)*spd;
      c.a=0.95; c.len=90+Math.random()*160; c.active=true;
      c.timer=130+Math.random()*380;
    };

    const MESH_C: [string,string][] = [
      ["#4c1d9532","#7c3aed14"],["#6d28d924","#9333ea0e"],
      ["#7c3aed1e","#a855f709"],["#5b21b61c","#6d28d907"],
      ["#3b076428","#4c1d950f"],["#4a044e22","#6b21a808"],
    ];

    let gridOff=0, t=0, frame=0;

    const onResize = () => {
      w=canvas.width=window.innerWidth; h=canvas.height=window.innerHeight;
      smoke.forEach(o=>{o.x=w*o.xF;o.y=h*o.yF;});
      mesh.forEach(o=>{o.x=w*o.xF;o.y=h*o.yF;});
      initRain();
    };
    const onMouse = (e:MouseEvent) => { mouseRef.current={x:e.clientX,y:e.clientY}; };
    const onTouch = (e:TouchEvent) => { if(e.touches[0]) mouseRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY}; };
    window.addEventListener("resize",onResize);
    window.addEventListener("mousemove",onMouse);
    window.addEventListener("touchmove",onTouch,{passive:true});

    const draw = () => {
      t+=0.016; frame++;
      gridOff+=0.52; if(gridOff>44)gridOff=0;

      ctx.clearRect(0,0,w,h);
      ctx.fillStyle="#020009"; ctx.fillRect(0,0,w,h);

      // ── MESH GRADIENT WAVES ──
      mesh.forEach((m,i) => {
        const px=m.x+Math.sin(t*m.spd*4+m.ph)*w*0.21;
        const py=m.y+Math.cos(t*m.spd*3+m.ph)*h*0.17;
        const r=m.r*(1+0.10*Math.sin(t*0.55+i));
        const g=ctx.createRadialGradient(px,py,0,px,py,r);
        g.addColorStop(0,MESH_C[i][0]); g.addColorStop(0.4,MESH_C[i][1]); g.addColorStop(1,"transparent");
        ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
      });
      // Белые блики
      for (let wi=0;wi<3;wi++) {
        const ang=t*0.22+wi*Math.PI*2/3;
        const wx=w*(0.28+wi*0.22)+Math.sin(ang)*w*0.12;
        const wy=h*0.28+Math.cos(ang*1.4)*h*0.09;
        const wg=ctx.createRadialGradient(wx,wy,0,wx,wy,220+wi*60);
        wg.addColorStop(0,`rgba(255,255,255,${0.032-wi*0.008})`);
        wg.addColorStop(0.5,"rgba(210,170,255,0.008)");
        wg.addColorStop(1,"transparent");
        ctx.beginPath(); ctx.arc(wx,wy,220+wi*60,0,Math.PI*2); ctx.fillStyle=wg; ctx.fill();
      }

      // ── NEON SMOKE (6 слоёв на шар) ──
      smoke.forEach(o => {
        const pulse=1+0.15*Math.sin(t*o.spd*55+o.ph);
        const dx=Math.sin(t*o.spd*2.8+o.ph)*95, dy=Math.cos(t*o.spd*2.2+o.ph)*65;
        const ox=o.x+dx, oy=o.y+dy;
        for (let l=0;l<6;l++) {
          const lr=o.r*pulse*(1-l*0.13);
          const lx=ox+Math.sin(t*0.62+l*1.2+o.ph)*58, ly=oy+Math.cos(t*0.45+l*1.0+o.ph)*40;
          const ops=["58","30","1c","12","0a","05"][l], fad=["1e","12","0c","08","04","02"][l];
          const g=ctx.createRadialGradient(lx,ly,0,lx,ly,lr);
          g.addColorStop(0,o.c+ops); g.addColorStop(0.35,o.c+fad); g.addColorStop(1,"transparent");
          ctx.beginPath(); ctx.arc(lx,ly,lr,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        }
      });

      // ── BOKEH ──
      bokeh.forEach(b => {
        b.ang+=b.spd;
        const bx=b.x+Math.cos(b.ang)*42, by=b.y+Math.sin(b.ang)*28;
        const g=ctx.createRadialGradient(bx,by,0,bx,by,b.r);
        g.addColorStop(0,b.c+"24"); g.addColorStop(0.5,b.c+"0a"); g.addColorStop(1,"transparent");
        ctx.beginPath(); ctx.arc(bx,by,b.r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
      });

      // ── АНИМИРОВАННАЯ СЕТКА ──
      ctx.save();
      const vx=w/2, vy=h*0.42;
      for (let i=0;i<=18;i++) {
        const ry=(i/18)*h+gridOff;
        ctx.globalAlpha=0.008+(ry/h)*0.058;
        ctx.strokeStyle=i%3===0?"#9333ea":"#7c3aed"; ctx.lineWidth=i%3===0?0.75:0.45;
        ctx.beginPath(); ctx.moveTo(0,ry); ctx.lineTo(w,ry); ctx.stroke();
      }
      const VL=isMobile?16:28;
      for (let i=0;i<=VL;i++) {
        const bx=(i/VL)*w, ctr=1-Math.abs(i/VL-0.5)*2;
        ctx.globalAlpha=0.012+ctr*0.052; ctx.strokeStyle="#a855f7"; ctx.lineWidth=0.5;
        ctx.beginPath(); ctx.moveTo(vx,vy); ctx.lineTo(bx,h); ctx.stroke();
      }
      ctx.restore();

      // ── "BRUCE 3D" ДОЖДЬ ──
      ctx.save();
      ctx.font=`bold ${FS}px 'Courier New',monospace`;
      rain.forEach(col => {
        col.y+=col.speed;
        if (col.y-col.len*FS>h) {
          col.y=-FS*(5+Math.random()*10); col.speed=0.55+Math.random()*1.8;
          col.len=14+Math.floor(Math.random()*16); col.alpha=0.14+Math.random()*0.28;
        }
        for (let idx=0;idx<col.len;idx++) {
          const cy=col.y-idx*FS;
          if (cy<-FS||cy>h+FS) continue;
          const ch=BRUCE[(col.offset+col.len-idx)%BRUCE.length];
          const fade=idx/col.len;
          if (idx===0) {
            ctx.shadowColor="#e040fb"; ctx.shadowBlur=16;
            ctx.globalAlpha=col.alpha*1.2; ctx.fillStyle="#fce7ff";
          } else if (idx<2) {
            ctx.shadowColor="#c026d3"; ctx.shadowBlur=8;
            ctx.globalAlpha=col.alpha*0.88; ctx.fillStyle="#e879f9";
          } else if (idx<5) {
            ctx.shadowBlur=3; ctx.shadowColor="#9333ea";
            ctx.globalAlpha=col.alpha*(1-fade)*0.72; ctx.fillStyle="#a855f7";
          } else {
            ctx.shadowBlur=0;
            ctx.globalAlpha=col.alpha*(1-fade)*0.28; ctx.fillStyle="#6d28d9";
          }
          ctx.fillText(ch,col.x-FS/2,cy); ctx.shadowBlur=0;
        }
      });
      ctx.restore();

      // ── КОМЕТЫ ──
      comets.forEach(c => {
        c.timer--;
        if (c.timer<=0&&!c.active) resetComet(c);
        if (c.active) {
          const spd=Math.sqrt(c.vx*c.vx+c.vy*c.vy);
          const tx=c.x-(c.vx/spd)*c.len, ty=c.y-(c.vy/spd)*c.len;
          const sg=ctx.createLinearGradient(tx,ty,c.x,c.y);
          sg.addColorStop(0,"transparent");
          sg.addColorStop(0.65,`rgba(170,100,255,${c.a*0.35})`);
          sg.addColorStop(1,`rgba(240,190,255,${c.a})`);
          ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(c.x,c.y);
          ctx.strokeStyle=sg; ctx.lineWidth=2.2; ctx.stroke();
          const hg=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,6);
          hg.addColorStop(0,`rgba(255,230,255,${c.a})`); hg.addColorStop(1,"transparent");
          ctx.beginPath(); ctx.arc(c.x,c.y,6,0,Math.PI*2); ctx.fillStyle=hg; ctx.fill();
          c.x+=c.vx; c.y+=c.vy; c.a-=0.007;
          if (c.a<=0||c.x>w+150||c.y>h+150) { c.active=false; c.timer=130+Math.random()*380; }
        }
      });

      // ── ЗВЁЗДЫ ──
      stars.forEach(s => {
        s.tw+=s.spd;
        const fa=s.bright?s.a*(0.15+0.85*Math.abs(Math.sin(s.tw))):s.a*(0.38+0.62*Math.sin(s.tw));
        if (s.bright) {
          ctx.save();
          ctx.globalAlpha=fa; ctx.fillStyle="#ffffff";
          ctx.shadowColor="#c084fc"; ctx.shadowBlur=8;
          const sz=s.r*2.2;
          ctx.beginPath(); ctx.arc(s.x,s.y,sz*0.35,0,Math.PI*2); ctx.fill();
          ctx.fillRect(s.x-sz*1.8,s.y-0.6,sz*3.6,1.2);
          ctx.fillRect(s.x-0.6,s.y-sz*1.8,1.2,sz*3.6);
          ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
          ctx.globalAlpha=fa;
          ctx.fillStyle=frame%200<3&&Math.random()>0.95?"#ffffff":"#ddd6fe";
          ctx.fill(); ctx.globalAlpha=1;
        }
      });

      // ── ЧАСТИЦЫ + СОЕДИНЕНИЯ + МЫШЬ ──
      const mouse=mouseRef.current;
      pts.forEach(p => {
        const mdx=p.x-mouse.x, mdy=p.y-mouse.y, md=Math.sqrt(mdx*mdx+mdy*mdy);
        if (md<145&&md>0) { const f=((145-md)/145)*0.032; p.vx+=(mdx/md)*f; p.vy+=(mdy/md)*f; }
        p.vx=p.vx*0.982+p.bvx*0.018; p.vy=p.vy*0.982+p.bvy*0.018;
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=w; if(p.x>w)p.x=0; if(p.y<0)p.y=h; if(p.y>h)p.y=0;
        p.tw+=0.025;
        const a=p.a*(0.4+0.6*Math.sin(p.tw));
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*2.8,0,Math.PI*2);
        ctx.globalAlpha=a*0.14; ctx.fillStyle=p.c; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.globalAlpha=a; ctx.fillStyle=p.c; ctx.fill(); ctx.globalAlpha=1;
      });

      const CD=isMobile?80:122, CD2=CD*CD;
      for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++) {
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d2=dx*dx+dy*dy;
        if (d2<CD2) {
          const d=Math.sqrt(d2);
          ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y);
          ctx.strokeStyle=`rgba(147,51,234,${0.24*(1-d/CD)})`; ctx.lineWidth=0.6; ctx.stroke();
        }
      }
      if (mouse.x>0&&mouse.x<w) {
        pts.forEach(p => {
          const dx=p.x-mouse.x, dy=p.y-mouse.y, d=Math.sqrt(dx*dx+dy*dy);
          if (d<185) {
            ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(mouse.x,mouse.y);
            ctx.strokeStyle=`rgba(200,130,255,${0.3*(1-d/185)})`; ctx.lineWidth=0.7; ctx.stroke();
          }
        });
        const mg=ctx.createRadialGradient(mouse.x,mouse.y,0,mouse.x,mouse.y,105);
        mg.addColorStop(0,"rgba(168,85,247,0.13)"); mg.addColorStop(1,"transparent");
        ctx.beginPath(); ctx.arc(mouse.x,mouse.y,105,0,Math.PI*2); ctx.fillStyle=mg; ctx.fill();
      }

      // ── ВИНЬЕТКА ──
      const vig=ctx.createRadialGradient(w/2,h/2,h*0.17,w/2,h/2,h*1.12);
      vig.addColorStop(0,"transparent"); vig.addColorStop(1,"rgba(0,0,0,0.84)");
      ctx.fillStyle=vig; ctx.fillRect(0,0,w,h);

      animId=requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize",onResize);
      window.removeEventListener("mousemove",onMouse);
      window.removeEventListener("touchmove",onTouch);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none"
      style={{ position:"fixed", inset:0, width:"100vw", height:"100vh", zIndex:-1 }}
    />
  );
}
