import { Link, useRoute } from "wouter";
import {
  Menu, X, User, Shield, LogOut, LogIn, Home, ShoppingBag, Tag,
  Image, Star, Search, Printer, ChevronRight, Zap, Calculator, Sparkles,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useI18n, type Lang } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

function LangToggle({ dark }: { dark?: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "ru" ? "en" : "ru")}
      className={`flex items-center gap-1 text-xs font-bold transition-all px-2.5 py-1.5 rounded-lg border ${
        dark
          ? "text-white/50 hover:text-white border-white/10 hover:border-primary/40 hover:bg-primary/10"
          : "text-muted-foreground hover:text-foreground border-transparent hover:border-primary/20 hover:bg-primary/5"
      }`}
    >
      <span className={lang === "ru" ? (dark ? "text-primary font-black" : "text-foreground") : "opacity-35"}>RU</span>
      <span className="opacity-25">·</span>
      <span className={lang === "en" ? (dark ? "text-primary font-black" : "text-foreground") : "opacity-35"}>EN</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// MenuCanvas — Все 6 эффектов в мобильном меню
// ─────────────────────────────────────────────────────────────
function MenuCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let id: number;
    let w = (c.width = c.offsetWidth || 320);
    let h = (c.height = c.offsetHeight || window.innerHeight);

    // ── 1. "BRUCE 3D" RAIN ──
    const BRUCE = "BRUCE 3D ";
    const FS = 10;
    const GAP = FS * 2.0;
    interface RCol { x:number;y:number;speed:number;alpha:number;len:number;offset:number; }
    const rain: RCol[] = Array.from({ length: Math.floor(w/GAP) }, (_, i) => ({
      x: i*GAP+GAP/2,
      y: Math.random()*h,
      speed: 0.5+Math.random()*1.4,
      alpha: 0.12+Math.random()*0.22,
      len: 8+Math.floor(Math.random()*10),
      offset: Math.floor(Math.random()*BRUCE.length),
    }));

    // ── 2. PARTICLES ──
    const PCOLS = ["#9333ea","#7c3aed","#a855f7","#c084fc","#d946ef"];
    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3,
      r: Math.random()*1.4+0.2, a: Math.random()*0.5+0.1,
      c: PCOLS[Math.floor(Math.random()*PCOLS.length)],
      tw: Math.random()*Math.PI*2,
    }));

    // ── 3. STARS ──
    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random()*w, y: Math.random()*h,
      r: Math.random()*1.2+0.1, a: Math.random()*0.7+0.1,
      tw: Math.random()*Math.PI*2, spd: 0.01+Math.random()*0.025,
    }));

    // ── 4. NEON SMOKE ──
    const smoke = [
      { xF:.15, yF:.12, r:130, c:"#7c3aed", ph:0,   spd:.004 },
      { xF:.88, yF:.42, r:115, c:"#9333ea", ph:2.1, spd:.003 },
      { xF:.50, yF:.82, r:100, c:"#a855f7", ph:4.2, spd:.005 },
      { xF:.08, yF:.65, r: 90, c:"#c026d3", ph:1.5, spd:.006 },
      { xF:.82, yF:.88, r: 95, c:"#6d28d9", ph:3.3, spd:.004 },
    ].map(o => ({ ...o, x:w*o.xF, y:h*o.yF }));

    // ── 5. MESH GRADIENT ──
    const mesh = [
      { xF:.25, yF:.2,  r:200, ph:0,          spd:.0022, x:0, y:0 },
      { xF:.75, yF:.7,  r:180, ph:Math.PI,    spd:.0018, x:0, y:0 },
      { xF:.50, yF:.45, r:160, ph:Math.PI/2,  spd:.0028, x:0, y:0 },
    ].map(o => ({ ...o, x:w*o.xF, y:h*o.yF }));

    // ── 6. COMETS ──
    interface Cm { x:number;y:number;vx:number;vy:number;a:number;len:number;active:boolean;timer:number; }
    const comets: Cm[] = Array.from({ length:3 }, () => ({ x:0,y:0,vx:0,vy:0,a:0,len:0,active:false,timer:60+Math.random()*200 }));
    const resetC = (cm: Cm) => {
      cm.x=Math.random()*w; cm.y=0;
      const ang=Math.PI/5+Math.random()*Math.PI/4, spd=4+Math.random()*8;
      cm.vx=Math.cos(ang)*spd; cm.vy=Math.sin(ang)*spd;
      cm.a=0.9; cm.len=50+Math.random()*80; cm.active=true; cm.timer=60+Math.random()*200;
    };

    // Grid
    let gridOff=0;
    let t=0;
    const MESH_C: [string,string][] = [
      ["#4c1d9528","#7c3aed10"],["#6d28d91c","#9333ea0a"],["#7c3aed18","#a855f708"],
    ];

    const draw = () => {
      t+=0.018; gridOff+=0.4; if(gridOff>30)gridOff=0;
      ctx.clearRect(0,0,w,h);

      // Mesh gradient
      mesh.forEach((m,i)=>{
        const px=m.x+Math.sin(t*m.spd*4+m.ph)*w*0.18;
        const py=m.y+Math.cos(t*m.spd*3+m.ph)*h*0.12;
        const r=m.r*(1+0.08*Math.sin(t*0.5+i));
        const g=ctx.createRadialGradient(px,py,0,px,py,r);
        g.addColorStop(0,MESH_C[i][0]); g.addColorStop(0.5,MESH_C[i][1]); g.addColorStop(1,"transparent");
        ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
      });

      // Neon smoke
      smoke.forEach(o=>{
        const pulse=1+0.12*Math.sin(t*o.spd*50+o.ph);
        const ox=o.x+Math.sin(t*o.spd*2.5+o.ph)*30, oy=o.y+Math.cos(t*o.spd*2+o.ph)*20;
        for (let l=0;l<4;l++){
          const lr=o.r*pulse*(1-l*0.2);
          const lx=ox+Math.sin(t*0.6+l*1.1+o.ph)*22, ly=oy+Math.cos(t*0.4+l*0.9+o.ph)*16;
          const ops=["50","28","14","08"][l], fad=["1c","0e","07","03"][l];
          const g=ctx.createRadialGradient(lx,ly,0,lx,ly,lr);
          g.addColorStop(0,o.c+ops); g.addColorStop(0.4,o.c+fad); g.addColorStop(1,"transparent");
          ctx.beginPath(); ctx.arc(lx,ly,lr,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        }
      });

      // Grid
      ctx.save();
      for (let i=0;i<=10;i++){
        const ry=(i/10)*h+gridOff;
        ctx.globalAlpha=0.006+(ry/h)*0.04; ctx.strokeStyle="#9333ea"; ctx.lineWidth=0.4;
        ctx.beginPath(); ctx.moveTo(0,ry); ctx.lineTo(w,ry); ctx.stroke();
      }
      for (let i=0;i<=8;i++){
        const bx=(i/8)*w; const ctr=1-Math.abs(i/8-0.5)*2;
        ctx.globalAlpha=0.01+ctr*0.035; ctx.strokeStyle="#a855f7"; ctx.lineWidth=0.4;
        ctx.beginPath(); ctx.moveTo(w/2,h*0.3); ctx.lineTo(bx,h); ctx.stroke();
      }
      ctx.restore();

      // BRUCE 3D rain
      ctx.save();
      ctx.font=`bold ${FS}px 'Courier New',monospace`;
      rain.forEach(col=>{
        col.y+=col.speed;
        if (col.y-col.len*FS>h){col.y=-FS*(3+Math.random()*8);col.speed=0.5+Math.random()*1.4;col.len=8+Math.floor(Math.random()*10);}
        for (let idx=0;idx<col.len;idx++){
          const cy=col.y-idx*FS; if(cy<-FS||cy>h+FS)continue;
          const ch=BRUCE[(col.offset+col.len-idx)%BRUCE.length];
          const fade=idx/col.len;
          if(idx===0){ctx.shadowColor="#e040fb";ctx.shadowBlur=10;ctx.globalAlpha=col.alpha*1.2;ctx.fillStyle="#fce7ff";}
          else if(idx<2){ctx.shadowColor="#c026d3";ctx.shadowBlur=5;ctx.globalAlpha=col.alpha*0.85;ctx.fillStyle="#e879f9";}
          else if(idx<4){ctx.shadowBlur=2;ctx.globalAlpha=col.alpha*(1-fade)*0.65;ctx.fillStyle="#a855f7";}
          else{ctx.shadowBlur=0;ctx.globalAlpha=col.alpha*(1-fade)*0.25;ctx.fillStyle="#6d28d9";}
          ctx.fillText(ch,col.x-FS/2,cy); ctx.shadowBlur=0;
        }
      });
      ctx.restore();

      // Comets
      comets.forEach(cm=>{
        cm.timer--;
        if(cm.timer<=0&&!cm.active)resetC(cm);
        if(cm.active){
          const spd=Math.sqrt(cm.vx*cm.vx+cm.vy*cm.vy);
          const tx=cm.x-(cm.vx/spd)*cm.len, ty=cm.y-(cm.vy/spd)*cm.len;
          const sg=ctx.createLinearGradient(tx,ty,cm.x,cm.y);
          sg.addColorStop(0,"transparent"); sg.addColorStop(0.7,`rgba(170,100,255,${cm.a*0.3})`); sg.addColorStop(1,`rgba(240,190,255,${cm.a})`);
          ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(cm.x,cm.y); ctx.strokeStyle=sg; ctx.lineWidth=1.8; ctx.stroke();
          cm.x+=cm.vx; cm.y+=cm.vy; cm.a-=0.012;
          if(cm.a<=0||cm.x>w+50||cm.y>h+50){cm.active=false;cm.timer=60+Math.random()*200;}
        }
      });

      // Stars
      stars.forEach(s=>{
        s.tw+=s.spd;
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.globalAlpha=s.a*(0.35+0.65*Math.abs(Math.sin(s.tw)));
        ctx.fillStyle="#ddd6fe"; ctx.fill(); ctx.globalAlpha=1;
      });

      // Particles + connections
      pts.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.tw+=0.028;
        if(p.x<0)p.x=w; if(p.x>w)p.x=0; if(p.y<0)p.y=h; if(p.y>h)p.y=0;
        const a=p.a*(0.4+0.6*Math.sin(p.tw));
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.globalAlpha=a; ctx.fillStyle=p.c; ctx.fill(); ctx.globalAlpha=1;
      });
      const CD=65;
      for (let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<CD){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(147,51,234,${0.22*(1-d/CD)})`;ctx.lineWidth=0.5;ctx.stroke();}
      }

      id=requestAnimationFrame(draw);
    };
    draw();
    return ()=>cancelAnimationFrame(id);
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

const NAV_ITEMS = [
  { href: "/",           icon: Home,        labelKey: "home"       as const },
  { href: "/shop",       icon: ShoppingBag, labelKey: "shop"       as const },
  { href: "/services",   icon: Printer,     labelKey: "services"   as const },
  { href: "/prices",     icon: Tag,         labelKey: "prices"     as const },
  { href: "/gallery",    icon: Image,       labelKey: "gallery"    as const },
  { href: "/reviews",    icon: Star,        labelKey: "reviews"    as const },
  { href: "/calculator", icon: Calculator,  labelKey: "calculator" as const },
  { href: "/tracker",    icon: Search,      labelKey: "tracker"    as const },
];

const ITEM_COLOR: Record<string, string> = {
  "/shop": "#f0abfc",
  "/gallery": "#c084fc",
  "/calculator": "#a78bfa",
};

function MobileNavItem({
  href, icon: Icon, label, index, onClick,
}: {
  href: string; icon: any; label: string; index: number; onClick: () => void;
}) {
  const [isActive] = useRoute(href === "/" ? "/" : href);
  const accent = ITEM_COLOR[href] || "#a855f7";

  return (
    <motion.div
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.045, type: "spring", damping: 22, stiffness: 280 }}
    >
      <Link href={href} onClick={onClick}>
        <div className={`relative flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer group overflow-hidden ${
          isActive ? "border border-primary/35" : "hover:bg-white/[0.04] border border-transparent"
        }`}
          style={isActive ? { background: `linear-gradient(120deg, ${accent}18 0%, ${accent}08 100%)` } : {}}
        >
          {isActive && (
            <div
              className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
              style={{ background: `linear-gradient(180deg, ${accent}, ${accent}60)`, boxShadow: `0 0 8px ${accent}` }}
            />
          )}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
              isActive ? "" : "group-hover:scale-105"
            }`}
            style={isActive
              ? { background: `linear-gradient(135deg, ${accent}35, ${accent}18)`, border: `1px solid ${accent}40`, boxShadow: `0 0 14px ${accent}22` }
              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
            }
          >
            <Icon className="w-4 h-4 transition-colors" style={{ color: isActive ? accent : "rgba(255,255,255,0.35)" }} />
          </div>
          <span className="text-sm font-semibold transition-colors" style={{ color: isActive ? accent : "rgba(255,255,255,0.6)" }}>
            {label}
          </span>
          {isActive && (
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function MobileMenu({
  isOpen, onClose, user, isAdmin, activeCount, logout, t,
}: {
  isOpen: boolean; onClose: () => void;
  user: any; isAdmin: boolean; activeCount: number;
  logout: () => void; t: any; lang: string; setLang: (l: any) => void;
}) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const initials = user?.name?.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99] bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            key="panel"
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[100] w-[320px] max-w-[92vw] flex flex-col overflow-hidden"
            style={{ background: "linear-gradient(160deg, #0a0015 0%, #0f0022 55%, #0a0015 100%)" }}
          >
            <MenuCanvas />
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #9333ea60, #c084fc80, #9333ea60, transparent)" }} />
            <div className="absolute top-0 left-0 bottom-0 w-px" style={{ background: "linear-gradient(180deg, transparent, #7c3aed50, #a855f760, #7c3aed50, transparent)" }} />
            <div className="absolute top-0 right-0 w-52 h-52 bg-primary/15 blur-[90px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-700/12 blur-[70px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.07]">
              <Link href="/" onClick={onClose} className="flex items-center gap-2.5 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 blur-md rounded-full group-hover:bg-primary/40 transition-all" />
                  <img src="/logo.png" alt="BRUCE 3D SHOP" className="relative h-10 w-10 object-contain" />
                </div>
                <div>
                  <span className="text-sm font-black tracking-tight text-white leading-none block">
                    BRUCE <span className="text-primary" style={{ textShadow: "0 0 12px #a855f780" }}>3D</span> SHOP
                  </span>
                  <span className="text-[10px] text-white/25 font-medium tracking-widest uppercase">Studio</span>
                </div>
              </Link>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <X style={{ width: 16, height: 16, color: "rgba(255,255,255,0.5)" }} />
              </button>
            </div>

            {/* User block */}
            <div className="relative px-4 pt-3 pb-3 border-b border-white/[0.06]">
              {user ? (
                <div className="space-y-1">
                  <Link href="/dashboard" onClick={onClose}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all group hover:bg-white/[0.04]"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all group-hover:scale-105"
                      style={{ background: "linear-gradient(135deg, #7c3aed40, #9333ea25)", border: "1px solid #9333ea50", boxShadow: "0 0 12px #9333ea20", color: "#c084fc" }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{user.name}</div>
                      <div className="text-[11px] text-white/35">Личный кабинет</div>
                    </div>
                    {activeCount > 0 && (
                      <motion.span
                        animate={{ scale: [1, 1.12, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-[10px] font-black text-white px-2 py-0.5 rounded-full"
                        style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7)", boxShadow: "0 0 10px #9333ea60" }}
                      >
                        {activeCount}
                      </motion.span>
                    )}
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <button
                    onClick={() => { logout(); onClose(); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-500/8 w-full text-left transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                      <LogOut className="w-4 h-4 text-white/25 group-hover:text-red-400 transition-colors" />
                    </div>
                    <span className="text-sm text-white/35 group-hover:text-red-400 transition-colors">{t.nav.logout}</span>
                  </button>
                </div>
              ) : (
                <Link href="/login" onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.04] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                    <LogIn className="w-4 h-4 text-white/30 group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white/55 group-hover:text-white transition-colors">{t.nav.login}</div>
                    <div className="text-[11px] text-white/25">Войдите в аккаунт</div>
                  </div>
                </Link>
              )}
            </div>

            {/* Nav items */}
            <nav className="relative flex-1 overflow-y-auto px-3.5 py-3 space-y-0.5">
              {NAV_ITEMS.map(({ href, icon, labelKey }, i) => (
                <MobileNavItem key={href} href={href} icon={icon} label={t.nav[labelKey]} index={i} onClick={onClose} />
              ))}
              {isAdmin && (
                <>
                  <div className="my-3 mx-1" style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(234,179,8,0.2), transparent)" }} />
                  <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: NAV_ITEMS.length * 0.045 + 0.05 }}
                  >
                    <Link href="/admin" onClick={onClose}
                      className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-yellow-500/8 transition-all group border border-transparent hover:border-yellow-500/20"
                    >
                      <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0 group-hover:bg-yellow-500/18 transition-colors">
                        <Shield className="w-4 h-4 text-yellow-400/60 group-hover:text-yellow-400 transition-colors" />
                      </div>
                      <span className="text-sm font-semibold text-yellow-400/60 group-hover:text-yellow-400 transition-colors">{t.nav.admin}</span>
                    </Link>
                  </motion.div>
                </>
              )}
              <div className="flex items-center justify-between px-3 py-2 mt-1">
                <span className="text-[11px] text-white/20 font-medium">Язык</span>
                <LangToggle dark />
              </div>
            </nav>

            {/* CTA */}
            <div className="relative px-4 pb-7 pt-3 border-t border-white/[0.06]">
              <Link href="/order" onClick={onClose}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative w-full rounded-2xl overflow-hidden group"
                  style={{ height: 54 }}
                >
                  <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, #6d28d9 0%, #9333ea 50%, #7c3aed 100%)" }} />
                  <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }}
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: "0 0 30px #9333ea80 inset" }} />
                  <div className="absolute inset-0 rounded-2xl" style={{ border: "1px solid rgba(192,132,252,0.4)", boxShadow: "0 0 20px #9333ea40" }} />
                  <div className="relative flex items-center justify-center gap-2 text-white font-black text-sm tracking-wide">
                    <Sparkles className="w-4 h-4" />
                    {t.nav.order}
                  </div>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DesktopNavLink({ href, label }: { href: string; label: string }) {
  const [isActive] = useRoute(href === "/" ? "/" : href);
  return (
    <Link href={href} className="relative group">
      <span className={`text-sm font-medium transition-all duration-200 ${
        isActive ? "text-primary" : "text-muted-foreground hover:text-white"
      }`}>
        {label}
      </span>
      <div
        className={`absolute -bottom-0.5 left-0 right-0 h-px rounded-full transition-all duration-300 ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        }`}
        style={{ background: "linear-gradient(90deg, transparent, #a855f7, transparent)" }}
      />
    </Link>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const { t, lang, setLang } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: ordersData } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => apiFetch<{ orders: { status: string }[] }>("orders/my"),
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 20000,
  });
  const activeCount = ordersData?.orders?.filter(
    o => !["completed","rejected","confirmed","cancelled"].includes(o.status)
  ).length ?? 0;

  const links = [
    { href: "/",           label: t.nav.home },
    { href: "/shop",       label: t.nav.shop },
    { href: "/services",   label: t.nav.services },
    { href: "/prices",     label: t.nav.prices },
    { href: "/gallery",    label: t.nav.gallery },
    { href: "/reviews",    label: t.nav.reviews },
    { href: "/calculator", label: t.nav.calculator },
    { href: "/tracker",    label: t.nav.tracker },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full transition-all duration-300"
        style={{
          background: scrolled ? "rgba(8,0,20,0.92)" : "rgba(5,0,14,0.75)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid rgba(147,51,234,0.2)" : "1px solid rgba(147,51,234,0.08)",
          boxShadow: scrolled ? "0 4px 30px rgba(120,50,200,0.12)" : "none",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-px opacity-60"
          style={{ background: "linear-gradient(90deg, transparent 0%, #7c3aed 30%, #c084fc 50%, #7c3aed 70%, transparent 100%)" }}
        />
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-md transition-all duration-300 group-hover:opacity-80"
                style={{ background: "radial-gradient(circle, #9333ea40, transparent)" }}
              />
              <img src="/logo.png" alt="BRUCE 3D SHOP" className="relative h-11 w-11 object-contain" />
            </div>
            <span className="text-base font-black tracking-tight leading-none">
              BRUCE{" "}
              <span className="text-primary" style={{ textShadow: "0 0 16px #a855f760, 0 0 32px #7c3aed30" }}>3D</span>{" "}
              SHOP
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {links.map(l => <DesktopNavLink key={l.href} {...l} />)}
          </nav>

          <div className="hidden md:flex items-center gap-1.5">
            <LangToggle />
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-1.5 text-yellow-400/60 hover:text-yellow-400 text-xs px-2 hover:bg-yellow-500/8">
                  <Shield className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-1.5 relative hover:bg-primary/10 hover:text-primary">
                    <User className="w-4 h-4" />
                    {user.name.split(" ")[0]}
                    {activeCount > 0 && (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.8 }}
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary"
                        style={{ boxShadow: "0 0 6px #a855f7" }}
                      />
                    )}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/8" onClick={() => logout()}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-1.5 hover:text-primary hover:bg-primary/8">
                  <LogIn className="w-4 h-4" /> {t.nav.login}
                </Button>
              </Link>
            )}
            <Link href="/order">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative inline-flex h-9 items-center gap-1.5 px-4 rounded-full text-sm font-bold text-white overflow-hidden group"
                style={{ background: "linear-gradient(120deg, #6d28d9, #9333ea, #7c3aed)", boxShadow: "0 0 16px rgba(147,51,234,0.4)" }}
              >
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
                />
                <Zap className="w-3.5 h-3.5 relative" />
                <span className="relative">{t.nav.order}</span>
              </motion.button>
            </Link>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            className="md:hidden relative p-2 rounded-xl transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(147,51,234,0.2)" }}
            onClick={() => setIsOpen(true)}
          >
            <Menu className="h-5 w-5 text-white/70" />
            {activeCount > 0 && (
              <motion.span
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"
                style={{ boxShadow: "0 0 6px #a855f7" }}
              />
            )}
          </motion.button>
        </div>
      </header>

      <MobileMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        user={user}
        isAdmin={isAdmin}
        activeCount={activeCount}
        logout={logout}
        t={t}
        lang={lang}
        setLang={setLang}
      />
    </>
  );
}
