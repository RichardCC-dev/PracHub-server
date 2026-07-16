// --- Mock del cliente Gemini (factory inline para evitar TDZ de hoisting) ---
jest.mock('../src/config/geminiClient', () => ({
  genAI: { getGenerativeModel: jest.fn() },
  GEMINI_MODELS: {
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

describe('aiService — mejora de texto y secciones de CV (Gemini FLASH_2_5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('improveText', () => {
    it('devuelve el texto mejorado trimado y usa el modelo FLASH_2_5', async () => {
      setupModelMock(jest.fn().mockResolvedValue({
        response: { text: () => '  Texto mejorado por IA  ' },
      }));

      const result = await aiService.improveText({
        section: 'profile',
        field: 'summary',
        content: 'texto original',
      });

      expect(genAI.getGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-2.5-flash' });
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

    it('maneja la sección skills con estructura areas + soft', async () => {
      setupModelMock(jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            areas: [{ area: 'Frontend', skills: 'React, Node' }],
            soft: 'Comunicación',
          }),
        },
      }));

      const result = await aiService.improveSection({
        section: 'skills',
        data: { areas: [{ area: 'Frontend', skills: 'React' }], soft: 'Comunicación' },
      });

      expect(result).toEqual({
        areas: [{ area: 'Frontend', skills: 'React, Node' }],
        soft: 'Comunicación',
      });
    });

    it('construye el prompt de skills desde areas y soft', async () => {
      const generateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ areas: [{ area: 'Frontend', skills: 'React' }], soft: 'Trabajo en equipo' }),
        },
      });
      setupModelMock(generateContent);

      await aiService.improveSection({
        section: 'skills',
        data: { areas: [{ area: 'Frontend', skills: 'React' }], soft: 'Trabajo en equipo' },
      });

      const promptArg = generateContent.mock.calls[0][0];
      expect(promptArg).toContain('Frontend');
      expect(promptArg).toContain('React');
      expect(promptArg).toContain('Trabajo en equipo');
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

    it('filtra items vacíos para la sección projects y usa bullets', async () => {
      const generateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ items: [{ title: 'P1', bullets: ['B1', 'B2'] }] }),
        },
      });
      setupModelMock(generateContent);

      await aiService.improveSection({
        section: 'projects',
        data: {
          items: [
            { title: 'P1', bullets: ['B1', 'B2'] },
            { title: '', bullets: [''] },
          ],
        },
      });

      const promptArg = generateContent.mock.calls[0][0];
      expect(promptArg).toContain('Proyecto 1');
      expect(promptArg).toContain('Viñetas:');
      expect(promptArg).toContain('- B1');
      expect(promptArg).not.toContain('Proyecto 2');
    });

    it('maneja projects con formato legacy description (sin bullets)', async () => {
      const generateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ items: [{ title: 'P1', bullets: ['Mejorado'] }] }),
        },
      });
      setupModelMock(generateContent);

      await aiService.improveSection({
        section: 'projects',
        data: {
          items: [{ title: 'P1', description: 'Descripción legacy' }],
        },
      });

      const promptArg = generateContent.mock.calls[0][0];
      expect(promptArg).toContain('- Descripción legacy');
    });

    it('lanza error específico cuando la IA no devuelve JSON válido', async () => {
      setupModelMock(jest.fn().mockResolvedValue({
        response: { text: () => 'esto no es json' },
      }));

      await expect(
        aiService.improveSection({ section: 'profile', data: { summary: 'x' } })
      ).rejects.toThrow('La IA no devolvió un formato válido. Intenta de nuevo.');
    });

    it('parsea JSON envuelto en bloques markdown ```json', async () => {
      setupModelMock(jest.fn().mockResolvedValue({
        response: { text: () => '```json\n{"summary": "Perfil mejorado"}\n```' },
      }));

      const result = await aiService.improveSection({
        section: 'profile',
        data: { summary: 'perfil original' },
      });

      expect(result).toEqual({ summary: 'Perfil mejorado' });
    });

    it('extrae JSON aunque la IA añada texto explicativo alrededor', async () => {
      setupModelMock(jest.fn().mockResolvedValue({
        response: { text: () => 'Aquí tienes la mejora:\n{"summary": "Perfil mejorado"}\nEspero que te sirva.' },
      }));

      const result = await aiService.improveSection({
        section: 'profile',
        data: { summary: 'perfil original' },
      });

      expect(result).toEqual({ summary: 'Perfil mejorado' });
    });

    it('elimina marcadores markdown **bold** de los valores JSON', async () => {
      setupModelMock(jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            items: [{ title: '**Sistema web**', bullets: ['**Desarrollado** con React', 'Mejoró el **rendimiento**'] }],
          }),
        },
      }));

      const result = await aiService.improveSection({
        section: 'projects',
        data: { items: [{ title: 'Sistema web', bullets: ['Desarrollado con React'] }] },
      });

      expect(result.items[0].title).toBe('Sistema web');
      expect(result.items[0].bullets[0]).toBe('Desarrollado con React');
      expect(result.items[0].bullets[1]).toBe('Mejoró el rendimiento');
    });

    it('elimina marcadores *italic* de los valores JSON', async () => {
      setupModelMock(jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({ summary: 'Estudiante *motivado* y *proactivo*' }),
        },
      }));

      const result = await aiService.improveSection({
        section: 'profile',
        data: { summary: 'Estudiante motivado' },
      });

      expect(result.summary).toBe('Estudiante motivado y proactivo');
    });

    it('lanza error amigable cuando la API falla', async () => {
      setupModelMock(jest.fn().mockRejectedValue(new Error('network')));

      await expect(
        aiService.improveSection({ section: 'profile', data: { summary: 'x' } })
      ).rejects.toThrow('No se pudo generar la sugerencia en este momento.');
    });
  });
});
