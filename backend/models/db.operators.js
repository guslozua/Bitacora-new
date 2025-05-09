// models/db.operators.js
const Op = {
  eq: 'eq',         // igual a
  ne: 'ne',         // no igual a
  gt: 'gt',         // mayor que
  gte: 'gte',       // mayor o igual que
  lt: 'lt',         // menor que
  lte: 'lte',       // menor o igual que
  in: 'in',         // en un array
  notIn: 'notIn',   // no en un array
  between: 'between', // entre dos valores
  like: 'like',     // patrón LIKE SQL
  notLike: 'notLike', // patrón NOT LIKE SQL
  iLike: 'iLike',   // patrón ILIKE (case insensitive)
  notILike: 'notILike', // patrón NOT ILIKE
  startsWith: 'startsWith', // comienza con
  endsWith: 'endsWith',     // termina con
  substring: 'substring',   // contiene subcadena
  or: 'or',         // operador OR
  and: 'and'        // operador AND
};

module.exports = {
  Op
};