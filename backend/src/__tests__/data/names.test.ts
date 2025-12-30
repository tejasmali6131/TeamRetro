import {
  animals,
  plants,
  colors,
  celestial,
  elements,
  generateRandomName,
  setNameDeck,
  clearUsedNames,
  getUsedNames
} from '../../data/names';

describe('Names Data Store', () => {
  // Clear used names before each test
  beforeEach(() => {
    clearUsedNames('test-retro');
  });

  describe('name arrays', () => {
    it('should have all name arrays with items', () => {
      const arrays = { animals, plants, colors, celestial, elements };
      Object.entries(arrays).forEach(([_name, arr]) => {
        expect(Array.isArray(arr)).toBe(true);
        expect(arr.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generateRandomName', () => {
    it('should generate unique names and track them', () => {
      const names = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const name = generateRandomName('test-retro');
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
        names.add(name);
      }
      // All names should be unique
      expect(names.size).toBe(10);
      // Should track used names
      expect(getUsedNames('test-retro').length).toBe(10);
    });

    it('should generate names for different retros independently', () => {
      generateRandomName('retro-1');
      generateRandomName('retro-2');

      expect(getUsedNames('retro-1').length).toBe(1);
      expect(getUsedNames('retro-2').length).toBe(1);

      clearUsedNames('retro-1');
      clearUsedNames('retro-2');
    });
  });

  describe('setNameDeck', () => {
    it('should use correct deck for each deck type', () => {
      const deckTests: [string, string[]][] = [
        ['animals', animals],
        ['plants', plants],
        ['colors', colors],
        ['celestial', celestial],
        ['elements', elements],
      ];

      deckTests.forEach(([deckName, deckArray]) => {
        clearUsedNames('test-retro');
        setNameDeck('test-retro', deckName);
        const name = generateRandomName('test-retro');
        expect(deckArray).toContain(name);
      });
    });

    it('should use random deck for random or unknown deck types', () => {
      const allNames = [...animals, ...plants, ...colors, ...celestial, ...elements];

      // Test 'random' deck
      clearUsedNames('test-retro');
      setNameDeck('test-retro', 'random');
      const randomName = generateRandomName('test-retro');
      expect(allNames).toContain(randomName);

      // Test unknown deck type (should fall back to random)
      clearUsedNames('test-retro');
      setNameDeck('test-retro', 'unknown-deck');
      const unknownName = generateRandomName('test-retro');
      expect(allNames).toContain(unknownName);
    });

    it('should use random deck by default when no deck is set', () => {
      const allNames = [...animals, ...plants, ...colors, ...celestial, ...elements];
      clearUsedNames('test-retro-new');
      // No setNameDeck call - should default to random
      const name = generateRandomName('test-retro-new');
      expect(allNames).toContain(name);
      clearUsedNames('test-retro-new');
    });
  });

  describe('clearUsedNames and getUsedNames', () => {
    it('should clear and get used names correctly', () => {
      // New retro starts empty
      expect(getUsedNames('new-retro')).toEqual([]);

      // Generate and track names
      const name1 = generateRandomName('test-retro');
      const name2 = generateRandomName('test-retro');
      const usedNames = getUsedNames('test-retro');
      expect(usedNames).toContain(name1);
      expect(usedNames).toContain(name2);

      // Clear only affects specific retro
      generateRandomName('retro-other');
      clearUsedNames('test-retro');
      expect(getUsedNames('test-retro').length).toBe(0);
      expect(getUsedNames('retro-other').length).toBe(1);
      clearUsedNames('retro-other');
    });
  });

  describe('name pool exhaustion', () => {
    it('should reset pool when all names are used for a specific deck', () => {
      setNameDeck('test-retro', 'colors');
      const colorCount = colors.length;

      // Use all colors
      for (let i = 0; i < colorCount; i++) {
        generateRandomName('test-retro');
      }

      // Pool should be exhausted and reset
      const newName = generateRandomName('test-retro');
      expect(colors).toContain(newName);
    });
  });
});
