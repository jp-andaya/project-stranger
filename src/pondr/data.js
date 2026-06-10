// data.js — sample notes, prompts, wins, identity constants.
// Ported from the design handoff (pondr-data.js). The prototype attached
// everything to window.*; here it's a normal ES module. In production these
// sample arrays map to server-side data + account state.

export const PROMPTS = [
  "What's on your mind right now?",
  "What's something you've been quietly proud of?",
  "What's something you wish you could tell a stranger?",
  "What do you pretend to understand but really don't?",
  "What's a small joy from today?",
  "What's something you're still learning to forgive?",
  "When did you last feel truly at peace?",
  "What would you tell your younger self?",
  "What's a kindness you've never forgotten?",
  "What helped you through a hard week?",
  "What's a comfort you return to again and again?",
  "What are you glad you said out loud?",
  "What does home feel like to you?",
];

export const CATEGORIES = ["Reflection", "Hope", "Confession", "Question", "Memory", "Gratitude"];

export const SAMPLE_NOTES = [
  { id: "n1", prompt: PROMPTS[0],  cat: "Reflection", author: 438,  title: "Rest isn't falling behind",        body: "I think I'm slowly learning that rest doesn't mean I'm falling behind. It's taken me years to unlearn the idea that productivity equals worth. Some days the bravest thing I do is close the laptop, sit by the window, and let the afternoon be quiet. I'm trying to believe that the world keeps turning even when I'm still.", when: "2h ago" },
  { id: "n2", prompt: PROMPTS[0],  cat: "Hope",       author: 1207, title: "Choosing to keep going",           body: "Some days are heavy, but I'm choosing to keep going anyway. Not because I feel strong, but because tomorrow hasn't happened yet and I want to see who I become on the other side of this. If you're reading this and you're tired too — let's keep going together.", when: "5h ago" },
  { id: "n3", prompt: PROMPTS[0],  cat: "Confession", author: 89,   title: "I pretend I'm fine",               body: "I pretend I'm fine so often, even though I just want someone to ask if I'm okay and actually wait for the real answer. I've gotten so good at the performance that sometimes I fool myself. But underneath the 'I'm good, thanks' there's a person who would give anything to be seen for one honest minute.", when: "9h ago" },
  { id: "n4", prompt: PROMPTS[0],  cat: "Question",   author: 3162, title: "How do you let go?",               body: "How do you let go of something that still means everything to you? I keep waiting for the day it stops aching, but it just changes shape. Maybe letting go isn't a single moment — maybe it's a thousand small choices to look forward instead of back. I'm still learning the first one.", when: "14h ago" },
  { id: "n5", prompt: PROMPTS[1],  cat: "Memory",     author: 712,  title: "The little things",                body: "I miss the little things about someone I used to talk to every day. The way they texted in lowercase, how they'd send a song with no caption, the inside jokes that don't make sense to anyone else. We didn't have a dramatic ending. We just slowly stopped, and somehow that hurts more.", when: "1 day ago" },
  { id: "n6", prompt: PROMPTS[1],  cat: "Reflection", author: 2055, title: "Closed chapters",                  body: "Not every door is meant to stay open. I'm learning to be okay with closed chapters and new beginnings, even when I don't get the closure I wanted. Some stories just end mid-sentence, and the growth is in writing the next page anyway.", when: "1 day ago" },
  { id: "n7", prompt: PROMPTS[2],  cat: "Gratitude",  author: 56,   title: "Moments no one sees",              body: "Grateful for the small moments that no one else sees but somehow make everything feel worth it. The first sip of coffee before the house wakes up. A stranger's dog deciding I'm worth a tail wag. The particular gold of 5pm light on the kitchen wall. These are the things I'd miss most.", when: "2 days ago" },
  { id: "n8", prompt: PROMPTS[2],  cat: "Confession", author: 1894, title: "Still crying over it",             body: "I still cry over things that happened months ago, in the shower, in the car, in the gap between meetings. People think I've moved on because I stopped talking about it. The truth is I just learned to carry it more quietly.", when: "2 days ago" },
  { id: "n9", prompt: PROMPTS[3],  cat: "Hope",       author: 327,  title: "Maybe next year",                  body: "Maybe I'll be different next year. Maybe I'll finally be the person I keep promising myself I'll become — a little kinder, a little braver, a little less afraid of being a beginner. Maybe that hope is enough to keep going. Most days, it has to be.", when: "3 days ago" },
  { id: "n10", prompt: PROMPTS[3], cat: "Memory",     author: 941,  title: "Rain on hot pavement",             body: "The smell of rain on hot pavement still takes me back to my grandmother's porch, the screen door slapping shut, the radio playing something old. I didn't know those were the good old days while I was living them. I'd give a lot for one more ordinary afternoon there.", when: "3 days ago" },
  { id: "n11", prompt: PROMPTS[4], cat: "Question",   author: 2783, title: "Homesick for nowhere",             body: "Is it normal to feel homesick for a place you never actually lived? Sometimes I ache for a version of life I only imagined — a small town, a slow morning, people who know my name at the bakery. Maybe home isn't a place I lost. Maybe it's a place I haven't built yet.", when: "4 days ago" },
  { id: "n12", prompt: PROMPTS[4], cat: "Gratitude",  author: 604,  title: "To the stranger at the door",      body: "Thank you to the stranger who held the door this morning when my hands were full and my day was already falling apart. You'll never know that it was the first kind thing that happened to me in a week, and that it made me cry a little on the train. Small kindness travels further than you think.", when: "4 days ago" },
  { id: "n13", prompt: PROMPTS[0],  cat: "Reflection", author: 271,  title: "Learning to sit with quiet",        body: "I used to fill every silence with noise — podcasts, scrolling, anything. Lately I've been letting the quiet just be quiet. It's uncomfortable at first, like a room that's too still, but underneath it there's a version of me I haven't heard from in a long time.", when: "1h ago" },
  { id: "n14", prompt: PROMPTS[0],  cat: "Hope",       author: 1530, title: "A softer year",                   body: "I'm hoping this is the year I stop being so hard on myself. Not all at once — just a little gentler each day. If I can talk to myself the way I'd talk to a friend, maybe that's enough of a resolution.", when: "3h ago" },
  { id: "n15", prompt: PROMPTS[0],  cat: "Memory",     author: 842,  title: "My mother's handwriting",         body: "I found a grocery list in my mother's handwriting tucked in an old coat. Just eggs, bread, oranges. I stood in the hallway and cried over oranges. The ordinary things are the ones that ambush you.", when: "6h ago" },
  { id: "n16", prompt: PROMPTS[0],  cat: "Confession", author: 1999, title: "I'm scared of wasting it",         body: "Sometimes I'm so afraid of wasting my life that I freeze and waste the afternoon. I'm trying to forgive myself for the days I just survive instead of seize. Showing up is its own kind of brave.", when: "20h ago" },
  { id: "n17", prompt: PROMPTS[1],  cat: "Reflection", author: 365,  title: "Proud of a quiet no",             body: "I said no to something I'd usually say yes to out of guilt, and the world didn't end. I'm quietly proud of the boundary. It felt like betrayal in the moment and like self-respect by evening.", when: "1 day ago" },
  { id: "n18", prompt: PROMPTS[1],  cat: "Gratitude",  author: 1142, title: "Still here",                      body: "I'm proud that I'm still here, honestly. A year ago I wasn't sure I would be. Nobody handed me a trophy for it, but I know what it cost, and that's enough.", when: "1 day ago" },
  { id: "n19", prompt: PROMPTS[2],  cat: "Confession", author: 503,  title: "What I never said",               body: "I wish I could tell a stranger that I miss someone I'm not allowed to miss anymore. Saying it to you, who'll never know me, somehow makes it lighter to carry.", when: "2 days ago" },
  { id: "n20", prompt: PROMPTS[5],  cat: "Reflection", author: 778,  title: "Forgiving the younger me",        body: "I'm still learning to forgive the version of me who didn't know better. He was just scared and doing his best with what he had. I think healing is partly letting the past be young and unfinished.", when: "5 days ago" },
  { id: "n21", prompt: PROMPTS[5],  cat: "Hope",       author: 1688, title: "The grudge I'm setting down",      body: "I've carried a grudge so long it started to feel like part of me. I'm not ready to forgive completely, but today I loosened my grip a little. Even that felt like setting down a heavy bag.", when: "5 days ago" },
  { id: "n22", prompt: PROMPTS[6],  cat: "Memory",     author: 294,  title: "Peace by the water",              body: "The last time I felt truly at peace was on a dock at dusk, feet in cold lake water, no phone, no plan. I keep trying to recreate it and forgetting that peace isn't a place — it's the moment you stop reaching for the next one.", when: "6 days ago" },
];

