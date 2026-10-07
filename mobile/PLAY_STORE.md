# Seu Signo (Veias da Sintonia) na Google Play

Pacote: `br.com.veiasdasintonia.prosperar` · app nativo em React Native (Expo SDK 57), sem WebView.

## Como gerar o app

Pré-requisitos (tudo em D:): JDK 21 em `D:\tudo\jdk21`, Android SDK em `D:\tudo\bubblewrap\android_sdk`, chave de assinatura em `D:\tudo\android-signing\` (`signing.properties` + keystore, nunca no Git).

```bash
cd mobile
npm install
npx expo prebuild --platform android --clean --no-install
echo "sdk.dir=D:/tudo/bubblewrap/android_sdk" > android/local.properties
cd android
JAVA_HOME=D:/tudo/jdk21 ANDROID_HOME=D:/tudo/bubblewrap/android_sdk GRADLE_USER_HOME=D:/tudo/gradle-home ./gradlew.bat bundleRelease assembleRelease
```

Saídas: `android/app/build/outputs/bundle/release/app-release.aab` (envie à Play Console) e `android/app/build/outputs/apk/release/app-release.apk` (instalar direto no celular). A cada envio novo, aumente `android.versionCode` em `app.json`.

## Configuração manual na Play Console

1. **Criar o app** com o pacote acima, idioma Português (Brasil), tipo App, gratuito.
2. **Play App Signing**: aceitar. A chave do `signing.properties` vira a *chave de upload*.
3. **Assinaturas e produtos** (Monetizar → Produtos):
   - Assinatura `premium_mensal`, plano base mensal com renovação automática (R$ 29,99 como no site, ou o preço que preferir).
   - Produto único `premium_vitalicio` (R$ 239,99 como no site).
   Os ids precisam ser exatamente esses (estão em `lib/googlePlay.ts` e `mobile/src/billing.ts`).
4. **Conta de serviço para validar compras** no servidor:
   - Google Cloud → criar projeto → ativar *Google Play Android Developer API* → criar conta de serviço → baixar a chave JSON.
   - Play Console → Usuários e permissões → convidar o e-mail da conta de serviço com as permissões *Ver informações do app* e *Gerenciar pedidos e assinaturas*.
   - Guardar o JSON inteiro como secret no Worker: `npx wrangler secret put GOOGLE_PLAY_SERVICE_ACCOUNT --name use-seu-signo-para-prosperar` (colar o conteúdo do arquivo). Sem isso, nenhuma compra é liberada (o servidor responde 503).
5. **Teste interno**: criar a faixa de teste interno, adicionar seu e-mail como testador e (em Configurações → Testes de licença) cadastrar o e-mail de teste de compras. Compras de teste não cobram.
6. **Política de privacidade**: `https://veiasdasintonia.com.br/privacidade`
7. **Exclusão de conta** (Segurança dos dados → Exclusão de conta): `https://veiasdasintonia.com.br/excluir-conta`
8. **Conta de acesso para o revisor** (Conteúdo do app → Acesso ao app): criar uma conta de teste de verdade e informar e-mail e senha à revisão (o app exige login).

## Textos da ficha

**Nome**: Seu Signo: astrologia e prosperidade

**Descrição curta (até 80)**: Astrologia que vira ação: missões diárias, sinais e sua árvore da prosperidade.

**Descrição completa**:

O Seu Signo transforma astrologia em ação. Em vez de só ler o horóscopo, você recebe um passo pequeno por dia e vê a sua Árvore da Prosperidade crescer com a sua constância.

O que você encontra:
• Horóscopo do dia, da semana e do mês para o seu signo, com o céu de hoje.
• Sinais do Universo: descubra o que significam as horas iguais (11:11, 22:22…), com leitura pelo seu signo e pela sua numerologia.
• Numerologia: Caminho de Vida, Destino, Alma, Personalidade e seus ciclos pessoais.
• Missão do dia e ritual de 3 minutos, escolhidos para o seu objetivo.
• Árvore da Prosperidade que cresce com as suas ações, metas e conquistas.
• Diário de reflexões, trilhas guiadas de 7 e 21 dias e relatório semanal.
• Tarô do dia e Roda da Fortuna, como rituais de reflexão.
• Conversa com a Sintonia, uma IA de apoio que usa o seu signo e o céu de hoje como contexto.

Premium opcional: ao criar a conta você experimenta 3 dias de Premium. Depois, parte do conteúdo continua grátis e o Premium libera todas as áreas. A assinatura renova sozinha e pode ser cancelada a qualquer momento na Google Play.

Importante: o conteúdo é simbólico, para autoconhecimento e entretenimento. Não prevê o futuro, não promete dinheiro nem resultados e não substitui ajuda profissional (psicológica, médica, jurídica ou financeira).

**Categoria**: Estilo de vida (alternativa: Entretenimento) · **Classificação**: Livre/Todos, sem violência nem conteúdo sensível; informar que há compras no app e conversa com IA. **Público-alvo**: 18+.

## Segurança dos dados (formulário)

| Dado | Coletado | Compartilhado | Finalidade |
|---|---|---|---|
| E-mail | Sim | Não (só com Resend, que envia e-mails da conta) | Conta, comunicação |
| Nome, data/hora/cidade de nascimento | Sim | Não | Funcionalidade do app (signo, numerologia) |
| Mensagens do chat com a IA | Sim | Sim, processadores (Cloudflare Workers AI) para gerar a resposta | Funcionalidade |
| Histórico de compras | Sim (status da assinatura) | Não | Liberar o Premium |
| Interações no app (eventos de uso) | Sim | Não | Análise, sem rastreamento de terceiros |
| ID do dispositivo/publicidade | Não | Não | — |

Dados criptografados em trânsito (HTTPS). O usuário pode pedir exclusão (in-app e pela página de exclusão). O app não usa anúncios.

## Gráficos

- Ícone 512×512: `public/app-icon-512.png`.
- Imagem de destaque 1024×500 e capturas de tela do celular: gere a partir do app (as capturas de `entrega/capturas`).
