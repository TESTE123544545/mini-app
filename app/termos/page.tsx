import type { Metadata } from "next";
import Link from "next/link";
import "../signos/signos.css";
import { SeoPage } from "@/components/SeoPage";

export const metadata: Metadata = {
  title: { absolute: "Termos de Uso | Veias da Sintonia" },
  description: "Termos de uso do Veias da Sintonia: o que o app oferece, conta, assinatura Premium, teste grátis, cancelamento e responsabilidades.",
  alternates: { canonical: "/termos" },
};

const UPDATED = "28 de setembro de 2026";
const CONTACT = "contato@veiasdasintonia.com.br";

/** Terms of use. Keep in step with how trial, subscription and cancellation actually work. */
export default function TermsPage() {
  return <SeoPage crumbs={[{ name: "Termos de uso", href: "/termos" }]} jsonLd={[]}>
    <header className="zodiac-hero"><h1>Termos de Uso</h1><p>Última atualização: {UPDATED}</p></header>
    <div className="zodiac-body legal">
      <p className="seo-lede">Ao criar uma conta ou usar o Veias da Sintonia (site e aplicativo), você concorda com estes termos e com a nossa <Link href="/privacidade">Política de Privacidade</Link>.</p>

      <section className="zodiac-section"><h2>1. O que é o Veias da Sintonia</h2>
        <p>Um app de autoconhecimento e hábitos que usa a astrologia como linguagem simbólica: leituras do signo, diagnóstico, missões, diário, metas e conversa com uma inteligência artificial.</p>
        <p><strong>Conteúdo para entretenimento e autoconhecimento.</strong> As leituras não são previsões garantidas e não substituem aconselhamento profissional — psicológico, médico, jurídico ou financeiro. Nenhum conteúdo do app é recomendação de investimento, e não prometemos resultados financeiros. As respostas da IA podem conter erros; use o seu próprio julgamento.</p></section>

      <section className="zodiac-section"><h2>2. Idade e conta</h2>
        <p>Você precisa ter 18 anos ou mais, ou 16 anos com autorização dos pais ou responsáveis. Use um e-mail real e seu; e-mails temporários ou de teste não são aceitos. Você é responsável por manter sua senha em segredo e por tudo o que acontece na sua conta.</p></section>

      <section className="zodiac-section"><h2>3. Plano grátis, teste e Premium</h2>
        <p><strong>Grátis:</strong> fazer o diagnóstico. Os demais recursos fazem parte do Premium.</p>
        <p><strong>Teste grátis:</strong> contas novas recebem o Premium completo por 3 dias, sem cartão e sem cobrança automática. Ao fim do teste, a conta volta sozinha ao plano grátis e sua jornada continua salva.</p>
        <p><strong>Presente de boas-vindas:</strong> quem fez o teste tem 50% de desconto no primeiro mês da primeira assinatura mensal, válido até 7 dias depois do fim do teste. O desconto vale só para o primeiro mês; depois, o valor normal do plano.</p>
        <p><strong>Assinatura mensal:</strong> cobrada todo mês pelo Stripe até você cancelar. Sem fidelidade: cancele quando quiser em Perfil → Gerenciar assinatura; o acesso continua até o fim do período já pago.</p>
        <p><strong>Acesso vitalício:</strong> pagamento único, sem mensalidade.</p>
        <p>Os preços aparecem no app antes de você confirmar. Você pode desistir da compra em até 7 dias, conforme o Código de Defesa do Consumidor (art. 49), escrevendo para <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p></section>

      <section className="zodiac-section"><h2>4. Uso aceitável</h2>
        <p>Não use o app para atividades ilegais, para ofender ou assediar, para tentar acessar contas ou áreas que não são suas, nem para sobrecarregar o serviço. Mensagens abusivas no chat podem suspender temporariamente o acesso ao chat. Podemos suspender ou encerrar contas que violem estes termos.</p></section>

      <section className="zodiac-section"><h2>5. Conteúdo e propriedade intelectual</h2>
        <p>Textos, marca, artes e o app pertencem ao Veias da Sintonia. O que você escreve (diário, metas, mensagens) é seu; você nos autoriza a guardá-lo e processá-lo apenas para prestar o serviço.</p></section>

      <section className="zodiac-section"><h2>6. Disponibilidade e responsabilidade</h2>
        <p>Trabalhamos para manter o app no ar e seguro, mas ele pode ter interrupções ou falhas. Na medida permitida pela lei, não nos responsabilizamos por decisões tomadas com base nas leituras ou nas respostas da IA.</p></section>

      <section className="zodiac-section"><h2>7. Mudanças, lei e contato</h2>
        <p>Podemos atualizar estes termos; mudanças relevantes serão avisadas no app ou por e-mail. Estes termos seguem a lei brasileira. Dúvidas: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p></section>
    </div>
  </SeoPage>;
}
