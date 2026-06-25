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
const geminiService = require('../src/services/geminiService');

// Helper: configura el mock del modelo para chat (startChat + sendMessage)
// Devuelve el mock de startChat para inspección de argumentos.
const setupChatModelMock = (sendMessageImpl) => {
  const startChatMock = jest.fn(() => ({ sendMessage: sendMessageImpl }));
  genAI.getGenerativeModel.mockReturnValue({ startChat: startChatMock });
  return startChatMock;
};

// Helper: configura el mock del modelo para generateContent
const setupGenerateContentModelMock = (generateContentImpl) => {
  genAI.getGenerativeModel.mockReturnValue({ generateContent: generateContentImpl });
};

describe('geminiService — simulador de entrevistas (Gemini FLASH_2_5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('chatWithGemini', () => {
    it('usa el modelo FLASH_2_5 e inicia un chat', async () => {
      const sendMessage = jest.fn().mockResolvedValue({ response: { text: () => 'Hola candidato' } });
      setupChatModelMock(sendMessage);

      await geminiService.chatWithGemini([], 'Desarrollador', 'Hola', 'Ingeniería', 'Tech');

      expect(genAI.getGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-2.5-flash' });
    });

    it('inyecta el system prompt y el saludo inicial cuando el historial está vacío', async () => {
      const sendMessage = jest.fn().mockResolvedValue({ response: { text: () => 'Respuesta' } });
      const startChat = setupChatModelMock(sendMessage);

      await geminiService.chatWithGemini([], 'Data Analyst', 'Hola', null, null);

      const startChatArgs = startChat.mock.calls[0][0];
      expect(startChatArgs.history[0].role).toBe('user');
      expect(startChatArgs.history[0].parts[0].text).toContain('Marco');
      expect(startChatArgs.history[1].role).toBe('model');
      expect(startChatArgs.history[1].parts[0].text).toContain('Data Analyst');
    });

    it('incluye carrera y sector en el system prompt cuando se proveen', async () => {
      const sendMessage = jest.fn().mockResolvedValue({ response: { text: () => 'Ok' } });
      const startChat = setupChatModelMock(sendMessage);

      await geminiService.chatWithGemini([], 'Dev', 'Hola', 'Sistemas', 'Banca');

      const promptText = startChat.mock.calls[0][0].history[0].parts[0].text;
      expect(promptText).toContain('Sistemas');
      expect(promptText).toContain('Banca');
    });

    it('sanea la alternancia user/model del historial (elimina turnos consecutivos del mismo rol)', async () => {
      const sendMessage = jest.fn().mockResolvedValue({ response: { text: () => 'Ok' } });
      const startChat = setupChatModelMock(sendMessage);

      const history = [
        { role: 'user', content: 'pregunta 1' },
        { role: 'user', content: 'pregunta 2 duplicada' },
        { role: 'ai', content: 'respuesta 1' },
      ];

      await geminiService.chatWithGemini(history, 'Dev', 'nuevo mensaje', null, null);

      const sanitized = startChat.mock.calls[0][0].history;
      const roles = sanitized.map((t) => t.role);
      // system(user), saludo(model), user(preg1), model(resp1) — el segundo user se descarta
      expect(roles).toEqual(['user', 'model', 'user', 'model']);
    });

    it('elimina el último turno user del historial para no romper la regla de alternancia', async () => {
      const sendMessage = jest.fn().mockResolvedValue({ response: { text: () => 'Ok' } });
      const startChat = setupChatModelMock(sendMessage);

      const history = [
        { role: 'user', content: 'hola' },
        { role: 'ai', content: 'hola, ¿qué tal?' },
        { role: 'user', content: 'mi respuesta' }, // último user (sin respuesta de la IA)
      ];

      await geminiService.chatWithGemini(history, 'Dev', 'nuevo mensaje', null, null);

      const sanitized = startChat.mock.calls[0][0].history;
      const roles = sanitized.map((t) => t.role);
      expect(roles[roles.length - 1]).toBe('model');
    });

    it('devuelve el texto de la respuesta en éxito', async () => {
      const sendMessage = jest.fn().mockResolvedValue({ response: { text: () => 'Respuesta final' } });
      setupChatModelMock(sendMessage);

      const result = await geminiService.chatWithGemini([], 'Dev', 'msg', null, null);
      expect(result).toBe('Respuesta final');
    });

    it('reintenta una vez ante un error 429 respetando el retryDelay de la API', async () => {
      const err429 = {
        status: 429,
        errorDetails: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '5s' }],
      };
      const sendMessage = jest
        .fn()
        .mockRejectedValueOnce(err429)
        .mockResolvedValueOnce({ response: { text: () => 'Recuperado' } });
      setupChatModelMock(sendMessage);

      const promise = geminiService.chatWithGemini([], 'Dev', 'msg', null, null);
      await jest.advanceTimersByTimeAsync(7000);

      const result = await promise;
      expect(result).toBe('Recuperado');
      expect(sendMessage).toHaveBeenCalledTimes(2);
    });

    it('propaga el error cuando se agota el reintento ante 429', async () => {
      const err429 = { status: 429, errorDetails: [] };
      const sendMessage = jest.fn().mockRejectedValue(err429);
      setupChatModelMock(sendMessage);

      const promise = geminiService.chatWithGemini([], 'Dev', 'msg', null, null);
      // Adjuntar catch inmediatamente para evitar unhandled rejection con fake timers
      const result = promise.catch((e) => e);
      await jest.advanceTimersByTimeAsync(35000);

      const error = await result;
      expect(error).toMatchObject({ status: 429 });
      expect(sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateSimulationSummary', () => {
    it('parsea el JSON, limpia fences ```json y serializa feedbackSummary a string', async () => {
      const summaryJson = {
        overallScore: 72,
        feedbackSummary: {
          general: 'Buen desempeño general.',
          detailed: [{ question: 'q', answer: 'a', score: 70, feedback: 'f' }],
        },
      };
      const generateContent = jest.fn().mockResolvedValue({
        response: { text: () => '```json\n' + JSON.stringify(summaryJson) + '\n```' },
      });
      setupGenerateContentModelMock(generateContent);

      const result = await geminiService.generateSimulationSummary([
        { role: 'ai', content: '¿Cuéntame de ti?' },
        { role: 'user', content: 'Soy estudiante de ingeniería.' },
      ]);

      expect(result.overallScore).toBe(72);
      expect(typeof result.feedbackSummary).toBe('string');
      const parsed = JSON.parse(result.feedbackSummary);
      expect(parsed.general).toBe('Buen desempeño general.');
    });

    it('usa el fallback local cuando la API falla (sin 429)', async () => {
      const generateContent = jest.fn().mockRejectedValue(new Error('API error'));
      setupGenerateContentModelMock(generateContent);

      const result = await geminiService.generateSimulationSummary([
        { role: 'user', content: 'respuesta corta' },
      ]);

      expect(typeof result.overallScore).toBe('number');
      expect(result.overallScore).toBeGreaterThanOrEqual(30);
      expect(result.overallScore).toBeLessThanOrEqual(78);
      expect(typeof result.feedbackSummary).toBe('string');
    });

    it('el fallback penaliza respuestas muy cortas (< 15 palabras promedio)', async () => {
      const generateContent = jest.fn().mockRejectedValue(new Error('fail'));
      setupGenerateContentModelMock(generateContent);

      const result = await geminiService.generateSimulationSummary([
        { role: 'user', content: 'sí' },
        { role: 'user', content: 'no' },
      ]);

      expect(result.overallScore).toBeLessThanOrEqual(50);
    });
  });
});
