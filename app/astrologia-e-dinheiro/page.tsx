import type { Metadata } from "next";
import Link from "next/link";
import "../signos/signos.css";
import { articleJsonLd, FaqSection, faqJsonLd, InlineCta, SeoPage } from "@/components/SeoPage";
import { ZODIAC_SIGNS } from "@/lib/zodiacContent";

/** Pillar page: astrology and money — written for "astrologia e dinheiro", "signo e prosperidade" and neighbours. */

const TITLE = "Astrologia e Dinheiro: Como Usar o Seu Signo Para Prosperar";
const DESCRIPTION = "Astrologia e dinheiro sem promessas mágicas: como cada signo e elemento lida com as finanças, o que o mapa astral mostra, o ritmo da Lua e hábitos de prosperidade por signo.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | Veias da Sintonia` },
  description: DESCRIPTION,
  alternates: { canonical: "/astrologia-e-dinheiro" },
  openGraph: { images: ["/og-image.jpg"], title: TITLE, description: DESCRIPTION, url: "/astrologia-e-dinheiro", type: "article" },
};

const ELEMENTS = [
  { name: "Fogo — Áries, Leão e Sagitário", text: "O Fogo ganha dinheiro com iniciativa: abre caminhos, vende bem as próprias ideias e se anima com metas ousadas. O risco costuma estar na pressa — gastar no impulso, apostar alto demais ou largar um projeto quando a empolgação passa. Para o Fogo, prosperar tem a ver com dar direção à energia: metas curtas, com prazo, e uma reserva que proteja o entusiasmo dos próprios excessos." },
  { name: "Terra — Touro, Virgem e Capricórnio", text: "A Terra é o elemento da construção. Tende a planejar, a guardar e a valorizar o que é concreto, o que costuma render uma relação mais estável com o dinheiro. A armadilha é o controle virar medo: segurar demais, adiar investimentos em si mesmo ou medir o próprio valor só pelo que acumula. Para a Terra, prosperar é deixar espaço para o prazer e para o novo, sem perder o chão." },
  { name: "Ar — Gêmeos, Libra e Aquário", text: "O Ar prospera com ideias, contatos e comunicação. Enxerga oportunidades antes dos outros e se dá bem em trocas, parcerias e projetos criativos. O ponto de atenção é a dispersão: muitas frentes abertas, pouca constância, e dinheiro que escapa em pequenos gastos sem registro. Para o Ar, prosperar é transformar ideias em rotina — anotar, acompanhar e terminar." },
  { name: "Água — Câncer, Escorpião e Peixes", text: "A Água sente o dinheiro. Costuma ser generosa, intuitiva e ótima em perceber o que as pessoas precisam — o que pode virar trabalho de valor. O desafio é quando a emoção decide sozinha: comprar para aliviar o humor, emprestar sem limite ou evitar olhar as contas. Para a Água, prosperar é unir intuição e clareza: sentir, sim, mas decidir com os números na mão." },
];

const MOON = [
  { phase: "Lua Nova", text: "tempo de intenção. Bom momento simbólico para definir uma meta financeira pequena e concreta — quanto guardar, qual gasto cortar, qual conta organizar." },
  { phase: "Lua Crescente", text: "tempo de ação. Coloque o plano em movimento: abra a reserva, mande a proposta, estude aquele curso." },
  { phase: "Lua Cheia", text: "tempo de colheita e revisão. Olhe o que funcionou, reconheça o que cresceu e perceba onde o dinheiro está escapando." },
  { phase: "Lua Minguante", text: "tempo de soltar. Cancele assinaturas esquecidas, renegocie dívidas, desapegue do que pesa no orçamento." },
];

const RITUALS = [
  { who: "Fogo", text: "um ritual de ação: toda segunda-feira, escolha uma única tarefa que aproxima você de uma meta financeira e faça antes de qualquer outra coisa." },
  { who: "Terra", text: "um ritual de cuidado: separe um valor fixo no dia em que o dinheiro entra — mesmo pequeno — antes de pagar qualquer conta." },
  { who: "Ar", text: "um ritual de registro: anote cada gasto por sete dias seguidos, sem julgamento, só para enxergar o padrão." },
  { who: "Água", text: "um ritual de presença: antes de uma compra por impulso, respire e espere 24 horas; se ainda fizer sentido, compre sem culpa." },
];

