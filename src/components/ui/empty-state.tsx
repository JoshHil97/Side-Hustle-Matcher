import { Card } from "@/components/ui/card";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="text-center">
      <p className="text-sm font-semibold text-stone-900">{title}</p>
      <p className="mt-2 text-sm text-stone-600">{description}</p>
    </Card>
  );
}
