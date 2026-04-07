/**
 * pov-content.ts — Static authored content for all 52 PoV argument types.
 *
 * Key: direction_tag (matches the direction_tag field in PrepUnit.practices[1].directions)
 * Value: full blog-style entry with hook, core concept, detection, and IELTS examples.
 *
 * Usage:
 *   import { povContent, poleStyles } from "~/content/pov-content";
 *   const entry = povContent[direction_tag]; // undefined if no authored content
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Pole =
  | "Wealth & Economy"
  | "Environment & Future"
  | "Personal Freedom"
  | "Society & Laws"
  | "Innovation & Tech"
  | "Tradition & History"
  | "Mental Wellbeing";

export interface PovEntry {
  id: string;
  title: string;
  poles: [Pole, Pole];
  hook: { analogy: string; name: string };
  core: { name: string; analogy: string; exp: string };
  det: { q1: string; q2: string; t: string };
  top: Array<{ t: string; r: string; p: string }>;
}

// ─── Pole badge styles ────────────────────────────────────────────────────────

/** Tailwind classes for each pole's badge. Used in PoV page and QB sidebar. */
export const poleStyles: Record<Pole, string> = {
  "Wealth & Economy": "bg-amber-200 text-gray-900",
  "Environment & Future": "bg-emerald-300 text-gray-900",
  "Personal Freedom": "bg-pink-500 text-white",
  "Society & Laws": "bg-blue-700 text-white",
  "Innovation & Tech": "bg-cyan-300 text-gray-900",
  "Tradition & History": "bg-orange-400 text-gray-900",
  "Mental Wellbeing": "bg-violet-400 text-white",
};

// ─── Entries ──────────────────────────────────────────────────────────────────

