import { BookOpen, CalendarClock, Flower2, MessageCircle, Sparkles, TreeDeciduous } from "lucide-react";
import { BrandOrnament } from "@/components/BrandLockup";

/** What Premium unlocks — only features the app really has, in the brand's circled-icon style. */
const FEATURES = [
  { icon: TreeDeciduous, title: "Árvore da Prosperidade", note: "cresce com as suas ações" },
  { icon: Sparkles, title: "Diagnóstico completo", note: "seu perfil e suas 5 dimensões" },
  { icon: CalendarClock, title: "Seu Momento", note: "hoje, na semana e no mês" },
  { icon: Flower2, title: "Experiências exclusivas", note: "tarô, roda e trilhas guiadas" },
  { icon: BookOpen, title: "Conteúdos Premium", note: "guias da sua biblioteca" },
  { icon: MessageCircle, title: "Conversa com a IA", note: "uma dica para o seu dia" },
];

export function PremiumFeatures({ title = "Quer ir além do diagnóstico?" }: { title?: string }) {
  return <section className="premium-features">
    <h2>{title}</h2>
    <p className="premium-features__sub">Desbloqueie sua experiência Premium.</p>
    <BrandOrnament/>
    <ul>
      {FEATURES.map(({ icon: Icon, title: name, note }) => <li key={name}>
        <span aria-hidden="true"><Icon strokeWidth={1.4}/></span>
        <strong>{name}</strong>
        <small>{note}</small>
      </li>)}
    </ul>
  </section>;
}
