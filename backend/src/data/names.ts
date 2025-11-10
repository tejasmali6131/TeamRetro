// Lists of names for random participant assignment

export const animals = [
  'Panda', 'Tiger', 'Lion', 'Elephant', 'Giraffe', 'Zebra', 'Koala', 'Penguin',
  'Dolphin', 'Whale', 'Eagle', 'Hawk', 'Owl', 'Falcon', 'Parrot', 'Peacock',
  'Fox', 'Wolf', 'Bear', 'Deer', 'Rabbit', 'Squirrel', 'Otter', 'Beaver',
  'Cheetah', 'Leopard', 'Jaguar', 'Lynx', 'Cougar', 'Panther', 'Kangaroo',
  'Platypus', 'Hedgehog', 'Porcupine', 'Raccoon', 'Badger', 'Meerkat', 'Seal',
  'Walrus', 'Manatee', 'Turtle', 'Tortoise', 'Iguana', 'Gecko', 'Chameleon',
  'Salamander', 'Frog', 'Toad', 'Octopus', 'Jellyfish', 'Starfish', 'Seahorse'
];

export const plants = [
  'Rose', 'Lily', 'Tulip', 'Sunflower', 'Daisy', 'Orchid', 'Lotus', 'Jasmine',
  'Lavender', 'Marigold', 'Peony', 'Hibiscus', 'Magnolia', 'Azalea', 'Camellia',
  'Oak', 'Maple', 'Pine', 'Willow', 'Cedar', 'Birch', 'Elm', 'Ash',
  'Cherry', 'Apple', 'Peach', 'Plum', 'Orange', 'Lemon', 'Mango', 'Banana',
  'Fern', 'Moss', 'Ivy', 'Bamboo', 'Cactus', 'Aloe', 'Sage', 'Basil',
  'Mint', 'Thyme', 'Rosemary', 'Chamomile', 'Ginger', 'Turmeric', 'Clover'
];

export const colors = [
  'Crimson', 'Scarlet', 'Ruby', 'Coral', 'Amber', 'Gold', 'Canary', 'Lime',
  'Emerald', 'Jade', 'Teal', 'Cyan', 'Azure', 'Sapphire', 'Cobalt', 'Indigo',
  'Violet', 'Magenta', 'Rose', 'Pearl', 'Silver', 'Platinum', 'Ivory', 'Cream'
];

export const celestial = [
  'Sun', 'Moon', 'Star', 'Comet', 'Nova', 'Galaxy', 'Nebula', 'Meteor',
  'Aurora', 'Eclipse', 'Constellation', 'Pulsar', 'Quasar', 'Asteroid', 'Venus',
  'Mars', 'Jupiter', 'Saturn', 'Mercury', 'Neptune', 'Uranus', 'Pluto'
];

export const elements = [
  'Fire', 'Water', 'Earth', 'Air', 'Thunder', 'Lightning', 'Storm', 'Rain',
  'Snow', 'Ice', 'Frost', 'Wind', 'Cloud', 'Mist', 'Fog', 'Dawn',
  'Dusk', 'Twilight', 'Shadow', 'Light', 'Crystal', 'Diamond', 'Pearl', 'Opal'
];

// Combine all name categories
const allNameCategories = [animals, plants, colors, celestial, elements];

// Keep track of used names per session to avoid duplicates
const usedNamesPerRetro: Map<string, Set<string>> = new Map();

/**
 * Generate a random unique name for a participant in a retro session
 * @param retroId - The ID of the retro session
 * @returns A unique random name
 */
export const generateRandomName = (retroId: string): string => {
  // Get or create the set of used names for this retro
  if (!usedNamesPerRetro.has(retroId)) {
    usedNamesPerRetro.set(retroId, new Set());
  }
  
  const usedNames = usedNamesPerRetro.get(retroId)!;
  
  // Flatten all name categories into one array
  const allNames = allNameCategories.flat();
  
  // If we've used all names, reset the pool
  if (usedNames.size >= allNames.length) {
    usedNames.clear();
  }
  
  // Find an unused name
  let randomName: string;
  do {
    const randomCategory = allNameCategories[Math.floor(Math.random() * allNameCategories.length)];
    randomName = randomCategory[Math.floor(Math.random() * randomCategory.length)];
  } while (usedNames.has(randomName));
  
  // Mark this name as used
  usedNames.add(randomName);
  
  return randomName;
};

/**
 * Clear used names for a retro session (useful when session ends)
 * @param retroId - The ID of the retro session
 */
export const clearUsedNames = (retroId: string): void => {
  usedNamesPerRetro.delete(retroId);
};

/**
 * Get all used names for a retro session
 * @param retroId - The ID of the retro session
 * @returns Array of used names
 */
export const getUsedNames = (retroId: string): string[] => {
  return Array.from(usedNamesPerRetro.get(retroId) || []);
};
