export interface CampaignTemplate {
  id: string;
  name: string;
  theme: string;
  outline: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Deadly';
  icon: string;
}

export const campaignTemplates: CampaignTemplate[] = [
  {
    id: 'dark-fantasy',
    name: 'Dark Fantasy',
    theme: 'Dark Fantasy',
    outline: `Generate a series of epic acts for a Dark Fantasy D&D campaign. Each act should feature grim battles, cursed lands, and the struggle between light and encroaching darkness.

Tone: grim, foreboding, epic, with moral ambiguity and the weight of difficult choices.

Requirements:
• Provide {num_acts} acts chronicling the battle against ancient evil
• Create a world where hope is scarce but heroes persist
• Include {num_monsters} powerful threats (dragons, demons, corrupted beings, shadow creatures)
• Feature cursed artifacts, forbidden magic, and dark prophecies
• Present morally complex choices with no clear right answer
• Build toward an epic confrontation with ancient evil
• Include themes of sacrifice, corruption, and redemption

Scene theme: "An ancient darkness awakens from forgotten ruins, corrupting the land. Heroes must stand against impossible odds, knowing victory may require terrible sacrifice."

Output format for each act:
• Act Title (dark and epic)
• The Grim World (describe the corrupted setting and atmosphere)
• Ancient Threat (the specific evil or corruption faced)
• Moral Dilemmas (difficult choices heroes must make)
• Dark Forces (monsters, curses, corrupted allies)
• Key Characters (allies, enemies, those caught between)
• Possible Outcomes (victory, defeat, or pyrrhic success)
• Consequences (scars left on world and heroes)`,
    description: 'Epic battles against dark forces in a grim fantasy world',
    difficulty: 'Hard',
    icon: '🐉',
  },
  {
    id: 'high-fantasy',
    name: 'High Fantasy',
    theme: 'High Fantasy',
    outline: 'A classic high fantasy campaign with noble heroes, magical kingdoms, and epic quests. The realm is threatened by a dark lord seeking to destroy all that is good.',
    description: 'Classic fantasy adventure with heroes and magic',
    difficulty: 'Medium',
    icon: '⚔️',
  },
  {
    id: 'comedy',
    name: 'Comedy Adventure',
    theme: 'Comedy',
    outline: `Generate a series of comedic scene acts for a Dungeons & Dragons adventure. The acts should be structured like a short play or sketch, with clear escalating beats, silly conflicts, and humorous resolutions.

Tone: lighthearted, absurd, and full of misadventures.

Requirements:
• Provide {num_acts} acts, each with a title and a short description
• Include escalating comedic complications where the heroes make things worse without meaning to
• Feature ridiculous NPCs, exaggerated reactions, and magically absurd situations
• Ensure the acts loosely connect into one funny scenario but can be used independently
• Keep outcomes open-ended so players can improvise or derail the scene
• Add optional twist endings for each act to surprise the players
• Include {num_monsters} comedic "monsters" (silly creatures, not threats)

Scene theme: "The party must help The City prepare for the Grand Cheese Festival, but everything goes horribly, hilariously wrong."

Output format for each act:
• Act Title
• Setup (2-3 sentences)
• Comedic Conflict (what goes hilariously wrong)
• Escalation (how it gets worse)
• Optional Twist (surprise ending)
• Key NPCs (funny characters to interact with)
• Outcomes (multiple silly ways this could resolve)`,
    description: 'Funny and lighthearted adventures with comedic twists',
    difficulty: 'Easy',
    icon: '🎭',
  },
  {
    id: 'murder-mystery',
    name: 'Murder Mystery',
    theme: 'Murder Mystery',
    outline: `Generate a series of investigative acts for a Murder Mystery D&D campaign. Each act should present clues, suspects, and revelations as players unravel a complex conspiracy.

Tone: suspenseful, investigative, noir-inspired, with twists and red herrings.

Requirements:
• Provide {num_acts} acts that build toward revealing the mastermind
• Present multiple suspects with motives, means, and opportunity
• Include {num_monsters} potential threats (not all may be the killer)
• Feature clues, evidence, and investigative challenges
• Create red herrings and misdirection to keep players guessing
• Include social investigation: interviews, interrogations, uncovering lies
• Build tension as investigators get closer to the truth (and danger)

Scene theme: "A series of bizarre murders plague the city's elite. Each victim was found with a peculiar calling card, and the party must solve the case before the killer strikes again—possibly at them."

Output format for each act:
• Act Title (mysterious and intriguing)
• The Crime Scene (what happened and what evidence exists)
• Suspects & Motives (multiple potential culprits with secrets)
• Clues & Red Herrings (evidence that helps or misleads)
• Investigation Challenges (obstacles, lies, cover-ups)
• Key NPCs (suspects, witnesses, informants, authorities)
• Plot Twists (revelations that change everything)
• Possible Conclusions (multiple solutions based on evidence interpreted)`,
    description: 'Investigate crimes and solve mysteries in a dark city',
    difficulty: 'Medium',
    icon: '🔍',
  },
  {
    id: 'ancient-egypt',
    name: 'Ancient Egypt',
    theme: 'Ancient',
    outline: 'An ancient Egyptian campaign with pharaohs, pyramids, and desert adventures. The party explores lost tombs, uncovers ancient curses, and battles mummies and other undead.',
    description: 'Explore ancient tombs and Egyptian mythology',
    difficulty: 'Medium',
    icon: '🏺',
  },
  {
    id: 'pirate-adventure',
    name: 'Pirate Adventure',
    theme: 'Pirate',
    outline: `Generate a series of swashbuckling acts for a high-seas Pirate D&D campaign. Each act should feature naval adventure, treasure hunting, and daring escapades.

Tone: adventurous, swashbuckling, nautical, with both danger and excitement on the open ocean.

Requirements:
• Provide {num_acts} acts following the crew's adventures across the seas
• Include ship-to-ship combat, boarding actions, and naval strategy
• Feature {num_monsters} sea monsters, rival pirates, and maritime threats
• Use nautical terminology and seafaring atmosphere
• Include treasure maps, buried loot, and legendary artifacts
• Add moral choices: pirate code vs. personal gain
• Feature colorful NPCs: ship captains, merchants, navy officers, fellow pirates

Scene theme: "The crew has acquired a mysterious treasure map leading to the legendary Dead Man's Cove, but rival pirates and sea monsters stand between them and fortune."

Output format for each act:
• Act Title (nautical and exciting)
• Setting the Sails (the crew's current situation and objective)
• High Seas Challenges (storms, battles, rival ships encountered)
• Treasure & Discovery (what they find or learn)
• Naval Threats (enemies, monsters, or obstacles)
• Key NPCs (colorful maritime characters)
• Multiple Endings (treasure won, lost, or complications)
• Legendary Tales (how this adds to the crew's reputation)`,
    description: 'Sail the seas, find treasure, and battle pirates',
    difficulty: 'Medium',
    icon: '🏴‍☠️',
  },
  {
    id: 'steampunk',
    name: 'Steampunk',
    theme: 'Steampunk',
    outline: `Generate a series of industrial acts for a Victorian Steampunk D&D campaign. Each act should feature mechanical marvels, steam-powered intrigue, and clockwork conspiracies.

Tone: Victorian, industrial, mechanical, with brass, gears, steam, and technological wonder mixed with class conflict.

Requirements:
• Provide {num_acts} acts exploring the clockwork city and its mysteries
• Feature mechanical inventions, steam technology, and clockwork devices
• Include {num_monsters} steam-powered constructs, automatons, and mechanical threats
• Use Victorian-era language and industrial terminology
• Include class conflict: aristocrats vs. workers, inventors vs. industrialists
• Feature espionage, corporate sabotage, and technological theft
• Add moral questions about technology, progress, and humanity

Scene theme: "The Brass City hums with a thousand gears, but a revolutionary invention threatens to either save the city or doom it to mechanical apocalypse."

Output format for each act:
• Act Title (mechanical and Victorian)
• The Clockwork Setting (describe the industrial environment)
• Technological Mystery (the invention, conspiracy, or threat)
• Mechanical Complications (gears, steam, constructs causing problems)
• Social Intrigue (class conflict, politics, corporate schemes)
• Key Figures (inventors, industrialists, rebels, automatons)
• Multiple Resolutions (technological, political, or violent)
• Innovations Discovered (new tech or knowledge gained)`,
    description: 'Victorian steampunk with gears, steam, and intrigue',
    difficulty: 'Hard',
    icon: '⚙️',
  },
  {
    id: 'horror',
    name: 'Gothic Horror',
    theme: 'Horror',
    outline: `Generate a series of terrifying acts for a Gothic Horror Dungeons & Dragons campaign. Each act should build dread, escalate tension, and create atmosphere of supernatural terror.

Tone: dark, unsettling, atmospheric, with creeping dread and psychological horror.

Requirements:
• Provide {num_acts} acts, each building toward a horrifying climax
• Create oppressive atmosphere with environmental horror and disturbing details
• Include {num_monsters} supernatural threats (vampires, werewolves, spirits, eldritch horrors)
• Use sensory details: what players see, hear, smell in the darkness
• Build tension slowly before shocking revelations
• Include moral dilemmas and psychological horror elements
• Foreshadow future horrors through omens and warnings

Scene theme: "The party arrives at a cursed village where the dead do not stay buried, and the living fear the night."

Output format for each act:
• Act Title (ominous and evocative)
• Atmosphere (describe the oppressive mood and setting)
• Initial Horror (the first disturbing discovery)
• Escalating Dread (how tension builds and things worsen)
• The Revelation (horrifying truth revealed)
• Key Threats (monsters, curses, or dangers)
• Potential Resolutions (ways to survive or escape)
• Lingering Consequences (what haunts them after)`,
    description: 'Survive supernatural horrors in a dark world',
    difficulty: 'Hard',
    icon: '🦇',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    theme: 'Cyberpunk',
    outline: `Generate a series of high-tech acts for a Cyberpunk D&D campaign. Each act should feature corporate intrigue, hacking, street-level crime, and the struggle against megacorporate control.

Tone: dystopian, neon-soaked, gritty, with themes of transhumanism and corporate oppression.

Requirements:
• Provide {num_acts} acts navigating the corporate-controlled dystopia
• Feature hacking, netrunning, and digital warfare
• Include {num_monsters} threats (combat drones, cyborgs, AI constructs, corporate security)
• Present cybernetic augmentation choices and their consequences
• Include corporate espionage, data theft, and shadow operations
• Feature street gangs, fixers, hackers, and corporate agents
• Explore themes of humanity vs. technology, freedom vs. control

Scene theme: "In the neon shadows of the megacity, a group of edgerunners takes a dangerous job: steal data from a megacorp vault. But they soon discover the data is more than just corporate secrets—it's the key to humanity's future."

Output format for each act:
• Act Title (cyberpunk and edgy)
• The Dystopian Setting (neon streets, corporate zones, the sprawl)
• The Job (mission, heist, or operation)
• Technical Challenges (hacking, security, tech obstacles)
• Corporate Threats (security forces, rival runners, AI)
• Key Figures (fixers, corpos, street legends, AI entities)
• Cybernetic Consequences (augmentations gained or lost, humanity cost)
• Outcomes (success, betrayal, corporate retaliation)`,
    description: 'High-tech dystopian future with cybernetics',
    difficulty: 'Hard',
    icon: '🤖',
  },
  {
    id: 'western',
    name: 'Wild West',
    theme: 'Western',
    outline: 'A wild west campaign in a frontier land. The party becomes gunslingers, sheriffs, or outlaws, facing bandits, supernatural threats, and the harsh wilderness of the untamed frontier.',
    description: 'Cowboys, outlaws, and adventure in the frontier',
    difficulty: 'Medium',
    icon: '🤠',
  },
  {
    id: 'viking',
    name: 'Viking Saga',
    theme: 'Viking',
    outline: 'A viking campaign of raiding, exploration, and Norse mythology. The party sails longships, battles monsters from legend, and seeks glory in the name of the gods.',
    description: 'Norse mythology and viking adventures',
    difficulty: 'Medium',
    icon: '⚡',
  },
  {
    id: 'urban-fantasy',
    name: 'Urban Fantasy',
    theme: 'Urban Fantasy',
    outline: 'An urban fantasy campaign set in a modern city where magic and technology coexist. The party discovers hidden magical societies, battles supernatural threats, and navigates the secret world beneath the mundane.',
    description: 'Magic in the modern world, hidden from mortals',
    difficulty: 'Medium',
    icon: '🌃',
  },
  {
    id: 'post-apocalyptic',
    name: 'Post-Apocalyptic',
    theme: 'Post-Apocalyptic',
    outline: 'A post-apocalyptic campaign in a world destroyed by magic or technology. The party scavenges ruins, battles mutants and raiders, and tries to rebuild civilization in a wasteland.',
    description: 'Survive in a world destroyed by catastrophe',
    difficulty: 'Hard',
    icon: '💀',
  },
  {
    id: 'fairy-tale',
    name: 'Fairy Tale',
    theme: 'Fairy Tale',
    outline: 'A fairy tale campaign with twisted versions of classic stories. The party navigates enchanted forests, deals with trickster fae, and must break curses in a world where stories come to life.',
    description: 'Classic fairy tales with dark twists',
    difficulty: 'Easy',
    icon: '🧚',
  },
  {
    id: 'samurai',
    name: 'Samurai Epic',
    theme: 'Samurai',
    outline: 'A samurai campaign in feudal Japan with honor, duty, and epic duels. The party serves a daimyo, battles rival clans, and faces supernatural yokai in a land of honor and tradition.',
    description: 'Feudal Japan with samurai, honor, and yokai',
    difficulty: 'Hard',
    icon: '🗾',
  },
  {
    id: 'space-opera',
    name: 'Space Opera',
    theme: 'Space Opera',
    outline: 'A space opera campaign across the galaxy. The party commands starships, explores alien worlds, battles space pirates, and uncovers ancient alien mysteries in the vast cosmos.',
    description: 'Epic space adventures across the galaxy',
    difficulty: 'Hard',
    icon: '🚀',
  },
  {
    id: 'zombie-apocalypse',
    name: 'Zombie Apocalypse',
    theme: 'Zombie',
    outline: `Generate a series of survival acts for a Zombie Apocalypse D&D campaign. Each act should feature desperate survival, resource scarcity, and the constant threat of the undead horde.

Tone: desperate, survival-focused, tense, with both horror and action elements.

Requirements:
• Provide {num_acts} acts chronicling the party's struggle to survive
• Feature resource scarcity: food, water, ammunition, medicine
• Include {num_monsters} zombie variants (shambling dead, fast infected, special mutations)
• Present difficult moral choices: who to save, what to sacrifice
• Include base-building, fortification, and safe zone management
• Feature other survivors: allies, rivals, desperate people making bad choices
• Build toward discovering the outbreak's origin or finding a cure

Scene theme: "The dead walk the earth. Cities are overrun. The party must scavenge, survive, and maintain their humanity while searching for safe haven—and perhaps a cure."

Output format for each act:
• Act Title (dire and survival-focused)
• The Devastated World (describe the post-apocalyptic setting)
• Survival Challenge (resource needs, threats, objectives)
• Zombie Threats (types of undead, horde movements, outbreaks)
• Human Element (other survivors, conflicts, moral dilemmas)
• Key Locations (safe zones, scavenge sites, danger areas)
• Difficult Choices (who lives, who dies, what price for survival)
• Possible Outcomes (survival, loss, discoveries made)`,
    description: 'Survive the zombie apocalypse and find a cure',
    difficulty: 'Deadly',
    icon: '🧟',
  },
  {
    id: 'medieval-political',
    name: 'Political Intrigue',
    theme: 'Political',
    outline: 'A political intrigue campaign in a medieval court. The party navigates complex politics, uncovers conspiracies, and must choose sides in a war of succession where words are as deadly as swords.',
    description: 'Navigate court politics and conspiracies',
    difficulty: 'Medium',
    icon: '👑',
  },
  {
    id: 'underwater',
    name: 'Underwater Adventure',
    theme: 'Underwater',
    outline: 'An underwater campaign in the depths of the ocean. The party explores sunken cities, battles sea monsters, and uncovers the secrets of an ancient underwater civilization.',
    description: 'Explore the depths and underwater kingdoms',
    difficulty: 'Medium',
    icon: '🌊',
  },
  {
    id: 'time-travel',
    name: 'Time Travel',
    theme: 'Time Travel',
    outline: 'A time travel campaign where the party jumps between different eras. They must fix temporal anomalies, prevent paradoxes, and stop a villain who seeks to rewrite history.',
    description: 'Travel through time and fix temporal anomalies',
    difficulty: 'Hard',
    icon: '⏰',
  },
  {
    id: 'dragon-riders',
    name: 'Dragon Riders',
    theme: 'Dragon Riders',
    outline: 'A dragon rider campaign where the party bonds with dragons and becomes legendary riders. They must protect the realm from ancient threats and master the art of dragon combat.',
    description: 'Bond with dragons and become legendary riders',
    difficulty: 'Hard',
    icon: '🐲',
  },
];

export const getTemplateByTheme = (theme: string): CampaignTemplate | undefined => {
  return campaignTemplates.find(t => t.theme.toLowerCase() === theme.toLowerCase());
};

export const getTemplatesByDifficulty = (difficulty: string): CampaignTemplate[] => {
  return campaignTemplates.filter(t => t.difficulty === difficulty);
};

