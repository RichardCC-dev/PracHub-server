const recognizedUniversityDomains = new Map([
  ['uni.edu.pe', 'Universidad Nacional de Ingeniería'],
  ['unmsm.edu.pe', 'Universidad Nacional Mayor de San Marcos'],
  ['pucp.edu.pe', 'Pontificia Universidad Católica del Perú'],
  ['up.edu.pe', 'Universidad del Pacífico'],
  ['ulima.edu.pe', 'Universidad de Lima'],
  ['utec.edu.pe', 'Universidad de Ingeniería y Tecnología'],
  ['upc.edu.pe', 'Universidad Peruana de Ciencias Aplicadas'],
  ['esan.edu.pe', 'Universidad ESAN'],
]);

const getEmailDomain = (email) => email.split('@')[1]?.toLowerCase().trim();

const isRecognizedUniversityEmail = (email) => {
  const domain = getEmailDomain(email);
  return Boolean(domain && recognizedUniversityDomains.has(domain));
};

const getUniversityByEmail = (email) => {
  const domain = getEmailDomain(email);
  return recognizedUniversityDomains.get(domain) || null;
};

module.exports = {
  recognizedUniversityDomains,
  isRecognizedUniversityEmail,
  getUniversityByEmail,
};
