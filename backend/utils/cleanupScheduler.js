// utils/cleanupScheduler.js
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

/**
 * Programar una tarea para limpiar la carpeta de uploads periódicamente
 */
function scheduleCleanup() {
  // Programar la limpieza cada hora (puedes ajustar según necesidades)
  schedule.scheduleJob('0 * * * *', () => {
    console.log('Iniciando limpieza programada de la carpeta uploads...');
    cleanupUploadsFolder();
  });
  
  console.log('Limpieza programada de uploads configurada con éxito');
}

/**
 * Limpia archivos huérfanos de la carpeta uploads
 */
function cleanupUploadsFolder() {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // Verificar si la carpeta existe
    if (!fs.existsSync(uploadsDir)) {
      console.log('La carpeta uploads no existe. Creándola...');
      fs.mkdirSync(uploadsDir, { recursive: true });
      return;
    }
    
    const files = fs.readdirSync(uploadsDir);
    
    if (files.length === 0) {
      console.log('No hay archivos para limpiar en la carpeta uploads');
      return;
    }
    
    // Establecer tiempo límite (archivos más antiguos que 1 hora)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let filesDeleted = 0;
    
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      
      try {
        const stats = fs.statSync(filePath);
        
        // Si el archivo es más antiguo que el límite, eliminarlo
        if (stats.mtime < oneHourAgo) {
          fs.unlinkSync(filePath);
          filesDeleted++;
          console.log(`Archivo huérfano eliminado: ${filePath}`);
        }
      } catch (err) {
        console.error(`Error al procesar el archivo ${filePath}:`, err);
      }
    });
    
    console.log(`Limpieza completada. ${filesDeleted} archivos eliminados.`);
  } catch (err) {
    console.error('Error al limpiar la carpeta uploads:', err);
  }
}

// También exportamos la función para poder ejecutarla manualmente si es necesario
module.exports = {
  scheduleCleanup,
  cleanupUploadsFolder
};