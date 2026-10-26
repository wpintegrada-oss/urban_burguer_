import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, MessageCircle, ShoppingBag } from "lucide-react";
import { CATEGORIES, HERO_IMAGE, ITEMS, STORE, type MenuItem } from "@shared/menu";
import { brl } from "@shared/pricing";
import { useCart } from "@/lib/cart";
import { CATEGORY_ICONS } from "@/components/icons";
import { ItemModal } from "@/components/ItemModal";
import { CartDrawer } from "@/components/CartDrawer";

export default function Home() {
  const cart = useCart();
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [active, setActive] = useState(CATEGORIES[0].id);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lockSpy = useRef(false);

  // Destaca a categoria da seção visível enquanto o cliente rola a página.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (lockSpy.current) return;
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id.replace("cat-", ""));
      },
      { rootMargin: "-130px 0px -65% 0px" },
    );
    CATEGORIES.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Mantém a pílula ativa visível na barra horizontal.
  useEffect(() => {
    pillRefs.current[active]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  const goTo = (id: string) => {
    setActive(id);
    lockSpy.current = true;
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => (lockSpy.current = false), 700);
  };

  return (
    <div className={cart.count > 0 ? "pb-28" : "pb-10"}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-heading text-lg font-black tracking-tight">
            <Flame className="text-brand" size={22} /> URBAN <span className="text-brand">BURGUER</span>
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
      <section className="relative isolate overflow-hidden">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "linear-gradient(180deg, rgba(13,13,17,0.7) 0%, rgba(13,13,17,0.95) 100%)" }}
        />
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-16 sm:pb-20 sm:pt-24">
          <span className="inline-block rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wider">
            {STORE.tagline}
          </span>
          <h1 className="mt-4 max-w-xl text-4xl font-black leading-[1.05] sm:text-6xl">
            Burgers feitos na chapa, <span className="text-brand">entregues quentes.</span>
          </h1>
          <p className="mt-4 max-w-md text-base text-zinc-300">
            Peça online seus burgers, combos, porções e batatas recheadas. Entrega rápida e
            confirmação pelo WhatsApp.
          </p>
          <button
            type="button"
            onClick={() => goTo(CATEGORIES[0].id)}
            data-testid="hero-cta-button"
            className="glow mt-7 rounded-full bg-brand px-7 py-3.5 font-bold transition hover:bg-brand-soft active:scale-[0.98]"
          >
            Ver cardápio
          </button>
        </div>
      </section>

      {/* Categorias */}
      <nav
        aria-label="Categorias do cardápio"
        className="sticky top-14 z-20 border-b border-line bg-ink/90 backdrop-blur-xl"
      >
        <div className="no-scrollbar mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c.icon];
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

      {/* Cardápio */}
      <main id="cardapio" className="mx-auto max-w-5xl space-y-12 px-4 pt-8">
        {CATEGORIES.map((c) => {
          const items = ITEMS.filter((i) => i.categoryId === c.id);
          if (items.length === 0) return null;
          return (
            <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-32" data-testid={`category-section-${c.id}`}>
              <h2 className="text-2xl font-bold sm:text-3xl">{c.name}</h2>
              <p className="mb-4 mt-1 text-sm text-muted">{c.description}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item)}
                    data-testid={`menu-item-${item.id}`}
                    className="group flex gap-4 rounded-2xl border border-line bg-panel p-3 text-left transition hover:border-brand/60 hover:bg-panel-hover"
                  >
                    <div className="min-w-0 flex-1 py-1">
                      {item.badge && (
                        <span className="mb-1.5 inline-block rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] font-bold text-brand-soft">
                          {item.badge}
                        </span>
                      )}
                      <h3 className="text-lg font-bold leading-tight">{item.name}</h3>
                      <p className="mt-1 line-clamp-3 text-sm leading-snug text-muted">{item.description}</p>
                      <p className="mt-2 font-heading text-lg font-bold text-brand">{brl(item.price)}</p>
                    </div>
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="size-28 shrink-0 rounded-xl object-cover transition group-hover:scale-[1.03] sm:size-32"
                    />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="mx-auto mt-14 max-w-5xl px-4 text-center text-sm text-muted">
        <p className="font-heading font-bold text-white">{STORE.name}</p>
        <a
          href={`https://wa.me/${STORE.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-brand-soft hover:underline"
        >
          <MessageCircle size={16} /> {STORE.whatsappDisplay}
        </a>
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
