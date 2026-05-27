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
