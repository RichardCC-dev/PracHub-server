describe('geminiClient — configuración centralizada de modelos Gemini', () => {
  let originalApiKey;

  beforeEach(() => {
    originalApiKey = process.env.GEMINI_API_KEY;
    jest.resetModules();
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalApiKey;
    jest.resetModules();
  });

  it('expone los tres modelos Gemini usados por los servicios de IA', () => {
    const { GEMINI_MODELS } = require('../src/config/geminiClient');

    expect(GEMINI_MODELS.FLASH).toBe('gemini-2.0-flash');
    expect(GEMINI_MODELS.FLASH_2_5).toBe('gemini-2.5-flash');
    expect(GEMINI_MODELS.FLASH_LITE).toBe('gemini-2.5-flash-lite');
  });

  it('construye el cliente singleton genAI con la API key del entorno', () => {
    process.env.GEMINI_API_KEY = 'test-key-1234';
    const { genAI } = require('../src/config/geminiClient');

    // Verificamos la API surface (instanceof falla por instancias duplicadas del módulo en Jest)
    expect(genAI).toBeTruthy();
    expect(typeof genAI.getGenerativeModel).toBe('function');
    expect(genAI.constructor.name).toBe('GoogleGenerativeAI');
  });

  it('usa string vacío como fallback cuando GEMINI_API_KEY no está definida', () => {
    delete process.env.GEMINI_API_KEY;
    const { genAI } = require('../src/config/geminiClient');

    // No debe lanzar aunque no haya key (permite arrancar el server en entornos sin IA)
    expect(genAI).toBeTruthy();
    expect(typeof genAI.getGenerativeModel).toBe('function');
  });
});
