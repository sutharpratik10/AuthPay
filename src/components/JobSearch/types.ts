// Shared SearchFilters type for JobSearch components
export interface SearchFilters {
  jobTitle: string;
  skills: string[];
  location: string;
  jobType: string;
  experienceLevel?: string;
  salaryRange?: string;
  company?: string;
}