const FAQ = [
  { q: "A astrologia pode prever se vou ganhar dinheiro?", a: "Não. A astrologia é uma linguagem simbólica de autoconhecimento: ela ajuda a entender seus padrões com dinheiro, suas forças e seus pontos cegos. Resultado financeiro depende de escolhas, contexto e constância — não do signo." },
  { q: "Qual signo tem mais facilidade com dinheiro?", a: "Cada signo tem facilidades diferentes. Os de Terra costumam ser mais organizados, os de Fogo mais ousados, os de Ar mais criativos em oportunidades e os de Água mais intuitivos. Nenhum signo está condenado ou garantido quando o assunto é prosperidade." },
  { q: "O que é a casa 2 no mapa astral?", a: "A casa 2 é tradicionalmente associada aos recursos, ao dinheiro que você ganha e ao que você valoriza. O signo e os planetas nela dão pistas simbólicas de como você lida com segurança material." },
  { q: "Qual planeta é ligado à prosperidade?", a: "Júpiter é associado à expansão e às oportunidades, Vênus ao que você valoriza e atrai, e Saturno à disciplina e à construção de longo prazo. Juntos, falam de crescer, escolher e sustentar." },
  { q: "Como usar a astrologia para prosperar na prática?", a: "Use o signo como espelho: identifique sua força natural com dinheiro, seu ponto de atenção e um hábito pequeno que equilibra os dois. Depois, repita esse hábito com constância — é aí que a prosperidade acontece." },
  { q: "Existe ritual de prosperidade que funciona?", a: "Rituais funcionam como compromissos simbólicos: eles ajudam a lembrar da intenção e a criar constância. O efeito vem do hábito que o ritual sustenta — guardar, registrar, planejar —, não de uma força mágica." },
];

