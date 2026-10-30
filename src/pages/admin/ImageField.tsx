import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { FoodImage } from "@/components/Visuals";
import { inputCls } from "./kit";

/** Reduz a foto no próprio navegador (máx. 900 px) para o envio ser rápido. */
async function fileToDataUrl(file: File, maxSide = 900): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Não consegui abrir essa imagem. Use JPG, PNG ou WebP."));
      el.src = objectUrl;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Seu navegador não conseguiu preparar a imagem.");
    ctx.fillStyle = "#ffffff"; // PNG transparente vira fundo branco
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ImageField({
  value,
  onChange,
  pin,
  label = "Foto",
  testId = "image-field",
}: {
  value: string;
  onChange: (url: string) => void;
  pin: string;
  label?: string;
  testId?: string;
}) {
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem (JPG, PNG ou WebP).");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { url } = await apiPost<{ url: string }>("/image", { dataUrl }, { "x-admin-pin": pin });
      onChange(url);
      toast.success("Foto enviada!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid={testId}>
      <p className="mb-1.5 text-xs font-semibold text-muted">{label}</p>
      <div className="flex items-center gap-3">
        <FoodImage src={value} alt="Pré-visualização" className="size-24 shrink-0 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <label
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-soft ${
              busy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <ImagePlus size={16} /> {busy ? "Enviando…" : value ? "Trocar foto" : "Enviar foto"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              data-testid={`${testId}-file`}
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = ""; // permite escolher o mesmo arquivo de novo
              }}
            />
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs text-muted transition hover:text-red-400"
            >
              <Trash2 size={14} /> Remover foto
            </button>
          )}
        </div>
      </div>
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer">Ou usar um link de imagem</summary>
        <input
          type="url"
          inputMode="url"
          placeholder="https://..."
          value={value.startsWith("/api/image") ? "" : value}
          onChange={(e) => onChange(e.target.value.trim())}
          data-testid={`${testId}-url`}
          className={`${inputCls} mt-2`}
        />
      </details>
    </div>
  );
}
