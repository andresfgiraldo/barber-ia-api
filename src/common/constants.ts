import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const DEFAULT_TIMEZONE = 'America/Bogota'; // Zona horaria por defecto
export const LOCAL_WORK_START_HOUR = 8; // Hora de inicio de la jornada laboral local
export const LOCAL_WORK_END_HOUR = 18;
export const WORKING_DAYS = [1, 2, 3, 4, 5]; // Días laborables (lunes a viernes)

export const DEFAULT_SLOT_INTERVAL = 30; // minutos entre slots sugeridos


const now = dayjs().tz(DEFAULT_TIMEZONE);
const offsetMinutes = now.utcOffset();
const offsetHours = offsetMinutes / 60; 

export const UTC_WORK_START_HOUR = LOCAL_WORK_START_HOUR-offsetHours; 
export const UTC_WORK_END_HOUR = LOCAL_WORK_END_HOUR-offsetHours;


