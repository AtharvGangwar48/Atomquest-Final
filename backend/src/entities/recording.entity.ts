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

  @Column({ type: 'enum', enum: ['in_progress', 'processing', 'ready', 'failed'], default: 'in_progress' })
  status: 'in_progress' | 'processing' | 'ready' | 'failed';

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ nullable: true })
  duration: number;

  @CreateDateColumn()
  createdAt: Date;
}
