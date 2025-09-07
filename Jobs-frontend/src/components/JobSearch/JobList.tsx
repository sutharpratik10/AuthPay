
import React, { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface Job {
  id: number;
  company: string;
  title: string;
  level: string;
  description: string;
  url: string;
  location: string;
  jobType: string;
  skills: string[];
  salary?: string;
  postedDate: string;
  featured?: boolean;
  companyLogo?: string;
}

const jobs: Job[] = [
  {
    id: 1,
    company: "DEVTEST",
    title: "🚁 Copter pilot",
    level: "Mid level",
    description: "Are you ready to take flight with Devtest Corporation as our newest Copter Pilot Extraordinaire? Join our high-flying IT department!",
    url: "#",
    location: "Remote",
    jobType: "remote",
    skills: ["Aviation", "IT Support", "Communication"],
    salary: "$80,000 - $120,000",
    postedDate: "2024-09-05",
    featured: true
  },
  {
    id: 2,
    company: "EY",
    title: "FS-RISK CONSULTING-SFT-ABS-SENIOR",
    level: "Senior level",
    description: "A Senior role at EY's Financial Services Organization, focusing on Structured Finance Transactions (ABS/MBS).",
    url: "#",
    location: "New York, NY",
    jobType: "office",
    skills: ["Risk Management", "Financial Analysis", "Structured Finance", "ABS", "MBS"],
    salary: "$150,000 - $200,000",
    postedDate: "2024-09-04",
    featured: true
  },
  {
    id: 3,
    company: "Binance",
    title: "Operations Specialist - Pay&Card",
    level: "Mid level",
    description: "Join Binance as an Operations Specialist to manage crypto payment disputes, ensure compliance, and optimize processes.",
    url: "#",
    location: "Singapore",
    jobType: "hybrid",
    skills: ["Cryptocurrency", "Payment Processing", "Compliance", "Operations"],
    salary: "$70,000 - $100,000",
    postedDate: "2024-09-03"
  },
  {
    id: 4,
    company: "Wing",
    title: "Technical Support Representative",
    level: "Entry level",
    description: "Wing is seeking a remote Technical Support Representative in India to provide IT and customer support.",
    url: "#",
    location: "Mumbai, India",
    jobType: "remote",
    skills: ["Customer Support", "Technical Troubleshooting", "Communication"],
    salary: "$25,000 - $35,000",
    postedDate: "2024-09-02"
  },
  {
    id: 5,
    company: "Wing",
    title: "Graphic Designer",
    level: "Mid level",
    description: "Wing is seeking a Mid-level Graphic Designer based in India to create diverse digital and print assets.",
    url: "#",
    location: "Bangalore, India",
    jobType: "hybrid",
    skills: ["Adobe Creative Suite", "UI/UX Design", "Print Design", "Digital Marketing"],
    salary: "$30,000 - $50,000",
    postedDate: "2024-09-01"
  },
  {
    id: 6,
    company: "Microsoft",
    title: "Senior Software Engineer",
    level: "Senior level",
    description: "Join Microsoft's cloud platform team to build scalable solutions for enterprise customers worldwide.",
    url: "#",
    location: "Seattle, WA",
    jobType: "hybrid",
    skills: ["C#", "Azure", "Microservices", "Kubernetes", "DevOps"],
    salary: "$160,000 - $220,000",
    postedDate: "2024-09-06",
    featured: true
  },
  {
    id: 7,
    company: "Meta",
    title: "Frontend Developer",
    level: "Mid level",
    description: "Build the next generation of social media experiences using React and modern web technologies.",
    url: "#",
    location: "Menlo Park, CA",
    jobType: "office",
    skills: ["React", "TypeScript", "GraphQL", "JavaScript", "CSS"],
    salary: "$130,000 - $180,000",
    postedDate: "2024-09-05"
  },
  {
    id: 8,
    company: "Stripe",
    title: "Product Manager",
    level: "Senior level",
    description: "Lead product strategy for Stripe's payment infrastructure serving millions of businesses globally.",
    url: "#",
    location: "San Francisco, CA",
    jobType: "hybrid",
    skills: ["Product Strategy", "Data Analysis", "Fintech", "API Design"],
    salary: "$180,000 - $250,000",
    postedDate: "2024-09-04",
    featured: true
  }
];

interface SearchFilters {
  jobTitle: string;
  skills: string[];
  location: string;
  jobType: string;
  experienceLevel: string;
  salaryRange: string;
  company: string;
}

interface JobListProps {
  searchFilters?: SearchFilters;
}

const JobList: React.FC<JobListProps> = ({ searchFilters }) => {
  const [sortBy, setSortBy] = useState<'date' | 'salary' | 'company'>('date');
  const [savedJobs, setSavedJobs] = useState<Set<number>>(new Set());

  const filteredAndSortedJobs = useMemo(() => {
    let filtered = jobs;

    // Apply search filters
    if (searchFilters) {
      filtered = jobs.filter(job => {
        const titleMatch = !searchFilters.jobTitle || 
          job.title.toLowerCase().includes(searchFilters.jobTitle.toLowerCase());
        
        const locationMatch = !searchFilters.location || 
          job.location.toLowerCase().includes(searchFilters.location.toLowerCase());
        
        const jobTypeMatch = !searchFilters.jobType || 
          job.jobType === searchFilters.jobType;
        
        const skillsMatch = searchFilters.skills.length === 0 || 
          searchFilters.skills.some(skill => 
            job.skills.some(jobSkill => 
              jobSkill.toLowerCase().includes(skill.toLowerCase())
            )
          );

        const experienceLevelMatch = !searchFilters.experienceLevel || 
          job.level.toLowerCase() === searchFilters.experienceLevel.toLowerCase();

        const companyMatch = !searchFilters.company || 
          job.company.toLowerCase().includes(searchFilters.company.toLowerCase());

        // Salary range filtering (simplified)
        let salaryMatch = true;
        if (searchFilters.salaryRange && job.salary) {
          const jobSalaryNum = parseInt(job.salary.replace(/[^0-9]/g, ''));
          switch (searchFilters.salaryRange) {
            case '0-50000':
              salaryMatch = jobSalaryNum <= 50000;
              break;
            case '50000-100000':
              salaryMatch = jobSalaryNum >= 50000 && jobSalaryNum <= 100000;
              break;
            case '100000-150000':
              salaryMatch = jobSalaryNum >= 100000 && jobSalaryNum <= 150000;
              break;
            case '150000+':
              salaryMatch = jobSalaryNum >= 150000;
              break;
          }
        }

        return titleMatch && locationMatch && jobTypeMatch && skillsMatch && 
               experienceLevelMatch && companyMatch && salaryMatch;
      });
    }

    // Sort jobs
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        case 'company':
          return a.company.localeCompare(b.company);
        case 'salary':
          // Extract salary numbers for comparison (simplified)
          const aSalary = parseInt(a.salary?.replace(/[^0-9]/g, '') || '0');
          const bSalary = parseInt(b.salary?.replace(/[^0-9]/g, '') || '0');
          return bSalary - aSalary;
        default:
          return 0;
      }
    });
  }, [searchFilters, sortBy]);

  const toggleSaveJob = (jobId: number) => {
    setSavedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const getJobTypeColor = (jobType: string) => {
    switch (jobType) {
      case 'remote': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'hybrid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'office': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'entry level': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'mid level': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'senior level': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Posted today';
    if (diffDays <= 7) return `Posted ${diffDays} days ago`;
    return `Posted on ${date.toLocaleDateString()}`;
  };

  return (
    <div className="mx-auto mt-12 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Listings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {filteredAndSortedJobs.length} jobs found
            {searchFilters?.jobTitle && ` for "${searchFilters.jobTitle}"`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'salary' | 'company')}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="date">Latest</option>
            <option value="salary">Salary</option>
            <option value="company">Company</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {filteredAndSortedJobs.map((job) => (
          <div 
            key={job.id} 
            className={`bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow ${
              job.featured ? 'ring-2 ring-blue-500 ring-opacity-20' : ''
            }`}
          >
            {job.featured && (
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                  ⭐ Featured
                </Badge>
              </div>
            )}
            
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
                    {job.company}
                  </div>
                  <Badge className={`text-xs ${getJobTypeColor(job.jobType)}`}>
                    {job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {job.title}
                </h3>
                
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge className={`text-xs ${getLevelColor(job.level)}`}>
                    {job.level}
                  </Badge>
                  <span className="text-sm text-gray-500 dark:text-gray-400">📍 {job.location}</span>
                  {job.salary && (
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      💰 {job.salary}
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                  {job.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {job.skills.slice(0, 4).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {job.skills.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{job.skills.length - 4} more
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(job.postedDate)}
                </p>
              </div>
              
              <div className="flex flex-col gap-2 lg:min-w-[120px]">
                <Button
                  onClick={() => window.open(job.url, '_blank')}
                  className="w-full"
                >
                  Apply Now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSaveJob(job.id)}
                  className={`w-full ${savedJobs.has(job.id) ? 'bg-blue-50 text-blue-600 border-blue-300' : ''}`}
                >
                  {savedJobs.has(job.id) ? '❤️ Saved' : '🤍 Save'}
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredAndSortedJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No jobs found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search criteria to find more opportunities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobList;