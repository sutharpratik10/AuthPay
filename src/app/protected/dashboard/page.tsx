"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface Event {
  id: string
  title: string
  date: string
  attendees: number
  status: "upcoming" | "active" | "past"
}

const mockEvents: Event[] = [
  {
    id: "evt-001",
    title: "Summer Beach Party",
    date: "2025-07-15",
    attendees: 38,
    status: "upcoming"
  },
  {
    id: "evt-002",
    title: "Tech Conference 2025",
    date: "2025-08-25",
    attendees: 124,
    status: "upcoming"
  },
  {
    id: "evt-003",
    title: "Team Building Workshop",
    date: "2025-06-30",
    attendees: 15,
    status: "upcoming"
  },
  {
    id: "evt-004",
    title: "Annual Charity Gala",
    date: "2025-05-20",
    attendees: 89,
    status: "past"
  }
]

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("User")
  
  // Simulate fetching data
  useEffect(() => {
    const fetchData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setEvents(mockEvents)
      // Parse the name of the logged in user from localStorage or fallback
      const storedName = localStorage.getItem("userName")
      // Simulate fetching user name from database
      const fetchUserNameFromDB = async () => {
        // Replace this with actual API/database call
        await new Promise(resolve => setTimeout(resolve, 500))
        return "Pratik" // Example fetched name
      }
      const nameFromDB = await fetchUserNameFromDB()
      setUserName(nameFromDB || (storedName ? storedName : "User"))
      setIsLoading(false)
    }
    
    fetchData()
  }, [])
  
  return (

    <div className="w-full max-w-full px-2 sm:px-4 py-6 mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome back, {userName}! Here&#39;s an overview of your events.
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          Create New Event
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-lg font-semibold">Total Events</h3>
          </div>
          <div className="pt-4">
            <div className="text-4xl font-bold">{isLoading ? "-" : events.length}</div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-lg font-semibold">Upcoming Events</h3>
          </div>
          <div className="pt-4">
            <div className="text-4xl font-bold">
              {isLoading ? "-" : events.filter(e => e.status === "upcoming").length}
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-lg font-semibold">Total Attendees</h3>
          </div>
          <div className="pt-4">
            <div className="text-4xl font-bold">
              {isLoading ? "-" : events.reduce((acc, evt) => acc + evt.attendees, 0)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="rounded-lg border mt-6 overflow-x-auto">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Your Events</h2>
        </div>
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/20">
                  <th className="text-left p-3 font-medium">Event Name</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Attendees</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} className="border-b">
                    <td className="sm:p-0 sm:pl-1">{event.title}</td>
                    <td className="sm:p-0 sm:pl-1">{new Date(event.date).toLocaleDateString()}</td>
                    <td className="sm:p-0 sm:pl-1">{event.attendees}</td>
                    <td className="sm:p-0 sm:pl-1">
                      <span className={`inline-flex items-center rounded-full sm:p-0.5 p-2 text-xs font-semibold ${
                        event.status === 'upcoming'
                          ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : event.status === 'active'
                          ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">View</Button>
                        <Button size="sm" variant="outline">Edit</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
