const { Simulation, Student } = require('../models');
const geminiService = require('../services/geminiService');

exports.startSimulation = async (req, res) => {
  try {
    const { simulatedRole, career, sector } = req.body;
    const userId = req.user.id;

    const student = await Student.findOne({ where: { userId } });
    if (!student) {
      return res.status(404).json({ error: 'Perfil de estudiante no encontrado' });
    }

    // Mensaje inicial de la IA (visible en el chat)
    const initialAiMessage = {
      role: 'ai',
      content: `Hola, soy Marco. Gracias por tomarte el tiempo. Para la posición de ${simulatedRole}, te haré algunas preguntas para conocerte mejor. Para empezar, ¿puedes presentarte brevemente y contarme qué te motivó a postular a esta área?`
    };

    const simulation = await Simulation.create({
      studentId: student.id,
      simulatedRole,
      career: career || null,
      sector: sector || null,
      status: 'in_progress',
      chatHistory: [initialAiMessage],
    });

    res.status(201).json({ simulation });
  } catch (error) {
    console.error('Error starting simulation:', error);
    res.status(500).json({ error: 'Error al iniciar la simulación' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const student = await Student.findOne({ where: { userId } });
    
    const simulation = await Simulation.findOne({ 
      where: { id, studentId: student.id } 
    });

    if (!simulation) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }

    if (simulation.status === 'completed') {
      return res.status(400).json({ error: 'La simulación ya está finalizada' });
    }

    // Agregar mensaje del usuario al historial
    const userMsg = { role: 'user', content: message };
    const currentHistory = simulation.chatHistory || [];
    
    // Obtener respuesta de Gemini (pasamos career y sector si existen)
    const aiResponseText = await geminiService.chatWithGemini(
      currentHistory,
      simulation.simulatedRole,
      message,
      simulation.career,
      simulation.sector
    );
    
    const aiMsg = { role: 'ai', content: aiResponseText };
    
    const newHistory = [...currentHistory, userMsg, aiMsg];
    
    simulation.chatHistory = newHistory;
    await simulation.save();

    res.json({ simulation, aiResponse: aiMsg });
  } catch (error) {
    console.error('Error sending message [status=%s]:', error.status || 'N/A', error.message || error);
    if (error.status === 429) {
      // Guardar el mensaje del usuario y responder con mensaje de espera
      // para no perder el turno del candidato
      try {
        const waitMsg = { 
          role: 'ai', 
          content: 'Un momento, estoy procesando tu respuesta. Por favor, envía tu mensaje nuevamente en unos segundos.' 
        };
        const currentHistory = simulation?.chatHistory || [];
        simulation.chatHistory = [...currentHistory, { role: 'user', content: req.body.message }, waitMsg];
        await simulation.save();
        return res.json({ simulation, aiResponse: waitMsg, rateLimited: true });
      } catch (_) {}
      return res.status(429).json({ error: 'El servicio de IA está ocupado. Espera unos segundos y reenvía tu mensaje.' });
    }
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};

exports.endSimulation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const student = await Student.findOne({ where: { userId } });
    
    const simulation = await Simulation.findOne({ 
      where: { id, studentId: student.id } 
    });

    if (!simulation) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }

    if (simulation.status === 'completed') {
      return res.status(400).json({ error: 'La simulación ya está finalizada' });
    }

    // Regla: Mínimo 5 minutos de simulación
    const fiveMinutesInMs = 5 * 60 * 1000;
    const timeElapsed = new Date() - new Date(simulation.createdAt);
    
    if (timeElapsed < fiveMinutesInMs) {
      const remaining = Math.ceil((fiveMinutesInMs - timeElapsed) / 60000);
      return res.status(400).json({ 
        error: `La conversación es muy corta para generar un análisis confiable. Continúa la entrevista ${remaining} minuto${remaining > 1 ? 's' : ''} más para desbloquear tu puntuación y retroalimentación.`
      });
    }

    // Generar resumen con IA
    const summary = await geminiService.generateSimulationSummary(simulation.chatHistory);
    
    simulation.overallScore = summary.overallScore;
    simulation.aiFeedbackSummary = summary.feedbackSummary;
    simulation.status = 'completed';
    await simulation.save();

    res.json({ simulation });
  } catch (error) {
    console.error('Error ending simulation:', error);
    res.status(500).json({ error: 'Error al finalizar la simulación' });
  }
};

exports.getSimulationsHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({ where: { userId } });

    if (!student) {
      return res.status(404).json({ error: 'Perfil de estudiante no encontrado' });
    }

    const simulations = await Simulation.findAll({
      where: { studentId: student.id },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'simulatedRole', 'overallScore', 'status', 'createdAt', 'updatedAt']
    });

    res.json({ simulations });
  } catch (error) {
    console.error('Error fetching simulations history:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

exports.getSimulationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await Student.findOne({ where: { userId } });

    if (!student) {
      return res.status(404).json({ error: 'Perfil de estudiante no encontrado' });
    }

    const { Sequelize } = require('sequelize');

    const completedSims = await Simulation.findAll({
      where: { studentId: student.id, status: 'completed' },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'simulatedRole', 'sector', 'overallScore', 'createdAt'],
    });

    const totalSessions = await Simulation.count({ where: { studentId: student.id } });
    const completedCount = completedSims.length;

    if (completedCount === 0) {
      return res.json({
        stats: {
          totalSessions,
          completedSessions: 0,
          averageScore: null,
          highestScore: null,
          lowestScore: null,
          trend: [],
          roleBreakdown: [],
          bestRole: null,
          worstRole: null,
        }
      });
    }

    const scores = completedSims.map(s => s.overallScore).filter(s => s != null);
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
    const highestScore = scores.length > 0 ? Math.max(...scores) : null;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : null;

    // Tendencia: últimas 8 sesiones completadas
    const trendSims = completedSims.slice(-8);
    const trend = trendSims.map(s => ({
      id: s.id,
      role: s.simulatedRole,
      score: s.overallScore,
      date: s.createdAt,
    }));

    // Desglose por rol
    const roleMap = {};
    completedSims.forEach(s => {
      const key = s.simulatedRole;
      if (!roleMap[key]) roleMap[key] = { role: key, scores: [], count: 0 };
      if (s.overallScore != null) {
        roleMap[key].scores.push(s.overallScore);
        roleMap[key].count++;
      }
    });

    const roleBreakdown = Object.values(roleMap).map(r => ({
      role: r.role,
      sessions: r.count,
      averageScore: r.scores.length > 0
        ? Math.round(r.scores.reduce((a, b) => a + b, 0) / r.scores.length)
        : null,
    })).sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0));

    const bestRole = roleBreakdown[0] || null;
    const worstRole = roleBreakdown.length > 1 ? roleBreakdown[roleBreakdown.length - 1] : null;

    res.json({
      stats: {
        totalSessions,
        completedSessions: completedCount,
        averageScore,
        highestScore,
        lowestScore,
        trend,
        roleBreakdown,
        bestRole,
        worstRole,
      }
    });
  } catch (error) {
    console.error('Error fetching simulation stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de progreso' });
  }
};

exports.getSimulationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const student = await Student.findOne({ where: { userId } });
    
    const simulation = await Simulation.findOne({ 
      where: { id, studentId: student.id } 
    });

    if (!simulation) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }

    res.json({ simulation });
  } catch (error) {
    console.error('Error fetching simulation details:', error);
    res.status(500).json({ error: 'Error al obtener detalles de la simulación' });
  }
};
