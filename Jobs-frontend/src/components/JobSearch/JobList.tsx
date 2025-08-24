
import React from "react";

const jobs = [
  {
    id: 1,
    company: "DEVTEST",
    title: "🚁 Copter pilot",
    level: "Mid level",
    description: "Are you ready to take flight with Devtest Corporation as our newest Copter Pilot Extraordinaire? Join our high-flying IT department!",
    url: "#"
  },
  {
    id: 2,
    company: "EY",
    title: "FS-RISK CONSULTING-SFT-ABS-SENIOR",
    level: "Senior level",
    description: "A Senior role at EY's Financial Services Organization, focusing on Structured Finance Transactions (ABS/MBS).",
    url: "#"
  },
  {
    id: 3,
    company: "Binance",
    title: "Operations Specialist - Pay&Card",
    level: "Mid level",
    description: "Join Binance as an Operations Specialist to manage crypto payment disputes, ensure compliance, and optimize processes.",
    url: "#"
  },
  {
    id: 4,
    company: "Wing",
    title: "Technical Support Representative",
    level: "Entry level",
    description: "Wing is seeking a remote Technical Support Representative in India to provide IT and customer support.",
    url: "#"
  },
  {
    id: 5,
    company: "Wing",
    title: "Graphic Designer",
    level: "Mid level",
    description: "Wing is seeking a Mid-level Graphic Designer based in India to create diverse digital and print assets.",
    url: "#"
  }
];

const JobList: React.FC = () => (
  <div className="mx-auto max-w-2xl mt-12 px-4">
    <h1 className="text-2xl font-bold mb-8 text-center">Job Listings</h1>
    <div className="flex flex-col gap-6">
      {jobs.map((job) => (
        <div key={job.id} className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6 flex flex-col gap-2">
          <div className="text-sm text-gray-500 dark:text-gray-300 font-semibold">{job.company}</div>
          <div className="text-xl font-bold dark:text-white">{job.title}</div>
          {job.level && <div className="text-gray-500 dark:text-gray-400 text-sm">{job.level}</div>}
          {job.description && <div className="text-gray-600 dark:text-gray-300 text-sm">{job.description}</div>}
          <div className="mt-2">
            <a
              href={job.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary dark:text-blue-400 font-semibold hover:underline"
            >
              Explore Opportunity →
            </a>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default JobList;