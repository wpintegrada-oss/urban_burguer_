import { useState, type FormEvent } from "react";
import type { Settings } from "@shared/types";
import { Field, inputCls } from "./kit";
import { ImageField } from "./ImageField";
import { useAdminActions } from "./useAdmin";

export function StoreTab({ pin, settings }: { pin: string; settings: Settings }) {
  const actions = useAdminActions(pin);
  const [f, setF] = useState<Settings>(settings);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setF((s) => ({ ...s, [key]: value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    actions.saveSettings.mutate(f);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" data-testid="store-form">
      <section className="space-y-4 rounded-2xl border border-line bg-panel p-4">
        <h2 className="font-bold">Identidade</h2>
        <Field label="Nome da loja" id="sf-name">
          <input id="sf-name" required maxLength={40} value={f.name} data-testid="store-name"
            onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Selo acima do título (opcional)" id="sf-tagline" hint="Ex.: Hamburgueria Artesanal">
          <input id="sf-tagline" maxLength={60} value={f.tagline} data-testid="store-tagline"
            onChange={(e) => set("tagline", e.target.value)} className={inputCls} />
        </Field>
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-panel p-4">
        <h2 className="font-bold">Capa do site</h2>
        <ImageField label="Foto de fundo da capa" value={f.heroImage} onChange={(v) => set("heroImage", v)}
          pin={pin} testId="store-hero-image" />
        <Field label="Título" id="sf-title">
          <input id="sf-title" maxLength={80} value={f.heroTitle} data-testid="store-hero-title"
            onChange={(e) => set("heroTitle", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Final do título (aparece em laranja)" id="sf-accent">
          <input id="sf-accent" maxLength={80} value={f.heroAccent} data-testid="store-hero-accent"
            onChange={(e) => set("heroAccent", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Texto de apoio" id="sf-sub">
          <textarea id="sf-sub" rows={3} maxLength={240} value={f.heroSubtitle} data-testid="store-hero-subtitle"
            onChange={(e) => set("heroSubtitle", e.target.value)} className={`${inputCls} resize-none`} />
        </Field>
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-panel p-4">
        <h2 className="font-bold">WhatsApp da loja</h2>
        <Field label="Número que recebe os pedidos" id="sf-wa" hint="Com DDD. Ex.: (86) 99999-9999">
          <input id="sf-wa" required inputMode="tel" value={f.whatsappNumber} data-testid="store-whatsapp"
            onChange={(e) => set("whatsappNumber", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Como mostrar o número no site (opcional)" id="sf-wad" hint="Se deixar vazio, o site monta sozinho.">
          <input id="sf-wad" maxLength={30} value={f.whatsappDisplay} data-testid="store-whatsapp-display"
            onChange={(e) => set("whatsappDisplay", e.target.value)} className={inputCls} />
        </Field>
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-panel p-4">
        <h2 className="font-bold">Horário de funcionamento</h2>
        <Field label="Texto que aparece no rodapé do site" id="sf-hours" hint="Pode usar várias linhas. Ex.: Seg a Sex: 18h às 23h">
          <textarea id="sf-hours" rows={4} maxLength={400} value={f.hours} data-testid="store-hours"
            placeholder={"Seg a Sex: 18h às 23h\nSáb e Dom: 17h às 00h"}
            onChange={(e) => set("hours", e.target.value)} className={`${inputCls} resize-none`} />
        </Field>
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-panel p-4">
        <h2 className="font-bold">Instagram</h2>
        <Field label="Usuário ou link do perfil (opcional)" id="sf-ig" hint="Ex.: urbanburguer ou instagram.com/urbanburguer">
          <input id="sf-ig" maxLength={120} value={f.instagram} data-testid="store-instagram"
            onChange={(e) => set("instagram", e.target.value)} className={inputCls} />
        </Field>
      </section>

      <button
        type="submit"
        disabled={actions.saveSettings.isPending}
        data-testid="store-save"
        className="glow w-full rounded-full bg-brand px-5 py-3.5 font-bold text-white hover:bg-brand-soft disabled:opacity-60"
      >
        {actions.saveSettings.isPending ? "Salvando…" : "Salvar dados da loja"}
      </button>
    </form>
  );
}
