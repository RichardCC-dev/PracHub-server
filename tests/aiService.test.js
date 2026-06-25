// --- Mock del cliente Gemini (factory inline para evitar TDZ de hoisting) ---
jest.mock('../src/config/geminiClient', () => ({
  genAI: { getGenerativeModel: jest.fn() },
  GEMINI_MODELS: {
    FLASH: 'gemini-2.0-flash',
    FLASH_2_5: 'gemini-2.5-flash',
    FLASH_LITE: 'gemini-2.5-flash-lite',
  },
}));

const { genAI } = require('../src/config/geminiClient');
const aiService = require('../src/services/aiService');

// Helper: configura el mock del modelo para devolver un generateContent dado
const setupModelMock = (generateContentImpl) => {
  genAI.getGenerativeModel.mockReturnValue({ generateContent: generateContentImpl });
};

describe('aiService — mejora de texto y secciones de CV (Gemini FLASH)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('improveText', () => {
    it('devuelve el texto mejorado trimado y usa el modelo FLASH', async () => {
      setupModelMock(jest.fn().mockResolvedValue({
        response: { text: () => '  Texto mejorado por IA  ' },
      }));

      const result = await aiService.improveText({
        section: 'profile',
        field: 'summary',
        content: 'texto original',
      });

      expect(genAI.getGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-2.0-flash' });
      expect(result).toBe('Texto mejorado por IA');
    });

    it('lanza un error amigable cuando la API de Gemini falla', async () => {
      setupModelMock(jest.fn().mockRejectedValue(new Error('API down')));

      await expect(
        aiService.improveText({ section: 'profile', field: 'summary', content: 'x' })
      ).rejects.toThrow('No se pudo generar la sugerencia en este momento.');
    });
  });

  describe('improveSection', () => {
    it('parsea y devuelve el JSON mejorado para la sección profile', async () => {
      setupModelMock(jest.fn().mockResolvedValue({
        response: { text: () => JSON.stringify({ summary: 'Perfil mejorado' }) },
      }));

      const result = await aiService.improveSection({
        section: 'profile',
        data: { summary: 'perfil original' },
      });

      expect(result).toEqual({ summary: 'Perfil mejorado' });
    });

    it('maneja la sección skills con su estructura esperada', async () => {
      setupModelMock(jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ technical: 'React, Node', soft: 'Comunicación' }),
        },
      }));

      const result = await aiService.improveSection({
        section: 'skills',
        data: { technical: 'React', soft: 'Comunicación' },
      });

      expect(result).toEqual({ technical: 'React, Node', soft: 'Comunicación' });
    });

    it('filtra items vacíos antes de construir el prompt de experience', async () => {
      const generateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ items: [{ company: 'X', role: 'Y', description: 'Z' }] }),
        },
      });
      setupModelMock(generateContent);

      await aiService.improveSection({
        section: 'experience',
        data: {
          items: [
            { company: 'X', role: 'Y', description: 'Z' },
            { company: '', role: '', description: '' }, // item vacío
          ],
        },
      });

      const promptArg = generateContent.mock.calls[0][0];
      expect(promptArg).toContain('Experiencia 1');
      expect(promptArg).not.toContain('Experiencia 2');
    });

    it('filtra items vacíos para la sección projects', async () => {
      const generateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ items: [{ title: 'P1', description: 'D1' }] }),
        },
      });
      setupModelMock(generateContent);

      await aiService.improveSection({
        section: 'projects',
        data: {
          items: [
            { title: 'P1', description: 'D1' },
            { title: '', description: '' },
          ],
        },
      });

      const promptArg = generateContent.mock.calls[0][0];
      expect(promptArg).toContain('Proyecto 1');
      expect(promptArg).not.toContain('Proyecto 2');
    });

    it('lanza error cuando la IA no devuelve JSON válido', async () => {
      setupModelMock(jest.fn().mockResolvedValue({
        response: { text: () => 'esto no es json' },
      }));

      await expect(
        aiService.improveSection({ section: 'profile', data: { summary: 'x' } })
      ).rejects.toThrow('No se pudo generar la sugerencia en este momento.');
    });

    it('lanza error amigable cuando la API falla', async () => {
      setupModelMock(jest.fn().mockRejectedValue(new Error('network')));

      await expect(
        aiService.improveSection({ section: 'profile', data: { summary: 'x' } })
      ).rejects.toThrow('No se pudo generar la sugerencia en este momento.');
    });
  });
});
