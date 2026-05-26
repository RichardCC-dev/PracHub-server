-- Insertar ofertas de prueba (requiere tener al menos 1 empresa creada)
-- Reemplaza el company_id (1) con el ID real de una empresa de tu BD

INSERT INTO offers (company_id, title, description, requirements, area, career_tags, modality, duration, compensation, status, created_at, updated_at) 
VALUES 
(1, 'Practicante de Desarrollo Web', 'Buscamos estudiante de ingeniería para prácticas pre-profesionales en desarrollo frontend con React.', 'Conocimientos en HTML, CSS, JavaScript. Deseable experiencia con React.', 'Tecnología', '["Ingeniería de Software", "Sistemas"]', 'remote', '6 meses', 'S/ 1,200 mensual', 'pending', NOW() - INTERVAL 2 DAY, NOW()),

(1, 'Practicante de Marketing Digital', 'Apoyo en gestión de redes sociales, campañas de email marketing y análisis de métricas.', 'Estudiante de marketing o comunicaciones. Creatividad y redacción.', 'Marketing', '["Marketing", "Comunicaciones"]', 'hybrid', '4 meses', 'S/ 1,000 mensual', 'pending', NOW() - INTERVAL 25 HOUR, NOW()),

(1, 'Practicante de Recursos Humanos', 'Apoyo en procesos de selección, onboarding y clima organizacional.', 'Estudiante de administración o psicología. Buena comunicación interpersonal.', 'RRHH', '["Administración", "Psicología"]', 'in_person', '6 meses', 'S/ 900 mensual', 'pending', NOW() - INTERVAL 50 HOUR, NOW()),

(1, 'Practicante de Finanzas', 'Análisis de estados financieros, proyecciones y apoyo en presupuestos.', 'Excel avanzado, conocimientos de contabilidad. Estudiante de contabilidad o economía.', 'Finanzas', '["Contabilidad", "Economía"]', 'in_person', '3 meses', 'S/ 1,100 mensual', 'pending', NOW(), NOW());
