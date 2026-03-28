import type { LandingContent } from '@/features/landing/types/content';

export const landingContent: LandingContent = {
  brand: { name: 'Ana', accent: 'Psicologia' },
  professional: {
    fullName: 'Ana Paula Boaventura de Moura',
    displayName: 'Ana Paula Boaventura',
    crp: '04/84622',
    approach: 'Psicóloga Humanista',
  },
  contact: {
    whatsapp: '5511999999999',
    whatsappMessage: 'Olá! Vim pelo site e gostaria de saber mais sobre o atendimento.',
    instagram: '@placeholder',
    email: 'contato@placeholder.com',
  },
  hero: {
    title: 'Cuide da sua saúde\nmental com\nacolhimento\nprofissional',
    highlightWords: ['saúde', 'mental'],
    description:
      'Psicoterapia individual para adultos e adolescentes, com escuta ativa, respeito ao seu tempo e um espaço seguro para falar sobre você.',
    badge: 'Psicóloga Online (Ana) | CRP 04/84622',
    ctaLabel: 'Agendar via WhatsApp',
    statValue: '100%',
    statText: 'atendimento online humanizado',
    imageSrc: '/images/landing/ana-hero.jpeg',
  },
  about: {
    eyebrow: 'Sobre mim',
    title: 'Olá, sou a Ana',
    paragraphs: [
      'Psicóloga com registro CRP 04/84622, com atuação clínica voltada para adultos e adolescentes.',
      'Acredito que cada pessoa tem sua própria história e ritmo. Meu papel é oferecer um espaço de <strong>acolhimento, escuta ativa e confiança</strong>, onde você possa se expressar livremente.',
      'Minha abordagem é humanista e busca favorecer <strong>autoconhecimento, compreensão emocional e construção de recursos</strong> para lidar com os desafios da vida.',
    ],
    ctaLabel: 'Falar comigo no WhatsApp →',
    imageSrc: '/images/landing/ana-about.jpeg',
  },
  approach: {
    eyebrow: 'Abordagem Terapêutica',
    title: 'Psicologia Humanista',
    highlightWords: ['Humanista'],
    description: [
      'Na psicologia humanista, acredito que cada pessoa possui recursos internos para promover mudanças significativas em sua vida. Meu papel como terapeuta é facilitar esse processo de autodescoberta e crescimento pessoal.',
      'O foco está no presente, nas suas experiências e sentimentos atuais, ajudando você a desenvolver maior autoconsciência e a tomar decisões mais alinhadas com seus valores e objetivos.',
    ],
    principles: [
      {
        title: 'Acolhimento',
        description: 'Ambiente seguro e livre de julgamentos, onde você é aceito como é.',
        icon: 'heart',
      },
      {
        title: 'Autenticidade',
        description: 'Relação genuína entre terapeuta e paciente, baseada em confiança mútua.',
        icon: 'users',
      },
      {
        title: 'Autoconhecimento',
        description: 'Desenvolvimento da consciência sobre si mesmo e suas potencialidades.',
        icon: 'lightbulb',
      },
      {
        title: 'Autonomia',
        description: 'Empoderamento para fazer suas próprias escolhas com responsabilidade.',
        icon: 'target',
      },
    ],
  },
  specialties: {
    eyebrow: 'Áreas de atuação',
    title: 'Como posso ajudar você',
    subtitle: 'Trabalho com diferentes demandas emocionais, sempre respeitando sua individualidade.',
    items: [
      {
        title: 'Ansiedade',
        description: 'Aprenda a lidar com pensamentos acelerados e preocupações excessivas.',
        icon: 'brain',
      },
      {
        title: 'Relacionamentos',
        description: 'Desenvolva relações mais saudáveis e autênticas.',
        icon: 'heart',
      },
      {
        title: 'Autoestima',
        description: 'Reconecte-se consigo e fortaleça sua autoconfiança.',
        icon: 'smile',
      },
      {
        title: 'Traumas',
        description: 'Processe experiências difíceis em um espaço seguro.',
        icon: 'shield',
      },
      {
        title: 'Autoconhecimento',
        description: 'Entenda seus padrões e descubra seu potencial.',
        icon: 'spark',
      },
      {
        title: 'Transições de vida',
        description: 'Navegue mudanças importantes com mais clareza.',
        icon: 'users',
      },
    ],
  },
  process: {
    eyebrow: 'Processo',
    title: 'Como funciona o atendimento',
    subtitle: 'Um processo simples e acolhedor do primeiro contato ao acompanhamento.',
    items: [
      {
        number: '01',
        title: 'Primeiro contato',
        description:
          'Entre em contato pelo WhatsApp. Vou responder suas dúvidas e entender suas necessidades.',
        icon: 'message',
      },
      {
        number: '02',
        title: 'Agendamento',
        description: 'Escolhemos juntas o melhor horário para sua rotina. Flexibilidade é importante.',
        icon: 'calendar',
      },
      {
        number: '03',
        title: 'Sessões online',
        description: 'Encontros de 50 minutos por videochamada, em ambiente seguro e confidencial.',
        icon: 'video',
      },
      {
        number: '04',
        title: 'Evolução contínua',
        description:
          'Acompanhamento personalizado respeitando seu tempo e objetivos terapêuticos.',
        icon: 'chart',
      },
    ],
  },
  infoCards: [
    {
      title: 'Atendimento Online',
      value: '100% remoto',
      detail: 'Atendo de qualquer lugar via videochamada segura',
      icon: 'video',
    },
    {
      title: 'Duração',
      value: '50 minutos',
      detail: 'Sessões semanais ou quinzenais',
      icon: 'clock',
    },
    {
      title: 'Sigilo',
      value: 'Garantido',
      detail: 'Total confidencialidade profissional',
      icon: 'lock',
    },
    {
      title: 'Flexibilidade',
      value: 'Horários variados',
      detail: 'Manhã, tarde ou noite',
      icon: 'calendar',
    },
  ],
  faq: {
    eyebrow: 'Dúvidas',
    title: 'Perguntas frequentes',
    subtitle: 'Esclareci as principais dúvidas, mas fique à vontade para perguntar o que quiser.',
    items: [
      {
        question: 'Como funciona a primeira sessão?',
        answer:
          'Na primeira sessão, conversamos sobre o que te trouxe até aqui, suas expectativas e objetivos. Também explico como funciona o processo terapêutico e respondo suas dúvidas.',
      },
      {
        question: 'Quanto tempo dura o tratamento?',
        answer:
          'Cada processo tem seu ritmo. A duração varia de acordo com suas demandas, objetivos e momento de vida.',
      },
      {
        question: 'As sessões online funcionam?',
        answer:
          'Sim. O atendimento online é reconhecido e pode ser tão efetivo quanto o presencial, desde que você esteja em um ambiente reservado e com boa conexão.',
      },
      {
        question: 'Posso remarcar sessões?',
        answer: 'Sim. O ideal é avisar com antecedência para que possamos reorganizar o horário.',
      },
      {
        question: 'Como funciona o sigilo profissional?',
        answer:
          'Tudo que é compartilhado em sessão é tratado com confidencialidade, conforme o código de ética profissional.',
      },
      {
        question: 'Qual o valor da sessão?',
        answer: 'Os valores e formas de pagamento podem ser informados diretamente no WhatsApp.',
      },
    ],
    footerLead: 'Ainda tem dúvidas?',
    footerCtaLabel: 'Falar comigo no WhatsApp →',
  },
  finalCta: {
    title: 'Pronta para dar o primeiro passo?',
    description:
      'Agendar sua primeira sessão é simples. Vamos conversar sem compromisso sobre como posso ajudar você.',
    buttonLabel: 'Agendar via WhatsApp',
    helper: 'Respondo em até 24 horas',
    imageSrc: '/images/landing/final-cta-room.jpg',
  },
  footer: {
    description: 'Um espaço de acolhimento, escuta e cuidado para sua saúde mental.',
    locationLabel: 'Atendimento online | Contagem, BH e região',
  },
};
