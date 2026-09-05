const en = {
  common: {
    back: "Back",
    getStarted: "Get started",
    moreOptions: "More options",
    seeAll: "See all",
    viewAll: "View all",
  },
  tabs: {
    home: "Home",
    trips: "My Trip",
    explore: "Explore",
    favorites: "Favorite",
    profile: "Profile",
  },
  home: {
    userEyebrow: "Welcome back",
    userName: "Loka User",
    search: "Search",
    notifications: "Notifications",
    searchPlaceholder: "Where do you want to go?",
    checkInHelper: "Discover stays, experiences, and hidden gems for your next trip.",
    exploreCity: "Explore city",
    recentTrip: "Recent Trip",
  },
  travel: {
    toggleFavorite: "Save {{title}}",
    priceFrom: "${{price}}/person",
    collectionResultCount: "{{count}} destinations",
    collections: {
      recommended: "Recommended for you",
      trending: "Trending now",
      seasonal: "Seasonal picks",
      new: "New releases",
    },
    cityScreen: {
      popularPlaces: "{{city}} Popular Places",
      galleries: "{{city}} Galleries",
      otherTrip: "Other Trip",
      popularPlace: "Popular Place",
      person: "person",
      toggleFeaturedFavorite: "Save featured place",
    },
    cities: {
      tokyo: {
        name: "Tokyo",
        country: "Japan",
        featuredTitle: "Lake Kawaguchi",
      },
      kyoto: {
        name: "Kyoto",
        country: "Japan",
        featuredTitle: "Arashiyama Bamboo Grove",
      },
      paris: {
        name: "Paris",
        country: "France",
        featuredTitle: "Montmartre",
      },
      singapore: {
        name: "Singapore",
        country: "Singapore",
        featuredTitle: "Marina Bay",
      },
      seoul: {
        name: "Seoul",
        country: "South Korea",
        featuredTitle: "Bukchon Hanok Village",
      },
    },
    detail: {
      title: "Detail",
      peopleVisited: "people have visited",
      details: "Details",
      galleries: "Galleries",
      startFrom: "Start from",
      person: "Person",
      checkout: "Checkout",
    },
    destinations: {
      haLongBay: {
        title: "Ha Long Bay",
        location: "Quang Ninh, Vietnam",
        description:
          "Sail between limestone islands, quiet coves, and floating villages in one of Vietnam's most memorable coastal landscapes.",
      },
      santorini: {
        title: "Santorini",
        location: "Cyclades, Greece",
        description:
          "Discover whitewashed villages, volcanic beaches, and sunset views across the Aegean Sea.",
      },
      bali: {
        title: "Bali Retreat",
        location: "Ubud, Indonesia",
        description:
          "Slow down among rice terraces, forest temples, and restorative island experiences.",
      },
      swissAlps: {
        title: "Swiss Alps",
        location: "Bernese Oberland, Switzerland",
        description:
          "Ride panoramic trains and follow alpine trails beneath Switzerland's dramatic peaks.",
      },
      parisEscape: {
        title: "Paris Escape",
        location: "Paris, France",
        description:
          "Walk through historic neighborhoods, riverside landmarks, galleries, and intimate cafes.",
      },
      newYork: {
        title: "New York City",
        location: "New York, United States",
        description:
          "Experience iconic neighborhoods, skyline views, museums, and food from around the world.",
      },
      sapporoWinter: {
        title: "Sapporo Winter",
        location: "Hokkaido, Japan",
        description:
          "Enjoy snow-covered streets, winter festivals, mountain views, and Hokkaido comfort food.",
      },
      maldives: {
        title: "Maldives Escape",
        location: "North Male Atoll, Maldives",
        description:
          "Unwind beside clear lagoons, coral reefs, and peaceful overwater stays.",
      },
      cappadocia: {
        title: "Cappadocia",
        location: "Nevsehir, Turkiye",
        description:
          "Explore sculpted valleys, cave towns, and sunrise skies filled with hot-air balloons.",
      },
      kyoto: {
        title: "Kyoto Heritage",
        location: "Kyoto, Japan",
        description:
          "Find quiet temples, traditional streets, seasonal gardens, and enduring craft culture.",
      },
      singapore: {
        title: "Singapore City",
        location: "Singapore",
        description:
          "Move between futuristic gardens, heritage districts, and one of Asia's best food scenes.",
      },
      amalfiCoast: {
        title: "Amalfi Coast",
        location: "Campania, Italy",
        description:
          "Follow cliffside towns, Mediterranean coves, and scenic roads along southern Italy.",
      },
    },
  },
  trips: {
    title: "My Trip",
    tabs: {
      booking: "Booking",
      planning: "Trip Planning",
    },
    remindMe: "Remind me",
    onGoing: "On Going",
    schedule: "Thursday, June 20 - 4:30 PM",
    forPeople: "for 4 people",
    planningTitle: "Build your next trip",
    planningDescription:
      "Destinations and activities added to your plan will appear here.",
    userPlans: "Your AI trip plans",
    bookings: {
      haLongBay: {
        date: "December 20, 2026",
        countdown: "In 4 days",
      },
      parisEscape: {
        date: "December 24, 2026",
        countdown: "In 8 days",
      },
    },
  },
  explore: {
    title: "Explore",
    description: "Search destinations, stays, and experiences around the world.",
  },
  travelPlan: {
    step: "Step {{current}}",
    chat: {
      title: "AI Trip Planner",
      online: "Ready to plan",
      restart: "Start over",
      progress: "{{current}}/{{total}} details",
      thinking: "Planning the next question...",
      generating: "Building your trip...",
      send: "Send answer",
      confirm: "Confirm",
      confirmInterests: "Continue with these interests",
      starter: {
        title: "Where should we go next?",
        description:
          "Plan through a short conversation. I will ask one question at a time and shape the itinerary around your choices.",
        action: "Create New Trip",
      },
      questions: {
        origin: "Great! To start planning, where will you be travelling from?",
        destination:
          "Where would you like to go? Add both city and country so I can keep the route focused.",
        groupSize:
          "Who is joining this trip? Choose the group that best matches your travellers.",
        budget: "What spending level feels right for this trip?",
        tripDuration:
          "How many days would you like to spend in {{destination}}?",
        interests:
          "What kind of experiences should I prioritize? You can choose more than one.",
        requirements:
          "Any special requirements or preferences I should account for?",
        final:
          "I have everything I need. Review your choices, then I will build the hotels and day-by-day plan.",
      },
      placeholders: {
        origin: "e.g. Ho Chi Minh City, Vietnam",
        destination: "e.g. Da Nang, Vietnam",
        requirements: "Type a preference or special requirement",
      },
      suggestions: {
        origins: {
          hoChiMinhCity: "Ho Chi Minh City, Vietnam",
          hanoi: "Hanoi, Vietnam",
          daNang: "Da Nang, Vietnam",
        },
        destinations: {
          daNang: "Da Nang, Vietnam",
          tokyo: "Tokyo, Japan",
          bali: "Bali, Indonesia",
        },
        requirements: {
          none: "No special requirements",
          children: "Travelling with young children",
          accessible: "Wheelchair-accessible places",
        },
      },
      answer: {
        days: "{{count}} days",
      },
      controls: {
        durationTitle: "How many days do you want to travel?",
        decreaseDays: "Decrease number of days",
        increaseDays: "Increase number of days",
      },
      summary: {
        route: "Route",
        group: "Group",
        budget: "Budget",
        duration: "Duration",
      },
      ready: {
        title: "Your trip is ready",
        description: "Hotels and a complete daily itinerary have been saved to My Trips.",
        action: "View Trip",
      },
    },
    intro: {
      title: "Plan a new trip",
      assistant: "Hi, I am your AI trip planner.",
      pitch: "Let's start planning your vacation trip automatically with AI",
      start: "Start Planning",
      benefits: {
        route: "Create the most appropriate travel path",
        length: "Adjust the length of your trip",
        budget: "Set a budget according to what you want",
        group: "Plan for solo travel, couples, friends, or family",
      },
    },
    actions: {
      continue: "Continue",
      generate: "Generate Trip",
      planAnother: "Plan another trip",
    },
    steps: {
      destination: {
        title: "Where do you want to go?",
        subtitle: "Choose a destination to anchor the plan.",
      },
      traveller: {
        title: "Who is this trip with?",
        subtitle: "Choose who you are going with.",
      },
      duration: {
        title: "How long is the trip?",
        subtitle: "Pick a suggested travel length.",
      },
      budget: {
        title: "What is your budget?",
        subtitle: "Select the spending style for this plan.",
      },
      review: {
        title: "Review Summary",
        subtitle: "Confirm the details before AI builds your itinerary.",
      },
    },
    summary: {
      tripName: "Trip Name",
      destination: "Destination",
      traveller: "Choose your traveller",
      dates: "Travel Dates",
      budget: "Travel Budget",
      interests: "Interest",
    },
    status: {
      planned: "Planned",
      completed: "Completed",
    },
    demoTrip: {
      name: "Raja Ampat Islands",
      destination: "West Papua",
      date: "20 May, 2024",
    },
    generated: {
      title: "Trip Plan",
      defaultName: "Trip to {{destination}}",
      startDate: "18 Jun, 2026",
      endDate: "20 Jun, 2026",
      people: "people",
      peopleCount: "{{count}} Person",
      day: "Day {{day}}",
      hotels: "Suggested hotels",
      itinerary: "Daily itinerary",
      fallbackSummary:
        "A balanced itinerary for {{destination}} with practical routes, local food, and time to rest.",
      fallbackHotel: {
        name: "Recommended stay {{index}}",
        address: "Central {{destination}}",
        price: "${{price}} / night",
        description: "A well-located stay selected to fit your route and budget.",
      },
      fallbackActivity: {
        details: "A practical stop selected around your interests in {{destination}}.",
        address: "Central {{destination}}",
        ticket: "Check locally",
        travelTime: "20-30 min",
        bestTime: "Morning",
      },
      fallbackDays: [
        {
          title: "Arrive and settle in",
          summary: "Ease into {{destination}} with a light first day.",
          activity1: "Check in near the main area",
          activity2: "Walk a scenic neighborhood",
          activity3: "Try a local dinner spot",
        },
        {
          title: "Signature experiences",
          summary: "Spend the day around the strongest highlights.",
          activity1: "Visit the top landmark early",
          activity2: "Add a food or culture stop",
          activity3: "Watch sunset from a viewpoint",
        },
        {
          title: "Slow morning and return",
          summary: "Close the trip without rushing the last day.",
          activity1: "Breakfast at a local cafe",
          activity2: "Shop for small gifts",
          activity3: "Transfer back to the airport",
        },
      ],
    },
    options: {
      destinations: {
        indonesia: {
          title: "Indonesia",
          subtitle: "Islands, beaches, temples, and warm local food.",
          location: "Indonesia",
        },
        japan: {
          title: "Japan",
          subtitle: "Cities, shrines, trains, food streets, and seasons.",
          location: "Japan",
        },
        vietnam: {
          title: "Vietnam",
          subtitle: "Bays, old towns, mountain roads, and street food.",
          location: "Vietnam",
        },
      },
      travellers: {
        solo: {
          title: "Only Me",
          subtitle: "Travelling alone with a flexible pace.",
        },
        couple: {
          title: "With a Couple",
          subtitle: "Balanced comfort and memorable moments.",
        },
        family: {
          title: "With Family",
          subtitle: "Easy routing and family-friendly experiences.",
        },
        friends: {
          title: "My Friends",
          subtitle: "Fun stops with shared activities.",
        },
      },
      durations: {
        threeDays: {
          title: "3 days / 2 nights",
          subtitle: "A compact long-weekend plan.",
        },
        fourDays: {
          title: "4 days / 3 nights",
          subtitle: "More time for one slower day.",
        },
        oneWeek: {
          title: "7 days / 6 nights",
          subtitle: "A deeper route with more variety.",
        },
      },
      budgets: {
        cheap: {
          title: "Cheap",
          subtitle: "Prioritize value stays, local food, and public transport.",
        },
        balanced: {
          title: "Balanced",
          subtitle: "Mix comfort, guided activities, and good meals.",
        },
        premium: {
          title: "Premium",
          subtitle: "Choose upgraded stays and curated experiences.",
        },
      },
      interests: {
        relaxing: {
          title: "Relaxing",
          subtitle: "Slow pace and restful stops.",
        },
        roadTrip: {
          title: "Road Trip",
          subtitle: "Scenic moves between places.",
        },
        historical: {
          title: "Historical",
          subtitle: "Culture, landmarks, and old towns.",
        },
        foodTourism: {
          title: "Food Tourism",
          subtitle: "Local dishes and market stops.",
        },
        backpacking: {
          title: "Backpacking",
          subtitle: "Lightweight and flexible discovery.",
        },
      },
    },
  },
  favorites: {
    title: "My Favorite",
    searchPlaceholder: "Search favorites",
    recentAdded: "Recent Added",
    favoriteList: "Favorite List",
    empty: "No favorites match this filter.",
    categories: {
      all: "All",
      adventure: "Adventure",
      beach: "Beach",
      culture: "Culture",
    },
  },
  auth: {
    title: "Start your next journey",
    description:
      "Sign in to sync your trips, favorites, and travel plans across devices.",
    google: "Continue with Google",
    signingIn: "Signing in...",
    legal:
      "By continuing, you agree to Loka's Terms of Use and Privacy Policy.",
    errors: {
      signIn: "Google sign-in could not be completed. Please try again.",
      network: "The server could not be reached. Check the API URL and your connection.",
    },
  },
  profile: {
    title: "My Profile",
    fallbackName: "Loka User",
    googleAccount: "Google account",
    editProfile: "Edit profile",
    signOutErrorTitle: "Unable to sign out",
    signOutError: "The server could not be reached. Please try again.",
    languages: {
      vi: "Vietnamese",
      en: "English",
    },
    items: {
      bookings: {
        title: "My Bookings",
        subtitle: "2 active, 2 history",
      },
      payment: {
        title: "Payment",
        subtitle: "Credit card and PayPal",
      },
      language: {
        title: "Language",
      },
      helpCenter: {
        title: "Help Center",
        subtitle: "Support available 24/7",
      },
      terms: {
        title: "Terms & Conditions",
        subtitle: "Terms for using Loka",
      },
      privacy: {
        title: "Privacy Policy",
        subtitle: "How we protect your data",
      },
      rateUs: {
        title: "Rate Us",
        subtitle: "Share your experience",
      },
      deleteAccount: {
        title: "Delete account",
        subtitle: "Request permanent account deletion",
      },
      signOut: {
        title: "Sign out",
        pending: "Signing out...",
        subtitle: "Sign out of this account",
      },
    },
  },
};

export default en;
