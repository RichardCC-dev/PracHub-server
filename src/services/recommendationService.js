const natural = require('natural');
const { Resume, Offer, Student, Company } = require('../models');
const logger = require('../utils/logger');

const COMPATIBILITY_THRESHOLD = 40;

class RecommendationService {
  constructor() {
    this.TfIdf = natural.TfIdf;
  }

  // ==========================================
  // INTEGRANTE 1: Vectorización del Estudiante
  // ==========================================
  async buildStudentTextProfile(studentId) {
    const resume = await Resume.findOne({
      where: { studentId },
      include: [{ model: Student, as: 'student' }]
    });

    if (!resume) {
      throw new Error('El estudiante no tiene un CV registrado');
    }

    const { student, profile, skills, experience, education, languages, projects, certifications } = resume;

    // Extraer texto relevante del estudiante
    const textComponents = [
      student.career || '',
      student.university || '',
      student.bio || '',
      profile?.summary || ''
    ];

    // Extraer skills
    if (skills && Array.isArray(skills.areas)) {
      skills.areas.forEach(area => {
        if (area.skills) textComponents.push(area.skills);
        if (area.area) textComponents.push(area.area);
      });
    }
    if (skills && skills.soft) textComponents.push(skills.soft);

    // Extraer idiomas
    if (languages && languages.list) {
      textComponents.push(languages.list);
    }

    // Extraer educación (manejando el objeto items)
    if (education && Array.isArray(education.items)) {
      education.items.forEach(edu => {
        if (edu.degree) textComponents.push(edu.degree);
        if (edu.institution) textComponents.push(edu.institution);
      });
    } else if (education && Array.isArray(education)) {
      education.forEach(edu => {
        if (edu.degree) textComponents.push(edu.degree);
        if (edu.fieldOfStudy) textComponents.push(edu.fieldOfStudy);
      });
    }

    // Extraer experiencia (manejando el objeto items)
    if (experience && Array.isArray(experience.items)) {
      experience.items.forEach(exp => {
        if (exp.role) textComponents.push(exp.role);
        if (exp.company) textComponents.push(exp.company);
        if (exp.description) textComponents.push(exp.description);
      });
    } else if (experience && Array.isArray(experience)) {
      experience.forEach(exp => {
        if (exp.position) textComponents.push(exp.position);
        if (exp.description) textComponents.push(exp.description);
      });
    }

    // Extraer proyectos
    if (projects && Array.isArray(projects.items)) {
      projects.items.forEach(proj => {
        if (proj.title) textComponents.push(proj.title);
        if (proj.description) textComponents.push(proj.description);
      });
    }

    // Extraer certificaciones
    if (certifications && Array.isArray(certifications.items)) {
      certifications.items.forEach(cert => {
        if (cert.name) textComponents.push(cert.name);
        if (cert.issuer) textComponents.push(cert.issuer);
      });
    }

    // Limpiar y unir el texto
    const rawText = textComponents.join(' ').toLowerCase();
    
    // Tokenización y limpieza de stop words básica
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(rawText);
    
    return tokens.join(' ');
  }

  // ==========================================
  // INTEGRANTE 3: Vectorización de Ofertas
  // ==========================================
  async buildOfferTextProfile(offer) {
    const textComponents = [
      offer.title || '',
      offer.description || '',
      offer.requirements || '',
      offer.area || ''
    ];

    if (offer.careerTags && Array.isArray(offer.careerTags)) {
      textComponents.push(offer.careerTags.join(' '));
    }

    const rawText = textComponents.join(' ').toLowerCase();
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(rawText);

    return tokens.join(' ');
  }

  // ==========================================
  // INTEGRANTE 2: Motor de Similitud (Matching)
  // ==========================================
  
  /**
   * Calcula el score de compatibilidad entre un estudiante y una oferta individual
   * Usa la misma lógica que calculateSimilarityScores para consistencia
   */
  async calculateCompatibilityScore(studentId, offer) {
    try {
      const studentTextProfile = await this.buildStudentTextProfile(studentId);
      const offerTextProfile = await this.buildOfferTextProfile(offer);

      const tfidf = new this.TfIdf();
      tfidf.addDocument(studentTextProfile);
      tfidf.addDocument(offerTextProfile);

      const studentVector = this.getTfIdfVector(tfidf, 0);
      const offerVector = this.getTfIdfVector(tfidf, 1);
      const similarity = this.cosineSimilarity(studentVector, offerVector);

      return Math.round(similarity * 100);
    } catch (error) {
      logger.error('Error calculando compatibilidad individual:', error);
      return 0;
    }
  }

  async calculateSimilarityScores(studentText, offers) {
    const tfidf = new this.TfIdf();

    // Documento 0: Perfil del estudiante
    tfidf.addDocument(studentText);

    // Documentos 1-N: Ofertas
    for (const offer of offers) {
      const offerText = await this.buildOfferTextProfile(offer);
      tfidf.addDocument(offerText);
    }

    // Calcular similitud del coseno usando los vectores TF-IDF
    const studentVector = this.getTfIdfVector(tfidf, 0);
    
    const results = [];
    
    // Evaluamos las ofertas (índices 1 a N)
    for (let i = 0; i < offers.length; i++) {
      const offerVector = this.getTfIdfVector(tfidf, i + 1);
      const similarity = this.cosineSimilarity(studentVector, offerVector);
      
      // Convertir a porcentaje (0-100)
      const matchScore = Math.round(similarity * 100);
      
      results.push({
        offer: offers[i],
        matchScore
      });
    }

    // Filtrar por umbral y ordenar de mayor a menor score
    return results
      .filter(r => r.matchScore >= COMPATIBILITY_THRESHOLD)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  // Métodos auxiliares matemáticos
  getTfIdfVector(tfidf, documentIndex) {
    const vector = {};
    const terms = tfidf.listTerms(documentIndex);
    terms.forEach(item => {
      vector[item.term] = item.tfidf;
    });
    return vector;
  }

  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    // Obtener todos los términos únicos
    const allTerms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

    for (const term of allTerms) {
      const v1 = vec1[term] || 0;
      const v2 = vec2[term] || 0;
      
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  // Endpoint principal
  async getRecommendedOffers(studentId) {
    try {
      // 1. Integrante 1 obtiene el texto del estudiante
      const studentTextProfile = await this.buildStudentTextProfile(studentId);

      // 2. Traemos las ofertas activas
      const activeOffers = await Offer.findAll({
        where: { status: 'approved' },
        include: [
          {
            model: Company,
            as: 'company',
            attributes: ['id', 'legalName', 'tradeName', 'logoUrl'],
          },
        ],
      });

      if (activeOffers.length === 0) return [];

      // 3. Integrante 2 y 3 calculan los scores
      const recommendations = await this.calculateSimilarityScores(studentTextProfile, activeOffers);

      return recommendations;
    } catch (error) {
      logger.error('Error en getRecommendedOffers:', error);
      throw error;
    }
  }
}

const instance = new RecommendationService();
instance.COMPATIBILITY_THRESHOLD = COMPATIBILITY_THRESHOLD;

module.exports = instance;
