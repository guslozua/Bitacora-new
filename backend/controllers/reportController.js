//controllers/reportController.js
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');

// Generar reporte en PDF
const generatePDFReport = async (req, res) => {
    const doc = new PDFDocument();
    res.setHeader('Content-Disposition', 'attachment; filename=reporte.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    
    doc.fontSize(18).text('Reporte de Tareas', { align: 'center' });
    doc.moveDown();

    try {
        const [results] = await db.query('SELECT * FROM Tareas');
        results.forEach(task => {
            doc.fontSize(12).text(`ID: ${task.id} - Título: ${task.titulo} - Estado: ${task.estado}`);
        });
        doc.end();
    } catch (err) {
        console.error('Error en generación de PDF:', err);
        res.status(500).json({ message: 'Error generando reporte' });
    }
};

// Generar reporte en Excel
const generateExcelReport = async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tareas');
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Título', key: 'titulo', width: 30 },
        { header: 'Estado', key: 'estado', width: 15 }
    ];
    
    try {
        const [results] = await db.query('SELECT * FROM Tareas');
        results.forEach(task => worksheet.addRow(task));
        res.setHeader('Content-Disposition', 'attachment; filename=reporte.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Error en generación de Excel:', err);
        res.status(500).json({ message: 'Error generando reporte' });
    }
};

// Obtener estadísticas
const getStatistics = async (req, res) => {
    try {
        const stats = {};
        const [tareasStats] = await db.query('SELECT estado, COUNT(*) as cantidad FROM Tareas GROUP BY estado');
        stats.tareas = tareasStats;
        
        const [proyectosStats] = await db.query('SELECT estado, COUNT(*) as cantidad FROM Proyectos GROUP BY estado');
        stats.proyectos = proyectosStats;
        
        const [usuariosStats] = await db.query('SELECT estado, COUNT(*) as cantidad FROM Usuarios GROUP BY estado');
        stats.usuarios = usuariosStats;
        
        res.json(stats);
    } catch (err) {
        console.error('Error obteniendo estadísticas:', err);
        res.status(500).json({ message: 'Error obteniendo estadísticas', error: err.message });
    }
};

module.exports = { generatePDFReport, generateExcelReport, getStatistics };