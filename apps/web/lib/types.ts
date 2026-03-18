/**
 * Types matching the Rust API (apps/api/src/models/project.rs).
 */

export interface Milestone {
  name: string;
  percentage: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  funding_target: number;
  escrow_treasury_address: string;
  milestones: Milestone[];
}