// The current user's own pseudonymous number (assigned at join).
export const MY_NUMBER = 1024;

// Format an author number as a pseudonym, e.g. 438 -> "Stranger #438".
export function strangerLabel(n) {
  return "Stranger #" + n;
}

// ── Identity handles: a moderated adjective + a creature noun ──
// Curated, gentle, positive — the only words an account can pick from.
export const ADJECTIVES = [
  "Brave", "Quiet", "Gentle", "Curious", "Kind", "Bright", "Calm", "Bold",
  "Wise", "Hopeful", "Tender", "Steady", "Wandering", "Lucky", "Mellow",
  "Humble", "Radiant", "Patient",
  // funnier / more expressive
  "Sleepy", "Grumpy", "Snazzy", "Cosmic", "Sassy", "Dapper", "Cheeky",
  "Plucky", "Whimsical", "Giddy", "Jolly", "Zesty", "Wobbly", "Peppy",
  "Funky", "Quirky", "Velvet", "Drowsy", "Witty", "Breezy", "Sunny",
  "Dreamy", "Cuddly", "Bouncy", "Fuzzy", "Spunky", "Chipper", "Goofy",
  "Dazzling", "Glittery", "Sparkly", "Twinkly", "Nifty", "Swift", "Nimble",
  "Cozy", "Snug", "Toasty", "Spicy", "Tangy", "Minty", "Frosty", "Misty",
  "Stormy", "Cloudy", "Starry", "Lunar", "Stellar", "Galactic", "Mythic",
  "Noble", "Regal", "Stoic", "Serene", "Placid", "Zen", "Earnest", "Loyal",
  "Trusty", "Merry", "Cheery", "Sprightly", "Lively", "Vivid", "Bubbly",
  "Jaunty", "Dashing", "Suave", "Posh", "Fancy", "Charming", "Graceful",
  "Spry", "Perky", "Wholesome", "Modest", "Mighty", "Valiant", "Fearless",
  "Daring", "Curly", "Tiny", "Grand", "Epic", "Groovy", "Jazzy", "Snappy",
  "Crisp", "Fresh", "Chirpy", "Wiggly", "Squishy", "Fluffy",
];
// Animals & creatures only.
export const CREATURES = [
  "Otter", "Heron", "Fox", "Sparrow", "Whale", "Moth", "Hare", "Finch",
  "Lynx", "Robin", "Badger", "Crane", "Wren", "Deer", "Owl", "Seal",
  "Newt", "Swan", "Platypus", "Axolotl", "Narwhal", "Pufferfish",
  "Hedgehog", "Sloth", "Quokka", "Capybara", "Gecko", "Jellyfish",
  "Toad", "Pangolin", "Octopus", "Penguin", "Raccoon", "Possum", "Ferret",
  "Weasel", "Stoat", "Mole", "Vole", "Shrew", "Bison", "Moose", "Elk",
  "Caribou", "Ibex", "Tapir", "Okapi", "Lemur", "Loris", "Meerkat",
  "Mongoose", "Aardvark", "Armadillo", "Wombat", "Wallaby", "Koala",
  "Dingo", "Kiwi", "Kookaburra", "Cassowary", "Pelican", "Puffin",
  "Albatross", "Egret", "Ibis", "Stork", "Falcon", "Kestrel", "Osprey",
  "Magpie", "Raven", "Crow", "Jay", "Lark", "Swift", "Swallow", "Starling",
  "Hummingbird", "Toucan", "Macaw", "Parrot", "Cockatoo", "Flamingo",
  "Peacock", "Pheasant", "Quail", "Grouse", "Turtle", "Tortoise",
  "Chameleon", "Iguana", "Skink", "Salamander", "Frog", "Seahorse",
  "Starfish", "Urchin", "Squid", "Cuttlefish", "Nautilus", "Manta",
  "Stingray", "Anglerfish", "Pike", "Trout", "Koi", "Eel", "Dolphin",
  "Porpoise", "Walrus", "Manatee", "Dugong", "Beaver", "Chipmunk",
  "Squirrel", "Dormouse", "Marmot", "Hamster", "Gerbil", "Mantis",
  "Beetle", "Ladybug", "Firefly", "Cricket", "Butterfly", "Dragonfly",
  "Bumblebee", "Snail", "Crab", "Lobster", "Shrimp",
  // mythical
  "Dragon", "Phoenix", "Unicorn", "Griffin", "Pegasus", "Kraken", "Sphinx",
  "Yeti", "Wyvern", "Hydra", "Basilisk", "Chimera", "Faun", "Sprite", "Pixie",
];

