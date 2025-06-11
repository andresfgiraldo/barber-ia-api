// appointment.controller.ts
import { Controller, Get, Post, Body, Query, Delete, Param } from '@nestjs/common';
import { AppointmentService } from './appointment.service';

@Controller('/')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) { }

  @Get('available')
  async getAvailable(
    @Query('startTimestamp') startTimestamp: number,
    @Query('endTimestamp') endTimestamp: number,
    // @Query('duration') duration: string,
  ) {
    return this.appointmentService.getAvailableSlots(
      startTimestamp,
      endTimestamp,
      // parseInt(duration),
    );
  }

  @Post()
  async create(
    @Body('startTimestamp') startTimestamp: number
  ) {
    return this.appointmentService.createAppointment(startTimestamp);
  }

}
