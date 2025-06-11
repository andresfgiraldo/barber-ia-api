// appointment.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { DEFAULT_SLOT_INTERVAL, DEFAULT_TIMEZONE, UTC_WORK_END_HOUR, UTC_WORK_START_HOUR, WORKING_DAYS } from 'src/common/constants';
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class AppointmentService {


  // private readonly LOCAL_WORK_START_HOUR = 8; // 08:00
  // private readonly LOCAL_WORK_END_HOUR = 18; // 18:00

  // private readonly UTC_WORK_START_HOUR = this.LOCAL_WORK_START_HOUR + 5; // Ajuste para UTC-5 (Bogotá)
  // private readonly UTC_WORK_END_HOUR = this.LOCAL_WORK_END_HOUR + 5; // Ajuste para UTC-5 (Bogotá)



  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) { }

  private isWorkingDay(date: Date): boolean {
    const day = date.getDay(); // 0 = domingo, 6 = sábado
    return WORKING_DAYS.includes(day);
  }

  private isWithinWorkingHours(date: Date, duration: number): boolean {
    const startHour = date.getHours();
    const end = new Date(date.getTime() + duration * 60000);
    const endHour = end.getHours() + end.getMinutes() / 60;
    return (
      startHour >= UTC_WORK_START_HOUR &&
      endHour <= UTC_WORK_END_HOUR
    );
  }

  async getAvailableSlots(startTimestamp: number, endTimestamp: number, duration: number = DEFAULT_SLOT_INTERVAL): Promise<string[]> {

    const start = dayjs(Number(startTimestamp)).toDate();
    const end = dayjs(Number(endTimestamp)).toDate();
    const yesterday = dayjs().subtract(1, 'day').toDate();

    if (end < start) {
      throw new BadRequestException('La fecha de finalización no puede ser anterior a la fecha de inicio');
    }

    if (start < yesterday) {
      throw new BadRequestException('La fecha de inicio no puede ser anterior al tiempo actual');
    }

    const allSlots: Date[] = [];

    const existingAppointments = await this.appointmentRepo.find({
      where: {
        startTime: Between(start, end),
      },
    });

    const overlaps = (date: Date): boolean => {
      const startMs = date.getTime();
      const endMs = startMs + duration * 60000;

      return existingAppointments.some(app => {
        const appStart = app.startTime.getTime();
        const appEnd = appStart + app.duration * 60000;
        return startMs < appEnd && endMs > appStart;
      });
    };

    const current = new Date(start);

    while (current <= end) {
      if (
        this.isWorkingDay(current) &&
        this.isWithinWorkingHours(current, duration) &&
        !overlaps(current)
      ) {
        allSlots.push(new Date(current));
      }
      current.setMinutes(current.getMinutes() + DEFAULT_SLOT_INTERVAL);
    }

    return allSlots.map(slot => dayjs(slot).tz(DEFAULT_TIMEZONE).format());
  }

  async createAppointment(startTimestamp: number, duration: number = DEFAULT_SLOT_INTERVAL): Promise<Appointment> {
    const startTime = dayjs.unix(startTimestamp).toDate();
    if (!this.isWorkingDay(startTime)) {
      throw new BadRequestException('La cita debe ser en un día hábil (lunes a viernes)');
    }

    if (!this.isWithinWorkingHours(startTime, duration)) {
      throw new BadRequestException('La cita debe estar dentro del horario de atención');
    }

    const endTime = new Date(startTime.getTime() + duration * 60000);

    // MYSQL
    // const overlapping = await this.appointmentRepo
    //   .createQueryBuilder('a')
    //   .where(
    //     ':startTime < (a.startTime + INTERVAL a.duration MINUTE) AND :endTime > a.startTime',
    //     { startTime, endTime },
    //   )
    //   .getOne();

    // POSTGRESQL
    const overlapping = await this.appointmentRepo
      .createQueryBuilder('a')
      .where(
        `:startTime < a.startTime + make_interval(mins := a.duration) AND :endTime > a.startTime`,
        { startTime, endTime },
      )
      .getOne();

    if (overlapping) {
      throw new BadRequestException('Ya hay una cita en ese rango de tiempo');
    }

    const appointment = this.appointmentRepo.create({ startTime, duration });
    return this.appointmentRepo.save(appointment);
  }
}
