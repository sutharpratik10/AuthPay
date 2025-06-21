"use client"

export const ProjectInfo = {
  companyLogo: "/file.svg",
  companyName: "RSVP App"
}

export const NavigationService = {
  navigationItems: [
    {
      title: "Docs",
      href: "/docs"
    },
    {
      title: "Features",
      items: [
        {
          title: "Event Management",
          description: "Create and manage your events with ease",
          href: "/features/event-management"
        },
        {
          title: "Invitations",
          description: "Send beautiful digital invitations",
          href: "/features/invitations"
        },
        {
          title: "RSVP Tracking",
          description: "Track responses and manage your guest list",
          href: "/features/rsvp-tracking"
        },
        {
          title: "Analytics",
          description: "Get insights about your events",
          href: "/features/analytics"
        }
      ]
    },
    {
      title: "Theme Demo",
      href: "/theme-demo"
    },
    {
      title: "About Us",
      items: [
        {
          title: "Our Story",
          description: "Learn about our journey",
          href: "/about/story"
        },
        {
          title: "Team",
          description: "Meet the people behind RSVP App",
          href: "/about/team"
        },
        {
          title: "Contact",
          description: "Get in touch with us",
          href: "/about/contact"
        }
      ]
    }
  ]
}
