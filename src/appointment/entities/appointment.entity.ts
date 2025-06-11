// appointment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Appointment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp' })
    startTime: Date;

    @Column({ type: 'int' }) // duración en minutos
    duration: number;

    @Column({ default: false })
    cancelled: boolean;
}