const entries: PovEntry[] = [
  {
    id: "individual_collective_blocking",
    title: "Individual action alone cannot solve shared problems",
    poles: ["Personal Freedom", "Society & Laws"],
    hook: {
      name: "The Asking Nicely Trap",
      analogy:
        "Your teacher assigns a massive group project. 'I trust you will all voluntarily do your share!' What happens? You do 90% of the work while three kids play on their phones. Trusting people to just 'be nice' completely failed.",
    },
    core: {
      name: "The Traffic Jam Example",
      analogy:
        "A city has terrible traffic. The mayor puts up a sign: 'Please take the bus!' You wait in the rain for the bus, but thousands of people drive warm cars right past you. Because there were no rules, everyone chose the selfish option.",
      exp: "Massive problems require massive rules. You cannot fix a broken system by asking people nicely.",
    },
    det: {
      q1: "Is this problem too big for one person to fix alone?",
      q2: "Do people have a selfish reason to cheat if there are no rules?",
      t: "While {personal choices} are admirable, a {massive societal problem} cannot be solved without strict rules.",
    },
    top: [
      {
        t: "Climate Change",
        r: "You bravely drink from a paper straw to save the turtles.",
        p: "It's useless because a massive corporation is legally dumping 10,000 tons of oil next door.",
      },
      {
        t: "Obesity Crisis",
        r: "A teenager tries to eat healthy on their own.",
        p: "They are trapped because the only affordable food in their neighborhood is addictive fast food.",
      },
      {
        t: "Traffic Congestion",
        r: "You choose to ride a bike to work to stop pollution.",
        p: "You get run off the road because the government hasn't built safe bike lanes.",
      },
    ],
  },
  {
    id: "individual_flourishing_synergy",
    title: "Personal freedom and human wellbeing support each other",
    poles: ["Personal Freedom", "Mental Wellbeing"],
    hook: {
      name: "The Choice Engine",
      analogy:
        "Your parents force you to play the piano for 3 hours a day. You hate it. But when you freely choose to learn the guitar by yourself, you happily practice for 5 hours. The freedom to choose is what made it fun.",
    },
    core: {
      name: "The Autonomy Joy Example",
      analogy:
        "If someone forces you into a highly-paid, extremely stable office job, you might feel like a prisoner. But if you freely choose to start a risky, low-paying bakery, you wake up thrilled every morning. The act of choosing generates the happiness.",
      exp: "Human beings are not robots. Happiness doesn't just come from safety; it comes from directing your own life.",
    },
    det: {
      q1: "Who is in control of making the life choice?",
      q2: "How does having the freedom to choose create deep psychological happiness?",
      t: "{Personal freedom} allows individuals to pursue {careers they actually love}, increasing their overall wellbeing.",
    },
    top: [
      {
        t: "Career Choice",
        r: "A student ignores their parents' demands to become a doctor.",
        p: "They become a teacher and experience deep daily fulfillment instead of lifelong burnout.",
      },
      {
        t: "Arranged vs Chosen Marriage",
        r: "A person chooses their own partner despite societal pressure.",
        p: "The marriage survives because it was built on personal autonomy, not obligation.",
      },
      {
        t: "The Gig Economy",
        r: "A worker quits a 9-to-5 job to freelance.",
        p: "They lose job security, but their mental health skyrockets because they control their own schedule.",
      },
    ],
  },
  {
    id: "material_flourishing_tradeoff",
    title: "People have to choose between higher income and more meaningful lives",
    poles: ["Wealth & Economy", "Mental Wellbeing"],
    hook: {
      name: "The Golden Handcuffs",
      analogy:
        "You get a huge allowance, but your parents say you must do chores 12 hours a day to earn it. You are rich, but you can never hang out with your friends or play games. The money stole your actual life.",
    },
    core: {
      name: "The Salary Prison Example",
      analogy:
        "A brilliant lawyer makes a million dollars a year. But to keep the job, she works 90 hours a week, never sees her children, and suffers panic attacks. She has achieved absolute wealth, but zero human happiness.",
      exp: "The things that make us rich and the things that make us happy frequently pull in exact opposite directions.",
    },
    det: {
      q1: "What massive pile of money is being offered?",
      q2: "What beautiful human joy is being destroyed to earn that money?",
      t: "While {chasing a huge salary} offers financial security, it often demands sacrifices in {family time and mental health}.",
    },
    top: [
      {
        t: "Corporate Work Culture",
        r: "An executive gets promoted to Vice President with a massive bonus.",
        p: "They miss every single one of their child's birthdays due to endless business trips.",
      },
      {
        t: "Working Abroad",
        r: "A parent moves to a wealthy country to send money back home.",
        p: "They achieve financial stability, but suffer agonizing loneliness away from their family.",
      },
      {
        t: "Hustle Culture",
        r: "A teenager works three jobs to buy a luxury car.",
        p: "They buy the car, but are too exhausted and depressed to ever actually enjoy driving it.",
      },
    ],
  },
  {
    id: "preservation_progress_blocking",
    title: "Attachment to tradition slows necessary change",
    poles: ["Tradition & History", "Innovation & Tech"],
    hook: {
      name: "The Nostalgia Trap",
      analogy:
        "You are failing your math test. The teacher offers you a calculator, but you refuse. 'Using paper is the traditional way!' you say. You get an F. Your stubborn love for the past ruined your future.",
    },
    core: {
      name: "The Stubborn Anchor Example",
      analogy:
        "A farming village refuses to use modern tractors because 'our ancestors dug the dirt by hand' (Tradition & History). It sounds noble, but half the village starves to death when a drought hits because they couldn't plant fast enough (Innovation & Tech).",
      exp: "Just because something is old doesn't mean it is wise. Worshipping the past stops us from solving today's painful problems.",
    },
    det: {
      q1: "What 'romantic' old habit are people refusing to let go of?",
      q2: "How is this old habit actively hurting people today?",
      t: "While tradition feels safe, {an old tradition} prevents communities from adopting {a modern solution}.",
    },
    top: [
      {
        t: "Rote Learning in Schools",
        r: "Schools force kids to memorize facts from dusty books because 'that's how we always did it.'",
        p: "The kids enter an AI-driven world completely lacking critical thinking skills.",
      },
      {
        t: "Alternative Medicine",
        r: "People refuse modern vaccines, preferring ancient herbal remedies.",
        p: "Preventable diseases come back and harm the community because nostalgia replaced science.",
      },
      {
        t: "Paper Bureaucracy",
        r: "A government refuses to use digital databases to preserve filing jobs.",
        p: "Citizens wait months for simple hospital forms, causing massive unnecessary suffering.",
      },
    ],
  },
  {
    id: "flourishing_material_instrument",
    title: "Happy, fulfilled workers are more economically productive",
    poles: ["Mental Wellbeing", "Wealth & Economy"],
    hook: {
      name: "The Burnout Bill",
      analogy:
        "Think of a video game character. If they have full health and high stamina, they run faster and mine double the gold. If their health is flashing red, they crawl. Humans are the exact same way at work.",
    },
    core: {
      name: "The Happy Engine Example",
      analogy:
        "A hospital treats its nurses like robots, forcing them to work 14-hour shifts. The nurses burn out and quit after a year. The hospital spends millions constantly hiring and training new, stressed-out staff. Misery is incredibly expensive.",
      exp: "Investing in human wellbeing isn't just 'nice'; it is the smartest financial decision a business can make.",
    },
    det: {
      q1: "How are the workers being treated with dignity and care?",
      q2: "How does their happiness actually generate massive profits for the company?",
      t: "Investing in {treating workers well} reduces burnout and ultimately increases {business growth}.",
    },
    top: [
      {
        t: "Four-Day Work Week",
        r: "A company lets employees take Fridays off to rest and see their families.",
        p: "The rested employees come back Monday and invent a brilliant product that makes billions.",
      },
      {
        t: "Mental Health Days",
        r: "A tech firm offers free therapy and unlimited sick leave.",
        p: "Retention skyrockets; the company saves millions because their best engineers never quit.",
      },
      {
        t: "Living Wages",
        r: "A factory pays its floor workers enough to buy their own houses.",
        p: "The workers take deep pride in the factory, slashing error rates and boosting product quality.",
      },
    ],
  },
  {
    id: "material_sustainable_synergy",
    title: "A green economy proves growth and sustainability work together",
    poles: ["Wealth & Economy", "Environment & Future"],
    hook: {
      name: "The False Choice",
      analogy:
        "Your parents say you can either play video games OR do your homework. But what if your homework is to design a video game? Suddenly, you are having fun AND getting straight A's. You didn't have to choose.",
    },
    core: {
      name: "The Win-Win Example",
      analogy:
        "People used to think saving the earth meant living in a cave. But today, a company builds giant solar panels. They hire 10,000 workers, make a billion dollars in profit (Wealth & Economy), and totally stop air pollution (Environment & Future).",
      exp: "You don't have to choose between money and nature. Smart innovation solves both at the exact same time.",
    },
    det: {
      q1: "How does this green technology make a massive profit?",
      q2: "How does it simultaneously heal the environment?",
      t: "The apparent conflict between {making money} and {saving nature} is a false choice. {Green innovation} proves both work together.",
    },
    top: [
      {
        t: "Electric Vehicles (EVs)",
        r: "Car companies invent sleek, fast EVs and become the richest companies on earth.",
        p: "City skies clear up because there are zero exhaust fumes blocking the sun.",
      },
      {
        t: "Lab-Grown Meat",
        r: "Scientists sell cheap, delicious burgers and make an absolute fortune.",
        p: "Zero cows are killed, and massive forests are saved from being turned into farmland.",
      },
      {
        t: "Wind Farming",
        r: "Farmers rent out parts of their fields for wind turbines to earn massive extra cash.",
        p: "The turbines generate infinite clean energy while the farmer still grows food underneath.",
      },
    ],
  },
  {
    id: "progress_flourishing_causal_pos",
    title: "Technology improves human wellbeing",
    poles: ["Innovation & Tech", "Mental Wellbeing"],
    hook: {
      name: "The Invisible Healer",
      analogy:
        "You put on glasses for the very first time. Suddenly, the blurry green blobs outside turn into sharp, beautiful leaves. The technology (the glasses) didn't just make you 'efficient'; it brought pure joy and relief to your life.",
    },
    core: {
      name: "The Painkiller Example",
      analogy:
        "A grandmother lives alone in a tiny village. Twenty years ago, she would have died of severe loneliness. Today, she uses a tablet to video-call her grandchildren across the world every single morning. The screen erased her isolation.",
      exp: "Technology isn't just about making billionaires richer; it actively removes specific, agonizing sources of human suffering.",
    },
    det: {
      q1: "What brilliant new tool or software was invented?",
      q2: "What specific human pain or sadness did it completely cure?",
      t: "{New technology} does not just add convenience; it actively removes sources of {loneliness and pain}.",
    },
    top: [
      {
        t: "Medical Apps",
        r: "A diabetic patient uses a tiny Bluetooth sensor on their arm.",
        p: "They no longer have to stab their finger with needles 5 times a day, bringing immense psychological relief.",
      },
      {
        t: "Online Therapy",
        r: "A depressed teenager living in a rural town logs onto a telehealth app.",
        p: "They finally connect with a therapist, saving their life when no local help was available.",
      },
      {
        t: "Global Video Calling",
        r: "Immigrants use free Wi-Fi apps to call home.",
        p: "The agonizing homesickness of moving to a new country is instantly cured by seeing their mother's face.",
      },
    ],
  },
  {
    id: "progress_preservation_tradeoff",
    title: "Societies have to choose how fast to change",
    poles: ["Innovation & Tech", "Tradition & History"],
    hook: {
      name: "The Speed Limit Trap",
      analogy:
        "You move to a brand new, amazing high school. The classes are better and the gym is huge. But you instantly lose contact with all your childhood friends. You upgraded your life, but ripped apart your social fabric.",
    },
    core: {
      name: "The Whiplash Example",
      analogy:
        "A government decides to instantly upgrade its entire economy to Artificial Intelligence. The GDP triples overnight (Innovation & Tech). But millions of truck drivers and cashiers lose their jobs, their pride, and their communities in a single week (Tradition & History).",
      exp: "Rapid technological adoption produces massive gains, but moves faster than human beings can psychologically adapt.",
    },
    det: {
      q1: "What shiny new upgrade is the society rushing to adopt?",
      q2: "What community bond or human skill gets violently ripped apart by the speed?",
      t: "Rapid {new technology} produces economic gains but disrupts {human connections}.",
    },
    top: [
      {
        t: "AI Job Automation",
        r: "Companies replace customer service reps with flawless AI chatbots, saving billions.",
        p: "Entire towns of workers are thrown into sudden unemployment, destroying local communities.",
      },
      {
        t: "Rapid Urbanisation",
        r: "A country bulldozes villages to build hyper-modern mega-cities in 5 years.",
        p: "The ancient village networks of trust and family are scattered and lost forever.",
      },
      {
        t: "Cashless Societies",
        r: "A nation bans paper money to make digital shopping lightning fast.",
        p: "The elderly are completely alienated, unable to buy groceries or navigate their own town.",
      },
    ],
  },
  {
    id: "material_flourishing_causal_pos",
    title: "Financial security improves human wellbeing",
    poles: ["Wealth & Economy", "Mental Wellbeing"],
    hook: {
      name: "The Foundation of Joy",
      analogy:
        "Try studying for your hardest math test when you haven't eaten food in two days. You can't focus on numbers; your brain is screaming for a sandwich. You can't reach your potential if you are terrified of starving.",
    },
    core: {
      name: "The Poverty Panic Example",
      analogy:
        "People say 'money can't buy happiness.' But poverty, debt, and the terror of being evicted cause enormous psychological suffering. Having enough money in the bank removes the panic attack of survival. It lets you finally breathe.",
      exp: "Financial security doesn't magically make you joyful, but it removes the giant boulder of anxiety crushing your chest.",
    },
    det: {
      q1: "What terrifying financial fear was permanently removed?",
      q2: "How did having that cash allow the person's mind to finally relax?",
      t: "{Having money} removes major sources of anxiety, significantly improving {human happiness}.",
    },
    top: [
      {
        t: "Universal Basic Income",
        r: "The government guarantees every citizen $1,000 a month to survive.",
        p: "Rates of severe depression and domestic stress plummet because the terror of homelessness is gone.",
      },
      {
        t: "Living Wages",
        r: "A fast-food worker finally gets paid enough to afford rent and groceries.",
        p: "They stop having panic attacks at night and can finally enjoy playing with their kids.",
      },
      {
        t: "Retirement Pensions",
        r: "An elderly worker is guaranteed a stable monthly check.",
        p: "They spend their final years gardening and teaching, completely free from the fear of starving.",
      },
    ],
  },
  {
    id: "collective_individual_causal_pos",
    title: "Social support enables individual success",
    poles: ["Society & Laws", "Personal Freedom"],
    hook: {
      name: "The Invisible Ladder",
      analogy:
        "A kid wins a massive video game tournament and brags, 'I did this all by myself!' But he forgets his parents bought the computer, paid for Wi-Fi, and cooked his dinner. His 'solo' win was built on a massive support system.",
    },
    core: {
      name: "The Self-Made Myth",
      analogy:
        "A billionaire claims he built his delivery company from scratch. But who built the highways his trucks drive on? Who educated the workers he hired? The government did (Society & Laws). Without public foundation, his private wealth (Personal Freedom) is zero.",
      exp: "No one is entirely self-made. Private success grows in the rich soil of public infrastructure.",
    },
    det: {
      q1: "What amazing personal success is someone bragging about?",
      q2: "What invisible public system actually paid for the tools they used?",
      t: "The {individual success} stands entirely on a foundation of {government support}.",
    },
    top: [
      {
        t: "Free Education",
        r: "A brilliant student becomes a top surgeon and makes millions.",
        p: "They only learned to read because public tax dollars funded their elementary school.",
      },
      {
        t: "Public Healthcare",
        r: "An entrepreneur takes a massive risk to start a new tech company.",
        p: "They only took the risk because they knew universal healthcare would save them if they failed.",
      },
      {
        t: "City Infrastructure",
        r: "A hipster coffee shop makes massive profits selling lattes.",
        p: "They only exist because the city built a subway station next door that brings 1,000 customers a day.",
      },
    ],
  },
  {
    id: "sustainable_collective_instrument",
    title: "Government action is the only reliable way to protect the environment",
    poles: ["Environment & Future", "Society & Laws"],
    hook: {
      name: "The Tragedy of the Commons",
      analogy:
        "Ten kids share a pizza. If there's no rule, one kid quickly eats 6 slices and the rest starve. When humans share a resource, we are selfish. We need a teacher to enforce a rule so everyone gets a slice.",
    },
    core: {
      name: "The Boss of the Earth Example",
      analogy:
        "When a factory pollutes a river, they get the money, but the town gets the poisoned water. The market failed. Only a power larger than the market—the government (Society & Laws)—can force them to stop and pay the true cost.",
      exp: "Voluntary action undersupplies public goods. Survival requires hard boundaries that markets won't self-impose.",
    },
    det: {
      q1: "Why would a greedy business never fix this voluntarily?",
      q2: "What massive legal power is required to force them to stop?",
      t: "Voluntary behavior underdelivers; only {strict government rules} can guarantee {environmental protection} at scale.",
    },
    top: [
      {
        t: "Carbon Taxes",
        r: "Companies will always choose the cheapest, dirtiest coal energy if left alone.",
        p: "A carbon tax forces the price of pollution up, aligning incentives with survival.",
      },
      {
        t: "Plastic Bag Bans",
        r: "Asking people to bring cloth bags failed for decades.",
        p: "When the government simply banned plastic bags overnight, the massive plastic crisis disappeared.",
      },
      {
        t: "National Parks",
        r: "Property developers would gladly pave over every beautiful forest for profit.",
        p: "The government legally walls off the land, saving it from human greed forever.",
      },
    ],
  },
  {
    id: "individual_material_causal_pos",
    title: "Personal freedom drives economic growth",
    poles: ["Personal Freedom", "Wealth & Economy"],
    hook: {
      name: "The Enterprise Engine",
      analogy:
        "You spend all weekend baking cookies. You sell them and make $100. Because it's your money, you get to choose what to do with it. That freedom makes you want to wake up early and bake even more next weekend.",
    },
    core: {
      name: "The Motivation Example",
      analogy:
        "If a government forced everyone to work the exact same job for the exact same pay, people would become lazy. But when individuals are free to chase their own success and keep their profits (Personal Freedom), they innovate and generate massive wealth (Wealth & Economy).",
      exp: "Control stifles initiative. The freedom to keep what you earn is the ultimate engine of wealth.",
    },
    det: {
      q1: "What freedom was the individual given?",
      q2: "How did that freedom motivate them to build a massive business?",
      t: "When {Regular people} can make their own economic decisions, economies grow faster and create {economic wealth}.",
    },
    top: [
      {
        t: "The Gig Economy",
        r: "Workers have the ultimate freedom to choose their own hours and clients.",
        p: "This free market approach creates massive wealth and lightning-fast convenience for society.",
      },
      {
        t: "Deregulation",
        r: "The government removes strict, annoying rules on opening restaurants.",
        p: "Thousands of ambitious individuals open food trucks, creating a booming local economy.",
      },
      {
        t: "Private Property Rights",
        r: "Citizens are guaranteed they can own the land they buy.",
        p: "Knowing the government won't steal it, they invest millions building beautiful houses and farms.",
      },
    ],
  },
  {
    id: "progress_preservation_causal_neg",
    title: "Innovation destroys traditions that cannot be recovered",
    poles: ["Innovation & Tech", "Tradition & History"],
    hook: {
      name: "The Eraser Trap",
      analogy:
        "You finally buy the newest, fastest smartphone. But when you get home, you realize it deleted all your childhood photos during the transfer. You gained incredible speed, but you permanently lost your history.",
    },
    core: {
      name: "The Bulldozer Example",
      analogy:
        "A city modernizes by bulldozing a 300-year-old public square where families gathered for generations, replacing it with a massive shopping mall (Innovation & Tech). People buy goods faster, but the community loses its soul (Tradition & History).",
      exp: "Once a language, craft, or way of life is gone, it is gone forever. Technological change is an eraser.",
    },
    det: {
      q1: "What shiny new convenience do we gain?",
      q2: "What irreplaceable human connection or skill do we permanently lose?",
      t: "{New technology} moves faster than communities can adapt, permanently destroying {ancient cultures}.",
    },
    top: [
      {
        t: "Automation",
        r: "Robots pump out thousands of identical, perfect wooden chairs in a single hour.",
        p: "The 60-year-old local carpenter goes out of business. The physical human skill is lost forever.",
      },
      {
        t: "Global Internet Culture",
        r: "A teenager in a village gets access to Hollywood movies and infinite memes.",
        p: "They stop speaking their grandmother's dialect, and a unique language vanishes from the earth.",
      },
      {
        t: "Digital Streaming",
        r: "People can watch any movie instantly from their bedroom in 4K.",
        p: "The local cinema closes down, destroying the traditional shared experience of a community watching a film together.",
      },
    ],
  },
  {
    id: "progress_sustainable_transformation",
    title: "What technologists call a solution, ecologists call a new problem",
    poles: ["Innovation & Tech", "Environment & Future"],
    hook: {
      name: "The Whack-a-Mole Trap",
      analogy:
        "You clean up the dirt in your yard by blowing it into your neighbor's yard with a massive, loud leaf blower. You 'solved' your problem, but you just created a brand new toxic mess for someone else.",
    },
    core: {
      name: "The Toxic Trade-Off",
      analogy:
        "Engineers proudly announce that nuclear power plants produce zero carbon emissions. Climate crisis solved! (Innovation & Tech). But wait—now we have tons of highly radioactive glowing green waste that will be deadly for 10,000 years (Environment & Future).",
      exp: "Every massive technological 'solution' introduces terrifying new environmental costs. We just swap one poison for another.",
    },
    det: {
      q1: "What old toxic problem did this brilliant tech solve?",
      q2: "What brand new environmental nightmare did it quietly create?",
      t: "A {high-tech fix} to emissions is simultaneously an unsolved {toxic disaster} in another area.",
    },
    top: [
      {
        t: "Electric Vehicles (EVs)",
        r: "EVs produce absolutely zero smog or exhaust on the road.",
        p: "We now have to violently strip-mine the earth for lithium and bury millions of toxic batteries.",
      },
      {
        t: "Geoengineering",
        r: "Scientists want to spray chemicals into the sky to block the sun and cool the earth.",
        p: "It stops global warming, but accidentally causes permanent, global crop failures.",
      },
      {
        t: "Artificial Intelligence",
        r: "AI algorithms perfectly optimize city traffic to save gas.",
        p: "The massive server farms required to run the AI consume as much electricity as a small country.",
      },
    ],
  },
  {
    id: "material_sustainable_tradeoff",
    title: "Countries have to choose between growing their economy and protecting the environment",
    poles: ["Wealth & Economy", "Environment & Future"],
    hook: {
      name: "The Luxury Green Trap",
      analogy:
        "You can't afford a $50 eco-friendly bamboo toothbrush, so you buy the $1 plastic one. You didn't want to hurt the earth, but you literally only had one dollar. Survival beats purity.",
    },
    core: {
      name: "The Poor Man's Coal Example",
      analogy:
        "Rich countries yell at developing nations to stop burning cheap coal to save the sky. But that poor nation needs coal to keep their hospital lights on and feed their children (Wealth & Economy). They cannot afford expensive solar panels (Environment & Future).",
      exp: "Sustainability is expensive. The choice between a dirty factory and no electricity is a brutal, real-world tradeoff.",
    },
    det: {
      q1: "What desperate economic necessity is forcing people's hands?",
      q2: "What beautiful environmental thing must be sacrificed to survive?",
      t: "Developing nations must choose between {making money} and {saving nature} because clean tech is unaffordable.",
    },
    top: [
      {
        t: "Developing Nations Burning Coal",
        r: "A rapidly growing country burns coal to pull millions of citizens out of deep poverty.",
        p: "The thick smog chokes the sky and accelerates global climate change.",
      },
      {
        t: "Clearing the Rainforest",
        r: "Farmers slash and burn ancient jungle just to grow enough soy to feed their families.",
        p: "The lungs of the planet are permanently destroyed for basic agricultural survival.",
      },
      {
        t: "Cheap Plastic Packaging",
        r: "Poor communities rely on ultra-cheap food wrapped in single-use plastics.",
        p: "They can't afford glass or biodegradable options, so the plastic fills the local rivers.",
      },
    ],
  },
  {
    id: "material_collective_tradeoff",
    title: "Taxation and regulation reduce economic productivity",
    poles: ["Wealth & Economy", "Society & Laws"],
    hook: {
      name: "The Red Tape Trap",
      analogy:
        "You are playing a fun board game, but the rulebook is 500 pages long. Every time you try to roll the dice, someone yells 'Wait! Rule 47b!' The game is so safe and regulated that nobody ever gets to play.",
    },
    core: {
      name: "The Concrete Shoes Example",
      analogy:
        "A young woman wants to open a small bakery. But the local government demands 50 expensive safety permits, charges huge taxes, and requires a 2-year waiting period (Society & Laws). She runs out of money and gives up. The bakery never opens (Wealth & Economy).",
      exp: "Every rule a business must follow is a heavy cost. Too much government intervention crushes the engine that generates wealth.",
    },
    det: {
      q1: "What incredibly strict rule or tax is the government imposing?",
      q2: "How does it accidentally kill the business before it can even start?",
      t: "Every {strict government rule} businesses follow reduces {business growth}.",
    },
    top: [
      {
        t: "High Corporate Taxes",
        r: "The government taxes businesses at 50% to fund amazing public parks.",
        p: "The businesses simply move to a different country, taking thousands of jobs with them.",
      },
      {
        t: "Strict Labor Laws",
        r: "A law says you can never fire an employee, even if they are terrible.",
        p: "Companies become terrified to hire anyone new, causing youth unemployment to skyrocket.",
      },
      {
        t: "Heavy Business Licensing",
        r: "It takes 3 years of paperwork to legally open a hair salon.",
        p: "Ambitious people give up, and the town's economy stagnates completely.",
      },
    ],
  },
  {
    id: "material_collective_synergy",
    title: "Prosperous economies and strong societies build each other",
    poles: ["Wealth & Economy", "Society & Laws"],
    hook: {
      name: "The Nordic Loop",
      analogy:
        "Think of pumping up a bicycle tire. The strong rubber tire holds the air inside, and the high-pressure air makes the tire roll incredibly fast. They need each other perfectly.",
    },
    core: {
      name: "The Tax-to-Genius Pipeline",
      analogy:
        "A country taxes its rich companies (Society & Laws). It uses that money to build the best free universities in the world. Those schools produce genius engineers. Those engineers start trillion-dollar AI companies, generating even MORE tax money (Wealth & Economy).",
      exp: "Taxes aren't a punishment; they are an investment. Strong societies build smart workers who build rich economies.",
    },
    det: {
      q1: "How do the high taxes build up the citizens into super-workers?",
      q2: "How do those super-workers make the country unimaginably rich?",
      t: "A country that uses {tax money} to fund society produces educated workers who build a better {booming economy}.",
    },
    top: [
      {
        t: "Scandinavian Welfare Models",
        r: "Citizens pay high taxes for guaranteed childcare and free university.",
        p: "This creates a fearless, highly-skilled workforce that launches massively profitable global startups.",
      },
      {
        t: "Public Infrastructure",
        r: "The government spends billions building a flawless high-speed rail network.",
        p: "Businesses boom because workers and goods can travel across the country in minutes.",
      },
      {
        t: "Universal Healthcare",
        r: "The state pays for every citizen's medical bills.",
        p: "Workers never go bankrupt from getting sick, meaning they keep spending money and boosting the economy.",
      },
    ],
  },
  {
    id: "material_preservation_causal_neg",
    title: "Economic development destroys traditional culture",
    poles: ["Wealth & Economy", "Tradition & History"],
    hook: {
      name: "The Sell-Out Trap",
      analogy:
        "A quiet, lovely family diner gets famous on TikTok. Suddenly, investors buy it, cover it in neon lights, and serve cheap, frozen burgers to huge crowds. The diner made a million dollars, but lost its soul.",
    },
    core: {
      name: "The Plastic Souvenir Example",
      analogy:
        "A sacred indigenous ritual is discovered by a travel agency. Soon, the tribe is forced to perform the 'sacred' dance 8 times a day in a hotel lobby while tourists eat hot dogs (Wealth & Economy). The culture wasn't saved; it was turned into a clown show (Tradition & History).",
      exp: "When money flows into a community, it corrupts what people value. Commercialization replaces deep meaning with cheap performance.",
    },
    det: {
      q1: "What sacred, slow tradition was turned into a product?",
      q2: "How did the pursuit of mass profit completely ruin its true meaning?",
      t: "When {massive global money} flows in, it changes what people value, causing {authentic local culture} to rarely survive intact.",
    },
    top: [
      {
        t: "Mass Heritage Tourism",
        r: "Venice makes billions showing off its historic canals to cruise ships.",
        p: "Locals can't afford rent, turning the city into an empty museum with no real community life.",
      },
      {
        t: "Commercial Artisan Goods",
        r: "A tribe sells woven blankets to global fashion brands for massive cash.",
        p: "To meet demand, they use cheap synthetic thread. The 'traditional' blanket becomes a factory lie.",
      },
      {
        t: "Gentrification",
        r: "Rich developers buy up an old, culturally vibrant neighborhood.",
        p: "They tear down the historic music venues to build boring, generic luxury apartments.",
      },
    ],
  },
  {
    id: "progress_collective_instrument",
    title: "Technology makes government more effective",
    poles: ["Innovation & Tech", "Society & Laws"],
    hook: {
      name: "The Turbo Bureaucracy",
      analogy:
        "Waiting in line to renew your passport used to take 6 agonizing hours in a miserable, hot building. Then, they built an app. Now you take a selfie, click a button, and it's done in 6 seconds. The machine fixed the bureaucracy.",
    },
    core: {
      name: "The Digital State Example",
      analogy:
        "People love to complain that the government is slow. But when the government adopts artificial intelligence, massive databases, and digital apps (Innovation & Tech), they can suddenly track diseases, catch criminals, and distribute welfare instantly (Society & Laws).",
      exp: "Technology isn't just for making billionaires richer; it is the ultimate tool to make the government actually work for the people.",
    },
    det: {
      q1: "What extremely slow, annoying government task existed?",
      q2: "How did a brilliant new piece of code make it happen instantly?",
      t: "{Digital technology} allows {the government} to deliver services and coordinate responses faster.",
    },
    top: [
      {
        t: "Digital Voting",
        r: "Citizens use secure blockchain tech to vote from their smartphones on the couch.",
        p: "Voter turnout skyrockets to 90%, creating a wildly more accurate and powerful democracy.",
      },
      {
        t: "Smart Traffic Lights",
        r: "AI cameras watch city streets and adjust traffic lights in real-time.",
        p: "Ambulances get through instantly, saving lives, and the city's overall pollution plummets.",
      },
      {
        t: "AI Disaster Response",
        r: "The government uses satellite AI mapping immediately after a hurricane.",
        p: "Rescue helicopters are sent perfectly to the exact flooded houses, saving thousands of hours.",
      },
    ],
  },
  {
    id: "sustainable_individual_spillover",
    title: "Environmental damage harms individuals who had no part in causing it",
    poles: ["Environment & Future", "Personal Freedom"],
    hook: {
      name: "The Innocent Bystander",
      analogy:
        "Your brother makes a massive, sticky mess in the kitchen. But your mom comes home and yells at YOU to clean it up. You did absolutely nothing wrong, but you are paying the price for his disaster.",
    },
    core: {
      name: "The Downstream Death Trap",
      analogy:
        "A massive factory makes millions of dollars selling chemicals. They secretly dump the toxic waste into the river (Environment & Future). Ten miles downstream, a poor village of farmers who have never even seen the factory all get cancer from drinking the water (Personal Freedom).",
      exp: "Pollution doesn't stay where it is made. The people who profit from destroying the earth are rarely the ones who choke on the smoke.",
    },
    det: {
      q1: "Who made the massive toxic mess for profit?",
      q2: "Who is completely innocent but paying the ultimate, deadly price?",
      t: "{Toxic pollution} flows downstream, harming {Regular people} who had no part in decisions others made.",
    },
    top: [
      {
        t: "Industrial Pollution",
        r: "A mega-corporation builds a cheap, dirty oil refinery.",
        p: "The poor neighborhood next door suffers from skyrocketing asthma rates in their children.",
      },
      {
        t: "Climate Change & Island Nations",
        r: "Rich western countries burn billions of tons of coal to power luxury lifestyles.",
        p: "A tiny Pacific island nation that burns zero coal is completely swallowed by the rising ocean.",
      },
      {
        t: "Microplastics in Food",
        r: "Shipping companies dump millions of plastic nets into the sea to save money.",
        p: "The plastic breaks down and enters the bloodstream of a completely innocent consumer eating fish.",
      },
    ],
  },
  {
    id: "collective_individual_blocking",
    title: "Too much collective control destroys individual autonomy",
    poles: ["Society & Laws", "Personal Freedom"],
    hook: {
      name: "The Bubble Wrap Trap",
      analogy:
        "Helicopter parents track your phone 24/7, pick your clothes, and lock your door at 7 PM. You are perfectly, 100% safe from the world. But you have no friends and no life. You are perfectly trapped.",
    },
    core: {
      name: "The Nanny State Example",
      analogy:
        "The government decides sugary soda is bad for your health (Society & Laws). So, they ban all soda, tax fast food at 50%, and arrest anyone drinking cola. Society might be healthier, but adult humans are now treated like babies who cannot make choices (Personal Freedom).",
      exp: "When a community dictates too many choices in the name of 'safety', control justified by the common good quickly becomes oppression.",
    },
    det: {
      q1: "What 'good deed' is the government forcing on everyone?",
      q2: "What basic, dignified human freedom is crushed to achieve it?",
      t: "When {the government} dictates too many choices, {Regular people} lose the ability to direct their own lives.",
    },
    top: [
      {
        t: "Junk Food Bans",
        r: "The government successfully lowers the nation's diabetes rate.",
        p: "Adult citizens are stripped of the basic right to choose what they put into their own bodies.",
      },
      {
        t: "Internet Surveillance",
        r: "The state scans everyone's private messages to catch criminals.",
        p: "Every single innocent citizen loses their right to privacy and lives in constant fear.",
      },
      {
        t: "Mandatory Curfews",
        r: "Crime drops to zero because everyone is forced inside by 8 PM.",
        p: "The vibrant culture, nightlife, and freedom of the city are completely destroyed.",
      },
    ],
  },
  {
    id: "material_preservation_tradeoff",
    title: "Communities choose between economic growth and cultural identity",
    poles: ["Wealth & Economy", "Tradition & History"],
    hook: {
      name: "The Golden Bulldozer",
      analogy:
        "Your favorite weird, dusty local comic book store gets bought by a billionaire. He turns it into a shiny, perfectly clean Starbucks. The coffee is faster, but the magic of the neighborhood is completely dead.",
    },
    core: {
      name: "The Global Paving Example",
      analogy:
        "A massive multinational resort offers to build a luxury hotel on a tiny island. They will bring 1,000 jobs and millions in cash (Wealth & Economy). But to build it, they must pave over the island's most sacred, ancient temple (Tradition & History).",
      exp: "Development brings jobs and income, but violently replaces local practices with generic global ones. You cannot have both.",
    },
    det: {
      q1: "What massive pile of money is being offered to the town?",
      q2: "What unique, ancient local identity must be bulldozed to get it?",
      t: "Development brings {massive global money} but violently replaces {unique local culture} with global ones.",
    },
    top: [
      {
        t: "Multinational Corporations",
        r: "A giant global supermarket opens in a small village, offering incredibly cheap food.",
        p: "All 20 of the historic, family-owned local markets are driven into bankruptcy in a month.",
      },
      {
        t: "Globalized Architecture",
        r: "A historic European city allows developers to build massive glass skyscrapers to attract banks.",
        p: "The city's unique 500-year-old skyline is ruined, looking exactly like every other city on earth.",
      },
      {
        t: "Foreign Investment in Land",
        r: "Rich foreign investors buy up all the local farms to grow cash crops for export.",
        p: "The traditional local diet and farming methods are completely wiped out.",
      },
    ],
  },
  {
    id: "material_collective_feedback_neg",
    title: "Wealth and political power reinforce each other",
    poles: ["Wealth & Economy", "Society & Laws"],
    hook: {
      name: "The Oligarch Loop",
      analogy:
        "The richest kid in school buys the principal a brand new sports car. Amazingly, the principal suddenly lets that kid skip all his classes and gives him straight A's. The money bought the rules.",
    },
    core: {
      name: "The Legal Bribe Example",
      analogy:
        "A billionaire makes a fortune (Wealth & Economy). He uses that cash to legally donate millions to a politician. The politician gets elected and passes a new law that cuts taxes for billionaires (Society & Laws). The billionaire gets even richer. The gap widens.",
      exp: "Economic winners use their resources to shape policy in their favor. Favorable policy helps them win more.",
    },
    det: {
      q1: "How did the massive wealth legally buy the political rules?",
      q2: "How did those rigged rules generate even more wealth for the rich?",
      t: "{Billionaires} use resources to shape {tax money}, widening the gap between rich and poor.",
    },
    top: [
      {
        t: "Corporate Lobbying",
        r: "An oil company spends millions hiring lawyers to meet with politicians.",
        p: "The politicians quietly pass a law making it perfectly legal for that company to pollute the river.",
      },
      {
        t: "Tax Loopholes",
        r: "Ultra-rich individuals hire the smartest accountants on earth.",
        p: "They manipulate the legal tax code so they pay a lower tax rate than a school teacher.",
      },
      {
        t: "Campaign Finance",
        r: "A tech monopoly funds the campaigns of local judges.",
        p: "When the monopoly gets sued for breaking the law, the judges miraculously rule in their favor.",
      },
    ],
  },
  {
    id: "preservation_flourishing_tradeoff",
    title: "Cultural expectations can limit individual flourishing",
    poles: ["Tradition & History", "Mental Wellbeing"],
    hook: {
      name: "The Ancestor's Cage",
      analogy:
        "Your entire family has been doctors for four generations. They demand you become a doctor. But you pass out at the sight of blood and dream of being an artist. Their tradition is a prison for your soul.",
    },
    core: {
      name: "The Tradition Prison Example",
      analogy:
        "A brilliant young woman wants to become an engineer. But her ancient cultural tradition dictates that women must stay home, marry young, and not attend university (Tradition & History). She obeys the tradition, but lives her entire life in deep, silent depression (Mental Wellbeing).",
      exp: "Traditions that demand strict conformity can prevent individuals from discovering and living according to their own joy.",
    },
    det: {
      q1: "What ancient, strict rule is society forcing on the person?",
      q2: "What human joy or potential is being suffocated to obey the rule?",
      t: "{An old tradition} that demands conformity can prevent individuals from {living a happy life}.",
    },
    top: [
      {
        t: "Strict Gender Roles",
        r: "A society strictly enforces ancient rules about how men and women must behave to maintain order.",
        p: "Millions of individuals are crushed, unable to pursue careers or express their true identities.",
      },
      {
        t: "Arranged Marriages",
        r: "Families choose partners for their children to protect wealth and cultural bloodlines.",
        p: "Individuals are trapped in loveless, miserable marriages for 50 years to please their parents.",
      },
      {
        t: "Family Career Pressures",
        r: "A teenager is shamed into taking over the failing family business.",
        p: "They abandon their true passion for music, resulting in a lifetime of bitter resentment.",
      },
    ],
  },
  {
    id: "sustainable_progress_instrument",
    title: "Environmental limits force better innovation",
    poles: ["Environment & Future", "Innovation & Tech"],
    hook: {
      name: "The Empty Tank Catalyst",
      analogy:
        "Your favorite toy runs out of batteries, and the store is closed. You are forced to figure out a way to wire it to a tiny solar panel. If you had endless batteries, you never would have invented the solar toy.",
    },
    core: {
      name: "The Panic Invention Example",
      analogy:
        "When oil was cheap and endless, car companies were lazy. They built massive, gas-guzzling trucks. But when pollution laws hit and oil prices spiked (Environment & Future), engineers panicked and suddenly invented hyper-efficient electric vehicles (Innovation & Tech).",
      exp: "Scarcity is the mother of invention. Constraint is one of the most reliable drivers of brilliant technology.",
    },
    det: {
      q1: "What natural resource suddenly ran out or was banned?",
      q2: "What brilliant technology was invented out of pure survival panic?",
      t: "{Running out of raw materials} pushes engineers to find {brilliant inventions} they would never have looked for.",
    },
    top: [
      {
        t: "Water Scarcity",
        r: "A desert country completely runs out of fresh drinking water.",
        p: "They are forced to invent futuristic desalination plants that turn ocean water into drinking water.",
      },
      {
        t: "Land Shortages",
        r: "A massive, overcrowded city runs out of land to farm food.",
        p: "They invent high-tech vertical farming, growing massive amounts of lettuce inside skyscrapers.",
      },
      {
        t: "Carbon Limits",
        r: "Governments heavily tax factories that burn coal.",
        p: "Factories are forced to invent new machines that magically capture their own carbon smoke.",
      },
    ],
  },
  {
    id: "collective_flourishing_causal_pos",
    title: "Social connection is essential to human wellbeing",
    poles: ["Society & Laws", "Mental Wellbeing"],
    hook: {
      name: "The Infrastructure of Joy",
      analogy:
        "You are playing a massive, beautiful multiplayer video game, but you are the only player on the server. There are no enemies, no friends, no chatting. It's perfectly safe, but utterly, crushingly depressing.",
    },
    core: {
      name: "The Anti-Loneliness Engine",
      analogy:
        "Science proves that severe loneliness increases the risk of early death more than smoking 15 cigarettes a day. Public parks, community centers, and shared libraries (Society & Laws) aren't just buildings; they are physical machines designed to stop humans from dying of isolation (Mental Wellbeing).",
      exp: "We think of health as medicine. But a connected community is the most powerful medicine a society can build.",
    },
    det: {
      q1: "What shared public space or event brought people together?",
      q2: "How did it cure their modern depression and isolation?",
      t: "{Public parks and libraries} are not luxuries; they are the infrastructure that enables {human happiness}.",
    },
    top: [
      {
        t: "Public Parks",
        r: "A city spends millions to build a beautiful park in a concrete neighborhood.",
        p: "Strangers walk their dogs and talk, instantly lowering the neighborhood's severe depression rates.",
      },
      {
        t: "Community Festivals",
        r: "A town throws a massive, loud tomato-throwing festival in the street.",
        p: "Neighbors laugh together, dissolving class divides and curing the crushing isolation of winter.",
      },
      {
        t: "Free Public Libraries",
        r: "The state funds a warm, safe library with free internet.",
        p: "Elderly people gather there daily to read and chat, saving them from agonizing solitary confinement at home.",
      },
    ],
  },
  {
    id: "sustainable_individual_causal_pos",
    title: "A healthy environment directly improves individual lives",
    poles: ["Environment & Future", "Personal Freedom"],
    hook: {
      name: "The Biological Base",
      analogy:
        "Try running a marathon inside a dusty, moldy basement. You can't perform if the air you are breathing is poison. Your body physically requires a clean room to function.",
    },
    core: {
      name: "The Clean Blood Example",
      analogy:
        "We think of 'health' as eating a salad. But if the soil the salad grew in is pumped full of heavy metals, and the city tap water is poisoned with lead (Environment & Future), every individual eating that salad will eventually get sick (Personal Freedom).",
      exp: "You cannot isolate yourself from the planet. Clean air and safe water are the physical foundations of human joy.",
    },
    det: {
      q1: "What part of nature was kept perfectly clean?",
      q2: "How did that clean environment allow the human body to thrive?",
      t: "A {clean nature} affects physical health and what choices are available to {Regular people}.",
    },
    top: [
      {
        t: "Removing Lead Pipes",
        r: "A city spends billions replacing all the ancient toxic water pipes.",
        p: "The children drink clean water, and their brain development and test scores skyrocket.",
      },
      {
        t: "Urban Green Spaces",
        r: "A city plants 10,000 trees to block the smog from a highway.",
        p: "The asthma rates in the local individuals drop to zero, allowing them to finally play sports.",
      },
      {
        t: "Banning Pesticides",
        r: "A country makes it illegal to spray poison on crops.",
        p: "The farmers stop developing rare cancers, saving their lives and their families.",
      },
    ],
  },
  {
    id: "preservation_flourishing_synergy",
    title: "Cultural identity and personal wellbeing strengthen each other",
    poles: ["Tradition & History", "Mental Wellbeing"],
    hook: {
      name: "The Roots of Sanity",
      analogy:
        "You move to a massive new school where you feel totally invisible. Then, you find a club playing your home country's music. Suddenly, you feel anchored to the floor. You remember who you are.",
    },
    core: {
      name: "The Ancestral Shield Example",
      analogy:
        "A teenager faces crushing modern anxiety. But when she learns her grandmother's ancient language and stories of how her ancestors survived a war (Tradition & History), she gains a psychological shield of iron. She realizes she comes from a line of survivors (Mental Wellbeing).",
      exp: "Roots feed resilience. Knowing your deep history is a psychological necessity, not a luxury.",
    },
    det: {
      q1: "What ancient tradition or story is the person holding onto?",
      q2: "How does it give them an iron shield of psychological peace?",
      t: "Knowing {your family roots} makes individuals more confident, strengthening their {human happiness}.",
    },
    top: [
      {
        t: "Indigenous Language Revival",
        r: "A youth spends years learning a dying tribal dialect.",
        p: "They experience a profound sense of belonging that cures their modern teenage alienation.",
      },
      {
        t: "Genealogy (Family Trees)",
        r: "A person traces their DNA and historical ancestors back 400 years.",
        p: "They discover their ancestors overcame famine, giving them immense personal confidence today.",
      },
      {
        t: "Traditional Religious Rituals",
        r: "A stressed worker attends a quiet, ancient chanting service every week.",
        p: "The ritual provides a deep psychological anchor that money and modern therapy cannot buy.",
      },
    ],
  },
  {
    id: "progress_material_causal_pos",
    title: "Innovation drives economic growth",
    poles: ["Innovation & Tech", "Wealth & Economy"],
    hook: {
      name: "The New Frontier",
      analogy:
        "A kid invents a tiny app on his laptop that helps people find their keys. A million people download it for $1. He just pulled a million dollars out of thin air using only code.",
    },
    core: {
      name: "The Money Printer Example",
      analogy:
        "When the Internet was invented (Innovation & Tech), it didn't just let us send emails faster. It created entirely new industries—online shopping, streaming, social media—that generated trillions of dollars of new wealth that literally didn't exist before (Wealth & Economy).",
      exp: "Every major economic boom in history was built on a new piece of technology. Innovation prints wealth.",
    },
    det: {
      q1: "What brilliant new tool or software was invented?",
      q2: "How did it magically print new money for the global economy?",
      t: "Every major {economic explosion} in history was built on {new tools}.",
    },
    top: [
      {
        t: "Artificial Intelligence",
        r: "Programmers invent an AI that can write code and summarize documents.",
        p: "Companies adopt it, massive efficiency is gained, and profit margins skyrocket overnight.",
      },
      {
        t: "The Smartphone Economy",
        r: "Apple puts a computer and map into one glass rectangle.",
        p: "This spawns the 'gig economy' (Uber, food delivery), creating billions in new wealth.",
      },
      {
        t: "Agricultural Drones",
        r: "Engineers invent drones that perfectly water crops from the sky.",
        p: "Farmers double their harvest using half the water, massively increasing their income.",
      },
    ],
  },
  {
    id: "material_sustainable_causal_neg",
    title: "Economic growth damages the environment",
    poles: ["Wealth & Economy", "Environment & Future"],
    hook: {
      name: "The Appetite Trap",
      analogy:
        "A factory offers to pay you $1,000 a day to burn all the beautiful trees in your neighborhood. You accept. You are rich, but you live in a choking, toxic wasteland.",
    },
    core: {
      name: "The Hungry Beast Example",
      analogy:
        "A booming economy is a hungry beast. To create record profits, massive global corporations literally eat ancient forests, drain rivers, and blow up mountains to poop out smartphones and cheap fast fashion (Wealth & Economy). The earth cannot recover fast enough (Environment & Future).",
      exp: "When businesses prioritize maximum output, they violently consume the resources the planet needs to survive.",
    },
    det: {
      q1: "What massive profit is the industry frantically chasing?",
      q2: "What part of the earth is being permanently devoured to get it?",
      t: "When businesses prioritize {maximum profit}, they consume resources faster than {the earth can heal}.",
    },
    top: [
      {
        t: "Deforestation for Beef",
        r: "Massive farming corporations clear the Amazon to raise millions of cows for cheap burgers.",
        p: "The lungs of the planet are permanently destroyed for a quick quarterly profit.",
      },
      {
        t: "Fast Fashion Textile Waste",
        r: "Clothing brands pump out millions of $5 shirts to hit record sales targets.",
        p: "The unsold clothes form toxic mountains in deserts, poisoning the groundwater for centuries.",
      },
      {
        t: "Industrial Mining",
        r: "Tech companies demand rare earth metals for new computer chips.",
        p: "Mining corporations strip entire mountains bare, dumping radioactive sludge into local rivers.",
      },
    ],
  },
  {
    id: "material_sustainable_instrument",
    title: "Economic growth funds environmental protection",
    poles: ["Wealth & Economy", "Environment & Future"],
    hook: {
      name: "The Luxury Green Reality",
      analogy:
        "You desperately want to buy solar panels for your house, but you're broke. You are forced to burn cheap, dirty firewood just to survive the freezing winter. Purity is a luxury.",
    },
    core: {
      name: "The Expensive Shield Example",
      analogy:
        "A poor nation can't afford to care about the ozone layer when its citizens are starving. Only rich, highly developed nations (Wealth & Economy) have the excess tax money required to build billion-dollar wind farms and enforce strict environmental laws (Environment & Future).",
      exp: "Poverty makes sustainability harder, not easier. You need a wealthy economy to afford clean technology.",
    },
    det: {
      q1: "What massive pile of cash did the country successfully earn?",
      q2: "How was that cash spent to protect and heal nature?",
      t: "{Economic wealth} allows countries to afford cleaner technology and {fixing the environment}.",
    },
    top: [
      {
        t: "Subsidizing Renewable Energy",
        r: "A rich Western nation taxes its booming tech sector.",
        p: "They use the billions to pay for expensive early solar panels until they become cheap for everyone.",
      },
      {
        t: "Eco-Friendly City Planning",
        r: "A wealthy city generates massive property taxes.",
        p: "They use the cash to tear up concrete and plant 100,000 trees to naturally cool the streets.",
      },
      {
        t: "National Recycling Programs",
        r: "A thriving economy builds a high-tech waste management system.",
        p: "It costs a fortune to run, but perfectly sorts and recycles 90% of the country's plastic.",
      },
    ],
  },
  {
    id: "material_sustainable_blocking",
    title: "Short-term profit logic makes sustainability impossible",
    poles: ["Wealth & Economy", "Environment & Future"],
    hook: {
      name: "The Three-Month Blindness",
      analogy:
        "You get $50 for the month. You spend it all on day one on candy. You feel like a king today, but starve for the next 29 days. You traded the future for a sugar rush.",
    },
    core: {
      name: "The CEO Bonus Example",
      analogy:
        "A CEO gets a massive $10 million bonus if the company's profits go up this year (Wealth & Economy). He will be fired if profits drop. Therefore, he legally ignores the fact that his factory will completely destroy the local river in 20 years (Environment & Future).",
      exp: "The capitalist incentive structure works against long-term thinking by design. Quarterly profits always beat 50-year timelines.",
    },
    det: {
      q1: "Who gets the shiny bonus check today?",
      q2: "What toxic disaster is pushed into the future?",
      t: "Businesses chasing {quick cash} cannot plan for {protecting the future}.",
    },
    top: [
      {
        t: "Oil Companies Hiding Data",
        r: "Fossil fuel executives hid climate change data in the 1980s to keep stock prices high.",
        p: "They made billions, leaving the younger generation to deal with the apocalyptic fallout.",
      },
      {
        t: "Overfishing the Oceans",
        r: "Fishing fleets scoop up millions of tuna to hit their yearly sales targets.",
        p: "They wipe out the breeding population, guaranteeing the ocean will be dead in a decade.",
      },
      {
        t: "Single-Use Plastics",
        r: "Soda companies use cheap plastic bottles because glass costs 2 cents more to ship.",
        p: "They maximize quarterly profit, but doom the oceans to 1,000 years of microplastic pollution.",
      },
    ],
  },
  {
    id: "individual_collective_tradeoff",
    title: "Individual freedom and collective welfare pull against each other",
    poles: ["Personal Freedom", "Society & Laws"],
    hook: {
      name: "The Zero-Sum Liberty",
      analogy:
        "You want to play your guitar at maximum volume at 3 AM. It makes you feel incredibly happy and free. But it ruins the sleep of 50 neighbors in your apartment building.",
    },
    core: {
      name: "The Tug-of-War Example",
      analogy:
        "Your freedom to drive a car 100 mph (Personal Freedom) ends exactly where my physical safety begins (Society & Laws). Rules that protect everyone must restrict someone. Society is a constant, unresolvable tug-of-war between 'me' and 'us'.",
      exp: "Freedoms that benefit individuals often impose costs on others. This tension never fully resolves—it only gets managed.",
    },
    det: {
      q1: "What selfish freedom does the individual desperately want?",
      q2: "What damage does that freedom cause to the rest of the group?",
      t: "Rules that protect {public safety} restrict {personal independence}. This tension never fully resolves.",
    },
    top: [
      {
        t: "Refusing Vaccinations",
        r: "A citizen demands the absolute bodily freedom to refuse a vaccine.",
        p: "Their freedom allows a deadly virus to spread, threatening the weak and elderly in the community.",
      },
      {
        t: "Gun Control Laws",
        r: "Individuals demand the right to own military-grade weapons for personal defense.",
        p: "The society suffers from skyrocketing rates of mass violence and collective fear.",
      },
      {
        t: "Loud Noise Complaints",
        r: "A nightclub owner demands the freedom to blast music all night for profit.",
        p: "The entire neighborhood suffers from severe sleep deprivation and stress.",
      },
    ],
  },
  {
    id: "flourishing_progress_instrument",
    title: "Happier people produce better innovation",
    poles: ["Mental Wellbeing", "Innovation & Tech"],
    hook: {
      name: "The Safe Genius",
      analogy:
        "Try to solve a complex puzzle while a timer loudly ticks and someone screams at you. You freeze up. But if you sit in a quiet room with a cup of tea, you solve it instantly.",
    },
    core: {
      name: "The Ping-Pong Example",
      analogy:
        "Google gives its engineers free food, nap pods, and ping-pong tables (Mental Wellbeing). Why? Because a relaxed, happy human brain invents the future better than a terrified one. Stressed workers make mistakes; safe workers invent AI (Innovation & Tech).",
      exp: "People who feel safe and valued think more creatively than people running on stress and fear.",
    },
    det: {
      q1: "How is the person's mental health being fiercely protected?",
      q2: "What brilliant breakthrough did that relaxed mind invent?",
      t: "{Happy, rested workers} who feel safe think more creatively and produce {brilliant technology}.",
    },
    top: [
      {
        t: "Four-Day Work Weeks",
        r: "A tech company lets employees take Fridays off to rest and recharge.",
        p: "The rested employees come back Monday and invent a brilliant product that makes billions.",
      },
      {
        t: "Universal Basic Income",
        r: "Citizens receive enough money to survive without working a terrible job.",
        p: "Freed from panic, thousands of people use their time to invent new art, apps, and businesses.",
      },
      {
        t: "Psychological Safety in Teams",
        r: "A boss encourages employees to fail without punishing them.",
        p: "The fearless team takes massive creative risks, resulting in a world-changing patent.",
      },
    ],
  },
  {
    id: "progress_collective_blocking",
    title: "Technology makes collective governance harder",
    poles: ["Innovation & Tech", "Society & Laws"],
    hook: {
      name: "The Speed Limit Break",
      analogy:
        "A teacher tries to ban note-passing in class, but the kids are all secretly texting each other on their Apple Watches. The teacher's rules are useless against the new tech.",
    },
    core: {
      name: "The Tortoise and the Rocket",
      analogy:
        "Artificial Intelligence and cryptocurrency move at the speed of light across global borders (Innovation & Tech). But government laws take 5 years to write and only work inside one country (Society & Laws). The state is a slow tortoise chasing a rocket ship.",
      exp: "When information spreads faster than institutions can process it, traditional governance loses its grip.",
    },
    det: {
      q1: "What lightning-fast technology was just unleashed?",
      q2: "Why is the slow government totally powerless to stop or regulate it?",
      t: "When {new tools} move faster than institutions can process them, {the government} loses its grip.",
    },
    top: [
      {
        t: "Cryptocurrency",
        r: "Hackers invent digital, untraceable money that crosses borders instantly.",
        p: "Governments completely lose the ability to track taxes or stop illegal drug trades.",
      },
      {
        t: "Deepfakes and Elections",
        r: "AI generates hyper-realistic fake videos of politicians saying terrible things.",
        p: "The fake video spreads to millions in seconds, destroying an election before the state can debunk it.",
      },
      {
        t: "3D Printed Weapons",
        r: "Anyone can download a file and print a plastic gun in their bedroom.",
        p: "Traditional police laws about buying and registering firearms become instantly obsolete.",
      },
    ],
  },
  {
    id: "material_preservation_instrument_pos",
    title: "Economic value gives traditions a reason to survive",
    poles: ["Wealth & Economy", "Tradition & History"],
    hook: {
      name: "The Golden Shield",
      analogy:
        "A gorgeous 800-year-old castle is crumbling because the locals are broke. They decide to start charging tourists $10 for a tour. Suddenly, they make enough money to fix the roof. Capitalism saved the castle.",
    },
    core: {
      name: "The Ticket Example",
      analogy:
        "If a traditional tribal dance doesn't pay rent, the youth abandon it to work in a city. But if rich tourists pay top dollar to watch it (Wealth & Economy), the youth will stay, learn the dance, and the culture survives (Tradition & History).",
      exp: "Money is a crude but effective preservation tool. Crafts and practices that generate income get maintained.",
    },
    det: {
      q1: "How did this dying tradition become a massive money-maker?",
      q2: "How did that cash save it from extinction?",
      t: "Crafts and practices that generate {making money} get {kept alive}. Money is a preservation tool.",
    },
    top: [
      {
        t: "Eco-Tourism",
        r: "A tribe realizes rich tourists will pay $500 to see wild gorillas.",
        p: "The tribe fiercely protects the jungle from poachers to keep their business alive.",
      },
      {
        t: "Premium Artisan Crafts",
        r: "A grandmother sells her handmade tribal blankets to a luxury brand.",
        p: "Because she makes a fortune, her grandchildren eagerly beg to learn the ancient weaving skills.",
      },
      {
        t: "Heritage Architecture",
        r: "A developer buys a crumbling historic brick factory.",
        p: "They spend millions restoring it because 'vintage lofts' sell for triple the price.",
      },
    ],
  },
  {
    id: "preservation_material_instrument",
    title: "Cultural heritage drives economic activity",
    poles: ["Tradition & History", "Wealth & Economy"],
    hook: {
      name: "The Heritage Goldmine",
      analogy:
        "A boring town has zero economy. But they happen to have an ancient 500-year-old recipe for stinky cheese. Tourists flock there to try it, and the town becomes incredibly rich.",
    },
    core: {
      name: "The Tourist Magnet Example",
      analogy:
        "Ancient ruins, unique local foods, and weird traditional festivals (Tradition & History) aren't just nice to look at; they are massive magnets that pull billions of global tourist dollars into a local economy (Wealth & Economy).",
      exp: "Preserving culture is also preserving an economic asset. History literally pays the bills.",
    },
    det: {
      q1: "What ancient, dusty piece of history does the town own?",
      q2: "How does it act like a massive magnet for tourist cash?",
      t: "{Knowing your roots} generates significant {massive global money} for communities.",
    },
    top: [
      {
        t: "Heritage Tourism",
        r: "The city of Kyoto meticulously preserves its ancient wooden temples.",
        p: "Millions of global tourists fly there, injecting billions of dollars into the local hotels and shops.",
      },
      {
        t: "Traditional Food Festivals",
        r: "A region in Italy holds a massive, ancient truffle-hunting festival.",
        p: "Foodies from around the world arrive, driving the local economy for the entire year.",
      },
      {
        t: "Historical Film Locations",
        r: "A town preserves its medieval streets perfectly.",
        p: "Hollywood studios pay millions to film movies there, hiring hundreds of local workers.",
      },
    ],
  },
  {
    id: "progress_flourishing_causal_neg",
    title: "Technology harms human wellbeing",
    poles: ["Innovation & Tech", "Mental Wellbeing"],
    hook: {
      name: "The Digital Ghost",
      analogy:
        "Imagine having a superpower that lets you hear the thoughts of everyone on earth, but you can never turn it off. It would slowly drive you crazy. That's exactly what a smartphone is.",
    },
    core: {
      name: "The Always-On Example",
      analogy:
        "We invented screens that connect us to the globe (Innovation & Tech). But because we are living faster, always online, and constantly comparing ourselves to fake, filtered photos, teenagers are suffering from record-high anxiety and depression (Mental Wellbeing).",
      exp: "Technology makes our lives vastly more convenient, but it is slowly crushing the human spirit with distraction and comparison.",
    },
    det: {
      q1: "What futuristic convenience did we happily adopt?",
      q2: "How did it secretly cause deep anxiety and sadness?",
      t: "{Digital technology} makes people anxious and distracted, harming their {human happiness}.",
    },
    top: [
      {
        t: "Social Media",
        r: "Apps connect us to friends and infinite entertaining videos instantly.",
        p: "The constant comparison to fake, perfect lives causes skyrocketing rates of teen depression.",
      },
      {
        t: "24/7 Email Access",
        r: "We can check our work messages from anywhere in the world.",
        p: "The boundary between home and the office is destroyed, leading to chronic adult burnout.",
      },
      {
        t: "Algorithmic Feeds",
        r: "AI perfectly learns what we want to watch and feeds it to us.",
        p: "We become physically addicted to our screens, losing our ability to focus on real life.",
      },
    ],
  },
  {
    id: "individual_collective_synergy",
    title: "Strong individuals build strong communities",
    poles: ["Personal Freedom", "Society & Laws"],
    hook: {
      name: "The Hero's Output",
      analogy:
        "You work out just to get huge muscles for your own ego. But one day, a tree falls on your neighbor's car, and you use your huge muscles to lift it off. Your selfish strength accidentally saved the group.",
    },
    core: {
      name: "The Ambition Example",
      analogy:
        "When a person studies obsessively for 10 years to become a genius engineer (Personal Freedom), they do it for their own pride. But they end up building a brilliant bridge that saves the whole city from a flood (Society & Laws).",
      exp: "Individual capability becomes collective strength when it is needed most. We need strong individuals to protect the group.",
    },
    det: {
      q1: "What selfish, driven ambition did the person have?",
      q2: "How did that personal skill accidentally save the community?",
      t: "{individual success} driven by personal ambition becomes {a functioning society}.",
    },
    top: [
      {
        t: "Doctors in Pandemics",
        r: "A student aggressively competes to become the top surgeon to get rich.",
        p: "When a virus hits, their elite skills are exactly what saves thousands of lives in the local hospital.",
      },
      {
        t: "Brilliant Entrepreneurs",
        r: "A woman ruthlessly builds a massive tech company to prove her doubters wrong.",
        p: "Her company ends up employing 5,000 locals, single-handedly fixing the town's poverty crisis.",
      },
      {
        t: "Leadership Skills",
        r: "A person develops fierce public speaking skills to climb the corporate ladder.",
        p: "During a local natural disaster, they use those exact skills to organize the chaotic rescue effort.",
      },
    ],
  },
  {
    id: "collective_progress_tradeoff",
    title: "Government regulation slows innovation",
    poles: ["Society & Laws", "Innovation & Tech"],
    hook: {
      name: "The Red Tape Anchor",
      analogy:
        "You build a super-fast go-kart. But your mom makes you wear 3 helmets, heavy knee pads, and puts a strict speed limit of 2 mph on it. You are safe, but the kart is ruined.",
    },
    core: {
      name: "The Waiting Room Example",
      analogy:
        "To cure a deadly disease, scientists want to test a brilliant new AI drug (Innovation & Tech). But the government demands 10 years of safety paperwork and trials before they allow it (Society & Laws). The drug is safe, but thousands die waiting.",
      exp: "Rules designed to prevent harm also prevent experiments. The same oversight that protects us delays massive breakthroughs.",
    },
    det: {
      q1: "What ultra-strict safety rule is the government demanding?",
      q2: "What brilliant, life-saving invention is stuck in the waiting room?",
      t: "Every {strict government rule} designed to prevent harm delays the development of beneficial {brilliant technology}.",
    },
    top: [
      {
        t: "FDA Drug Approvals",
        r: "The government ensures no toxic medicines ever reach the public.",
        p: "A miraculous cure for cancer is delayed for 15 years in bureaucratic paperwork.",
      },
      {
        t: "Banning Drone Deliveries",
        r: "The city bans flying drones to protect airspace safety and privacy.",
        p: "A brilliant system for delivering emergency blood to hospitals in minutes is made illegal.",
      },
      {
        t: "Heavy Regulations on AI",
        r: "The state demands complex safety audits for any new AI software.",
        p: "Small startup geniuses go bankrupt, and innovation freezes completely.",
      },
    ],
  },
  {
    id: "collective_progress_synergy",
    title: "Public investment and private innovation build each other",
    poles: ["Society & Laws", "Innovation & Tech"],
    hook: {
      name: "The Relay Race",
      analogy:
        "The government builds a massive, perfectly smooth race track. Private companies build the lightning-fast, flashy race cars to drive on it. They need each other to race.",
    },
    core: {
      name: "The Tax-Funded Genius Example",
      analogy:
        "The government (Society & Laws) spent 40 years of tax money inventing the basic, boring Internet and GPS satellites. Then, private billionaires (Innovation & Tech) took that foundation and built Facebook, Uber, and Google.",
      exp: "Government funds the risky early research that takes decades. Private companies commercialize the results. Both sides get rich.",
    },
    det: {
      q1: "What 'boring' foundational science did the government pay for?",
      q2: "What flashy product did a private genius build on top of it?",
      t: "{the government} funds the risky early research; private {brilliant inventions} commercializes it.",
    },
    top: [
      {
        t: "NASA and SpaceX",
        r: "NASA spent 60 years doing the dangerous, unprofitable math of space travel.",
        p: "SpaceX uses that exact math to build reusable rockets and make billions.",
      },
      {
        t: "University Medical Research",
        r: "State-funded universities spend decades mapping human DNA.",
        p: "Private pharmaceutical companies use that free map to invent and sell blockbuster drugs.",
      },
      {
        t: "Military GPS",
        r: "The military launches billions of dollars of satellites into space.",
        p: "Uber uses those free satellites to build a massive global taxi empire.",
      },
    ],
  },
  {
    id: "collective_material_instrument",
    title: "Public investment drives economic growth",
    poles: ["Society & Laws", "Wealth & Economy"],
    hook: {
      name: "The Invisible Foundation",
      analogy:
        "Try to run a hyper-successful online business in a country with no power grid, no internet cables, and no courts to stop thieves. You fail instantly. You need the state.",
    },
    core: {
      name: "The Free Ride Example",
      analogy:
        "A massive corporation brags about making billions of dollars entirely 'on their own'. But they only succeeded because the state built the highways their delivery trucks drive on and educated their workers (Society & Laws).",
      exp: "Roads, education, and stable governance are what businesses depend on. The private sector grows on a foundation the government builds.",
    },
    det: {
      q1: "What invisible public system is doing all the heavy lifting?",
      q2: "What private company is getting rich standing on top of it?",
      t: "The private sector's {business growth} depends entirely on a foundation {the government} builds.",
    },
    top: [
      {
        t: "Public Transit Hubs",
        r: "The city spends billions to build a massive subway station.",
        p: "Private cafes and shops open next door and make millions from the foot traffic.",
      },
      {
        t: "Public Schools",
        r: "Taxpayers fund free K-12 education for millions of children.",
        p: "Tech companies get a massive, free pool of highly skilled workers they didn't have to train.",
      },
      {
        t: "Legal Systems",
        r: "The state funds police and judges to enforce contracts.",
        p: "Businesses confidently invest millions knowing no one can steal their property.",
      },
    ],
  },
  {
    id: "progress_preservation_instrument_pos",
    title: "Technology can preserve and revive cultural heritage",
    poles: ["Innovation & Tech", "Tradition & History"],
    hook: {
      name: "The Digital Museum",
      analogy:
        "Your grandmother's ancient soup recipe is fading from her memory. You pull out your 4K smartphone and record a video of her making it. The future just saved the past.",
    },
    core: {
      name: "The Freezing Time Example",
      analogy:
        "People think computers destroy history. But today, linguists use AI and advanced audio recording (Innovation & Tech) to capture dying indigenous languages, freezing them perfectly forever (Tradition & History).",
      exp: "Digital archives, language apps, and online communities allow traditions to survive in ways that would have been impossible without modern tools.",
    },
    det: {
      q1: "What ultra-modern tool is being used?",
      q2: "What fragile, ancient thing is being saved from extinction?",
      t: "{new tools} allow {ancient cultures} to survive and spread in impossible ways.",
    },
    top: [
      {
        t: "3D Printing Antiques",
        r: "A museum uses lasers to scan a crumbling ancient statue.",
        p: "They 3D print an exact replica so the original can be locked in a vault, perfectly preserved.",
      },
      {
        t: "Language Apps (Duolingo)",
        r: "Programmers build highly addictive, gamified smartphone apps.",
        p: "Millions of people use the tech to learn endangered languages like Welsh, saving them from death.",
      },
      {
        t: "VR Historical Tours",
        r: "Students put on modern VR headsets in their classroom.",
        p: "They are transported to walk through ancient Rome exactly as it looked 2,000 years ago.",
      },
    ],
  },
  {
    id: "individual_sustainable_insufficient",
    title: "Individual action alone cannot solve environmental problems",
    poles: ["Personal Freedom", "Environment & Future"],
    hook: {
      name: "The Drop in the Ocean",
      analogy:
        "You spend $10 on a metal straw to save the turtles. Meanwhile, a giant oil company dumps 50,000 gallons of toxic waste into the ocean while you sleep. Your virtue is useless.",
    },
    core: {
      name: "The Scale Shift Example",
      analogy:
        "The concept of a 'carbon footprint' was popularized by BP (an oil company) to make you feel guilty for driving to work. Why? So you ignore the fact that just 100 mega-corporations produce 71% of all global emissions.",
      exp: "The math doesn't work. Personal choices operate at a scale too small to address industrial-level damage. Systemic problems need systemic solutions.",
    },
    det: {
      q1: "Does this individual action actually fix the massive mathematical problem?",
      q2: "Is the person trapped by a massive toxic system anyway?",
      t: "While {personal choices} are nice, they operate at a scale too small to fix {Toxic pollution}.",
    },
    top: [
      {
        t: "Recycling Plastics",
        r: "Consumers meticulously wash and separate their plastics.",
        p: "The infrastructure is broken, and most of it is dumped in the ocean anyway by the corporations.",
      },
      {
        t: "Green Consumerism",
        r: "A shopper chooses to buy an organic, locally sourced apple.",
        p: "That apple costs triple the price. Sustainability becomes a luxury only the rich can afford.",
      },
      {
        t: "Biking to Work",
        r: "You ride a bike to stop pollution.",
        p: "You are run off the road because the city refuses to build safe bike lanes.",
      },
    ],
  },
  {
    id: "individual_sustainable_causal_neg",
    title: "Individual consumption choices damage the environment",
    poles: ["Personal Freedom", "Environment & Future"],
    hook: {
      name: "The Avalanche Trap",
      analogy:
        "One kid drops a piece of gum. No big deal. But 1,000 kids drop gum, and the school is ruined. Tiny choices create massive destruction.",
    },
    core: {
      name: "The One Drop Example",
      analogy:
        "You buy one cheap plastic toy from an online store. It seems harmless. But when 50 million people make that exact same 'harmless' individual choice (Personal Freedom), factories pump out enough toxic smoke to alter the global climate (Environment & Future).",
      exp: "Billions of small decisions—what to eat, how to travel, what to buy—add up to enormous environmental impact. Individual behavior is not trivial at scale.",
    },
    det: {
      q1: "What tiny, innocent-looking choice is one person making?",
      q2: "What happens when 50 million people do it at the exact same time?",
      t: "Billions of small {personal choices} add up to enormous {global destruction}.",
    },
    top: [
      {
        t: "Meat Consumption",
        r: "A person decides they want a cheap hamburger for lunch.",
        p: "Multiplied by millions, the meat industry clears entire rainforests just to feed the cows.",
      },
      {
        t: "Fast Fashion",
        r: "You buy a cheap shirt to wear once to a party.",
        p: "The global demand for disposable clothes creates mountains of toxic textile waste in poor countries.",
      },
      {
        t: "Next-Day Delivery",
        r: "You click 'one-day shipping' for convenience.",
        p: "Millions of half-empty delivery trucks flood the roads, massively spiking global carbon emissions.",
      },
    ],
  },
  {
    id: "material_collective_instrument",
    title: "Economic growth funds public services",
    poles: ["Wealth & Economy", "Society & Laws"],
    hook: {
      name: "The Empty Tip Jar",
      analogy:
        "You want to build a cool clubhouse for your friends, but wood costs $50. If you are all totally broke, it's not getting built. Dreams require cash.",
    },
    core: {
      name: "The Utopia Bill Example",
      analogy:
        "Politicians promise free healthcare, beautiful parks, and amazing schools (Society & Laws). But those things are incredibly expensive. If a country's businesses are failing and no one is making money (Wealth & Economy), the government has no tax money to build anything.",
      exp: "You cannot fund a utopia with an empty wallet. A productive economy is what makes collective investment possible in the first place.",
    },
    det: {
      q1: "What beautiful public service is being promised?",
      q2: "What massive economic engine is required to actually pay for it?",
      t: "{Public services} like schools and hospitals require tax revenue from {a strong economy}.",
    },
    top: [
      {
        t: "Universal Healthcare",
        r: "A government promises free, world-class hospitals for every citizen.",
        p: "It completely fails because the national economy is too weak to generate the necessary tax revenue.",
      },
      {
        t: "Welfare Programs",
        r: "Politicians vow to end poverty by handing out monthly checks.",
        p: "The program bankrupts the country because they taxed businesses so hard that all the factories closed.",
      },
      {
        t: "Green Infrastructure",
        r: "A city wants to build a multi-billion dollar clean-energy subway.",
        p: "They can only do it because they fostered a booming local tech industry that pays high taxes.",
      },
    ],
  },
  {
    id: "flourishing_collective_blocking",
    title: "A society of unhappy people cannot sustain effective collective life",
    poles: ["Mental Wellbeing", "Society & Laws"],
    hook: {
      name: "The Broken Engine",
      analogy:
        "Try to build a winning soccer team using 11 players who are all severely depressed, exhausted, and hate each other. You lose every single game. The pieces are broken.",
    },
    core: {
      name: "The Hollow State Example",
      analogy:
        "A government can build the best laws and bridges in the world, but if the citizens are suffering from epidemic burnout, severe anxiety, and loneliness (Mental Wellbeing), society physically collapses. No one volunteers, no one votes, no one cares (Society & Laws).",
      exp: "Mental illness and social disconnection reduce people's capacity to cooperate. Neglecting individual wellbeing eventually undermines everything built collectively.",
    },
    det: {
      q1: "What crushing mental burden are the citizens carrying?",
      q2: "How does this misery make the whole country fall apart?",
      t: "Mental burdens like burnout reduce people's capacity to sustain {a functioning society}.",
    },
    top: [
      {
        t: "Burnout Culture",
        r: "A country forces its citizens to work 80 hours a week to boost the GDP.",
        p: "The citizens become so exhausted and depressed that birth rates plummet, destroying the future of the nation.",
      },
      {
        t: "Epidemic Loneliness",
        r: "People live alone in tiny apartments, never speaking to neighbors.",
        p: "When a natural disaster hits, no one checks on the elderly, and communities completely fail to organize rescues.",
      },
      {
        t: "The Mental Health Crisis",
        r: "Teenagers are crushed by anxiety and social media addiction.",
        p: "They completely drop out of civic life, refusing to vote or participate in democracy.",
      },
    ],
  },
  {
    id: "collective_material_blocking",
    title: "Without redistribution, economic growth benefits only the few",
    poles: ["Society & Laws", "Wealth & Economy"],
    hook: {
      name: "The Dragon's Hoard",
      analogy:
        "You are playing Monopoly, and one player starts with all the hotels. No matter how many times you roll the dice, they get richer and you slowly go bankrupt. The game is rigged.",
    },
    core: {
      name: "The Vacuum Example",
      analogy:
        "When an economy booms, the wealth doesn't naturally 'trickle down'. Markets left alone act like a vacuum, concentrating wealth at the very top (Wealth & Economy). Without the government stepping in to force taxes and minimum wages (Society & Laws), the growth never reaches the workers.",
      exp: "Without collective mechanisms—taxes, welfare, labor laws—growth never reaches the people who actually need it most.",
    },
    det: {
      q1: "What massive pile of wealth was generated?",
      q2: "Why did none of it reach the actual workers without government force?",
      t: "Without {taxes and fair wages}, markets left alone concentrate {economic wealth} at the top.",
    },
    top: [
      {
        t: "Wealth Inequality",
        r: "A tech company invents a brilliant new AI and makes a trillion dollars.",
        p: "The CEO buys a superyacht, while the warehouse workers still rely on food stamps to survive.",
      },
      {
        t: "Minimum Wage Laws",
        r: "Corporate profits hit all-time record highs across the country.",
        p: "Wages stay completely flat for 20 years because companies will never voluntarily pay workers more than they have to.",
      },
      {
        t: "Taxing Billionaires",
        r: "The stock market booms, creating unprecedented national wealth.",
        p: "The public schools remain broke and crumbling because the ultra-rich use loopholes to avoid paying taxes.",
      },
    ],
  },
  {
    id: "flourishing_collective_instrument",
    title: "Human wellbeing is the ultimate purpose of collective organization",
    poles: ["Mental Wellbeing", "Society & Laws"],
    hook: {
      name: "The True Scoreboard",
      analogy:
        "A school boasts that it has the highest test scores in the entire state. But every single student is miserable, bullied, and stressed to the point of breaking. It is a failed school.",
    },
    core: {
      name: "The Pointless Nation Example",
      analogy:
        "A country brags that its GDP is the highest in the world (Society & Laws). But if its citizens suffer from epidemic loneliness and soaring suicide rates, the government has failed at the only thing it exists to do: make lives better (Mental Wellbeing).",
      exp: "Institutions that cannot point to improved human lives have no justification for the power they hold. Happiness is the only metric that matters.",
    },
    det: {
      q1: "What shiny, impressive statistic is the government bragging about?",
      q2: "What human misery proves the statistic is a total lie?",
      t: "A {government} with high GDP but epidemic sadness has failed its {job of making people happy}.",
    },
    top: [
      {
        t: "Gross National Happiness",
        r: "A country abandons GDP and tracks the actual mental joy of its citizens.",
        p: "They pass laws banning excessive overtime, proving that governments exist to protect joy, not just money.",
      },
      {
        t: "Work-Life Balance Laws",
        r: "The state makes it illegal for bosses to email workers after 6 PM.",
        p: "Economic output slightly drops, but family happiness skyrockets, which is the ultimate goal.",
      },
      {
        t: "Urban Design for Joy",
        r: "A city rips up a highway to build a massive, free public park.",
        p: "Traffic gets slightly worse, but childhood obesity and depression plummet, a massive win for society.",
      },
    ],
  },
  {
    id: "progress_preservation_transformation",
    title: "What innovators call progress, traditionalists experience as loss",
    poles: ["Innovation & Tech", "Tradition & History"],
    hook: {
      name: "The Two-Way Mirror",
      analogy:
        "The city replaces the bumpy, historic cobblestone road with perfectly smooth black asphalt. The commuters in their cars cheer. The local historian cries.",
    },
    core: {
      name: "The Perspective Example",
      analogy:
        "Uber is a brilliant, cheap innovation for the young professional who needs a ride (Innovation & Tech). But it is the violent, terrifying destruction of a 40-year career for the traditional taxi driver who loses everything (Tradition & History).",
      exp: "The exact same technological change produces genuinely different realities for different people. Progress is relative.",
    },
    det: {
      q1: "What amazing convenience did the young tech-lover get?",
      q2: "What deeply rooted tradition or livelihood did the older worker lose?",
      t: "What innovators call {new technology}, traditionalists experience as the violent loss of {authentic local culture}.",
    },
    top: [
      {
        t: "E-Commerce vs High Streets",
        r: "A teenager can buy anything with one click and get it delivered the next day.",
        p: "The 100-year-old family bookshop in the town center goes bankrupt, destroying the town's social hub.",
      },
      {
        t: "Digital Streaming",
        r: "People can watch any movie instantly from their bedroom in 4K.",
        p: "The local cinema closes down, destroying the traditional shared experience of a community watching a film together.",
      },
      {
        t: "Airbnb in Historic Cities",
        r: "Tourists get cheap, authentic-feeling apartments to stay in.",
        p: "The actual locals are evicted, turning a vibrant historic neighborhood into an empty ghost town.",
      },
    ],
  },
  {
    id: "progress_sustainable_causal_neg",
    title: "Technology creates new environmental problems while solving old ones",
    poles: ["Innovation & Tech", "Environment & Future"],
    hook: {
      name: "The Whack-a-Mole Trap",
      analogy:
        "You clean up the dirt in your yard by blowing it into your neighbor's yard with a massive leaf blower. You 'solved' your problem, but just moved the mess.",
    },
    core: {
      name: "The Toxic Swap Example",
      analogy:
        "We solved gas pollution by inventing electric cars (Innovation & Tech). But now we have to violently strip-mine the earth for lithium and figure out how to safely bury millions of toxic batteries (Environment & Future).",
      exp: "Every solution introduces new environmental costs alongside the benefits. We rarely eliminate pollution; we just change its shape.",
    },
    det: {
      q1: "What old toxic problem did this brilliant tech solve?",
      q2: "What brand new environmental nightmare did it quietly create?",
      t: "{Digital technology} solves old emissions but creates brand new {toxic disaster}.",
    },
    top: [
      {
        t: "Lithium Mining for EVs",
        r: "Electric vehicles produce absolutely zero smog or exhaust on the road.",
        p: "We now have to violently strip-mine the earth for rare metals, poisoning local groundwater.",
      },
      {
        t: "AI Data Centers",
        r: "AI perfectly optimizes city traffic to save millions of gallons of gas.",
        p: "The massive server farms required to run the AI consume as much electricity as a small country.",
      },
      {
        t: "E-Waste from Smartphones",
        r: "We no longer print millions of paper maps or phone books.",
        p: "We now dump millions of toxic, unrecyclable phones into landfills every single year.",
      },
    ],
  },
  {
    id: "progress_sustainable_spillover_neg",
    title: "Efficiency gains lead to more consumption, not less",
    poles: ["Innovation & Tech", "Environment & Future"],
    hook: {
      name: "The Efficiency Paradox",
      analogy:
        "Engineers invent a car engine that uses half as much gas! But because driving is now twice as cheap, people take 3 times as many road trips. The total amount of gas burned actually goes UP.",
    },
    core: {
      name: "The Jevons Paradox Example",
      analogy:
        "When we make LED lights 90% cheaper to run (Innovation & Tech), people don't use that efficiency to save energy. They just leave their lights on 24 hours a day, or light up entire buildings for decoration (Environment & Future).",
      exp: "Cheaper, cleaner technology makes people use more of it. Improvement doesn't automatically mean reduction; it often fuels human greed.",
    },
    det: {
      q1: "What technology got 10x more efficient?",
      q2: "How did human greed use that efficiency to consume even more?",
      t: "Cheaper, cleaner {new tools} makes people use more of it, worsening {the destruction of the earth}.",
    },
    top: [
      {
        t: "LED Lighting",
        r: "Engineers invent bulbs that require almost zero electricity to run.",
        p: "Cities respond by installing millions of new billboards, increasing the total global energy draw.",
      },
      {
        t: "Remote Work",
        r: "People stop commuting to the office, supposedly saving gas.",
        p: "They move out to the deep suburbs and end up driving 50 miles every weekend, burning more fuel than before.",
      },
      {
        t: "High-Yield GMO Crops",
        r: "Scientists invent corn that produces double the food per acre.",
        p: "Instead of using less land, mega-corporations just clear-cut more of the Amazon to plant even more of the cheap corn.",
      },
    ],
  },
];

// ─── Lookup map ───────────────────────────────────────────────────────────────

/**
 * Map from direction_tag → full PoV entry.
 * Returns undefined for direction tags not in this file.
 */
export const povContent: Record<string, PovEntry> = Object.fromEntries(
  entries.map((e) => [e.id, e])
);
