import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class Accountant {

  @PrimaryColumn({ unique: true })
  id: string;

  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  facebook?: string;

  @Column({ nullable: true })
  twitter?: string;

  @Column({ nullable: true })
  linkedIn?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  about?: string;

  @Column({ nullable: true })
  services?: string;

  @Column({ nullable: true })
  more?: string;

}