// models/incidente-codigo.model.js
const db = require('../config/db');
const { DataTypes } = require('sequelize');
const Incidente = require('./incidente.model');
const Codigo = require('./codigo.model');

// Modelo para la relación entre incidentes y códigos de facturación
const IncidenteCodigo = db.define('incidentes_codigos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_incidente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Incidente,
      key: 'id'
    }
  },
  id_codigo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Codigo,
      key: 'id'
    }
  },
  minutos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  importe: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'creado',
  updatedAt: 'actualizado',
  tableName: 'incidentes_codigos'
});

// Establecer relaciones
IncidenteCodigo.belongsTo(Incidente, {
  foreignKey: 'id_incidente',
  as: 'incidente'
});

IncidenteCodigo.belongsTo(Codigo, {
  foreignKey: 'id_codigo',
  as: 'codigo'
});

Incidente.hasMany(IncidenteCodigo, {
  foreignKey: 'id_incidente',
  as: 'codigos'
});

Codigo.hasMany(IncidenteCodigo, {
  foreignKey: 'id_codigo',
  as: 'incidentes'
});

module.exports = IncidenteCodigo;