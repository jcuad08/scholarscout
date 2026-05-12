// Shared types so both the Tracker component and the tracker-storage helper
// can reference the same shape without a circular import.

export type Status =
  | "Not started"
  | "Researching"
  | "Gathering materials"
  | "Drafting essay"
  | "Ready to submit"
  | "Submitted"
  | "Won"
  | "Rejected";

export const STATUSES: Status[] = [
  "Not started",
  "Researching",
  "Gathering materials",
  "Drafting essay",
  "Ready to submit",
  "Submitted",
  "Won",
  "Rejected",
];

export type Row = {
  id: string;
  name: string;
  award: string;
  deadline: string;
  status: Status;
  submitted: string;
  notes: string;
};

export type WonLost = {
  id: string;
  name: string;
  result: "Won" | "Rejected";
  amount: string;
  date: string;
};
