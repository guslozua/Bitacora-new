// AdminCalendar.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import {
  Button, Modal, Form, Container, Row, Col, Card,
  Nav, Tab, Alert, Badge, InputGroup, Table, Dropdown, ButtonGroup
} from 'react-bootstrap';
import { SketchPicker } from 'react-color';
import moment from 'moment';
import Swal from 'sweetalert2';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './AdminCalendar.css';
import { Event } from '../../models/Event';

// Configurar localización en español
moment.locale('es');
const localizer = momentLocalizer(moment);

interface AdminCalendarProps {
  events: Event[];
  onEventAdd?: (event: Event) => void;
  onEventUpdate?: (event: Event) => void;
  onEventDelete?: (eventId: string | number) => void;  // Actualizado para aceptar string o number
  onImportEvents?: (file: File) => void;
  onExportEvents?: (format?: string) => void;
  editEventId?: string | null;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

const AdminCalendar: React.FC<AdminCalendarProps> = ({
  events = [],
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  onImportEvents,
  onExportEvents,
  editEventId,
  initialStartDate,
  initialEndDate
}) => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [eventForm, setEventForm] = useState<Omit<Event, 'id'>>({
    title: '',
    start: new Date(),
    end: new Date(),
    allDay: false,
    type: 'event',
    description: '',
    location: '',
    color: '#3174ad'
  });

  const [holidayList, setHolidayList] = useState<Event[]>([]);
  const [tasksEvents, setTasksEvents] = useState<Event[]>([]);
  const [regularEvents, setRegularEvents] = useState<Event[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [birthdayEvents, setBirthdayEvents] = useState<Event[]>([]);
  const [daysOffEvents, setDaysOffEvents] = useState<Event[]>([]);
  const [gconectEvents, setGconectEvents] = useState<Event[]>([]);
  const [vacationEvents, setVacationEvents] = useState<Event[]>([]);

  // Verificar si hay un evento para editar al cargar
  useEffect(() => {
    if (editEventId) {
      const eventToEdit = events.find(e => e.id === editEventId);
      if (eventToEdit) {
        handleSelectEvent(eventToEdit);
      }
    }
  }, [editEventId, events]);

  // Verificar fechas iniciales
  useEffect(() => {
    if (initialStartDate && !editEventId) {
      setEventForm(prev => ({
        ...prev,
        start: initialStartDate,
        end: initialEndDate || new Date(initialStartDate.getTime() + 3600000) // +1 hora si no hay fecha fin
      }));
      setShowModal(true);
    }
  }, [initialStartDate, initialEndDate, editEventId]);

  // Separar eventos por tipo
  useEffect(() => {
    const holidays = events.filter(event => event.type === 'holiday');
    const tasks = events.filter(event => event.type === 'task');
    const regular = events.filter(event => event.type === 'event');
    const birthdays = events.filter(event => event.type === 'birthday'); // cumpleaños
    const daysoff = events.filter(event => event.type === 'dayoff'); // días a favor
    const gconect = events.filter(event => event.type === 'gconect');     // Guardia Conectividad
    const vacation = events.filter(event => event.type === 'vacation');   // Vacaciones

    setHolidayList(holidays);
    setTasksEvents(tasks);
    setRegularEvents(regular);
    setBirthdayEvents(birthdays); // Establecer cumpleaños
    setDaysOffEvents(daysoff); // Establecer días a favor
    setGconectEvents(gconect);       // Establecer eventos de Guardia Conectividad
    setVacationEvents(vacation);     // Establecer eventos de Vacaciones
  }, [events]);

  // Mostrar mensaje de éxito temporalmente
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Abrir modal para crear/editar evento
  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot(slotInfo);
    setSelectedEvent(null);

    setEventForm({
      title: '',
      start: slotInfo.start,
      end: slotInfo.end,
      allDay: slotInfo.slots.length > 1, // Si selecciona más de un slot, considerar todo el día
      type: 'event',
      description: '',
      location: '',
      color: '#3174ad'
    });

    setShowModal(true);
  };

