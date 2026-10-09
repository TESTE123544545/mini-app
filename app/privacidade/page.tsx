import type { Metadata } from "next";
import "../signos/signos.css";
import { SeoPage } from "@/components/SeoPage";

export const metadata: Metadata = {
  title: { absolute: "Política de Privacidade | Veias da Sintonia" },
  description: "Como o Veias da Sintonia coleta, usa e protege seus dados pessoais, de acordo com a LGPD (Lei 13.709/2018), e como exercer seus direitos.",
  alternates: { canonical: "/privacidade" },
};

const UPDATED = "28 de setembro de 2026";
const CONTACT = "contato@veiasdasintonia.com.br";

/** Privacy policy (LGPD). Describes what the code actually does — keep it in step with the app. */
export default function PrivacyPage() {
  return <SeoPage crumbs={[{ name: "Privacidade", href: "/privacidade" }]} jsonLd={[]}>
    <header className="zodiac-hero"><h1>Política de Privacidade</h1><p>Última atualização: {UPDATED}</p></header>
    <div className="zodiac-body legal">
      <p className="seo-lede">Esta política explica quais dados pessoais o Veias da Sintonia (veiasdasintonia.com.br e o aplicativo) coleta, para quê, com quem compartilha e como você pode exercer os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p>

      <section className="zodiac-section"><h2>1. Quem é o controlador</h2>
        <p>O controlador dos dados é o Veias da Sintonia. Para qualquer assunto de privacidade, inclusive para falar com o encarregado (DPO), escreva para <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p></section>

      <section className="zodiac-section"><h2>2. Quais dados coletamos</h2>
        <p><strong>Conta:</strong> e-mail e senha (guardamos apenas uma versão cifrada da senha, nunca a senha em si).</p>
        <p><strong>Perfil e jornada:</strong> nome, data de nascimento, signo, objetivo e intenção que você informa; metas, missões, reflexões do diário, conquistas e progresso da sua árvore; histórico dos sinais (horas iguais) que você abre na aba Sinais; foto de perfil, se você escolher enviar uma.</p>
        <p><strong>Conversas com a IA:</strong> as mensagens que você escreve no chat e as respostas, para manter o histórico das suas conversas.</p>
        <p><strong>Comunidade da Sintonia:</strong> se você entrar na comunidade (só para maiores de 18 anos), guardamos o nome de usuário e de exibição, a bio opcional, o signo (calculado da sua data de nascimento), as mensagens que você envia nas salas, as denúncias e bloqueios que você faz e, se você for denunciado, o registro da ação da equipe. As mensagens das salas e o seu perfil da comunidade (nome, signo, bio, selo) ficam visíveis para os outros membros. Não mostramos a sua data de nascimento, e-mail nem dados da sua jornada.</p>
        <p><strong>Diagnóstico:</strong> as respostas do diagnóstico ficam guardadas no seu próprio aparelho.</p>
        <p><strong>Pagamentos:</strong> o pagamento é feito pelo Stripe; nós não recebemos nem guardamos os dados do seu cartão — apenas o status da sua assinatura.</p>
        <p><strong>Uso do app e visitas:</strong> registramos ações dentro do app (por exemplo, “missão concluída”) e contamos visitas às páginas. A contagem de visitas não usa cookies e não guarda o seu endereço IP: usamos um código que muda todos os dias e não permite identificar você.</p>
        <p><strong>Tradução automática:</strong> se você usa o app em outro idioma que não o português, os textos do próprio app que aparecem na tela são enviados a um serviço de inteligência artificial para serem traduzidos e as traduções ficam guardadas para todos os usuários, sem ligação com você. O que você mesmo escreve (nome, metas, diário, conversas) não é enviado para esse fim; já os textos que o app gera a partir da sua jornada, como o relatório semanal, podem ser.</p></section>

      <section className="zodiac-section"><h2>3. Para que usamos e com qual base legal</h2>
        <p><strong>Prestar o serviço</strong> (criar e manter sua conta, gerar suas leituras, missões e relatórios, guardar sua jornada): execução do contrato com você (art. 7º, V).</p>
        <p><strong>Pagamentos e assinatura</strong>: execução do contrato e cumprimento de obrigações legais (art. 7º, II e V).</p>
        <p><strong>E-mails sobre a sua conta</strong> (recuperação de senha, teste grátis, fim do teste): execução do contrato e legítimo interesse (art. 7º, IX). Você pode deixar de receber os e-mails do teste pelo link em cada mensagem.</p>
        <p><strong>Segurança e prevenção de abuso</strong> (limites de tentativas, bloqueio de e-mails falsos e de tentativas de invadir contas): legítimo interesse. Para isso, quando alguém erra a senha guardamos por até 24 horas o endereço IP, a rede de origem e um código irreversível do e-mail tentado, e os bloqueios aplicados ficam registrados por até 30 dias.</p>
        <p><strong>Comunidade e moderação</strong>: execução do contrato e legítimo interesse em manter o espaço seguro. A equipe pode ler mensagens das salas e as mensagens denunciadas, apagá-las e suspender contas, e cada ação fica registrada. Ao excluir a sua conta, o seu perfil e as suas mensagens da comunidade são apagados.</p>
        <p><strong>Melhorar o app</strong> (estatísticas agregadas de uso e de visitas): legítimo interesse, sem cookies de rastreamento.</p>
        <p><strong>Foto de perfil e câmera</strong>: consentimento — você escolhe quando usar e pode apagar a foto a qualquer momento.</p></section>

      <section className="zodiac-section"><h2>4. Com quem compartilhamos</h2>
        <p>Não vendemos seus dados. Compartilhamos apenas o necessário com fornecedores que operam o serviço:</p>
        <p><strong>Cloudflare</strong> — hospedagem do site e do banco de dados. <strong>Stripe</strong> — processamento de pagamentos. <strong>Resend</strong> — envio de e-mails. <strong>Google AdSense</strong> — exibição de anúncios no site e no aplicativo para quem não é Premium (contas Premium não veem anúncios). <strong>Cloudflare Workers AI</strong>, <strong>OpenRouter</strong> e os provedores de IA que ele usa — geração das respostas do chat e de textos personalizados (enviamos o conteúdo necessário para gerar a resposta, como sua mensagem, seu signo e seu objetivo).</p>
        <p>Alguns desses fornecedores podem tratar dados fora do Brasil; nesses casos, a transferência segue as salvaguardas previstas na LGPD. Também podemos compartilhar dados quando exigido por lei ou por ordem judicial.</p></section>

      <section className="zodiac-section"><h2>5. Cookies</h2>
        <p>Os cookies que nós mesmos usamos são apenas os essenciais: o que mantém você conectado à sua conta e, para a equipe, o de acesso ao painel. Preferências como tema claro ou escuro ficam salvas no seu próprio navegador.</p>
        <p><strong>Anúncios:</strong> no site e no aplicativo, para quem não é Premium, o Google AdSense pode usar cookies e identificadores para exibir e medir anúncios, inclusive personalizados quando você permitir. Quando a lei exigir, o Google pede o seu consentimento antes de usá-los. Você pode gerenciar ou desativar anúncios personalizados em adssettings.google.com e saber mais em policies.google.com/technologies/ads. Contas Premium (assinatura ou teste grátis) não veem anúncios, e o Google não é carregado para elas.</p></section>

      <section className="zodiac-section"><h2>6. Por quanto tempo guardamos</h2>
        <p>Mantemos os dados da conta enquanto ela existir. Registros de uso e de visitas são usados de forma agregada. Se você pedir a exclusão da conta, apagamos seus dados pessoais, exceto o que a lei exigir que seja mantido (por exemplo, registros de pagamento).</p></section>

      <section className="zodiac-section"><h2>7. Seus direitos</h2>
        <p>Pela LGPD (art. 18), você pode pedir: confirmação de que tratamos seus dados; acesso a eles; correção de dados incompletos ou errados; anonimização, bloqueio ou eliminação de dados desnecessários; portabilidade; eliminação dos dados tratados com consentimento; informação sobre com quem compartilhamos; e revogação do consentimento. Basta escrever para <a href={`mailto:${CONTACT}`}>{CONTACT}</a> a partir do e-mail da sua conta. Para apagar a conta e os dados de uma vez, use <a href="/excluir-conta">a página de exclusão de conta</a> ou o botão Excluir minha conta no Perfil do app. Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).</p></section>

      <section className="zodiac-section"><h2>8. Segurança</h2>
        <p>Usamos conexão cifrada (HTTPS), senhas guardadas com hash e sal, cookies protegidos, limites de tentativas e acesso restrito da equipe com verificação em duas etapas. Nenhum sistema é 100% seguro, mas trabalhamos continuamente para proteger seus dados.</p></section>

      <section className="zodiac-section"><h2>9. Idade mínima</h2>
        <p>O Veias da Sintonia é destinado a pessoas com 18 anos ou mais. Pessoas entre 16 e 18 anos só podem usar com autorização dos pais ou responsáveis. Não coletamos intencionalmente dados de menores de 16 anos.</p></section>

      <section className="zodiac-section"><h2>10. Mudanças nesta política</h2>
        <p>Podemos atualizar esta política. Quando a mudança for relevante, avisaremos no app ou por e-mail. A data da última atualização fica sempre no topo desta página.</p></section>
    </div>
  </SeoPage>;
}
