// Test básico sin conexión externa
static async testConnectionMock(req, res) {
  try {
    console.log('🔍 Test básico de configuración de Aternity...');
    
    res.json({
      success: true,
      message: 'Configuración de Aternity verificada',
      details: {
        url: ATERNITY_BASE_URL,
        user: ATERNITY_USER,
        passwordConfigured: !!ATERNITY_PASSWORD,
        status: 'Mock test - sin conexión externa'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en configuración',
      error: error.message
    });
  }
}