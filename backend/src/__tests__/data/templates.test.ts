import { templates, getAllTemplates, getTemplateById } from '../../data/templates';

describe('Templates Data Store', () => {
  describe('templates array', () => {
    it('should contain predefined templates with required properties and valid columns', () => {
      expect(templates.length).toBeGreaterThan(0);

      templates.forEach(template => {
        // Check required properties
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('columns');
        expect(template).toHaveProperty('isDefault');
        expect(template).toHaveProperty('createdBy');
        expect(template).toHaveProperty('createdAt');
        expect(template).toHaveProperty('updatedAt');

        // Check columns
        expect(Array.isArray(template.columns)).toBe(true);
        expect(template.columns.length).toBeGreaterThan(0);

        template.columns.forEach(column => {
          expect(column).toHaveProperty('id');
          expect(column).toHaveProperty('name');
          expect(column).toHaveProperty('placeholder');
          expect(column).toHaveProperty('color');
          expect(column).toHaveProperty('order');
        });
      });
    });
  });

  describe('getAllTemplates', () => {
    it('should return all templates as array', () => {
      const result = getAllTemplates();

      expect(result).toBe(templates);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(templates.length);
      result.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
      });
    });
  });

  describe('getTemplateById', () => {
    it('should return template when found or undefined when not found', () => {
      // Test found case
      const result = getTemplateById('0');
      expect(result).toBeDefined();
      expect(result?.id).toBe('0');

      // Test not found
      expect(getTemplateById('nonexistent')).toBeUndefined();

      // Test all templates can be found
      templates.forEach(template => {
        const found = getTemplateById(template.id);
        expect(found).toBe(template);
      });
    });

    it('should return specific templates with correct structure', () => {
      // Start, Stop, Continue
      const ssc = getTemplateById('1');
      expect(ssc?.name).toBe('Start, Stop, Continue');
      expect(ssc?.columns.length).toBe(3);

      // Sailboat
      const sailboat = getTemplateById('4');
      expect(sailboat?.name).toBe('Sailboat');
      expect(sailboat?.columns.length).toBe(4);
    });
  });
});
