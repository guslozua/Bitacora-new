import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Button, Badge, Alert, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

// Interfaces actualizadas para el glosario
interface Categoria {
  id: number;
  nombre: string;
  color: string;
}

interface TerminoGlosario {
  id: number;
  termino: string;
  definicion: string;
  categoria_id: number;
  categoria_nombre?: string;
  categoria_color?: string;
  fecha_creacion: string;
  creado_por: string;
}

const Glosario = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [terminos, setTerminos] = useState<TerminoGlosario[]>([]);
  const [terminosFiltrados, setTerminosFiltrados] = useState<TerminoGlosario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [letraActiva, setLetraActiva] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTermino, setSelectedTermino] = useState<TerminoGlosario | null>(null);
  const [expandedTexts, setExpandedTexts] = useState<{[key: number]: boolean}>({});
  const [formTermino, setFormTermino] = useState({
    termino: '',
    definicion: '',
    categoria_id: ''
  });

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Función para alternar la visualización completa del texto
  const toggleExpandText = (terminoId: number) => {
    setExpandedTexts((prev) => ({
      ...prev,
      [terminoId]: !prev[terminoId]
    }));
  };

  // Alfabeto con el símbolo # agregado para filtrar términos numéricos
  const alfabeto = ['#', ...('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''))];

  // Función para obtener todas las categorías
  const fetchCategorias = async () => {
    setLoadingCategorias(true);
    try {
      const res = await axios.get('http://localhost:5000/api/glosario/categorias');
      setCategorias(res.data);
      setLoadingCategorias(false);
      return res.data;
    } catch (err) {
      console.error('Error fetching categories:', err);
      setLoadingCategorias(false);
      return [];
    }
  };

  // ✨ FUNCIÓN MEJORADA PARA ORDENAR TÉRMINOS (NUMÉRICOS AL FINAL)
  const ordenarTerminos = (terminos: TerminoGlosario[]) => {
    return terminos.sort((a, b) => {
      const aEsNumerico = /^[0-9]/.test(a.termino);
      const bEsNumerico = /^[0-9]/.test(b.termino);
      
      // Si uno es numérico y el otro no, el numérico va al final
      if (aEsNumerico && !bEsNumerico) return 1;
      if (!aEsNumerico && bEsNumerico) return -1;
      
      // Si ambos son numéricos, ordenar numéricamente
      if (aEsNumerico && bEsNumerico) {
        const numeroA = parseInt(a.termino.match(/^\d+/)?.[0] || '0');
        const numeroB = parseInt(b.termino.match(/^\d+/)?.[0] || '0');
        return numeroA - numeroB;
      }
      
      // Si ambos son alfabéticos, ordenar alfabéticamente
      return a.termino.toLowerCase().localeCompare(b.termino.toLowerCase(), 'es', {
        sensitivity: 'base',
        numeric: true
      });
    });
  };

  // Función para obtener todos los términos del glosario
  const fetchTerminos = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/glosario');
      
      // Asegurarse de que todas las entradas tengan la información de color
      let terminosConCategorias = res.data;
      if (categorias.length > 0) {
        terminosConCategorias = res.data.map((term: TerminoGlosario) => {
          if (term.categoria_id) {
            const categoriaEncontrada = categorias.find(cat => cat.id === term.categoria_id);
            if (categoriaEncontrada) {
              return {
                ...term,
                categoria_color: categoriaEncontrada.color,
                categoria_nombre: categoriaEncontrada.nombre
              };
            }
          }
          return term;
        });
      }
      
      // Ordenar términos
      const terminosOrdenados = ordenarTerminos(terminosConCategorias);
      setTerminos(terminosOrdenados);
      
      // Aplicar filtros actuales
      const terminosFiltrados = aplicarFiltros(terminosOrdenados, letraActiva, categoriaActiva, searchTerm);
      setTerminosFiltrados(terminosFiltrados);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
      Swal.fire({
        title: 'Error',
        text: 'Error al cargar los términos del glosario',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Función para comprobar si un término comienza con número
  const comienzaConNumero = (termino: string) => {
    return /^[0-9]/.test(termino);
  };

  // Función para filtrar por letra
  const filtrarPorLetra = (letra: string) => {
    if (letra === letraActiva) {
      // Si la letra ya está activa, desactivarla
      setLetraActiva('');
      const terminosFiltrados = aplicarFiltros(terminos, '', categoriaActiva, searchTerm);
      setTerminosFiltrados(terminosFiltrados);
    } else {
      setLetraActiva(letra);
      const terminosFiltrados = aplicarFiltros(terminos, letra, categoriaActiva, searchTerm);
      setTerminosFiltrados(terminosFiltrados);
    }
  };

  // Función para filtrar por categoría
  const filtrarPorCategoria = (categoriaId: number | null) => {
    if (categoriaId === categoriaActiva) {
      // Si la categoría ya está activa, desactivarla
      setCategoriaActiva(null);
      const terminosFiltrados = aplicarFiltros(terminos, letraActiva, null, searchTerm);
      setTerminosFiltrados(terminosFiltrados);
    } else {
      setCategoriaActiva(categoriaId);
      const terminosFiltrados = aplicarFiltros(terminos, letraActiva, categoriaId, searchTerm);
      setTerminosFiltrados(terminosFiltrados);
    }
  };

  // Función simplificada para aplicar todos los filtros
  const aplicarFiltros = (todosTerminos: TerminoGlosario[], letra: string, categoriaId: number | null, busqueda: string) => {
    let resultado = [...todosTerminos];
    
    // 1. Filtrar registros válidos
    resultado = resultado.filter(term => term.id && term.id > 0 && term.termino && term.termino.trim());
    
    // 2. Filtrar por letra si existe
    if (letra && letra.trim()) {
      if (letra === '#') {
        resultado = resultado.filter(term => /^[0-9]/.test(term.termino.trim()));
      } else {
        resultado = resultado.filter(term => {
          const terminoLimpio = term.termino.trim().toUpperCase();
          const letraLimpia = letra.toUpperCase();
          return terminoLimpio.startsWith(letraLimpia);
        });
      }
    }
    
    // 3. Filtrar por categoría si existe
    if (categoriaId !== null) {
      resultado = resultado.filter(term => term.categoria_id === categoriaId);
    }
    
    // 4. Filtrar por búsqueda si existe
    if (busqueda && busqueda.trim()) {
      const busquedaLimpia = busqueda.toLowerCase().trim();
      resultado = resultado.filter(term => 
        term.termino.toLowerCase().includes(busquedaLimpia) ||
        term.definicion.toLowerCase().includes(busquedaLimpia)
      );
    }
    
    // 5. Ordenar resultado final
    return ordenarTerminos(resultado);
  };



  // Función para filtrar por término de búsqueda
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Aplicar todos los filtros con el nuevo término de búsqueda
    const terminosFiltrados = aplicarFiltros(terminos, letraActiva, categoriaActiva, value);
    setTerminosFiltrados(terminosFiltrados);
  };

  // Actualizar filtros cuando cambien los términos base
  useEffect(() => {
    if (terminos.length > 0) {
      const terminosFiltrados = aplicarFiltros(terminos, letraActiva, categoriaActiva, searchTerm);
      setTerminosFiltrados(terminosFiltrados);
    }
  }, [terminos]);

  // Manejar cambio en formulario de término
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormTermino(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Abrir modal para crear nuevo término
  const handleNewTermino = () => {
    setSelectedTermino(null);
    setFormTermino({
      termino: '',
      definicion: '',
      categoria_id: ''
    });
    setShowModal(true);
  };

  // Abrir modal para editar un término existente
  const handleEditTermino = (termino: TerminoGlosario) => {
    setSelectedTermino(termino);
    setFormTermino({
      termino: termino.termino,
      definicion: termino.definicion,
      categoria_id: termino.categoria_id?.toString() || ''
    });
    setShowModal(true);
  };

  // Función para guardar un término (nuevo o actualizado)
  const handleSaveTermino = async () => {
    // Validación de campos obligatorios
    if (!formTermino.termino?.trim() || !formTermino.definicion?.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'El término y la definición son obligatorios',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    try {
      // Obtener el usuario actual del localStorage (ajustar según tu implementación)
      const usuario = JSON.parse(localStorage.getItem('user') || '{}');
      
      const payload = {
        termino: formTermino.termino.trim(),
        definicion: formTermino.definicion.trim(),
        categoria_id: formTermino.categoria_id ? parseInt(formTermino.categoria_id) : null
      };
      
      if (selectedTermino) {
        // Actualizar término existente
        await axios.put(`http://localhost:5000/api/glosario/${selectedTermino.id}`, payload);
        
        Swal.fire({
          title: '¡Éxito!',
          text: 'Término actualizado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Crear nuevo término
        await axios.post('http://localhost:5000/api/glosario', {
          ...payload,
          creado_por: usuario.username || 'Usuario'
        });
        
        Swal.fire({
          title: '¡Éxito!',
          text: 'Término agregado correctamente al glosario',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
      
      // Limpiar el formulario y ocultar el modal
      setFormTermino({
        termino: '',
        definicion: '',
        categoria_id: ''
      });
      setShowModal(false);
      
      // Recargar los términos
      fetchTerminos();
    } catch (err: any) {
      console.error('Error saving term:', err);
      
      let errorMessage = selectedTermino 
        ? 'Error al actualizar el término' 
        : 'Error al agregar el término al glosario';
      
      // Manejar errores específicos del backend
      if (err.response?.status === 409) {
        errorMessage = err.response.data.message || 'El término ya existe en el glosario';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Función para eliminar un término
  const handleDeleteTermino = (termino: TerminoGlosario) => {
    Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar el término "${termino.termino}" del glosario?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:5000/api/glosario/${termino.id}`);
          
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El término ha sido eliminado correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          
          // Recargar términos
          fetchTerminos();
        } catch (err) {
          console.error('Error deleting term:', err);
          Swal.fire({
            title: 'Error',
            text: 'Error al eliminar el término',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      }
    });
  };


  const getTerminosPorCategoria = () => {
    const categoriaCount: { [key: number]: number } = {};
    terminosFiltrados.forEach(term => {
      const categoriaId = term.categoria_id || 0;
      categoriaCount[categoriaId] = (categoriaCount[categoriaId] || 0) + 1;
    });
    return categoriaCount;
  };

  // ✨ CARGAR TÉRMINOS Y CATEGORÍAS AL MONTAR EL COMPONENTE CON ORDENAMIENTO
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Primero obtener categorías
        const categoriasData = await fetchCategorias();
        
        // Luego obtener términos y asignarles los colores de categoría
        const res = await axios.get('http://localhost:5000/api/glosario');
        
        if (categoriasData && categoriasData.length > 0) {
          const terminosConCategorias = res.data.map((termino: TerminoGlosario) => {
            if (termino.categoria_id) {
              const categoriaEncontrada = categoriasData.find(
                (cat: Categoria) => cat.id === termino.categoria_id
              );
              
              if (categoriaEncontrada) {
                return {
                  ...termino,
                  categoria_color: categoriaEncontrada.color,
                  categoria_nombre: categoriaEncontrada.nombre
                };
              }
            }
            return termino;
          });
          
          console.log("Términos procesados:", terminosConCategorias);
          
          // ✨ APLICAR ORDENAMIENTO CON NUMÉRICOS AL FINAL
          const terminosOrdenados = ordenarTerminos(terminosConCategorias);
          setTerminos(terminosOrdenados);
          
          // Aplicar filtros iniciales (mostrar todos)
          const terminosFiltrados = aplicarFiltros(terminosOrdenados, '', null, '');
        setTerminosFiltrados(terminosFiltrados);
        } else {
          // ✨ APLICAR ORDENAMIENTO CON NUMÉRICOS AL FINAL
          const terminosOrdenados = ordenarTerminos(res.data);
          setTerminos(terminosOrdenados);
          
          // Aplicar filtros iniciales (mostrar todos)
          const terminosFiltrados = aplicarFiltros(terminosOrdenados, '', null, '');
          setTerminosFiltrados(terminosFiltrados);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    
    setLoading(true);
    fetchData();
  }, []);

  // ✨ ACTUALIZAR COLORES DE CATEGORÍA EN LOS TÉRMINOS CUANDO CAMBIEN LAS CATEGORÍAS (CON ORDENAMIENTO)
  useEffect(() => {
    if (categorias.length > 0 && terminos.length > 0) {
      const terminosActualizados = terminos.map((term: TerminoGlosario) => {
        if (term.categoria_id) {
          const categoriaEncontrada = categorias.find(cat => cat.id === term.categoria_id);
          if (categoriaEncontrada) {
            return {
              ...term,
              categoria_color: categoriaEncontrada.color,
              categoria_nombre: categoriaEncontrada.nombre
            };
          }
        }
        return term;
      });
      
      // ✨ APLICAR ORDENAMIENTO
      const terminosOrdenados = ordenarTerminos(terminosActualizados);
      setTerminos(terminosOrdenados);
      
      // También actualizar los filtrados manteniendo los filtros actuales
      const terminosFiltrados = aplicarFiltros(terminosOrdenados, letraActiva, categoriaActiva, searchTerm);
      setTerminosFiltrados(terminosFiltrados);
    }
  }, [categorias]);

  useEffect(() => {
    // Agregar estilos CSS para animación de tarjetas
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      .hover-effect {
        transition: transform 0.3s ease, box-shadow 0.3s ease !important;
      }
      .hover-effect:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
      }
      /* Truncar texto largo en descripción */
      .card-text-truncate {
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        position: relative;
      }
      /* Gradiente para el botón "Ver más" - Solo para texto truncado */
      .card-text-truncate::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: 100%;
        height: 20px;
        background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1));
        pointer-events: none; /* Permite hacer clic en el botón debajo del gradiente */
      }
      /* Categoría activa con efecto de pulsación */
      @keyframes pulse-border {
        0% {
          box-shadow: 0 0 0 0 rgba(255,255,255, 0.7);
        }
        70% {
          box-shadow: 0 0 0 5px rgba(255,255,255, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(255,255,255, 0);
        }
      }
      .categoria-activa {
        animation: pulse-border 2s infinite;
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Función para determinar si un color de fondo necesita texto blanco o negro
  const getContrastColor = (hexColor: string) => {
    // Si no hay color, usar negro
    if (!hexColor) return '#000000';
    
    // Convertir hex a RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calcular luminosidad
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Retornar negro para colores claros, blanco para oscuros
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const contentStyle = {
    marginLeft: sidebarCollapsed ? '80px' : '250px',
    transition: 'all 0.3s',
    width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)',
    display: 'flex' as 'flex',
    flexDirection: 'column' as 'column',
    minHeight: '100vh',
  };

  return (
    <div className="d-flex">
      <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} onLogout={handleLogout} />

      <div style={contentStyle}>
        <Container fluid className="py-4 px-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0 fw-bold">Glosario de Términos</h2>
            <Button 
              variant="primary" 
              className="d-flex align-items-center" 
              onClick={handleNewTermino}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Agregar Término
            </Button>
          </div>

          {/* Mensaje de error */}
          {error && (
            <Alert variant="danger" className="mb-4">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              <Button
                variant="outline-danger"
                size="sm"
                className="ms-3"
                onClick={fetchTerminos}
              >
                Reintentar
              </Button>
            </Alert>
          )}

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              {/* Buscador */}
              <Row className="mb-4">
                <Col md={6} className="mx-auto">
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Buscar término..."
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </InputGroup>
                </Col>
              </Row>

              {/* Información de resultados */}
              <div className="text-center mb-3">
                <span className="text-muted">
                  {terminosFiltrados.length} {terminosFiltrados.length === 1 ? 'término encontrado' : 'términos encontrados'}
                  {letraActiva && ` para "${letraActiva === '#' ? 'números' : letraActiva}"`}
                  {categoriaActiva !== null && ` en categoría "${categorias.find(c => c.id === categoriaActiva)?.nombre || 'Desconocida'}"`}
                </span>
              </div>

              {/* Filtro alfabético */}
              <div className="d-flex flex-wrap justify-content-center mb-4">
                {alfabeto.map(letra => (
                  <span
                    key={letra}
                    className={`badge ${letraActiva === letra ? 'bg-primary' : 'bg-light text-dark'} m-1`}
                    style={{ 
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: letraActiva === letra ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                      transition: 'all 0.2s ease-in-out',
                      borderRadius: '50%'
                    }}
                    onClick={() => filtrarPorLetra(letra)}
                  >
                    {letra}
                  </span>
                ))}
              </div>
              
              {/* Filtro por categorías */}
              {!loadingCategorias && categorias.length > 0 && (
                <div className="d-flex flex-wrap justify-content-center mb-4">
                  {categorias.map(categoria => (
                    <span
                      key={categoria.id}
                      className="badge rounded-pill m-1"
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: categoria.color,
                        color: getContrastColor(categoria.color),
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        padding: '6px 12px',
                        minWidth: '80px',
                        textAlign: 'center',
                        boxShadow: categoriaActiva === categoria.id ? '0 4px 8px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.15)',
                        opacity: categoriaActiva === categoria.id ? 1 : 0.7,
                        transform: categoriaActiva === categoria.id ? 'scale(1.1)' : 'scale(1)',
                        border: categoriaActiva === categoria.id ? '2px solid #fff' : 'none',
                        transition: 'all 0.2s ease-in-out',
                        position: 'relative'
                      }}
                      onClick={() => filtrarPorCategoria(categoria.id)}
                    >
                      {categoriaActiva === categoria.id && (
                        <i 
                          className="bi bi-check-circle-fill" 
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            backgroundColor: '#fff',
                            borderRadius: '50%',
                            fontSize: '16px',
                            color: '#28a745'
                          }}
                        ></i>
                      )}
                      {categoria.nombre}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Resultados */}
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Cargando términos...</p>
                </div>
              ) : terminosFiltrados.length > 0 ? (
                <Row className="g-4">
                  {terminosFiltrados.map((termino) => (
                    <Col md={6} lg={4} key={termino.id}>
                      <Card className="h-100 border-0 shadow-sm hover-effect">
                        <Card.Body>
                          <div className="mb-2">
                            <h5 className="fw-bold mb-2">{termino.termino}</h5>
                            {termino.categoria_nombre && (
                              <span 
                                className="badge rounded-pill"
                                style={{
                                  backgroundColor: `${termino.categoria_color || '#0d6efd'}`, 
                                  color: getContrastColor(termino.categoria_color || '#0d6efd'),
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  padding: '4px 10px',
                                  marginBottom: '8px',
                                  display: 'inline-block'
                                }}
                              >
                                {termino.categoria_nombre}
                              </span>
                            )}
                          </div>
                          <div className="position-relative">
                            <Card.Text 
                              className={expandedTexts[termino.id] || termino.definicion.length <= 150 ? "" : "card-text-truncate"} 
                              style={{ whiteSpace: 'pre-line' }}
                            >
                              {termino.definicion}
                            </Card.Text>
                            {termino.definicion.length > 150 && (
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-0 text-decoration-none"
                                onClick={() => toggleExpandText(termino.id)}
                                style={{ position: expandedTexts[termino.id] ? 'static' : 'absolute', bottom: '0', right: '0', backgroundColor: 'white' }}
                              >
                                {expandedTexts[termino.id] ? 'Ver menos' : 'Ver más...'}
                              </Button>
                            )}
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <div className="text-muted small">
                              {/* <div>Creado por: {termino.creado_por}</div> */}
                              {/* <div>Fecha: {new Date(termino.fecha_creacion).toLocaleDateString()}</div> */}
                            </div>
                            <div>
                              <Button 
                                variant="light" 
                                size="sm" 
                                className="me-1 border-0"
                                onClick={() => handleEditTermino(termino)}
                              >
                                <i className="bi bi-pencil text-primary"></i>
                              </Button>
                              <Button 
                                variant="light" 
                                size="sm"
                                className="border-0"
                                onClick={() => handleDeleteTermino(termino)}
                              >
                                <i className="bi bi-trash text-danger"></i>
                              </Button>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-search fs-1 text-muted mb-3"></i>
                  <p className="text-muted">No se encontraron términos que coincidan con tu búsqueda</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* Modal para agregar/editar término */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedTermino ? 'Editar Término' : 'Agregar nuevo término al glosario'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Término *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingrese el término"
                  name="termino"
                  value={formTermino.termino}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Definición *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Ingrese la definición"
                  name="definicion"
                  value={formTermino.definicion}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Categoría</Form.Label>
                <Form.Select
                  name="categoria_id"
                  value={formTermino.categoria_id}
                  onChange={handleInputChange}
                >
                  <option value="">Sin categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </Form.Select>
                {formTermino.categoria_id && (
                  <div className="mt-2">
                    <span 
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: `${categorias.find(c => c.id.toString() === formTermino.categoria_id)?.color || '#0d6efd'}`,
                        color: getContrastColor(categorias.find(c => c.id.toString() === formTermino.categoria_id)?.color || '#0d6efd'),
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        padding: '4px 10px',
                        display: 'inline-block'
                      }}
                    >
                      {categorias.find(c => c.id.toString() === formTermino.categoria_id)?.nombre || ''}
                    </span>
                  </div>
                )}
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveTermino}>
              {selectedTermino ? 'Actualizar' : 'Guardar Término'}
            </Button>
          </Modal.Footer>
        </Modal>

        <Footer />
      </div>
    </div>
  );
};

export default Glosario;