export default function AstrologyAndMoney() {
  return <SeoPage
    crumbs={[{ name: "Astrologia e dinheiro", href: "/astrologia-e-dinheiro" }]}
    jsonLd={[articleJsonLd({ headline: "Astrologia e dinheiro: como usar o seu signo para prosperar", description: DESCRIPTION, path: "/astrologia-e-dinheiro" }), faqJsonLd(FAQ)]}
  >
    <header className="zodiac-hero">
      <h1>Astrologia e dinheiro — como usar o seu signo para prosperar</h1>
      <p>Sem promessas mágicas: a astrologia como espelho para entender a sua relação com o dinheiro e transformar isso em hábitos.</p>
    </header>
    <div className="zodiac-body">
      <p className="seo-lede">Todo mundo tem uma história com o dinheiro. Tem quem guarde cada centavo e mesmo assim sinta que nunca é suficiente; quem ganhe bem e veja tudo escorrer pelos dedos; quem tenha ideias ótimas e nunca consiga tirá-las do papel. Essas histórias costumam repetir padrões — e é aí que a astrologia pode ajudar.</p>
      <p className="seo-lede">Não como previsão de fortuna, mas como um espelho. O seu signo, o elemento a que ele pertence e o seu mapa astral descrevem, em linguagem simbólica, um jeito de agir, de desejar e de se proteger. Quando você enxerga esse jeito com clareza, fica mais fácil perceber onde está a sua força com o dinheiro e onde está o seu ponto cego.</p>
      <p className="seo-lede">Neste guia você vai ver como cada elemento e cada signo tende a lidar com as finanças, o que o mapa astral mostra além do signo solar, como usar o ritmo da Lua para organizar a vida financeira e quais hábitos de prosperidade combinam com o seu jeito.</p>

      <section className="zodiac-section">
        <h2>O que a astrologia pode (e o que não pode) dizer sobre dinheiro</h2>
        <p>A astrologia não diz quanto você vai ganhar, nem quando vai ficar rico. Quem promete isso está vendendo ilusão. O que ela oferece é um vocabulário para falar de comportamento: impulso e cautela, ousadia e medo, generosidade e controle. São tendências — o signo mostra o terreno, não decide o caminho.</p>
        <p>Pense num exemplo simples. Duas pessoas recebem o mesmo aumento. Uma, de temperamento mais ansioso por segurança, guarda quase tudo e passa meses sem se permitir nada. A outra, mais movida a entusiasmo, comemora com compras e, no mês seguinte, está no mesmo lugar. Nenhuma das duas está errada por natureza; cada uma tem uma força e um excesso. Enxergar isso é o primeiro passo para escolher diferente.</p>
        <p>É por isso que, no Veias da Sintonia, a astrologia vira ação: a leitura do dia se transforma numa pequena missão, e a constância aparece numa árvore que cresce com você. O signo é o ponto de partida; o hábito é o que constrói.</p>
      </section>

      <section className="zodiac-section">
        <h2>Os elementos e a sua relação com o dinheiro</h2>
        <p>Os doze signos se dividem em quatro elementos. Cada elemento descreve uma energia básica — e essa energia costuma aparecer com força na forma como lidamos com trabalho, gastos e segurança.</p>
        {ELEMENTS.map((element) => <div key={element.name}><h3>{element.name}</h3><p>{element.text}</p></div>)}
        <InlineCta text="Quer saber como isso se aplica ao seu signo?"/>
      </section>

      <section className="zodiac-section">
        <h2>Signo e prosperidade: o perfil financeiro de cada signo</h2>
        <p>Dentro de cada elemento, cada signo tem o seu tom. Um resumo do jeito de cada um com o dinheiro — e o guia completo de cada signo, com carreira, forças, armadilhas e hábitos:</p>
        {ZODIAC_SIGNS.map((sign) => <div key={sign.slug}>
          <h3>{`${sign.symbol}︎`} {sign.name} e o dinheiro</h3>
          <p>{sign.career} <Link href={`/signos/${sign.slug}/e-dinheiro`}>Leia o guia de {sign.name} e o dinheiro →</Link></p>
        </div>)}
      </section>

      <section className="zodiac-section">
        <h2>Mapa astral e dinheiro: além do signo solar</h2>
        <p>O signo solar é só a primeira camada. No mapa astral, alguns pontos são tradicionalmente associados aos recursos e à carreira — e ajudam a entender por que duas pessoas do mesmo signo lidam com dinheiro de formas tão diferentes.</p>
        <h3>Casa 2: o que você valoriza</h3>
        <p>A casa 2 fala dos seus recursos, do dinheiro que você ganha e, principalmente, do que você considera valioso. O signo que ocupa essa casa sugere o seu jeito de buscar segurança material.</p>
        <h3>Casa 10: carreira e reconhecimento</h3>
        <p>A casa 10 é associada à vocação, à imagem pública e ao lugar que você quer ocupar no mundo. Ela ajuda a pensar em que tipo de trabalho faz sentido para você no longo prazo.</p>
        <h3>Vênus, Júpiter e Saturno</h3>
        <p>Vênus mostra o que você valoriza e como atrai o que deseja; Júpiter, onde você tende a expandir e encontrar oportunidades; Saturno, onde a vida pede disciplina e construção paciente. Juntos, descrevem o tripé da prosperidade: desejar, crescer e sustentar.</p>
      </section>

      <section className="zodiac-section">
        <h2>A Lua e o ritmo da sua vida financeira</h2>
        <p>Uma forma simples e prática de usar a astrologia é acompanhar as fases da Lua como um calendário simbólico. Não para decidir investimentos, mas para dar ritmo aos seus hábitos:</p>
        {MOON.map((item) => <p key={item.phase}><strong>{item.phase}:</strong> {item.text}</p>)}
        <p>Você pode acompanhar a fase da Lua de hoje no <Link href="/horoscopo-do-dia">horóscopo do dia</Link>, junto com a leitura do seu signo.</p>
      </section>

      <section className="zodiac-section">
        <h2>Rituais de prosperidade por signo</h2>
        <p>Um ritual de prosperidade funciona quando vira hábito. Por isso, os melhores são pequenos, concretos e repetíveis. Uma sugestão para cada elemento:</p>
        {RITUALS.map((item) => <p key={item.who}><strong>{item.who}:</strong> {item.text}</p>)}
        <p>O que muda a vida financeira não é o ritual em si, mas a constância que ele cria. Um gesto pequeno, repetido por semanas, costuma fazer mais diferença do que uma grande decisão tomada uma vez.</p>
      </section>

      <section className="zodiac-section">
        <h2>Como usar a astrologia para prosperar, na prática</h2>
        <p><strong>1. Conheça o seu padrão.</strong> Leia o guia do seu signo e pergunte-se, com honestidade, onde ele aparece na sua relação com o dinheiro.</p>
        <p><strong>2. Escolha um ponto de atenção.</strong> Só um: o impulso, o medo, a dispersão ou a emoção. Tentar mudar tudo de uma vez é o caminho mais curto para desistir.</p>
        <p><strong>3. Crie um hábito pequeno.</strong> Algo que caiba em cinco minutos por dia — registrar um gasto, separar um valor, revisar uma conta.</p>
        <p><strong>4. Dê ritmo com a Lua.</strong> Use as fases como lembretes: intenção na nova, ação na crescente, revisão na cheia, desapego na minguante.</p>
        <p><strong>5. Acompanhe a sua constância.</strong> Prosperidade é o resultado de muitos dias parecidos. Ver o próprio progresso ajuda a continuar.</p>
        <InlineCta text="Quer um plano feito para o seu momento?"/>
      </section>

      <FaqSection faq={FAQ}/>
      <p className="seo-lede">A astrologia não vai fazer o trabalho por você — mas pode iluminar o caminho. Quando você entende o seu jeito, para de lutar contra ele e começa a usá-lo a seu favor. Comece pelo diagnóstico gratuito e descubra o que está influenciando a sua prosperidade agora.</p>
    </div>
  </SeoPage>;
}
