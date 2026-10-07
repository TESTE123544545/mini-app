import type { Metadata } from "next";
import "../signos/signos.css";
import { SeoPage } from "@/components/SeoPage";

export const metadata: Metadata = {
  title: { absolute: "Excluir minha conta | Veias da Sintonia" },
  description: "Como excluir a sua conta do Veias da Sintonia e quais dados são apagados.",
  alternates: { canonical: "/excluir-conta" },
};

const CONTACT = "contato@veiasdasintonia.com.br";

/** The account-deletion page that app stores ask for (Google Play "Data safety"). */
export default function DeleteAccountPage() {
  return <SeoPage crumbs={[{ name: "Excluir conta", href: "/excluir-conta" }]} jsonLd={[]}>
    <header className="zodiac-hero"><h1>Excluir minha conta</h1><p>Você pode apagar a sua conta e os seus dados quando quiser.</p></header>
    <div className="zodiac-body legal">
      <section className="zodiac-section"><h2>Pelo aplicativo</h2>
        <p>Abra o app, vá em <strong>Perfil</strong>, role até o fim e toque em <strong>Excluir minha conta</strong>. Por segurança, pedimos a sua senha para confirmar. A exclusão é imediata e não pode ser desfeita.</p></section>
      <section className="zodiac-section"><h2>Por e-mail</h2>
        <p>Se não consegue entrar, escreva para <a href={`mailto:${CONTACT}`}>{CONTACT}</a> a partir do e-mail cadastrado, com o assunto “Excluir minha conta”. Respondemos e apagamos os dados em até 15 dias.</p></section>
      <section className="zodiac-section"><h2>O que é apagado</h2>
        <p>Conta (e-mail e senha), perfil (nome, data, hora e cidade de nascimento, signo, objetivo e intenção), metas, reflexões do diário, conquistas, progresso da árvore, conversas com a IA, histórico de sinais e foto de perfil, além dos registros de uso ligados à conta.</p>
        <p>Podemos manter apenas o que a lei exigir, como registros de pagamento. Os dados de cartão ficam com o Stripe ou com a Google Play, nunca conosco.</p></section>
      <section className="zodiac-section"><h2>Assinaturas</h2>
        <p>Ao excluir a conta, as assinaturas feitas pelo site (Stripe) são canceladas automaticamente. Se você assinou pela Google Play, cancele também em <strong>Play Store, Pagamentos e assinaturas, Assinaturas</strong>, para não ser cobrado.</p></section>
    </div>
  </SeoPage>;
}
