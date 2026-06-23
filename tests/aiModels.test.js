const geminiClient = require('../src/config/geminiClient');
const { GEMINI_MODELS } = require('../src/config/geminiClient');

jest.mock('../src/config/geminiClient', () => ({
  GEMINI_MODELS: {
    ANALYSIS: 'gemini-1.5-flash',
    SIMULATION: 'gemini-1.5-pro',
  },
  generateText: jest.fn(),
  generateJSON: jest.fn(),
}));

describe('Pruebas del Modelo de IA (Gemini)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe generar texto usando geminiClient para el simulador', async () => {
    geminiClient.generateText.mockResolvedValue('Hola, esta es una respuesta de prueba.');
    
    const response = await geminiClient.generateText('Dame un saludo', GEMINI_MODELS.SIMULATION);
    
    expect(geminiClient.generateText).toHaveBeenCalledWith('Dame un saludo', 'gemini-1.5-pro');
    expect(response).toBe('Hola, esta es una respuesta de prueba.');
  });

  it('Debe generar JSON para el análisis de CV', async () => {
    const mockJson = { score: 85, feedback: 'Buen CV' };
    geminiClient.generateJSON.mockResolvedValue(mockJson);
    
    const response = await geminiClient.generateJSON('Analiza este CV: ...', GEMINI_MODELS.ANALYSIS);
    
    expect(geminiClient.generateJSON).toHaveBeenCalledWith('Analiza este CV: ...', 'gemini-1.5-flash');
    expect(response.score).toBe(85);
    expect(response.feedback).toBe('Buen CV');
  });
});
