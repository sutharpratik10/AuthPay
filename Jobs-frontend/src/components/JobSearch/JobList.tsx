import React, { useState } from "react";

type Job = {
  id: number;
  company: string;
  title: string;
  location: string;
  bookmarked: boolean;
};

const initialJobs: Job[] = [
  { id: 1, company: "Acme Corp", title: "Frontend Developer", location: "Remote", bookmarked: false },
  { id: 2, company: "Globex Inc", title: "Backend Engineer", location: "New York, NY", bookmarked: false },
  { id: 3, company: "Initech", title: "Full Stack Developer", location: "San Francisco, CA", bookmarked: false },
];

const JobList: React.FC = () => {
  const [jobs, setJobs] = useState(initialJobs);

  const toggleBookmark = (id: number) => {
    setJobs(jobs =>
      jobs.map(job =>
        job.id === id ? { ...job, bookmarked: !job.bookmarked } : job
      )
    );
  };

  return (
    <div className="mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Job Listings</h2>
      <div className="bg-accent shadow rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="">
              <th className="px-4 py-2 text-left">Company</th>
              <th className="px-4 py-2 text-left">Job Title</th>
              <th className="px-4 py-2 text-left">Location</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id} className="border-t">
                <td className="px-4 py-2">{job.company}</td>
                <td className="px-4 py-2">{job.title}</td>
                <td className="px-4 py-2">{job.location}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => toggleBookmark(job.id)}
                    className="focus:outline-none"
                    aria-label={job.bookmarked ? "Remove bookmark" : "Bookmark"}
                  >
                    {job.bookmarked ? (
                      <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 3a2 2 0 00-2 2v12l7-4 7 4V5a2 2 0 00-2-2H5z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3a2 2 0 00-2 2v12l7-4 7 4V5a2 2 0 00-2-2H5z" />
                      </svg>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobList;