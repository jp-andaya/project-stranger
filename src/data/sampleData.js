export const prompts = [
  {
    id: 'p1',
    text: "What do you pretend to understand but don't?",
    date: 'Saturday, March 14',
  },
  {
    id: 'p2',
    text: 'What would you tell your younger self?',
    date: 'Friday, March 13',
  },
  {
    id: 'p3',
    text: 'Describe a moment that changed everything.',
    date: 'Thursday, March 12',
  },
];

export const initialNotes = [
  {
    id: 'n1',
    content:
      "I pretend to understand why people ghost each other. I smile and nod when friends explain their reasons, but deep down I still don't get how someone can just... disappear.",
    promptId: 'p1',
    likes: 23,
    time: '2h ago',
  },
  {
    id: 'n2',
    content:
      "Cryptocurrency. I nod along in conversations, I even own some, but I genuinely have no idea what I'm doing or why any of it has value.",
    promptId: 'p1',
    likes: 47,
    time: '3h ago',
  },
  {
    id: 'n3',
    content:
      'How to be okay with being alone. I tell everyone I love my independence but some nights the silence is so loud.',
    promptId: 'p1',
    likes: 89,
    time: '5h ago',
  },
  {
    id: 'n4',
    content:
      "Adult friendships. Why is it so hard to make real connections after 25? Everyone seems to know something I don't.",
    promptId: 'p1',
    likes: 156,
    time: '8h ago',
  },
  {
    id: 'n5',
    content:
      'Dear younger me, stop trying so hard to fit in. The things that make you different will make you shine.',
    promptId: 'p2',
    likes: 67,
    time: '1d ago',
  },
  {
    id: 'n6',
    content:
      'The moment my dad said he was proud of me. Not for achieving anything, just for being me.',
    promptId: 'p3',
    likes: 203,
    time: '2d ago',
  },
];

export default { prompts, initialNotes };
