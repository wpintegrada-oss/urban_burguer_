import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Flame, Instagram, MessageCircle, ShoppingBag } from "lucide-react";
import type { MenuItem } from "@shared/types";
import { brl, isPromoActive } from "@shared/pricing";
import { useCart } from "@/lib/cart";
import { useMenu } from "@/lib/menu";
import { CATEGORY_ICONS } from "@/components/icons";
import { ItemModal } from "@/components/ItemModal";
import { CartDrawer } from "@/components/CartDrawer";
import { FoodImage, Price, PromoPill } from "@/components/Visuals";

export default function Home() {
  const cart = useCart();
  const { menu, settings } = useMenu();
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [activeCat, setActiveCat] = useState("");
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lockSpy = useRef(false);

  const categories = menu?.categories ?? [];
  const catKey = categories.map((c) => c.id).join("|");
  const active = activeCat || categories[0]?.id || "";

  useEffect(() => {
    document.title = `${settings.name} · ${settings.tagline}`;
  }, [settings.name, settings.tagline]);

  // Destaca a categoria da seção visível enquanto o cliente rola a página.
  useEffect(() => {
    if (!catKey) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (lockSpy.current) return;
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveCat(visible[0].target.id.replace("cat-", ""));
      },
      { rootMargin: "-130px 0px -65% 0px" },
    );
    catKey.split("|").forEach((id) => {
      const el = document.getElementById(`cat-${id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [catKey]);

  // Mantém a pílula ativa visível na barra horizontal.
  useEffect(() => {
    if (active) {
      pillRefs.current[active]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [active]);

  const goTo = (id: string) => {
    setActiveCat(id);
    lockSpy.current = true;
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => (lockSpy.current = false), 700);
  };

  if (!menu) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted" data-testid="menu-loading">
        <div className="flex items-center gap-2">
          <Flame className="animate-pulse text-brand" /> Carregando cardápio…
        </div>
      </div>
    );
  }

  const [firstWord, ...restWords] = settings.name.toUpperCase().split(" ");
  const visibleCats = categories.filter((c) => menu.products.some((p) => p.categoryId === c.id));

  return (
    <div className={cart.count > 0 ? "pb-28" : "pb-10"}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-heading text-lg font-black tracking-tight">
            <Flame className="text-brand" size={22} /> {firstWord}{" "}
            {restWords.length > 0 && <span className="text-brand">{restWords.join(" ")}</span>}
          </Link>
          <button
            type="button"
            onClick={() => cart.setOpen(true)}
            data-testid="header-cart-button"
            aria-label={`Abrir carrinho (${cart.count} itens)`}
            className="relative rounded-full border border-line bg-panel p-2.5 transition hover:bg-panel-hover"
          >
            <ShoppingBag size={20} />
            {cart.count > 0 && (
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold">
                {cart.count}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-panel">
        {settings.heroImage && (
          <img src={settings.heroImage} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
        )}
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(180deg, rgba(13,13,17,0.7) 0%, rgba(13,13,17,0.95) 100%)" }}
        />
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-16 sm:pb-20 sm:pt-24">
          {settings.tagline && (
            <span className="inline-block rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {settings.tagline}
            </span>
          )}
          <h1 className="mt-4 max-w-xl text-4xl font-black leading-[1.05] sm:text-6xl">
            {settings.heroTitle} <span className="text-brand">{settings.heroAccent}</span>
          </h1>
          {settings.heroSubtitle && (
            <p className="mt-4 max-w-md text-base text-zinc-300">{settings.heroSubtitle}</p>
          )}
          {visibleCats.length > 0 && (
            <button
              type="button"
              onClick={() => goTo(visibleCats[0].id)}
              data-testid="hero-cta-button"
              className="glow mt-7 rounded-full bg-brand px-7 py-3.5 font-bold transition hover:bg-brand-soft active:scale-[0.98]"
            >
              Ver cardápio
            </button>
          )}
        </div>
      </section>

      {/* Categorias */}
      {visibleCats.length > 0 && (
        <nav
          aria-label="Categorias do cardápio"
          className="sticky top-14 z-20 border-b border-line bg-ink/90 backdrop-blur-xl"
        >
          <div className="no-scrollbar mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3">
            {visibleCats.map((c) => {
              const Icon = CATEGORY_ICONS[c.icon] ?? CATEGORY_ICONS.Flame;
              const on = active === c.id;
              return (
                <button
                  key={c.id}
                  ref={(el) => {
                    pillRefs.current[c.id] = el;
                  }}
                  type="button"
                  onClick={() => goTo(c.id)}
                  aria-current={on ? "true" : undefined}
                  data-testid={`category-pill-${c.id}`}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    on ? "bg-brand text-white" : "bg-chip text-zinc-300 hover:bg-panel-hover"
                  }`}
                >
                  <Icon size={15} /> {c.name}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Cardápio */}
      <main id="cardapio" className="mx-auto max-w-5xl space-y-12 px-4 pt-8">
        {visibleCats.length === 0 && (
          <p data-testid="menu-empty" className="py-16 text-center text-muted">
            Estamos atualizando o cardápio. Volte em instantes!
          </p>
        )}
        {visibleCats.map((c) => {
          const items = menu.products.filter((i) => i.categoryId === c.id);
          return (
            <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-32" data-testid={`category-section-${c.id}`}>
              <h2 className="text-2xl font-bold sm:text-3xl">{c.name}</h2>
              {c.description && <p className="mb-4 mt-1 text-sm text-muted">{c.description}</p>}
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item)}
                    data-testid={`menu-item-${item.id}`}
                    className="group flex gap-4 rounded-2xl border border-line bg-panel p-3 text-left transition hover:border-brand/60 hover:bg-panel-hover"
                  >
                    <div className="min-w-0 flex-1 py-1">
                      {(isPromoActive(item) || item.badge) && (
                        <div className="mb-1.5 flex flex-wrap gap-1.5">
                          {isPromoActive(item) && <PromoPill />}
                          {item.badge && (
                            <span className="inline-block rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-bold text-brand-soft">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                      <h3 className="text-lg font-bold leading-tight">{item.name}</h3>
                      {item.description && (
                        <p className="mt-1 line-clamp-3 text-sm leading-snug text-muted">{item.description}</p>
                      )}
                      <Price item={item} className="mt-2 block font-heading text-lg font-bold text-brand" />
                    </div>
                    <FoodImage
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="size-28 shrink-0 rounded-xl transition group-hover:scale-[1.03] sm:size-32"
                    />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="mx-auto mt-14 flex max-w-5xl flex-col gap-6 px-4 text-sm text-muted sm:flex-row sm:items-start sm:justify-between">
        <div data-testid="footer-credit" className="text-center sm:text-left">
          <p className="text-xs uppercase tracking-wide">Desenvolvido por</p>
          <p className="font-heading font-bold text-white">WP Integrada</p>
          <a
            href="https://wa.me/5586998030143"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-brand-soft hover:underline"
          >
            <MessageCircle size={16} /> (86) 99803-0143
          </a>
          <a
            href="https://www.instagram.com/wp.integrada"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-1.5 text-brand-soft hover:underline sm:justify-start"
          >
            <Instagram size={16} /> @wp.integrada
          </a>
        </div>
        <div className="text-center sm:text-right">
          <p className="font-heading font-bold text-white">{settings.name}</p>
          <a
            href={`https://wa.me/${settings.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-brand-soft hover:underline"
          >
            <MessageCircle size={16} /> {settings.whatsappDisplay}
          </a>
          {settings.instagram && (
            <a
              href={`https://instagram.com/${settings.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-instagram"
              className="mt-2 flex items-center justify-center gap-1.5 text-brand-soft hover:underline sm:justify-end"
            >
              <Instagram size={16} /> @{settings.instagram}
            </a>
          )}
          {settings.hours && (
            <p
              data-testid="footer-hours"
              className="mt-3 flex max-w-xs items-start justify-center gap-1.5 whitespace-pre-line text-left sm:ml-auto sm:justify-end"
            >
              <Clock size={16} className="mt-0.5 shrink-0" /> <span>{settings.hours}</span>
            </p>
          )}
        </div>
      </footer>

      {/* Barra do carrinho */}
      {cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-3">
          <button
            type="button"
            onClick={() => cart.setOpen(true)}
            data-testid="cart-bar"
            className="glow mx-auto flex w-full max-w-lg items-center justify-between rounded-full bg-brand px-6 py-4 font-bold transition hover:bg-brand-soft active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag size={20} /> Ver carrinho · {cart.count} {cart.count === 1 ? "item" : "itens"}
            </span>
            <span>{brl(cart.total)}</span>
          </button>
        </div>
      )}

      <ItemModal item={selected} onClose={() => setSelected(null)} />
      <CartDrawer />
    </div>
  );
}
