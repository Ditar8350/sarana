import React, { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link, usePage, router } from '@inertiajs/react';

// 1. Definisi Tipe Data (Interfaces)
type NavItem = { 
    label: string; 
    href: string; 
};

type NavGroup = {
    label: string;
    href?: string;
    type: 'link' | 'dropdown';
    items?: NavItem[];
};

// 2. Terapkan Tipe Data pada Array
const navGroups: NavGroup[] = [
  { label: "Beranda", href: "#beranda", type: "link" },
  {
    label: "Profil",
    type: "dropdown",
    items: [
      { label: "Sambutan", href: "#sambutan" },
      { label: "Visi Misi", href: "#visi-misi" },
      { label: "Struktur", href: "/struktur" },
    ]
  },
  { label: "Berita", href: "#berita", type: "link" },
  { label: "Dokumen", href: "/dokumen", type: "link" },
  { label: "Kontak", href: "#kontak", type: "link" }
];

const navLinks: NavItem[] = navGroups.flatMap(g =>
  g.type === 'dropdown' ? (g.items || []) : [{ label: g.label, href: g.href! }]
);

export function Navbar() {
  // 3. Pendeklarasian State dengan Generics
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [active, setActive] = useState<string>("Beranda");
  
  const { url, props } = usePage();
  const isAuthenticated = Boolean((props as any)?.auth?.user);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    try {
      const full = url ?? window.location.href;
      const parsed = new URL(full, window.location.origin);
      const pathname = parsed.pathname || '/';
      const hash = parsed.hash ? parsed.hash.slice(1) : '';

      if (pathname !== '/' && pathname !== '') {
        const found = navLinks.find((link) => link.href === pathname);
        if (found) {
          setActive(found.label);
          return;
        }
      }

      if (hash) {
        const found = navLinks.find((link) => link.href === `#${hash}`);
        if (found) {
          setActive(found.label);
          return;
        }
      }

      if (pathname === '/' || pathname === '') {
        setActive('Beranda');
      }
    } catch (e) {
      // ignore
    }
  }, [url]);

  useEffect(() => {
    try {
      const full = url ?? window.location.href;
      const parsed = new URL(full, window.location.origin);
      const pathname = parsed.pathname || '/';

      if (pathname !== '/' && pathname !== '') return;

      const ids = navLinks
        .map((link) => (link.href && link.href.startsWith("#") ? link.href.slice(1) : null))
        .filter(Boolean) as string[];

      const elements = ids
        .map((raw) => {
          return (
            document.getElementById(raw) ||
            document.getElementById(raw.toLowerCase()) ||
            document.getElementById(raw.toUpperCase())
          );
        })
        .filter(Boolean) as Element[];

      if (!elements.length) return;

      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = (entry.target as Element).id;
              const found = navLinks.find((link) => {
                const href = link.href && link.href.startsWith("#") ? link.href.slice(1) : link.href;
                return href && (href === id || href.toLowerCase() === id.toLowerCase());
              });
              if (found) setActive(found.label);
            }
          });
        },
        { root: null, rootMargin: "-40% 0px -40% 0px", threshold: 0 }
      );

      elements.forEach((element) => obs.observe(element));
      return () => obs.disconnect();
    } catch (e) {
      // ignore
    }
  }, [url]);

  const navigateToSection = (id: string) => {
    try {
      const pathname = window.location.pathname || '/';
      const isLanding = pathname === '/' || pathname === '';
      if (isLanding) {
        const target = document.getElementById(id) || document.getElementById(id.toLowerCase());
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }
      router.visit(`/#${id}`);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    try {
      const full = url ?? window.location.href;
      const parsed = new URL(full, window.location.origin);
      const hash = parsed.hash || window.location.hash;
      const pathname = parsed.pathname || window.location.pathname;
      if (hash && (pathname === '/' || pathname === '')) {
        const id = (hash.startsWith('#') ? hash.slice(1) : hash);
        setTimeout(() => {
          const target = document.getElementById(id) || document.getElementById(id.toLowerCase());
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    } catch (e) {
      // ignore
    }
  }, [url]);

  // 4. Tambahkan Tipe pada Parameter Fungsi
  const renderDesktopLink = (link: { label: string; href?: string }, isDropdownItem: boolean = false) => {
    const isActive = active === link.label;
    const baseClass = isDropdownItem
      ? `block px-4 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? 'text-primary bg-primary-soft' : 'text-muted hover:text-primary hover:bg-primary-soft/60'}`
      : `px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive ? 'text-primary bg-primary-soft' : 'text-muted hover:text-primary hover:bg-primary-soft/60'}`;

    if (link.href && link.href.startsWith('#')) {
      return (
        <a key={link.label} href={link.href} onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
          e.preventDefault();
          navigateToSection(link.href!.slice(1));
        }} className={baseClass}>
          {link.label}
        </a>
      );
    }
    return (
      <Link key={link.label} href={link.href ?? '#'} onClick={() => setActive(link.label)} className={baseClass}>
        {link.label}
      </Link>
    );
  };

  const renderMobileLink = (link: { label: string; href?: string }, isChild: boolean = false) => {
    const isActive = active === link.label;
    const baseClass = `block py-3 text-sm font-medium rounded-xl transition-all ${isChild ? 'pl-8 pr-4' : 'px-4'} ${isActive ? 'text-primary bg-primary-soft' : 'text-muted hover:text-primary hover:bg-primary-soft/60'}`;

    if (link.href && link.href.startsWith('#')) {
      return (
        <a key={link.label} href={link.href} onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
          setMobileOpen(false);
          e.preventDefault();
          navigateToSection(link.href!.slice(1));
        }} className={baseClass}>
          {link.label}
        </a>
      );
    }
    return (
      <Link key={link.label} href={link.href ?? '#'} onClick={() => { setMobileOpen(false); setActive(link.label); }} className={baseClass}>
        {link.label}
      </Link>
    );
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-surface-container" : "bg-white/90 backdrop-blur-md border-b border-surface-container/80"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            <a href="#beranda" onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); navigateToSection('beranda'); }} className="flex items-center gap-3 group">
              <img
                src="/images/Logo-Unuha.png" 
                alt="Logo Universitas Nurul Huda"
                className="h-10 w-auto rounded-lg object-contain shadow-sm"
              />
              <div className="leading-tight">
                <div className="text-ink font-bold text-sm">
                  Biro Sarana & Prasarana
                </div>
                <div className="text-primary font-extrabold text-sm">
                  Universitas Nurul Huda
                </div>
              </div>
            </a>

            <div className="hidden lg:flex items-center gap-1 font-sans">
              {navGroups.map((group) => {
                if (group.type === 'link') {
                  return renderDesktopLink(group);
                }

                if (group.type === 'dropdown') {
                  const isActiveGroup = group.items?.some(item => item.label === active);

                  return (
                    <div key={group.label} className="relative group">
                      <button className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActiveGroup ? 'text-primary' : 'text-muted hover:text-primary hover:bg-primary-soft/60'}`}>
                        {group.label} <ChevronDown className="h-4 w-4" />
                      </button>

                      <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-surface-container shadow-xl rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                        <div className="flex flex-col py-2">
                          {group.items?.map(item => renderDesktopLink(item, true))}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            <div className="hidden lg:block">
              <Link
                href={isAuthenticated ? '/dashboard' : route('login')}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5 transition-all duration-300"
              >
                {isAuthenticated ? 'Dashboard' : 'Login'}
              </Link>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-ink hover:bg-surface-low transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className={`lg:hidden transition-all duration-300 overflow-hidden font-sans ${mobileOpen ? "max-h-[70vh] opacity-100 overflow-y-auto" : "max-h-0 opacity-0"}`}>
          <div className="bg-white/95 backdrop-blur-xl border-t border-surface-container px-4 py-4 space-y-1">
            {navGroups.map((group) => {
              if (group.type === 'link') {
                return renderMobileLink(group);
              }

              if (group.type === 'dropdown') {
                return (
                  <div key={group.label} className="py-2">
                    <div className="px-4 py-1 text-xs font-bold text-muted/70 uppercase tracking-wider">
                      {group.label}
                    </div>
                    <div className="space-y-1 mt-1">
                      {group.items?.map(item => renderMobileLink(item, true))}
                    </div>
                  </div>
                );
              }
              return null;
            })}

            <div className="pt-4 mt-2 border-t border-surface-container flex flex-col gap-2">
              <Link href={isAuthenticated ? '/dashboard' : route('login')} className="w-full text-center px-4 py-3 text-sm font-semibold text-primary border border-primary/30 rounded-xl hover:bg-primary-soft transition-colors">
                {isAuthenticated ? 'Dashboard' : 'Login'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div aria-hidden className="h-16 lg:h-20" />
    </>
  );
}