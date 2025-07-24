import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Button, Badge, Alert, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiConfig';
import Swal from 'sweetalert2';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';

// Interfaces para los enlaces
interface Categoria {
  id: number;
  nombre: string;
  color: string;
}

interface UrlAdicional {
  id?: number;
  url: string;
  titulo: string;
  orden?: number;
}

interface Enlace {
  id: number;
  titulo: string;
  url: string;
  descripcion: string;
  categoria_id: number;
  categoria_nombre?: string;
  categoria_color?: string;
  fecha_creacion: string;
  creado_por: string;
  urls_adicionales?: UrlAdicional[];
}

const Enlaces = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [enlaces, setEnlaces] = useState<Enlace[]>([]);
  const [enlacesFiltrados, setEnlacesFiltrados] = useState<Enlace[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [letraActiva, setLetraActiva] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEnlace, setSelectedEnlace] = useState<Enlace | null>(null);
  const [expandedTexts, setExpandedTexts] = useState<{[key: number]: boolean}>({});
  const [expandedUrlLists, setExpandedUrlLists] = useState<{[key: number]: boolean}>({});
  const [overflowElements, setOverflowElements] = useState<{[key: number]: boolean}>({});
  const [formEnlace, setFormEnlace] = useState({
    titulo: '',
    url: '',
    descripcion: '',
    categoria_id: ''
  });
  const [urlsAdicionales, setUrlsAdicionales] = useState<UrlAdicional[]>([]);
  
  // Referencias para los elementos de texto
  const textRefs = useRef<{[key: number]: HTMLDivElement | null}>({});
  const urlListRefs = useRef<{[key: number]: HTMLDivElement | null}>({});

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Función para detectar si un elemento desborda su contenedor
  const checkIfOverflowing = (id: number, element: HTMLElement | null) => {
    if (element) {
      // Restauramos la altura máxima para medir correctamente si hay desbordamiento
      const originalMaxHeight = element.style.maxHeight;
      const wasInTruncateMode = element.classList.contains('card-text-truncate');
      
      // Temporalmente quitamos restricciones para medir la altura real
      if (wasInTruncateMode) {
        element.classList.remove('card-text-truncate');
      }
      element.style.maxHeight = 'none';
      
      // Medimos la altura real del contenido
      const scrollHeight = element.scrollHeight;
      const clientHeight = 105; // Altura aproximada para 4-5 líneas de texto
      
      // Restauramos el estado original
      if (wasInTruncateMode) {
        element.classList.add('card-text-truncate');
      }
      element.style.maxHeight = originalMaxHeight;
      
      // Decidimos si debe truncarse (más de 4-5 líneas)
      const isOverflowing = scrollHeight > clientHeight;
      
      // Actualizamos el estado
      setOverflowElements(prev => ({
        ...prev,
        [id]: isOverflowing
      }));
      
      return isOverflowing;
    }
    return false;
  };

  // Función para alternar la visualización completa del texto
  const toggleExpandText = (enlaceId: number) => {
    setExpandedTexts(prev => ({
      ...prev,
      [enlaceId]: !prev[enlaceId]
    }));
    
    // Si estamos colapsando el texto, verificamos si desborda después
    setTimeout(() => {
      if (textRefs.current[enlaceId]) {
        checkIfOverflowing(enlaceId, textRefs.current[enlaceId]);
      }
    }, 50);
  };

  // Función para alternar la visualización completa de la lista de URLs
  const toggleExpandUrlList = (enlaceId: number) => {
    setExpandedUrlLists(prev => ({
      ...prev,
      [enlaceId]: !prev[enlaceId]
    }));
  };

  // Alfabeto con el símbolo # agregado para filtrar enlaces numéricos
  const alfabeto = ['#', ...('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''))];

  // Función para obtener todas las categorías
  const fetchCategorias = async () => {
    setLoadingCategorias(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/enlaces/categorias`);
      setCategorias(res.data);
      setLoadingCategorias(false);
      return res.data;
    } catch (err) {
      console.error('Error fetching categories:', err);
      setLoadingCategorias(false);
      return [];
    }
  };

  // Función para obtener todos los enlaces
  const fetchEnlaces = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/enlaces`);
      
      // Asegurarse de que todas las entradas tengan la información de color
      if (categorias.length > 0) {
        const enlacesConColorCategoria = res.data.map((enlace: Enlace) => {
          if (enlace.categoria_id) {
            const categoriaEncontrada = categorias.find(cat => cat.id === enlace.categoria_id);
            if (categoriaEncontrada) {
              return {
                ...enlace,
                categoria_color: categoriaEncontrada.color,
                categoria_nombre: categoriaEncontrada.nombre
              };
            }
          }
          return enlace;
        });
        
        setEnlaces(enlacesConColorCategoria);
        setEnlacesFiltrados(enlacesConColorCategoria);
      } else {
        setEnlaces(res.data);
        setEnlacesFiltrados(res.data);
      }
      
      setLoading(false);
      
      // Programar la verificación de desbordamiento después de que se hayan renderizado los elementos
      setTimeout(checkAllOverflows, 100);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
      Swal.fire({
        title: 'Error',
        text: 'Error al cargar los enlaces',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Verificar desbordamiento para todos los elementos después de cambios
  const checkAllOverflows = () => {
    // Programar después del renderizado
    setTimeout(() => {
      // Verificar textos
      Object.keys(textRefs.current).forEach(key => {
        const id = parseInt(key);
        const element = textRefs.current[id];
        if (element) {
          checkIfOverflowing(id, element);
        }
      });
      
      // También verificar listas de URLs si es necesario
      Object.keys(urlListRefs.current).forEach(key => {
        const id = parseInt(key);
        const element = urlListRefs.current[id];
        if (element) {
          const hasOverflow = element.scrollHeight > element.clientHeight;
          // Solo marcar como desbordado si tiene más de 3 URLs
          const enlace = enlaces.find(e => e.id === id);
          if (enlace && enlace.urls_adicionales && enlace.urls_adicionales.length > 3) {
            setExpandedUrlLists(prev => ({
              ...prev,
              [id]: prev[id] || false
            }));
          }
        }
      });
    }, 300);
  };

  // Función para comprobar si un título comienza con número
  const comienzaConNumero = (titulo: string) => {
    return /^[0-9]/.test(titulo);
  };

  // Función para filtrar por letra
  const filtrarPorLetra = (letra: string) => {
    if (letra === letraActiva) {
      // Si la letra ya está activa, desactivarla y mostrar enlaces según categoría activa
      setLetraActiva('');
      applyFilters('', categoriaActiva);
    } else {
      setLetraActiva(letra);
      applyFilters(letra, categoriaActiva);
    }
  };

  // Función para filtrar por categoría
  const filtrarPorCategoria = (categoriaId: number | null) => {
    if (categoriaId === categoriaActiva) {
      // Si la categoría ya está activa, desactivarla
      setCategoriaActiva(null);
      applyFilters(letraActiva, null);
    } else {
      setCategoriaActiva(categoriaId);
      applyFilters(letraActiva, categoriaId);
    }
  };

  // Función que aplica todos los filtros (letra, categoría, búsqueda)
  const applyFilters = (letra: string, categoriaId: number | null, sourceEnlaces = enlaces) => {
    let filtered = [...sourceEnlaces];
    
    // Filtrar por letra
    if (letra) {
      if (letra === '#') {
        filtered = filtered.filter(enlace => comienzaConNumero(enlace.titulo));
      } else {
        filtered = filtered.filter(enlace => enlace.titulo.toUpperCase().startsWith(letra));
      }
    }
    
    // Filtrar por categoría
    if (categoriaId !== null) {
      filtered = filtered.filter(enlace => enlace.categoria_id === categoriaId);
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      filtered = filtered.filter(enlace => 
        enlace.titulo.toLowerCase().includes(termLower) ||
        enlace.descripcion?.toLowerCase().includes(termLower) ||
        enlace.url.toLowerCase().includes(termLower) ||
        // Buscar también en URLs adicionales
        enlace.urls_adicionales?.some(urlItem => 
          urlItem.url.toLowerCase().includes(termLower) ||
          urlItem.titulo?.toLowerCase().includes(termLower)
        )
      );
    }
    
    setEnlacesFiltrados(filtered);
    
    // Programar verificación de desbordamientos después de aplicar filtros
    setTimeout(checkAllOverflows, 100);
  };

  // Función para filtrar por término de búsqueda
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Aplicar todos los filtros
    applyFilters(letraActiva, categoriaActiva);
  };

  // Actualizar filtros cuando cambia searchTerm
  useEffect(() => {
    applyFilters(letraActiva, categoriaActiva);
  }, [searchTerm, enlaces]);

  // Manejar cambio en formulario de enlace
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormEnlace(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Agregar un campo de URL adicional
  const addUrlAdicional = () => {
    setUrlsAdicionales(prev => ([...prev, { url: '', titulo: '' }]));
  };

  // Eliminar un campo de URL adicional
  const removeUrlAdicional = (index: number) => {
    setUrlsAdicionales(prev => prev.filter((_, i) => i !== index));
  };

  // Manejar cambios en formularios de URLs adicionales
  const handleUrlAdicionalChange = (index: number, field: string, value: string) => {
    setUrlsAdicionales(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Ordenar URLs adicionales
  const moveUrlAdicional = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === urlsAdicionales.length - 1)
    ) {
      return; // No hacer nada si intentamos mover fuera de los límites
    }
    
    setUrlsAdicionales(prev => {
      const newUrls = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Intercambiar los elementos
      [newUrls[index], newUrls[targetIndex]] = [newUrls[targetIndex], newUrls[index]];
      
      return newUrls;
    });
  };

  // Abrir modal para crear nuevo enlace
  const handleNewEnlace = () => {
    setSelectedEnlace(null);
    setFormEnlace({
      titulo: '',
      url: '',
      descripcion: '',
      categoria_id: ''
    });
    setUrlsAdicionales([]);
    setShowModal(true);
  };

  // Abrir modal para editar un enlace existente
  const handleEditEnlace = (enlace: Enlace) => {
    setSelectedEnlace(enlace);
    setFormEnlace({
      titulo: enlace.titulo,
      url: enlace.url,
      descripcion: enlace.descripcion || '',
      categoria_id: enlace.categoria_id?.toString() || ''
    });
    // Cargar URLs adicionales si existen
    setUrlsAdicionales(enlace.urls_adicionales || []);
    setShowModal(true);
  };

  // Función para validar URL - Versión más permisiva para URLs internas y personalizadas
  const isValidUrl = (url: string) => {
    // Validación más permisiva que permite URLs internas/privadas
    if (url.trim() === '') return false;
    
    try {
      // Si empieza con http:// o https://, asumimos que es válida para nuestro caso
      if (url.match(/^https?:\/\//i)) {
        return true;
      }
      
      // Para URLs sin protocolo, verificamos que tenga al menos un carácter antes de /
      if (url.includes('/')) {
        const parts = url.split('/');
        return parts[0].trim().length > 0;
      }
      
      // Para URLs más simples (sólo dominio)
      return url.trim().length > 0;
    } catch (error) {
      console.error('Error validando URL:', error);
      return false;
    }
  };

  // Asegurar que la URL incluya el protocolo
  const formatUrl = (url: string) => {
    if (url && !url.match(/^[a-zA-Z]+:\/\//)) {
      return 'http://' + url;
    }
    return url;
  };

  // Validar todas las URLs (principal y adicionales)
  const validateAllUrls = () => {
    if (!isValidUrl(formEnlace.url)) {
      Swal.fire({
        title: 'Error',
        text: 'El formato de la URL principal no es válido',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return false;
    }

    // Validar URLs adicionales
    const invalidUrl = urlsAdicionales.find(item => item.url && !isValidUrl(item.url));
    if (invalidUrl) {
      Swal.fire({
        title: 'Error',
        text: `El formato de la URL adicional "${invalidUrl.url}" no es válido`,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return false;
    }

    return true;
  };

  // Función para guardar un enlace (nuevo o actualizado)
  const handleSaveEnlace = async () => {
    // Validación de campos obligatorios
    if (!formEnlace.titulo || !formEnlace.url) {
      Swal.fire({
        title: 'Error',
        text: 'El título y la URL son obligatorios',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Validar formato de todas las URLs
    if (!validateAllUrls()) {
      return;
    }

    try {
      // Obtener el usuario actual del localStorage
      const usuario = JSON.parse(localStorage.getItem('user') || '{}');
      
      const formattedUrl = formatUrl(formEnlace.url);
      
      // Preparar URLs adicionales formateadas y añadir orden basado en el índice
      const formattedUrlsAdicionales = urlsAdicionales
        .filter(item => item.url.trim() !== '') // Filtrar URLs vacías
        .map((item, index) => ({
          ...item,
          url: formatUrl(item.url),
          orden: index + 1 // Establecer orden basado en la posición en el array
        }));
      
      const payload = {
        titulo: formEnlace.titulo,
        url: formattedUrl,
        descripcion: formEnlace.descripcion,
        categoria_id: formEnlace.categoria_id ? parseInt(formEnlace.categoria_id) : null,
        urls_adicionales: formattedUrlsAdicionales
      };
      
      if (selectedEnlace) {
        // Actualizar enlace existente
        await axios.put(`${API_BASE_URL}/enlaces/${selectedEnlace.id}`, payload);
        
        Swal.fire({
          title: '¡Éxito!',
          text: 'Enlace actualizado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Crear nuevo enlace
        await axios.post(`${API_BASE_URL}/enlaces`, {
          ...payload,
          creado_por: usuario.username || 'Usuario'
        });
        
        Swal.fire({
          title: '¡Éxito!',
          text: 'Enlace agregado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
      
      // Limpiar el formulario y ocultar el modal
      setFormEnlace({
        titulo: '',
        url: '',
        descripcion: '',
        categoria_id: ''
      });
      setUrlsAdicionales([]);
      setShowModal(false);
      
      // Recargar los enlaces
      fetchEnlaces();
    } catch (err) {
      console.error('Error saving link:', err);
      Swal.fire({
        title: 'Error',
        text: selectedEnlace 
          ? 'Error al actualizar el enlace' 
          : 'Error al agregar el enlace',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Función para abrir un enlace en una nueva pestaña
  const handleOpenEnlace = (url: string) => {
    window.open(formatUrl(url), '_blank', 'noopener,noreferrer');
  };

  // Función para eliminar un enlace
  const handleDeleteEnlace = (enlace: Enlace) => {
    Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar el enlace "${enlace.titulo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_BASE_URL}/enlaces/${enlace.id}`);
          
          Swal.fire({
            title: '¡Eliminado!',
            text: 'El enlace ha sido eliminado correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          
          // Recargar enlaces
          fetchEnlaces();
        } catch (err) {
          console.error('Error deleting link:', err);
          Swal.fire({
            title: 'Error',
            text: 'Error al eliminar el enlace',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      }
    });
  };

  // Función para mostrar el conteo de enlaces por categoría
  const getEnlacesPorCategoria = () => {
    const categoriaCount: { [key: number]: number } = {};
    enlacesFiltrados.forEach(enlace => {
      const categoriaId = enlace.categoria_id || 0;
      categoriaCount[categoriaId] = (categoriaCount[categoriaId] || 0) + 1;
    });
    return categoriaCount;
  };

  // Cargar enlaces y categorías al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Primero obtener categorías
        const categoriasData = await fetchCategorias();
        
        // Luego obtener enlaces y asignarles los colores de categoría
        const res = await axios.get(`${API_BASE_URL}/enlaces`);
        
        if (categoriasData && categoriasData.length > 0) {
          const enlacesConCategorias = res.data.map((enlace: Enlace) => {
            if (enlace.categoria_id) {
              const categoriaEncontrada = categoriasData.find(
                (cat: Categoria) => cat.id === enlace.categoria_id
              );
              
              if (categoriaEncontrada) {
                return {
                  ...enlace,
                  categoria_color: categoriaEncontrada.color,
                  categoria_nombre: categoriaEncontrada.nombre
                };
              }
            }
            return enlace;
          });
          
          setEnlaces(enlacesConCategorias);
          setEnlacesFiltrados(enlacesConCategorias);
        } else {
          setEnlaces(res.data);
          setEnlacesFiltrados(res.data);
        }
        
        setLoading(false);
        
        // Programar la verificación de desbordamiento después de que se hayan renderizado los elementos
        setTimeout(checkAllOverflows, 500);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    
    setLoading(true);
    fetchData();
    
    // Agregar listener de redimensionamiento para volver a comprobar el desbordamiento
    window.addEventListener('resize', checkAllOverflows);
    
    return () => {
      window.removeEventListener('resize', checkAllOverflows);
    };
  }, []);

  // Actualizar colores de categoría en los enlaces cuando cambien las categorías
  useEffect(() => {
    if (categorias.length > 0 && enlaces.length > 0) {
      const enlacesActualizados = enlaces.map((enlace: Enlace) => {
        if (enlace.categoria_id) {
          const categoriaEncontrada = categorias.find(cat => cat.id === enlace.categoria_id);
          if (categoriaEncontrada) {
            return {
              ...enlace,
              categoria_color: categoriaEncontrada.color,
              categoria_nombre: categoriaEncontrada.nombre
            };
          }
        }
        return enlace;
      });
      
      setEnlaces(enlacesActualizados);
      
      // También actualizar los filtrados manteniendo los filtros actuales
      applyFilters(letraActiva, categoriaActiva, enlacesActualizados);
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
      /* Estilos para descripción */
      .card-description {
        position: relative;
        margin-top: 12px;
      }
      /* Truncar texto largo en descripción */
      .card-text-truncate {
        max-height: 105px; /* Altura para aproximadamente 4-5 líneas de texto */
        overflow: hidden;
        position: relative;
      }
      /* Gradiente para el botón "Ver más" - Solo para texto truncado */
      .card-text-truncate::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 32px;
        background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1) 90%);
        pointer-events: none; /* Permite hacer clic en el botón debajo del gradiente */
      }
      /* Botón "Ver más" con posicionamiento mejorado */
      .ver-mas-btn {
        display: block;
        margin-top: 4px;
        text-align: right;
        position: relative;
        z-index: 5;
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
      /* Estilos para URLs adicionales */
      .url-adicional-item {
        margin-bottom: 8px;
        transition: all 0.2s ease;
      }
      .url-list-container {
        max-height: 150px;
        overflow-y: auto;
        position: relative;
      }
      .url-list-gradient {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 30px;
        background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1));
        pointer-events: none;
      }
      /* Tooltips personalizados */
      .tooltip-custom {
        position: relative;
        display: inline-block;
      }
      .tooltip-custom:hover .tooltip-text {
        visibility: visible;
        opacity: 1;
      }
      .tooltip-text {
        visibility: hidden;
        width: 120px;
        background-color: #555;
        color: #fff;
        text-align: center;
        border-radius: 6px;
        padding: 5px;
        position: absolute;
        z-index: 1;
        bottom: 125%;
        left: 50%;
        margin-left: -60px;
        opacity: 0;
        transition: opacity 0.3s;
        font-size: 0.75rem;
      }
      .tooltip-text::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #555 transparent transparent transparent;
      }
      /* Animación de pulse para nuevos elementos */
      @keyframes pulse-highlight {
        0% {
          background-color: rgba(255, 255, 0, 0.3);
        }
        50% {
          background-color: rgba(255, 255, 0, 0);
        }
        100% {
          background-color: rgba(255, 255, 0, 0.3);
        }
      }
      .pulse-highlight {
        animation: pulse-highlight 2s ease-in-out;
      }
      /* Estilos para iconos de ordenamiento */
      .orden-icon {
        cursor: pointer;
        color: #6c757d;
        margin: 0 3px;
        transition: color 0.2s;
      }
      .orden-icon:hover {
        color: #0d6efd;
      }
      .orden-icon.disabled {
        color: #dee2e6;
        cursor: not-allowed;
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

  // Función para acortar URL para visualización
  const shortenUrl = (url: string) => {
    try {
      const formattedUrl = formatUrl(url);
      const urlObj = new URL(formattedUrl);
      let displayUrl = urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
      if (displayUrl.length > 45) {
        displayUrl = displayUrl.substring(0, 42) + '...';
      }
      return displayUrl;
    } catch (error) {
      // Si hay un error al parsear la URL, devolver la URL original
      return url;
    }
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
            <h2 className="mb-0 fw-bold">Directorio de Enlaces</h2>
            <Button 
              variant="primary" 
              className="d-flex align-items-center" 
              onClick={handleNewEnlace}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Agregar Enlace
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
                onClick={fetchEnlaces}
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
                      placeholder="Buscar enlace por título, descripción o URL..."
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </InputGroup>
                </Col>
              </Row>

              {/* Información de resultados */}
              <div className="text-center mb-3">
                <span className="text-muted">
                  {enlacesFiltrados.length} {enlacesFiltrados.length === 1 ? 'enlace encontrado' : 'enlaces encontrados'}
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
                  <p className="mt-3 text-muted">Cargando enlaces...</p>
                </div>
              ) : enlacesFiltrados.length > 0 ? (
                <Row className="g-4">
                  {enlacesFiltrados.map((enlace) => (
                    <Col md={6} lg={4} key={enlace.id}>
                      <Card className="h-100 border-0 shadow-sm hover-effect">
                        <Card.Body>
                          <div className="mb-2">
                            <h5 className="fw-bold mb-2">
                              {enlace.titulo}
                            </h5>
                            {enlace.categoria_nombre && (
                              <span 
                                className="badge rounded-pill"
                                style={{
                                  backgroundColor: `${enlace.categoria_color || '#0d6efd'}`, 
                                  color: getContrastColor(enlace.categoria_color || '#0d6efd'),
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  padding: '4px 10px',
                                  marginBottom: '8px',
                                  display: 'inline-block'
                                }}
                              >
                                {enlace.categoria_nombre}
                              </span>
                            )}
                          </div>
                          
                          {/* URL principal con ícono para visitar */}
                          <div className="d-flex align-items-center mb-3">
                            <Badge 
                              bg="light" 
                              text="dark"
                              className="text-truncate border me-2" 
                              style={{ 
                                maxWidth: '100%', 
                                cursor: 'pointer',
                                padding: '6px 12px',
                                fontSize: '0.85rem'
                              }}
                              onClick={() => handleOpenEnlace(enlace.url)}
                            >
                              <i className="bi bi-link-45deg me-1"></i>
                              {shortenUrl(enlace.url)}
                            </Badge>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="flex-shrink-0"
                              onClick={() => handleOpenEnlace(enlace.url)}
                              title="Abrir enlace"
                            >
                              <i className="bi bi-box-arrow-up-right"></i>
                            </Button>
                          </div>
                          
                          {/* URLs adicionales */}
                          {enlace.urls_adicionales && enlace.urls_adicionales.length > 0 && (
                            <div className="mb-3">
                              <div 
                                className={`position-relative ${enlace.urls_adicionales.length > 3 && !expandedUrlLists[enlace.id] ? 'url-list-container' : ''}`}
                                ref={(el: HTMLDivElement | null) => {
                                  if (el) {
                                    urlListRefs.current[enlace.id] = el;
                                  }
                                }}
                              >
                                {enlace.urls_adicionales
                                  .slice(0, expandedUrlLists[enlace.id] ? enlace.urls_adicionales.length : 3)
                                  .map((urlItem, index) => (
                                    <div key={index} className="d-flex align-items-center mb-2 url-adicional-item">
                                      <Badge 
                                        bg="light" 
                                        text="secondary"
                                        className="text-truncate border me-2 tooltip-custom" 
                                        style={{ 
                                          maxWidth: '100%', 
                                          cursor: 'pointer',
                                          padding: '4px 10px',
                                          fontSize: '0.8rem'
                                        }}
                                        onClick={() => handleOpenEnlace(urlItem.url)}
                                      >
                                        <i className="bi bi-link-45deg me-1"></i>
                                        {urlItem.titulo || shortenUrl(urlItem.url)}
                                        <span className="tooltip-text">{urlItem.url}</span>
                                      </Badge>
                                      <Button 
                                        variant="outline-secondary" 
                                        size="sm" 
                                        className="flex-shrink-0 p-1"
                                        onClick={() => handleOpenEnlace(urlItem.url)}
                                        title="Abrir enlace adicional"
                                      >
                                        <i className="bi bi-box-arrow-up-right"></i>
                                      </Button>
                                    </div>
                                  ))}
                                {enlace.urls_adicionales.length > 3 && !expandedUrlLists[enlace.id] && <div className="url-list-gradient"></div>}
                              </div>
                              
                              {/* Botón para mostrar más/menos URLs - solo aparece si hay más de 3 URLs */}
                              {enlace.urls_adicionales.length > 3 && (
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-0 text-decoration-none mt-1"
                                  onClick={() => toggleExpandUrlList(enlace.id)}
                                >
                                  {expandedUrlLists[enlace.id] 
                                    ? <><i className="bi bi-chevron-up me-1"></i>Mostrar menos</> 
                                    : <><i className="bi bi-chevron-down me-1"></i>Ver {enlace.urls_adicionales.length - 3} enlaces más</>}
                                </Button>
                              )}
                            </div>
                          )}
                          
                          {/* Descripción - Solo se muestra si hay contenido */}
                          {enlace.descripcion && (
                            <div className="card-description">
                              <Card.Text 
                                className={expandedTexts[enlace.id] ? "" : (overflowElements[enlace.id] ? "card-text-truncate" : "")} 
                                style={{ whiteSpace: 'pre-line' }}
                                ref={(el: HTMLDivElement | null) => {
                                  if (el) {
                                    textRefs.current[enlace.id] = el;
                                  }
                                }}
                              >
                                {enlace.descripcion}
                              </Card.Text>
                              
                              {/* Botón "Ver más" - solo se muestra si realmente hay desbordamiento o si ya está expandido */}
                              {(overflowElements[enlace.id] || expandedTexts[enlace.id]) && (
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-0 text-decoration-none ver-mas-btn"
                                  onClick={() => toggleExpandText(enlace.id)}
                                >
                                  {expandedTexts[enlace.id] ? 'Ver menos' : 'Ver más...'}
                                </Button>
                              )}
                            </div>
                          )}
                          
                          <div className="d-flex justify-content-between align-items-center mt-3">
                            <div className="text-muted small">
                              {/* Se pueden mostrar datos adicionales como fecha o autor si se desea */}
                              {/* <div>Creado por: {enlace.creado_por}</div> */}
                              {/* <div>Fecha: {new Date(enlace.fecha_creacion).toLocaleDateString()}</div> */}
                            </div>
                            <div>
                              <Button 
                                variant="light" 
                                size="sm" 
                                className="me-1 border-0"
                                onClick={() => handleEditEnlace(enlace)}
                                title="Editar enlace"
                              >
                                <i className="bi bi-pencil text-primary"></i>
                              </Button>
                              <Button 
                                variant="light" 
                                size="sm"
                                className="border-0"
                                onClick={() => handleDeleteEnlace(enlace)}
                                title="Eliminar enlace"
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
                  <p className="text-muted">No se encontraron enlaces que coincidan con tu búsqueda</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>

        {/* Modal para agregar/editar enlace */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedEnlace ? 'Editar Enlace' : 'Agregar nuevo enlace'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Título *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingrese el título del enlace"
                  name="titulo"
                  value={formEnlace.titulo}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>URL Principal *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="https://ejemplo.com"
                  name="url"
                  value={formEnlace.url}
                  onChange={handleInputChange}
                  required
                />
                <Form.Text className="text-muted">
                  Ejemplo: https://ejemplo.com o www.ejemplo.com
                </Form.Text>
              </Form.Group>
              
              {/* URLs adicionales */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label>URLs Adicionales (Opcional)</Form.Label>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={addUrlAdicional}
                    className="d-flex align-items-center"
                  >
                    <i className="bi bi-plus-circle me-1"></i> Agregar URL
                  </Button>
                </div>
                
                {urlsAdicionales.length > 0 ? (
                  <div className="border rounded p-3 mb-3 bg-light">
                    {urlsAdicionales.map((urlItem, index) => (
                      <div key={index} className="mb-3 border-bottom pb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center">
                            <small className="text-muted me-2">URL adicional #{index + 1}</small>
                            {/* Iconos para ordenar URLs adicionales */}
                            <i 
                              className={`bi bi-arrow-up-short orden-icon ${index === 0 ? 'disabled' : ''}`}
                              onClick={() => index > 0 && moveUrlAdicional(index, 'up')}
                              title="Mover arriba"
                            ></i>
                            <i 
                              className={`bi bi-arrow-down-short orden-icon ${index === urlsAdicionales.length - 1 ? 'disabled' : ''}`}
                              onClick={() => index < urlsAdicionales.length - 1 && moveUrlAdicional(index, 'down')}
                              title="Mover abajo"
                            ></i>
                          </div>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => removeUrlAdicional(index)}
                            className="py-0 px-2"
                          >
                            <i className="bi bi-x-circle"></i>
                          </Button>
                        </div>
                        <Row className="g-2">
                          <Col sm={4}>
                            <Form.Group>
                              <Form.Label className="small">Título (Opcional)</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="Título descriptivo"
                                size="sm"
                                value={urlItem.titulo || ''}
                                onChange={(e) => handleUrlAdicionalChange(index, 'titulo', e.target.value)}
                              />
                            </Form.Group>
                          </Col>
                          <Col sm={8}>
                            <Form.Group>
                              <Form.Label className="small">URL *</Form.Label>
                              <Form.Control
                                type="text"
                                placeholder="https://ejemplo-adicional.com"
                                size="sm"
                                value={urlItem.url || ''}
                                onChange={(e) => handleUrlAdicionalChange(index, 'url', e.target.value)}
                                required
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted small fst-italic">No hay URLs adicionales. Haga clic en "Agregar URL" para incluir más enlaces relacionados.</p>
                )}
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Descripción breve del enlace (opcional)"
                  name="descripcion"
                  value={formEnlace.descripcion}
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Categoría</Form.Label>
                <Form.Select
                  name="categoria_id"
                  value={formEnlace.categoria_id}
                  onChange={handleInputChange}
                >
                  <option value="">Sin categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </Form.Select>
                {formEnlace.categoria_id && (
                  <div className="mt-2">
                    <span 
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: `${categorias.find(c => c.id.toString() === formEnlace.categoria_id)?.color || '#0d6efd'}`,
                        color: getContrastColor(categorias.find(c => c.id.toString() === formEnlace.categoria_id)?.color || '#0d6efd'),
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        padding: '4px 10px',
                        display: 'inline-block'
                      }}
                    >
                      {categorias.find(c => c.id.toString() === formEnlace.categoria_id)?.nombre || ''}
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
            <Button variant="primary" onClick={handleSaveEnlace}>
              {selectedEnlace ? 'Actualizar' : 'Guardar Enlace'}
            </Button>
          </Modal.Footer>
        </Modal>

        <Footer />
      </div>
    </div>
  );
};

export default Enlaces;