"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { createReview } from "@/lib/actions/review.actions";
import { cn } from "@/lib/utils/cn";

export function ReviewForm({ purchaseId, productName }: { purchaseId: string; productName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Selecciona una calificación.");
      return;
    }
    setError(null);
    setLoading(true);

    const result = await createReview({ purchaseId, rating, comment: comment || undefined });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <MessageSquarePlus size={14} /> Dejar reseña
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={productName}>
        {success ? (
          <p className="text-sm text-success">¡Gracias por tu reseña!</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} estrellas`}
                  className="p-1"
                >
                  <Star
                    size={26}
                    className={cn(
                      "transition-colors",
                      (hovered || rating) >= n ? "text-warning" : "text-border-strong"
                    )}
                    fill={(hovered || rating) >= n ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntale a otros compradores cómo te fue (opcional)"
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" isLoading={loading}>
              Enviar reseña
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