// Deterministic handle for any author number, so every stranger
// has a stable name. e.g. 438 -> "Quiet Heron".
export function handleFromNumber(n) {
  const a = ADJECTIVES[n % ADJECTIVES.length];
  const c = CREATURES[(n * 7) % CREATURES.length];
  return a + " " + c;
}

// ── Unlock economy (scalable) ──
// You must submit at least 1 note to see any responses; you then see the first
// FREE_NOTES of each prompt, and must reach UNLOCK_SUBS total submissions to
// read the rest.
export const FREE_NOTES = 3;
export const UNLOCK_SUBS = 5;

// Resolve the display handle for an author: the current user's chosen handle
// (passed in) if it's them, otherwise the deterministic stranger handle.
export function authorHandle(n, myHandle) {
  return n === MY_NUMBER ? (myHandle || handleFromNumber(n)) : handleFromNumber(n);
}

export const WIN_ICONS = ["Sun", "Heart", "Star", "Leaf", "Moon", "Coffee", "Music", "Book"];

export const SAMPLE_WINS = [
  { id: "w1", icon: "Sun",   text: "Had a great cup of coffee this morning.",            date: "May 21" },
  { id: "w2", icon: "Heart", text: "Got a kind message from a friend out of the blue.",  date: "May 20" },
  { id: "w3", icon: "Star",  text: "Finished a task I've been putting off. Feels good!", date: "May 19" },
  { id: "w4", icon: "Leaf",  text: "Took a walk outside and enjoyed the sunshine.",      date: "May 18" },
  { id: "w5", icon: "Moon",  text: "Watched a movie that made me smile.",                date: "May 17" },
];
