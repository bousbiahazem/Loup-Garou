export const ROLE_CATALOG = [
  {
    key: "villager",
    faction: "village",
    max: 50,
    names: {
      en: "Villager",
      fr: "Villageois",
      ar: "قروي"
    },
    descriptions: {
      en: "No special power. Discuss, vote, and help the village find the werewolves.",
      fr: "Aucun pouvoir special. Discute, vote et aide le village a trouver les loups-garous.",
      ar: "ما عندوش قوة خاصة. يناقش، يصوّت، ويساعد القرية تلقى المستذئبين."
    }
  },
  {
    key: "werewolf",
    faction: "wolves",
    max: 12,
    names: {
      en: "Werewolf",
      fr: "Loup-garou",
      ar: "مستذئب"
    },
    descriptions: {
      en: "Wakes at night with the other werewolves to choose a victim.",
      fr: "Se reveille la nuit avec les autres loups-garous pour choisir une victime.",
      ar: "يفيق في الليل مع بقية المستذئبين باش يختاروا ضحية."
    }
  },
  {
    key: "seer",
    faction: "village",
    max: 1,
    names: {
      en: "Seer",
      fr: "Voyante",
      ar: "العرافة"
    },
    descriptions: {
      en: "Each night, checks one player and learns their role from the narrator.",
      fr: "Chaque nuit, regarde un joueur et apprend son role par le narrateur.",
      ar: "كل ليلة تسأل على لاعب وتعرف دوره من الراوي."
    }
  },
  {
    key: "witch",
    faction: "village",
    max: 1,
    names: {
      en: "Witch",
      fr: "Sorciere",
      ar: "الساحرة"
    },
    descriptions: {
      en: "Has one healing potion and one poison potion for the whole game.",
      fr: "Possede une potion de vie et une potion de mort pour toute la partie.",
      ar: "عندها جرعة إنقاذ وجرعة قتل تستعمل كل واحدة مرة في اللعبة."
    }
  },
  {
    key: "hunter",
    faction: "village",
    max: 1,
    names: {
      en: "Hunter",
      fr: "Chasseur",
      ar: "الصياد"
    },
    descriptions: {
      en: "When eliminated, immediately takes one player down with them.",
      fr: "Quand il meurt, il elimine immediatement un autre joueur.",
      ar: "كي يموت ينجم يطيّح معاه لاعب آخر مباشرة."
    }
  },
  {
    key: "cupid",
    faction: "village",
    max: 1,
    names: {
      en: "Cupid",
      fr: "Cupidon",
      ar: "كيوبيد"
    },
    descriptions: {
      en: "Links two lovers on the first night. If one dies, the other dies too.",
      fr: "Lie deux amoureux la premiere nuit. Si l'un meurt, l'autre meurt aussi.",
      ar: "يربط زوز عشاق في أول ليلة. إذا واحد مات، الثاني يموت معاه."
    }
  },
  {
    key: "mayor",
    faction: "village",
    max: 1,
    names: {
      en: "Mayor",
      fr: "Maire",
      ar: "العمدة"
    },
    descriptions: {
      en: "Public title. The group can decide that this player's vote counts more.",
      fr: "Titre public. Le groupe peut decider que son vote vaut plus.",
      ar: "لقب معلن. تنجم المجموعة تقرر أن صوته أقوى."
    }
  },
  {
    key: "little_girl",
    faction: "village",
    max: 1,
    names: {
      en: "Little Girl",
      fr: "Petite fille",
      ar: "البنت الصغيرة"
    },
    descriptions: {
      en: "May secretly peek while the werewolves wake, if your table allows it.",
      fr: "Peut espionner discretement les loups-garous, si votre table l'autorise.",
      ar: "تنجم تسرق نظرة وقت يفوقوا المستذئبين، حسب قوانين المجموعة."
    }
  },
  {
    key: "thief",
    faction: "neutral",
    max: 1,
    names: {
      en: "Thief",
      fr: "Voleur",
      ar: "اللص"
    },
    descriptions: {
      en: "At setup, may choose from unused roles and change their role.",
      fr: "Au debut, peut choisir parmi des roles non utilises et changer de role.",
      ar: "في بداية اللعبة ينجم يختار من أدوار زايدة ويبدّل دوره."
    }
  },
  {
    key: "healer",
    faction: "village",
    max: 1,
    names: {
      en: "Healer",
      fr: "Salvateur",
      ar: "المعالج"
    },
    descriptions: {
      en: "Protects one player at night from the werewolf attack.",
      fr: "Protege un joueur la nuit contre l'attaque des loups-garous.",
      ar: "يحمي لاعب في الليل من هجوم المستذئبين."
    }
  },
  {
    key: "elder",
    faction: "village",
    max: 1,
    names: {
      en: "Elder",
      fr: "Ancien",
      ar: "الشيخ"
    },
    descriptions: {
      en: "Can survive the first werewolf attack, depending on your table rules.",
      fr: "Peut survivre a la premiere attaque des loups, selon vos regles.",
      ar: "ينجم ينجو من أول هجوم للمستذئبين حسب قوانينكم."
    }
  },
  {
    key: "idiot",
    faction: "village",
    max: 1,
    names: {
      en: "Village Idiot",
      fr: "Idiot du village",
      ar: "أبله القرية"
    },
    descriptions: {
      en: "If voted out, may be spared but loses voting power.",
      fr: "S'il est vote, il peut etre epargne mais perd son vote.",
      ar: "إذا خرج بالتصويت ينجم يعيش، أما يفقد حق التصويت."
    }
  },
  {
    key: "scapegoat",
    faction: "village",
    max: 1,
    names: {
      en: "Scapegoat",
      fr: "Bouc emissaire",
      ar: "كبش الفداء"
    },
    descriptions: {
      en: "If the vote ties, this player can be eliminated instead.",
      fr: "En cas d'egalite au vote, ce joueur peut etre elimine a la place.",
      ar: "وقت يصير تعادل في التصويت، ينجم هو يخرج عوضهم."
    }
  },
  {
    key: "piper",
    faction: "neutral",
    max: 1,
    names: {
      en: "Piper",
      fr: "Joueur de flute",
      ar: "العازف"
    },
    descriptions: {
      en: "Charms players at night and wins alone if everyone alive is charmed.",
      fr: "Charme des joueurs la nuit et gagne seul si tous les vivants sont charmes.",
      ar: "يسحر لاعبين في الليل ويربح وحده إذا كل الأحياء مسحورين."
    }
  },
  {
    key: "fox",
    faction: "village",
    max: 1,
    names: {
      en: "Fox",
      fr: "Renard",
      ar: "الثعلب"
    },
    descriptions: {
      en: "Checks a group of nearby players to detect whether a werewolf is there.",
      fr: "Verifie un groupe de joueurs proches pour savoir s'il contient un loup.",
      ar: "يتفقد مجموعة لاعبين قريبين باش يعرف إذا فيهم مستذئب."
    }
  },
  {
    key: "bear_tamer",
    faction: "village",
    max: 1,
    names: {
      en: "Bear Tamer",
      fr: "Montreur d'ours",
      ar: "مروّض الدب"
    },
    descriptions: {
      en: "The narrator gives a sign if a werewolf sits next to this player.",
      fr: "Le narrateur donne un signe si un loup-garou est assis a cote de lui.",
      ar: "الراوي يعطي علامة إذا مستذئب قاعد جنبه."
    }
  },
  {
    key: "bear",
    faction: "village",
    max: 1,
    names: {
      en: "Bear",
      fr: "Ours",
      ar: "الدب"
    },
    descriptions: {
      en: "Custom table role. Usually used as a strong village detector or protector.",
      fr: "Role personnalise. Souvent utilise comme detecteur ou protecteur fort du village.",
      ar: "دور custom. غالبا يستعمل ككاشف قوي ولا حامي للقرية."
    }
  },
  {
    key: "master_bear",
    faction: "village",
    max: 1,
    names: {
      en: "Master Bear",
      fr: "Maitre ours",
      ar: "سيد الدب"
    },
    descriptions: {
      en: "Custom upgraded Bear role. Narrator defines the exact power before the game.",
      fr: "Version renforcee de l'Ours. Le narrateur definit le pouvoir exact avant la partie.",
      ar: "نسخة أقوى من الدب. الراوي يحدد قوته بالضبط قبل اللعبة."
    }
  },
  {
    key: "wild_child",
    faction: "neutral",
    max: 1,
    names: {
      en: "Wild Child",
      fr: "Enfant sauvage",
      ar: "الطفل البري"
    },
    descriptions: {
      en: "Chooses a model. If the model dies, becomes a werewolf.",
      fr: "Choisit un modele. Si le modele meurt, devient loup-garou.",
      ar: "يختار قدوة. إذا القدوة ماتت، يتحوّل لمستذئب."
    }
  },
  {
    key: "white_wolf",
    faction: "wolves",
    max: 1,
    names: {
      en: "White Wolf",
      fr: "Loup blanc",
      ar: "المستذئب الأبيض"
    },
    descriptions: {
      en: "Plays with the werewolves but can win alone by eliminating everyone.",
      fr: "Joue avec les loups mais peut gagner seul en eliminant tout le monde.",
      ar: "يلعب مع المستذئبين أما ينجم يربح وحده إذا يطيّح الكل."
    }
  },
  {
    key: "blue_wolf",
    faction: "wolves",
    max: 1,
    names: {
      en: "Blue Wolf",
      fr: "Loup bleu",
      ar: "المستذئب الأزرق"
    },
    descriptions: {
      en: "Custom wolf variant. Narrator can give it a defensive or information power.",
      fr: "Variante personnalisee de loup. Le narrateur peut lui donner une defense ou une information.",
      ar: "نسخة custom من المستذئب. الراوي ينجم يعطيه حماية ولا معلومة."
    }
  },
  {
    key: "red_wolf",
    faction: "wolves",
    max: 1,
    names: {
      en: "Red Wolf",
      fr: "Loup rouge",
      ar: "المستذئب الأحمر"
    },
    descriptions: {
      en: "Custom wolf variant. Often played as an aggressive special wolf.",
      fr: "Variante personnalisee. Souvent jouee comme loup special agressif.",
      ar: "نسخة custom، غالبا تلعب كمستذئب هجومي خاص."
    }
  },
  {
    key: "fog_wolf",
    faction: "wolves",
    max: 1,
    names: {
      en: "Fog Wolf",
      fr: "Loup de brume",
      ar: "مستذئب الضباب"
    },
    descriptions: {
      en: "Custom wolf variant that can hide or blur information, by narrator rules.",
      fr: "Variante qui peut cacher ou brouiller les informations, selon le narrateur.",
      ar: "نسخة custom تنجم تخبي ولا تغبّش المعلومات حسب قوانين الراوي."
    }
  },
  {
    key: "talkative_wolf",
    faction: "wolves",
    max: 1,
    names: {
      en: "Talkative Wolf",
      fr: "Loup bavard",
      ar: "المستذئب الثرثار"
    },
    descriptions: {
      en: "Custom wolf variant built around speaking, bluffing, or extra narrator prompts.",
      fr: "Variante de loup basee sur la parole, le bluff ou des consignes du narrateur.",
      ar: "نسخة custom مبنية على الكلام، الخداع، ولا تعليمات إضافية من الراوي."
    }
  },
  {
    key: "big_bad_wolf",
    faction: "wolves",
    max: 1,
    names: {
      en: "Big Bad Wolf",
      fr: "Grand mechant loup",
      ar: "المستذئب الكبير"
    },
    descriptions: {
      en: "Gets an extra night attack while no regular werewolf has died.",
      fr: "A une attaque de nuit en plus tant qu'aucun loup n'est mort.",
      ar: "عنده هجمة إضافية في الليل ما دام ما مات حتى مستذئب عادي."
    }
  },
  {
    key: "infected_wolf",
    faction: "wolves",
    max: 1,
    names: {
      en: "Infected Wolf",
      fr: "Infect pere des loups",
      ar: "المستذئب المعدي"
    },
    descriptions: {
      en: "Can infect a victim instead of killing them, turning them to the wolf team.",
      fr: "Peut infecter une victime au lieu de la tuer et l'ajouter aux loups.",
      ar: "ينجم يعدي الضحية عوض قتلها وتولي مع فريق المستذئبين."
    }
  },
  {
    key: "kamikaze",
    faction: "neutral",
    max: 1,
    names: {
      en: "Kamikaze",
      fr: "Kamikaze",
      ar: "الكاميكاز"
    },
    descriptions: {
      en: "Custom role that can trade their life for a powerful elimination.",
      fr: "Role personnalise qui peut echanger sa vie contre une elimination forte.",
      ar: "دور custom ينجم يبدّل حياته بتطييح قوي."
    }
  },
  {
    key: "wolf_dog",
    faction: "neutral",
    max: 1,
    names: {
      en: "Wolf-Dog",
      fr: "Chien-loup",
      ar: "كلب الذئب"
    },
    descriptions: {
      en: "At the beginning, chooses whether to play as villager or werewolf.",
      fr: "Au debut, choisit de jouer villageois ou loup-garou.",
      ar: "في البداية يختار يلعب مع القرية ولا مع المستذئبين."
    }
  },
  {
    key: "raven",
    faction: "village",
    max: 1,
    names: {
      en: "Raven",
      fr: "Corbeau",
      ar: "الغراب"
    },
    descriptions: {
      en: "Marks one player at night so they start the day with vote pressure.",
      fr: "Marque un joueur la nuit pour lui mettre une pression de vote le jour.",
      ar: "يعلم لاعب في الليل باش يدخل النهار وعليه ضغط تصويت."
    }
  },
  {
    key: "knight",
    faction: "village",
    max: 1,
    names: {
      en: "Rusty Sword Knight",
      fr: "Chevalier a l'epee rouillee",
      ar: "الفارس صاحب السيف الصدئ"
    },
    descriptions: {
      en: "If killed by werewolves, can cause a nearby werewolf to die later.",
      fr: "S'il est tue par les loups, peut faire mourir un loup proche plus tard.",
      ar: "إذا قتلوه المستذئبين، ينجم يسبب موت مستذئب قريب بعده."
    }
  },
  {
    key: "angel",
    faction: "neutral",
    max: 1,
    names: {
      en: "Angel",
      fr: "Ange",
      ar: "الملاك"
    },
    descriptions: {
      en: "Tries to be eliminated very early to win alone.",
      fr: "Essaie d'etre elimine tres tot pour gagner seul.",
      ar: "يحاول يخرج بكري برشا باش يربح وحده."
    }
  },
  {
    key: "actor",
    faction: "village",
    max: 1,
    names: {
      en: "Actor",
      fr: "Comedien",
      ar: "الممثل"
    },
    descriptions: {
      en: "Can use a few unused roles as temporary powers.",
      fr: "Peut utiliser quelques roles non utilises comme pouvoirs temporaires.",
      ar: "ينجم يستعمل أدوار زايدة كقوى مؤقتة."
    }
  },
  {
    key: "devoted_servant",
    faction: "village",
    max: 1,
    names: {
      en: "Devoted Servant",
      fr: "Servante devouee",
      ar: "الخادمة المخلصة"
    },
    descriptions: {
      en: "May take the role of a player who has just been eliminated by vote.",
      fr: "Peut prendre le role d'un joueur qui vient d'etre elimine au vote.",
      ar: "تنجم تاخذ دور لاعب خرج بالتصويت توا."
    }
  },
  {
    key: "two_sisters",
    faction: "village",
    max: 2,
    names: {
      en: "Two Sisters",
      fr: "Deux soeurs",
      ar: "الأختان"
    },
    descriptions: {
      en: "Wake together to recognize each other.",
      fr: "Se reveillent ensemble pour se reconnaitre.",
      ar: "يفيقوا مع بعضهم باش يعرفوا بعضهم."
    }
  },
  {
    key: "three_brothers",
    faction: "village",
    max: 3,
    names: {
      en: "Three Brothers",
      fr: "Trois freres",
      ar: "الإخوة الثلاثة"
    },
    descriptions: {
      en: "Wake together to recognize each other.",
      fr: "Se reveillent ensemble pour se reconnaitre.",
      ar: "يفيقوا مع بعضهم باش يعرفوا بعضهم."
    }
  },
  {
    key: "stuttering_judge",
    faction: "village",
    max: 1,
    names: {
      en: "Stuttering Judge",
      fr: "Juge begue",
      ar: "القاضي المتلعثم"
    },
    descriptions: {
      en: "Can secretly request an extra village vote once per game.",
      fr: "Peut demander secretement un vote supplementaire une fois par partie.",
      ar: "ينجم يطلب تصويت إضافي للقرية مرة واحدة في اللعبة."
    }
  },
  {
    key: "barber",
    faction: "village",
    max: 1,
    names: {
      en: "Barber",
      fr: "Barbier",
      ar: "الحلاق"
    },
    descriptions: {
      en: "Can eliminate one player during the day, with consequences if wrong.",
      fr: "Peut eliminer un joueur le jour, avec consequences s'il se trompe.",
      ar: "ينجم يطيّح لاعب في النهار، وإذا غلط تكون فما عاقبة."
    }
  },
  {
    key: "barbie",
    faction: "neutral",
    max: 1,
    names: {
      en: "Barbie",
      fr: "Barbie",
      ar: "باربي"
    },
    descriptions: {
      en: "Custom table role from the old app. Narrator defines the exact ability.",
      fr: "Role personnalise de l'ancienne app. Le narrateur definit son pouvoir exact.",
      ar: "دور custom من النسخة القديمة. الراوي يحدد قوته بالضبط."
    }
  },
  {
    key: "alien",
    faction: "neutral",
    max: 1,
    names: {
      en: "Alien",
      fr: "Alien",
      ar: "الفضائي"
    },
    descriptions: {
      en: "Custom neutral role for your table. Narrator decides the win condition.",
      fr: "Role neutre personnalise pour votre table. Le narrateur decide sa condition de victoire.",
      ar: "دور محايد custom للمجموعة. الراوي يحدد كيفاش يربح."
    }
  }
];

export const DEFAULT_ROLE_COUNTS = {
  werewolf: 2,
  seer: 1,
  witch: 1,
  hunter: 1
};

export const ROLE_KEYS = new Set(ROLE_CATALOG.map((role) => role.key));

export function getRoleByKey(key) {
  return ROLE_CATALOG.find((role) => role.key === key);
}

export function translateRole(role, language = "en") {
  const lang = ["en", "fr", "ar"].includes(language) ? language : "en";

  return {
    key: role.key,
    faction: role.faction,
    max: role.max,
    name: role.names[lang] || role.names.en,
    description: role.descriptions[lang] || role.descriptions.en,
    names: role.names,
    descriptions: role.descriptions
  };
}