  // Abrir modal para editar evento existente
  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    setSelectedSlot(null);

    setEventForm({
      title: event.title,
      start: new Date(event.start),
      end: new Date(event.end),
      allDay: event.allDay || false,
      type: event.type,
      description: event.description || '',
      location: event.location || '',
      color: event.color || '#3174ad'
    });

    setShowModal(true);
  };

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setEventForm(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setEventForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Manejar cambios en las fechas - VERSIÓN CORREGIDA CON VALIDACIÓN
  const handleDateChange = (field: 'start' | 'end', value: string) => {
    // Obtenemos la fecha actual del formulario y extrae sus componentes de hora
    const currentDate = new Date(eventForm[field]);
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const seconds = currentDate.getSeconds();

    // Parsea correctamente la nueva fecha sin afectar la zona horaria
    const [year, month, day] = value.split('-').map(num => parseInt(num, 10));

    // Crea una nueva fecha usando UTC para evitar problemas de zona horaria
    const newDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    // Ajusta la fecha a la zona horaria local
    const localDate = new Date(newDate.getTime());

    // Restaura las horas, minutos y segundos originales
    localDate.setHours(hours, minutes, seconds);

    // Validar que la fecha de fin no sea anterior a la de inicio
    if (field === 'end') {
      const startDate = new Date(eventForm.start);
      if (localDate < startDate) {
        // Si la fecha de fin es anterior a la de inicio, mostrar error
        Swal.fire({
          title: 'Error',
          text: 'La fecha de fin no puede ser anterior a la fecha de inicio',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        return; // No actualizar el estado con una fecha inválida
      }
    } else if (field === 'start') {
      // Si estamos cambiando la fecha de inicio, verificamos que no sea posterior a la de fin
      const endDate = new Date(eventForm.end);
      if (localDate > endDate) {
        // Ajustamos automáticamente la fecha de fin para que sea igual a la de inicio
        setEventForm(prev => ({
          ...prev,
          [field]: localDate,
          end: new Date(localDate.getTime() + 3600000) // Fecha de inicio + 1 hora
        }));
        return;
      }
    }

    // Actualiza el estado con la nueva fecha
    setEventForm(prev => ({
      ...prev,
      [field]: localDate
    }));
  };

  // Función para aplicar en los inputs de tiempo - VERSIÓN CORREGIDA
  const handleTimeChange = (field: 'start' | 'end', timeValue: string) => {
    const [hours, minutes] = timeValue.split(':').map(num => parseInt(num, 10));

    // Obtenemos la fecha actual del formulario
    const dateToUpdate = new Date(eventForm[field]);

    // Creamos una nueva fecha con las horas y minutos seleccionados
    dateToUpdate.setHours(hours, minutes, 0, 0);

    // Validar tiempos si estamos actualizando la hora de fin
    if (field === 'end') {
      const startDate = new Date(eventForm.start);
      if (dateToUpdate < startDate) {
        // Si la hora de fin es anterior a la hora de inicio, mostrar error
        Swal.fire({
          title: 'Error',
          text: 'La hora de fin no puede ser anterior a la hora de inicio',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        return; // No actualizar el estado con una hora inválida
      }
    } else if (field === 'start') {
      // Si actualizamos la hora de inicio, verificar que no sea posterior a la hora de fin
      // en caso de ser el mismo día
      const endDate = new Date(eventForm.end);
      if (isSameDay(dateToUpdate, endDate) && dateToUpdate > endDate) {
        // Ajustar la hora de fin automáticamente
        endDate.setHours(hours + 1, minutes, 0, 0);
        setEventForm(prev => ({
          ...prev,
          [field]: dateToUpdate,
          end: endDate
        }));
        return;
      }
    }

    // Actualizamos el estado
    setEventForm(prev => ({
      ...prev,
      [field]: dateToUpdate
    }));
  };

  // Función auxiliar para verificar si dos fechas son el mismo día
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  // Manejar cambio de color
  const handleColorChange = (color: any) => {
    setEventForm(prev => ({
      ...prev,
      color: color.hex
    }));
  };

  // Guardar evento (nuevo o actualizado)
  const handleSaveEvent = () => {
    if (!eventForm.title.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'El título es obligatorio',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Validación adicional de fechas
    const startDate = new Date(eventForm.start);
    const endDate = new Date(eventForm.end);
    if (endDate < startDate) {
      Swal.fire({
        title: 'Error',
        text: 'La fecha de fin no puede ser anterior a la fecha de inicio',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Crear o actualizar evento
    const eventToSave: Event = {
      id: selectedEvent ? selectedEvent.id : `event-${Date.now()}`,
      ...eventForm
    };

    if (selectedEvent) {
      // Actualizar evento existente
      if (onEventUpdate) {
        onEventUpdate(eventToSave);
      }
      Swal.fire({
        title: '¡Éxito!',
        text: 'Evento actualizado correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      // Crear nuevo evento
      if (onEventAdd) {
        onEventAdd(eventToSave);
      }
      Swal.fire({
        title: '¡Éxito!',
        text: 'Evento creado correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    }

    handleCloseModal();
  };

  // Eliminar evento con SweetAlert2 - Versión actualizada
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      Swal.fire({
        title: '¿Está seguro?',
        text: `¿Desea eliminar el evento "${selectedEvent.title}"? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then(async (result) => {
        if (result.isConfirmed && onEventDelete) {
          try {
            // Mostrar indicador de carga
            Swal.fire({
              title: 'Eliminando...',
              text: 'Por favor espere',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });

            console.log(`Intentando eliminar evento: ${selectedEvent.id} (${selectedEvent.type}), tipo de ID: ${typeof selectedEvent.id}`);

            // Llamar a la función de eliminación
            await onEventDelete(selectedEvent.id);

            console.log(`Eliminación completada para: ${selectedEvent.id}`);

            // Mostrar mensaje de éxito
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El evento ha sido eliminado correctamente.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          } catch (error) {
            console.error('Error en handleDeleteEvent:', error);

            // Mostrar mensaje de error
            Swal.fire({
              title: 'Error',
              text: error instanceof Error ? error.message : 'No se pudo eliminar el evento',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        }
      });
    }

    handleCloseModal();
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setShowColorPicker(false);
    setSelectedEvent(null);
    setSelectedSlot(null);
  };

  // Importar eventos
  const handleImportEvents = () => {
    if (importFile && onImportEvents) {
      onImportEvents(importFile);
      Swal.fire({
        title: '¡Éxito!',
        text: 'Eventos importados correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      setImportFile(null);
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Por favor, seleccione un archivo para importar',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  // Exportar eventos con formato específico - VERSIÓN CORREGIDA
  const handleExportEvents = (format: 'csv' | 'json' | 'excel' = 'csv') => {
    if (onExportEvents) {
      // Pasamos el formato al servicio
      onExportEvents(format);

      // Asegurarse de que no haya ningún evento seleccionado o slot
      // que pueda causar que se abra el modal
      setSelectedEvent(null);
      setSelectedSlot(null);

      // Mostrar mensaje de éxito sin abrir modal
      setTimeout(() => {
        Swal.fire({
          title: '¡Éxito!',
          text: `Eventos exportados correctamente en formato ${format.toUpperCase()}`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }, 100); // Un pequeño retraso para asegurarnos que cualquier otro proceso termine
    }
  };

  // Manejar navegación en el calendario
  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    const newDate = new Date(date);

    if (action === 'PREV') {
      if (view === Views.MONTH) newDate.setMonth(date.getMonth() - 1);
      else if (view === Views.WEEK) newDate.setDate(date.getDate() - 7);
      else if (view === Views.DAY) newDate.setDate(date.getDate() - 1);
    } else if (action === 'NEXT') {
      if (view === Views.MONTH) newDate.setMonth(date.getMonth() + 1);
      else if (view === Views.WEEK) newDate.setDate(date.getDate() + 7);
      else if (view === Views.DAY) newDate.setDate(date.getDate() + 1);
    } else if (action === 'TODAY') {
      newDate.setTime(new Date().getTime());
    }

    setDate(newDate);
  };

  // Personalizar el aspecto de los eventos
  const eventStyleGetter = (event: Event) => {
    let backgroundColor = event.color || '#3174ad';

    if (!event.color) {
      switch (event.type) {
        case 'task':
          backgroundColor = '#0d6efd'; // Bootstrap primary
          break;
        case 'holiday':
          backgroundColor = '#dc3545'; // Bootstrap danger
          break;
        case 'event':
          backgroundColor = '#198754'; // Bootstrap success
          break;
        case 'birthday':
          backgroundColor = '#ff9800'; // Naranja para cumpleaños
          break;
        case 'dayoff':
          backgroundColor = '#4caf50'; // Verde claro para días a favor
          break;
        case 'gconect':
          backgroundColor = '#00bcd4'; // Azul celeste para Guardia Conectividad
          break;
        case 'vacation':
          backgroundColor = '#9e9e9e'; // Gris para Vacaciones
          break;
      }
    }

    const style = {
      backgroundColor,
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block'
    };

    return {
      style
    };
  };

  // Formatear el mes actual en mayúsculas
  const currentMonthYear = moment(date).format('MMMM YYYY').toUpperCase();

  // Renderizar la vista del calendario
  const renderCalendarView = () => {
    return (
      <>
        <Row className="mb-3">
          <Col sm={4}>
            <ButtonGroup>
              <Button variant="outline-secondary" onClick={() => handleNavigate('PREV')}>
                &laquo;
              </Button>
              <Button variant="outline-primary" onClick={() => handleNavigate('TODAY')}>
                Hoy
              </Button>
              <Button variant="outline-secondary" onClick={() => handleNavigate('NEXT')}>
                &raquo;
              </Button>
            </ButtonGroup>
          </Col>
          <Col sm={4} className="text-center">
            <h4 className="fw-bold month-title mb-0">{currentMonthYear}</h4>
          </Col>
          <Col sm={4} className="text-end">
            <ButtonGroup>
              <Button
                variant={view === Views.MONTH ? 'primary' : 'outline-primary'}
                onClick={() => setView(Views.MONTH)}
              >
                Mes
              </Button>
              <Button
                variant={view === Views.WEEK ? 'primary' : 'outline-primary'}
                onClick={() => setView(Views.WEEK)}
              >
                Semana
              </Button>
              <Button
                variant={view === Views.DAY ? 'primary' : 'outline-primary'}
                onClick={() => setView(Views.DAY)}
              >
                Día
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
        <Row>
          <Col>
            <div className="calendar-container">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                view={view}
                date={date}
                onNavigate={(newDate) => setDate(newDate)}
                onView={(newView) => setView(newView)}
                eventPropGetter={eventStyleGetter}
                components={{
                  toolbar: () => null // Eliminamos la barra de herramientas duplicada
                }}
                messages={{
                  today: 'Hoy',
                  previous: 'Anterior',
                  next: 'Siguiente',
                  month: 'Mes',
                  week: 'Semana',
                  day: 'Día',
                  agenda: 'Agenda',
                  date: 'Fecha',
                  time: 'Hora',
                  event: 'Evento',
                  allDay: 'Todo el día',
                  noEventsInRange: 'No hay eventos en este rango'
                }}
              />
            </div>
          </Col>
        </Row>
      </>
    );
  };

  // Renderizar la vista de gestión de eventos
  const renderEventsManagementView = () => {
    return (
      <Tab.Container defaultActiveKey="holidays">
        <Row>
          <Col sm={3}>
            <Nav variant="pills" className="flex-column">
              <Nav.Item>
                <Nav.Link eventKey="holidays">Feriados</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="tasks">Tareas</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="events">Eventos</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="birthdays">Cumpleaños</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="daysoff">Días a Favor</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="gconect">Guardia Conectividad</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="vacation">Vacaciones</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="import">Importar/Exportar</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          <Col sm={9}>
            <Tab.Content>
              <Tab.Pane eventKey="holidays">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3">
                    <h5 className="mb-0 fw-bold">Feriados</h5>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(null);
                        setEventForm({
                          title: '',
                          start: new Date(),
                          end: new Date(),
                          allDay: true,
                          type: 'holiday',
                          description: '',
                          location: '',
                          color: '#dc3545'
                        });
                        setShowModal(true);
                      }}
                    >
                      Agregar Feriado
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Título</th>
                          <th>Fecha</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holidayList.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center">No hay feriados registrados</td>
                          </tr>
                        ) : (
                          holidayList.map(holiday => (
                            <tr key={holiday.id}>
                              <td>{holiday.title}</td>
                              <td>{moment(holiday.start).format('DD/MM/YYYY')}</td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleSelectEvent(holiday)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEvent(holiday);
                                    handleDeleteEvent();
                                  }}
                                >
                                  Eliminar
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="tasks">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3">
                    <h5 className="mb-0 fw-bold">Tareas</h5>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(null);
                        setEventForm({
                          title: '',
                          start: new Date(),
                          end: new Date(),
                          allDay: false,
                          type: 'task',
                          description: '',
                          location: '',
                          color: '#0d6efd'
                        });
                        setShowModal(true);
                      }}
                    >
                      Agregar Tarea
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Título</th>
                          <th>Fecha Inicio</th>
                          <th>Fecha Fin</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasksEvents.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center">No hay tareas registradas</td>
                          </tr>
                        ) : (
                          tasksEvents.map(task => (
                            <tr key={task.id}>
                              <td>{task.title}</td>
                              <td>{moment(task.start).format('DD/MM/YYYY HH:mm')}</td>
                              <td>{moment(task.end).format('DD/MM/YYYY HH:mm')}</td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleSelectEvent(task)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEvent(task);
                                    handleDeleteEvent();
                                  }}
                                >
                                  Eliminar
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="events">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3">
                    <h5 className="mb-0 fw-bold">Eventos</h5>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(null);
                        setEventForm({
                          title: '',
                          start: new Date(),
                          end: new Date(),
                          allDay: false,
                          type: 'event',
                          description: '',
                          location: '',
                          color: '#198754'
                        });
                        setShowModal(true);
                      }}
                    >
                      Agregar Evento
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Título</th>
                          <th>Fecha Inicio</th>
                          <th>Fecha Fin</th>
                          <th>Ubicación</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regularEvents.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center">No hay eventos registrados</td>
                          </tr>
                        ) : (
                          regularEvents.map(event => (
                            <tr key={event.id}>
                              <td>{event.title}</td>
                              <td>{moment(event.start).format('DD/MM/YYYY HH:mm')}</td>
                              <td>{moment(event.end).format('DD/MM/YYYY HH:mm')}</td>
                              <td>{event.location || '-'}</td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleSelectEvent(event)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    handleDeleteEvent();
                                  }}
                                >
                                  Eliminar
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="birthdays">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3">
                    <h5 className="mb-0 fw-bold">Cumpleaños</h5>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(null);
                        setEventForm({
                          title: '',
                          start: new Date(),
                          end: new Date(),
                          allDay: true,
                          type: 'birthday',
                          description: '',
                          location: '',
                          color: '#ff9800'
                        });
                        setShowModal(true);
                      }}
                    >
                      Agregar Cumpleaños
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Persona</th>
                          <th>Fecha</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {birthdayEvents.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center">No hay cumpleaños registrados</td>
                          </tr>
                        ) : (
                          birthdayEvents.map(birthday => (
                            <tr key={birthday.id}>
                              <td>{birthday.title}</td>
                              <td>{moment(birthday.start).format('DD/MM/YYYY')}</td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleSelectEvent(birthday)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEvent(birthday);
                                    handleDeleteEvent();
                                  }}
                                >
                                  Eliminar
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="daysoff">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3">
                    <h5 className="mb-0 fw-bold">Días a Favor</h5>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(null);
                        setEventForm({
                          title: '',
                          start: new Date(),
                          end: new Date(),
                          allDay: true,
                          type: 'dayoff',
                          description: '',
                          location: '',
                          color: '#4caf50'
                        });
                        setShowModal(true);
                      }}
                    >
                      Agregar Día a Favor
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Descripción</th>
                          <th>Fecha</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {daysOffEvents.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center">No hay días a favor registrados</td>
                          </tr>
                        ) : (
                          daysOffEvents.map(dayoff => (
                            <tr key={dayoff.id}>
                              <td>{dayoff.title}</td>
                              <td>{moment(dayoff.start).format('DD/MM/YYYY')}</td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleSelectEvent(dayoff)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEvent(dayoff);
                                    handleDeleteEvent();
                                  }}
                                >
                                  Eliminar
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="gconect">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3">
                    <h5 className="mb-0 fw-bold">Guardias de Conectividad</h5>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(null);
                        setEventForm({
                          title: '',
                          start: new Date(),
                          end: new Date(),
                          allDay: true,
                          type: 'gconect',
                          description: '',
                          location: '',
                          color: '#00bcd4'
                        });
                        setShowModal(true);
                      }}
                    >
                      Agregar Guardia Conectividad
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Responsable</th>
                          <th>Fecha</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gconectEvents.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="text-center">No hay guardias de conectividad registradas</td>
                          </tr>
                        ) : (
                          gconectEvents.map(gconect => (
                            <tr key={gconect.id}>
                              <td>{gconect.title}</td>
                              <td>{moment(gconect.start).format('DD/MM/YYYY')}</td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleSelectEvent(gconect)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEvent(gconect);
                                    handleDeleteEvent();
                                  }}
                                >
                                  Eliminar
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Tab.Pane>
              <Tab.Pane eventKey="vacation">
  <Card className="border-0 shadow-sm">
    <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3">
      <h5 className="mb-0 fw-bold">Vacaciones</h5>
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          setSelectedEvent(null);
          setEventForm({
            title: '',
            start: new Date(),
            end: new Date(),
            allDay: true,
            type: 'vacation',
            description: '',
            location: '',
            color: '#9e9e9e'
          });
          setShowModal(true);
        }}
      >
        Agregar Vacaciones
      </Button>
    </Card.Header>
    <Card.Body>
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Empleado</th>
            <th>Fecha Inicio</th>
            <th>Fecha Fin</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {vacationEvents.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center">No hay vacaciones registradas</td>
            </tr>
          ) : (
            vacationEvents.map(vacation => (
              <tr key={vacation.id}>
                <td>{vacation.title}</td>
                <td>{moment(vacation.start).format('DD/MM/YYYY')}</td>
                <td>{moment(vacation.end).format('DD/MM/YYYY')}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleSelectEvent(vacation)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      setSelectedEvent(vacation);
                      handleDeleteEvent();
                    }}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </Card.Body>
  </Card>
</Tab.Pane>
              <Tab.Pane eventKey="import">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white py-3">
                    <h5 className="mb-0 fw-bold">Importar/Exportar Eventos</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row className="mb-4">
                      <Col>
                        <h6 className="fw-bold">Importar Eventos</h6>
                        <p>Sube un archivo CSV, JSON o Excel con tus eventos.</p>
                        <Form.Group controlId="formFile" className="mb-3">
                          <Form.Label>Seleccionar archivo</Form.Label>
                          <Form.Control
                            type="file"
                            accept=".csv,.json,.xlsx,.xls"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              if (e.target.files && e.target.files[0]) {
                                setImportFile(e.target.files[0]);
                              }
                            }}
                          />
                        </Form.Group>
                        <Button
                          variant="primary"
                          disabled={!importFile}
                          onClick={handleImportEvents}
                        >
                          Importar
                        </Button>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <h6 className="fw-bold">Exportar Eventos</h6>
                        <p>Descarga todos tus eventos en formato CSV, JSON o Excel.</p>
                        <ButtonGroup>
                          <Button
                            variant="success"
                            className="me-2"
                            onClick={() => handleExportEvents('csv')}
                          >
                            Exportar a CSV
                          </Button>
                          <Button
                            variant="success"
                            className="me-2"
                            onClick={() => handleExportEvents('json')}
                          >
                            Exportar a JSON
                          </Button>
                          <Button
                            variant="success"
                            onClick={() => handleExportEvents('excel')}
                          >
                            Exportar a Excel
                          </Button>
                        </ButtonGroup>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    );
  };

  // Renderizar contenido principal
  const renderContent = () => {
    if (successMessage) {
      return (
        <Alert variant="success" className="mb-3">
          {successMessage}
        </Alert>
      );
    }
    return null;
  };

  return (
    <Container fluid className="admin-calendar-container">
      <Card className="calendar-card border-0 shadow-sm">
        <Card.Header className="bg-white">
          <Nav variant="tabs" activeKey={activeTab} onSelect={(key) => key && setActiveTab(key)}>
            <Nav.Item>
              <Nav.Link eventKey="calendar">Calendario</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="management">Gestión de Eventos</Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>
        <Card.Body className="px-3 py-4">
          {renderContent()}
          {activeTab === 'calendar' ? renderCalendarView() : renderEventsManagementView()}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar eventos */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedEvent ? 'Editar Evento' : 'Nuevo Evento'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Título *</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={eventForm.title}
                onChange={handleFormChange}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha Inicio *</Form.Label>
                  <Form.Control
                    type="date"
                    value={moment(eventForm.start).format('YYYY-MM-DD')}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              {!eventForm.allDay && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Hora Inicio</Form.Label>
                    <Form.Control
                      type="time"
                      value={moment(eventForm.start).format('HH:mm')}
                      onChange={(e) => handleTimeChange('start', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              )}
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha Fin *</Form.Label>
                  <Form.Control
                    type="date"
                    value={moment(eventForm.end).format('YYYY-MM-DD')}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    required
                    min={moment(eventForm.start).format('YYYY-MM-DD')} // Agregamos validación HTML5
                  />
                </Form.Group>
              </Col>
              {!eventForm.allDay && (
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Hora Fin</Form.Label>
                    <Form.Control
                      type="time"
                      value={moment(eventForm.end).format('HH:mm')}
                      onChange={(e) => handleTimeChange('end', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              )}
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Todo el día"
                name="allDay"
                checked={eventForm.allDay}
                onChange={handleFormChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tipo de evento *</Form.Label>
              <Form.Select
                name="type"
                value={eventForm.type}
                onChange={handleFormChange}
                required
              >
                <option value="event">Evento</option>
                <option value="task">Tarea</option>
                <option value="holiday">Feriado</option>
                <option value="birthday">Cumpleaños</option>
                <option value="dayoff">Día a Favor</option>
                <option value="gconect">G. Conectividad</option>
                <option value="vacation">Vacaciones</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={eventForm.description}
                onChange={handleFormChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Ubicación</Form.Label>
              <Form.Control
                type="text"
                name="location"
                value={eventForm.location}
                onChange={handleFormChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  name="color"
                  value={eventForm.color}
                  onChange={handleFormChange}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  readOnly
                />
                <InputGroup.Text
                  style={{
                    backgroundColor: eventForm.color,
                    width: '40px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
              </InputGroup>
              {showColorPicker && (
                <div className="color-picker-container">
                  <SketchPicker
                    color={eventForm.color}
                    onChange={handleColorChange}
                  />
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          {selectedEvent && (
            <Button
              variant="danger"
              onClick={handleDeleteEvent}
            >
              Eliminar
            </Button>
          )}
          <Button variant="primary" onClick={handleSaveEvent}>
            {selectedEvent ? 'Actualizar' : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminCalendar;