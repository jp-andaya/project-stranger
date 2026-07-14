// data.js — identity vocabulary + client-side constants for Pondr.
// All content data (notes, wins, instants, prompts) now lives in the backend
// (see backend/seed_content.py for the seeded mirror of the old samples);
// this module keeps only the constants the UI needs synchronously.

export const CATEGORIES = ["Reflection", "Hope", "Confession", "Question", "Memory", "Gratitude"];

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
