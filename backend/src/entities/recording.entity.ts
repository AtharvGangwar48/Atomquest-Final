import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Session } from './session.entity';

@Entity('recordings')
export class Recording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @ManyToOne(() => Session)
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @Column({ type: 'enum', enum: ['recording', 'processing', 'ready', 'failed'], default: 'recording' })
  status: 'recording' | 'processing' | 'ready' | 'failed';

  @Column({ nullable: true })
  egressId: string;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ nullable: true })
  duration: number;

  @Column({ nullable: true, type: 'timestamp' })
  endedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
