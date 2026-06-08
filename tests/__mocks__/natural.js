// Mock de `natural` para el entorno de tests (evita parsear dependencias ESM)
const natural = {
  TfIdf: jest.fn().mockImplementation(() => ({
    addDocument: jest.fn(),
    listTerms: jest.fn().mockReturnValue([]),
  })),
  WordTokenizer: jest.fn().mockImplementation(() => ({
    tokenize: jest.fn().mockReturnValue([]),
  })),
  SentimentAnalyzer: jest.fn().mockImplementation(() => ({
    getSentiment: jest.fn().mockReturnValue(0),
  })),
  PorterStemmer: { stem: jest.fn((w) => w) },
};

module.exports = natural;
