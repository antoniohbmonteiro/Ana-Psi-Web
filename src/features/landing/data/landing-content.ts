import type { LandingContent } from "@/features/landing/types/landing-content";

export const landingContent: LandingContent = {
  profile: {
    fullName: "Ana Paula Boaventura de Moura",
    displayName: "Ana Paula Boaventura",
    shortName: "Ana Paula",
    crp: "04/84622",
    city: "Contagem",
    state: "MG",
    regionLabel: "Atendimento online para todo o Brasil",
    approach: "Humanista",
    audiences: ["Adultos", "Adolescentes"],
    modalities: ["Online", "Presencial"],
    whatsappNumber: "5531999999999",
    whatsappLabel: "WhatsApp placeholder",
    instagram: "@placeholder.instagram",
    email: "contato@placeholder.com",
  },
  hero: {
    eyebrow: "Psicóloga Online (Ana) | CRP 04/84622",
    title: "Cuide da sua saúde mental com acolhimento profissional",
    highlightedWord: "saúde mental",
    subtitle:
      "Psicoterapia individual para adultos e adolescentes, com escuta ativa, respeito ao seu tempo e um espaço seguro para falar sobre você.",
    primaryCtaLabel: "Agendar via WhatsApp",
    primaryCtaMessage: "Olá! Vim pelo site e gostaria de agendar uma sessão.",
    floatingCardTitle: "100%",
    floatingCardText: "atendimento online humanizado",
  },
  about: {
    eyebrow: "Sobre mim",
    title: "Olá, sou a Ana",
    paragraphs: [
      "Sou psicóloga com registro CRP 04/84622 e atuação com adultos e adolescentes em uma abordagem humanista, centrada na escuta e no cuidado com a singularidade de cada pessoa.",
      "Acredito que cada história merece acolhimento, presença e confiança. Meu papel é oferecer um espaço seguro para que você possa se expressar com liberdade e construir novas formas de compreender seus sentimentos.",
      "Os textos, contatos e detalhes desta seção podem ser ajustados depois no Firebase. Por enquanto, mantive uma base clara para o layout ficar pronto sem travar a implementação.",
    ],
    ctaLabel: "Falar comigo no WhatsApp",
    ctaMessage: "Olá! Vim pelo site e gostaria de tirar uma dúvida sobre o atendimento.",
  },
  specialties: {
    eyebrow: "Áreas de atuação",
    title: "Como posso ajudar você",
    subtitle:
      "Trabalho com diferentes demandas emocionais, sempre respeitando sua individualidade e o seu momento de vida.",
    items: [
      {
        title: "Ansiedade",
        description: "Aprenda a lidar com pensamentos acelerados, medo constante e preocupações excessivas.",
        icon: "brain",
      },
      {
        title: "Relacionamentos",
        description: "Desenvolva relações mais saudáveis, autênticas e alinhadas com o que você sente.",
        icon: "heart",
      },
      {
        title: "Autoestima",
        description: "Reconecte-se com a sua história e fortaleça sua autoconfiança no dia a dia.",
        icon: "sparkles",
      },
      {
        title: "Traumas",
        description: "Processe experiências difíceis em um espaço seguro, ético e sem julgamentos.",
        icon: "shield",
      },
      {
        title: "Autoconhecimento",
        description: "Entenda seus padrões, desejos e limites para viver com mais clareza e presença.",
        icon: "lightbulb",
      },
      {
        title: "Transições de vida",
        description: "Atravesse mudanças importantes com mais consciência, acolhimento e direção.",
        icon: "users",
      },
    ],
  },
  process: {
    eyebrow: "Processo",
    title: "Como funciona o atendimento",
    subtitle: "Um processo simples e acolhedor, do primeiro contato ao acompanhamento contínuo.",
    steps: [
      {
        title: "Primeiro contato",
        description: "Você me chama pelo WhatsApp, compartilha sua necessidade e eu explico como funciona o atendimento.",
        icon: "message-circle",
      },
      {
        title: "Agendamento",
        description: "Combinamos o melhor horário para a sua rotina, com organização clara e sem complicação.",
        icon: "calendar",
      },
      {
        title: "Sessões online",
        description: "Encontros de 50 minutos por videochamada, em ambiente seguro, ético e confidencial.",
        icon: "video",
      },
      {
        title: "Evolução contínua",
        description: "O acompanhamento respeita seu tempo, objetivos terapêuticos e processo de desenvolvimento emocional.",
        icon: "trending-up",
      },
    ],
  },
  practicalInfo: {
    items: [
      {
        label: "Atendimento online",
        value: "100% remoto",
        description: "Atendo de qualquer lugar por videochamada segura.",
        icon: "monitor",
      },
      {
        label: "Duração",
        value: "50 minutos",
        description: "Sessões semanais ou quinzenais, conforme necessidade.",
        icon: "clock",
      },
      {
        label: "Sigilo",
        value: "Garantido",
        description: "Total confidencialidade profissional em todo o processo.",
        icon: "lock",
      },
      {
        label: "Flexibilidade",
        value: "Horários variados",
        description: "Placeholder para manhã, tarde ou noite.",
        icon: "calendar-days",
      },
    ],
  },
  faq: {
    eyebrow: "Dúvidas",
    title: "Perguntas frequentes",
    subtitle: "Esclareci as principais dúvidas, mas fique à vontade para perguntar o que quiser.",
    items: [
      {
        question: "Como funciona a primeira sessão?",
        answer:
          "A primeira sessão é um momento de escuta e compreensão da sua demanda. Também é quando explico melhor como acontece o acompanhamento e alinhamos expectativas.",
      },
      {
        question: "Quanto tempo dura o tratamento?",
        answer:
          "Isso varia de acordo com o objetivo terapêutico, a frequência dos encontros e o momento de vida de cada pessoa. O processo é construído com cuidado e sem pressa.",
      },
      {
        question: "As sessões online funcionam?",
        answer:
          "Sim. O atendimento online pode ser tão acolhedor quanto o presencial quando acontece em ambiente seguro, com vínculo terapêutico e constância no acompanhamento.",
      },
      {
        question: "Posso remarcar sessões?",
        answer:
          "As regras de remarcação podem ser ajustadas depois no Firebase. Aqui deixei um texto base para preservar o layout e a estrutura da landing.",
      },
      {
        question: "Como funciona o sigilo profissional?",
        answer:
          "O sigilo é um princípio ético da psicologia. Tudo o que é compartilhado em sessão é tratado com confidencialidade, respeitando os limites legais da profissão.",
      },
      {
        question: "Qual o valor da sessão?",
        answer:
          "Você pode informar o valor depois no Firebase ou manter essa informação apenas no WhatsApp. Por enquanto, este item está como placeholder para a estrutura visual.",
      },
    ],
  },
  finalCta: {
    title: "Pronta para dar o primeiro passo?",
    description:
      "Agendar sua primeira sessão é simples. Podemos conversar sem compromisso para entender como posso ajudar você neste momento.",
    buttonLabel: "Agendar via WhatsApp",
    buttonMessage: "Olá! Vim pelo site e gostaria de conversar sobre o atendimento.",
    helperText: "Resposta em até 24 horas úteis.",
  },
  footer: {
    description: "Um espaço de acolhimento, escuta e cuidado para sua saúde mental.",
    links: [
      { label: "Sobre", href: "#sobre" },
      { label: "Como funciona", href: "#como-funciona" },
      { label: "FAQ", href: "#faq" },
      { label: "Contato", href: "#contato" },
    ],
  },
};
