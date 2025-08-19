import jobsData from "../../../jobs_data/scrapped/jobs.json";
import React, { useRef, useEffect, useState, useCallback } from "react";

type Job = {
  id: string | number;
  company: string;
  title: string;
  location?: string;
  level?: string;
  description?: string;
  url?: string;
  postedDate?: string;
};

const JobCard: React.FC<{ job: Job }> = ({ job }) => (
  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 flex flex-col justify-between min-h-[220px] transition-colors">
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-300 font-semibold mb-1">{job.company}</div>
      <div className="inline-block bg-green-100 dark:bg-green-900 dark:text-green-200 text-green-700 text-xs font-bold px-2 py-1 rounded mb-2">TODAY</div>
      <div className="text-xl font-bold mb-1 dark:text-white">{job.title}</div>
      {job.level && <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">{job.level}</div>}
      {job.description && <div className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">{job.description}</div>}
    </div>
    <div>
      <a
        href={job.url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary dark:text-blue-400 font-semibold hover:underline flex items-center mt-2"
      >
        Explore Opportunity
        <span className="ml-1">→</span>
      </a>
    </div>
  </div>
);



// Types for parsing jobs.json
type JobsJsonOffer = {
  id?: string | number;
  title?: string;
  name?: string;
  sharing_title?: string;
  location?: string;
  city?: string;
  country?: string;
  level?: string;
  seniority?: string;
  experience?: string;
  description?: string;
  short_description?: string;
  snippet?: string;
  translations?: { en?: { description?: string } };
  url?: string;
  careers_url?: string;
  apply_url?: string;
  link?: string;
  posted_at?: string;
  date?: string;
  created_at?: string;
};
type JobsJsonObj = { jobs?: { offers?: JobsJsonOffer[] } };
type JobsJson = Record<string, JobsJsonObj[]>;

const parseJobs = (data: unknown): Job[] => {
  const allJobs: Job[] = [];
  if (typeof data !== 'object' || data === null) return allJobs;
  Object.entries(data as JobsJson).forEach(([company, jobsArr]) => {
    if (Array.isArray(jobsArr)) {
      jobsArr.forEach((jobObj, idx) => {
        if (
          jobObj &&
          typeof jobObj === "object" &&
          'jobs' in jobObj &&
          jobObj.jobs &&
          typeof jobObj.jobs === "object" &&
          Array.isArray(jobObj.jobs.offers) &&
          jobObj.jobs.offers.length > 0
        ) {
          jobObj.jobs.offers.forEach((j, jidx) => {
            allJobs.push({
              id: j.id || `${company}-${idx}-${jidx}`,
              company: company,
              title: j.title || j.name || j.sharing_title || "Untitled",
              location: j.location || j.city || j.country || "",
              level: j.level || j.seniority || j.experience || "",
              description: (j.translations && j.translations.en && j.translations.en.description) || j.description || j.short_description || j.snippet || "",
              url: j.careers_url || j.url || j.apply_url || j.link || "#",
              postedDate: j.posted_at || j.date || j.created_at || ""
            });
          });
        }
      });
    }
  });
  return allJobs;
};

const jobs = parseJobs(jobsData);

const PAGE_SIZE = 20;

const JobList: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, jobs.length));
    }
  }, []);

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1
    };
    const observer = new window.IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [handleObserver]);

  const visibleJobs = jobs.slice(0, visibleCount);

  return (
    <div className="mx-auto mt-8 px-4">
      <div className="grid grid-cols-1 gap-6">
        {visibleJobs.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-300">No jobs found.</div>
        ) : (
          visibleJobs.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>
      {visibleCount < jobs.length && (
        <div ref={loaderRef} className="w-full flex justify-center py-8">
          <span className="text-gray-400 dark:text-gray-500">Loading more jobs...</span>
        </div>
      )}
    </div>
  );
};

export default JobList;