/* ==========================================================================
   Contenu du portfolio — un seul endroit à modifier.
   Chaque monde = un pays du tableau des départs.
   Chaque ville = un arrêt sur la route, avec sa fenêtre d'informations.
   `amb` renvoie à un décor défini dans js/world.js.
   ========================================================================== */

const PROFILE = {
  name: "Annabelle Megy",
  email: "annabelle.megy@gmail.com",
  linkedin: "https://www.linkedin.com/in/annabelle-megy-515721223/",
  github: "https://github.com/Annabelle-m",
  cv: "assets/cv/Annabelle_MEGY_CV.pdf",
  role: { fr: "Développeuse full-stack en alternance", en: "Full-stack developer, work-study" },
  base: { fr: "Bordeaux · télétravail ou présentiel · permis B", en: "Bordeaux, France · remote or on-site · driving licence" },
  pitch: {
    fr: "15 ans à organiser les voyages des autres. Aujourd'hui, je construis des applications web. Je cherche une alternance M1/M2 pour continuer le voyage.",
    en: "15 years organising other people's trips. Now I build web applications. I'm looking for a Master's work-study position (M1/M2) to keep travelling."
  }
};

const UI = {
  fr: {
    departures: "Départs", time: "Heure", flight: "Vol", destination: "Destination", gate: "Porte", status: "Statut",
    onTime: "À l'heure", boarding: "Embarquement", from: "Bordeaux · BOD",
    homeKicker: "Recherche alternance M1 / M2 · Dév. full-stack", homeTitle: "Ancienne agente de voyage,<br>future développeuse full-stack.",
    homeLead: "Choisissez un vol sur le tableau. Chaque destination ouvre un monde à parcourir en scooter.",
    classic: "Version classique", immersive: "Version immersive", skip: "Passer", skipHint: "Échap pour passer",
    takeoff: "Décollage", cruise: "En vol", landing: "Atterrissage",
    toAirport: "Aéroport", toAirportLong: "Retour à l'aéroport", sound: "Son", lang: "EN",
    exitPrompt: "Bifurcation vers l'aéroport central", exitBtn: "Prendre la route de l'aéroport", exitKey: "Entrée",
    controls: "↑ avancer · ↓ freiner / reculer · ← → tourner", readingZone: "Zone de lecture",
    welcome: "Bienvenue", nextWorld: "Prochain monde", bridge: "Pont océanique", returnFlight: "Retour au terminal",
    mobileHint: "Astuce : en paysage, c'est plus confortable.", kmh: "km/h", close: "Fermer",
    copy: "Copier", copied: "Copié", cvBtn: "Télécharger mon CV",
    postcardTitle: "Écrire une carte postale", postcardName: "Votre nom", postcardMsg: "Votre message",
    postcardSend: "Ouvrir dans ma messagerie", postcardNote: "Le bouton prépare un e-mail dans votre messagerie. Si rien ne s'ouvre, copiez l'adresse ci-dessus.",
    sections: { about: "À propos", journey: "Reconversion", skills: "Compétences", experience: "Expériences", projects: "Projets", contact: "Contact" },
    seeCode: "Code", available: "Disponible pour une alternance M1/M2",
    flyLines: ["Wiiiii !", "Accrochez-vous !", "Livraison express !", "Raccourci aérien !"], flyChute: "Parachute ouvert ☂", mapHint: "Cliquez une ville pour y sauter"
  },
  en: {
    departures: "Departures", time: "Time", flight: "Flight", destination: "Destination", gate: "Gate", status: "Status",
    onTime: "On time", boarding: "Boarding", from: "Bordeaux · BOD",
    homeKicker: "Seeking work-study M1 / M2 · Full-stack dev", homeTitle: "Former travel agent,<br>future full-stack developer.",
    homeLead: "Pick a flight on the board. Each destination opens a world you explore by scooter.",
    classic: "Classic version", immersive: "Immersive version", skip: "Skip", skipHint: "Esc to skip",
    takeoff: "Take-off", cruise: "Cruising", landing: "Landing",
    toAirport: "Airport", toAirportLong: "Back to the airport", sound: "Sound", lang: "FR",
    exitPrompt: "Exit to the central airport", exitBtn: "Take the airport road", exitKey: "Enter",
    controls: "↑ go · ↓ brake / reverse · ← → steer", readingZone: "Reading zone",
    welcome: "Welcome", nextWorld: "Next world", bridge: "Ocean bridge", returnFlight: "Back to the terminal",
    mobileHint: "Tip: landscape mode is more comfortable.", kmh: "km/h", close: "Close",
    copy: "Copy", copied: "Copied", cvBtn: "Download my CV",
    postcardTitle: "Write a postcard", postcardName: "Your name", postcardMsg: "Your message",
    postcardSend: "Open in my mail app", postcardNote: "The button drafts an email in your mail app. If nothing opens, copy the address above.",
    sections: { about: "About", journey: "Career change", skills: "Skills", experience: "Experience", projects: "Projects", contact: "Contact" },
    seeCode: "Code", available: "Available for a Master's work-study (M1/M2)",
    flyLines: ["Wheeee!", "Hold on tight!", "Express delivery!", "Air shortcut!"], flyChute: "Parachute open ☂", mapHint: "Click a city to jump there"
  }
};

/* --------------------------------------------------------------------------
   Les cinq mondes, dans l'ordre de la boucle routière.
   -------------------------------------------------------------------------- */
const WORLDS = [
  {
    id: "france", section: "about", code: "CDG", flight: "AM 101", gate: "A01", time: "08:15",
    country: { fr: "France", en: "France" }, label: { fr: "À propos", en: "About me" }, accent: "#6fa8ff",
    cities: [
      {
        id: "paris", amb: "paris", name: "Paris",
        panel: {
          fr: {
            kicker: "Paris · À propos", title: "Bonjour, moi c'est Annabelle.",
            lead: "Développeuse full-stack en alternance, basée à Bordeaux. J'ai passé quinze ans à organiser des voyages avant de passer de l'autre côté de l'écran.",
            items: [
              ["Aujourd'hui", "En Bachelor Coordinateur de projets informatiques, en alternance chez DBF Automobiles à Bruges (33), sur une stack PHP natif et MySQL."],
              ["Objectif", "Poursuivre jusqu'au M2 en alternance dans le développement, avec une curiosité forte pour l'IA appliquée au code."],
              ["Ma façon de travailler", "Organisée, autonome, curieuse. J'aime comprendre un besoin avant d'écrire la première ligne."],
              ["Hors écran", "12 ans de gymnastique (dont 5 en sport-études), 18 ans de volley dont 6 au niveau national, et un an en Australie en PVT."]
            ],
            tags: ["Bordeaux", "Alternance", "Full-stack", "Français · Anglais"]
          },
          en: {
            kicker: "Paris · About me", title: "Hi, I'm Annabelle.",
            lead: "Full-stack developer on a work-study programme, based in Bordeaux. I spent fifteen years organising trips before moving to the other side of the screen.",
            items: [
              ["Today", "Bachelor's in IT project coordination, work-study at DBF Automobiles in Bruges (near Bordeaux), on a plain PHP and MySQL stack."],
              ["Goal", "Carry on to a Master's (M2) through work-study in development, with a strong interest in AI applied to code."],
              ["How I work", "Organised, autonomous, curious. I like to understand a need before writing the first line."],
              ["Off screen", "12 years of gymnastics (5 in a sports-study programme), 18 years of volleyball including 6 at national level, and a year in Australia on a working holiday visa."]
            ],
            tags: ["Bordeaux", "Work-study", "Full-stack", "French · English"]
          }
        }
      },
      {
        id: "bordeaux", amb: "bordeaux", name: "Bordeaux",
        panel: {
          fr: {
            kicker: "Bordeaux · Ma reconversion", title: "Du billet d'avion au code.",
            lead: "Ma reconversion s'est construite étape par étape, comme un itinéraire avec ses correspondances.",
            items: [
              ["2012 → 2013", "Titre professionnel Conseiller Séjours et Voyages, AFPA Bayonne."],
              ["2010 → 2025", "Quinze ans dans le tourisme : relation client, billetterie affaires, outils GDS."],
              ["2025 → 2026", "Titre professionnel Développeur Web et Web Mobile (Bac+2), La Piscine Bordeaux."],
              ["Depuis sept. 2026", "Bachelor Coordinateur de projets informatiques, en alternance chez DBF Automobiles."],
              ["Ce que je garde du voyage", "Lire une demande complexe, trouver une solution qui tient la route, respecter les délais. C'est déjà la moitié du métier de dev."]
            ],
            tags: ["DWWM · Bac+2", "Bachelor · Bac+3", "Prochaine escale : M1/M2"]
          },
          en: {
            kicker: "Bordeaux · Career change", title: "From plane tickets to code.",
            lead: "My career change was built one step at a time, like an itinerary with its connections.",
            items: [
              ["2012 → 2013", "Professional title in travel consulting, AFPA Bayonne."],
              ["2010 → 2025", "Fifteen years in tourism: customer relations, business ticketing, GDS tools."],
              ["2025 → 2026", "Web and Mobile Web Developer professional title (2-year degree level), La Piscine Bordeaux."],
              ["Since Sept 2026", "Bachelor's in IT project coordination, work-study at DBF Automobiles."],
              ["What travel taught me", "Reading a complex request, finding a solution that holds up, meeting deadlines. That's already half of a developer's job."]
            ],
            tags: ["DWWM · 2-year", "Bachelor · 3-year", "Next stop: Master's"]
          }
        }
      }
    ]
  },
  {
    id: "usa", section: "skills", code: "LAX", flight: "AM 202", gate: "B12", time: "09:40",
    country: { fr: "États-Unis", en: "United States" }, label: { fr: "Compétences", en: "Skills" }, accent: "#ff8a5b",
    cities: [
      {
        id: "losangeles", amb: "losangeles", name: "Los Angeles",
        panel: {
          fr: { kicker: "Los Angeles · Front-end", title: "Front-end",
            lead: "Je pars d'une maquette et j'en fais une page qui s'adapte à l'écran, puis une interface qui réagit.",
            items: [["HTML · CSS", "Mises en page responsives en Flexbox et Grid, avec Bootstrap quand le projet s'y prête."], ["JavaScript", "Manipulation du DOM, événements, appels d'API asynchrones."], ["React", "Composants, routage avec React Router, données venues d'une API. C'est ce que je pratique cette année en Bachelor."]],
            tags: ["HTML", "CSS", "JavaScript", "React", "Vite", "Bootstrap"] },
          en: { kicker: "Los Angeles · Front-end", title: "Front-end",
            lead: "I start from a mock-up and turn it into a page that adapts to the screen, then into an interface that responds.",
            items: [["HTML · CSS", "Responsive layouts with Flexbox and Grid, and Bootstrap when the project calls for it."], ["JavaScript", "DOM manipulation, events, asynchronous API calls."], ["React", "Components, routing with React Router, data loaded from an API. This is what I practise this year in my Bachelor's."]],
            tags: ["HTML", "CSS", "JavaScript", "React", "Vite", "Bootstrap"] }
        }
      },
      {
        id: "newyork", amb: "newyork", name: "New York",
        panel: {
          fr: { kicker: "New York · Back-end", title: "Back-end",
            lead: "PHP tous les jours en entreprise, Symfony sur mes projets de formation.",
            items: [["PHP natif", "Mon outil quotidien en alternance chez DBF Automobiles."], ["Symfony", "Contrôleurs, entités Doctrine, formulaires et gabarits Twig : la base de MoovBiz Travel."], ["Comptes utilisateurs", "Inscription, connexion, sessions et réinitialisation du mot de passe par e-mail, codées sans framework dans Kanbanio."]],
            tags: ["PHP", "Symfony", "Doctrine", "Twig", "MVC"] },
          en: { kicker: "New York · Back-end", title: "Back-end",
            lead: "PHP every day at work, Symfony on my training projects.",
            items: [["Plain PHP", "My everyday tool in my work-study at DBF Automobiles."], ["Symfony", "Controllers, Doctrine entities, forms and Twig templates: the foundation of MoovBiz Travel."], ["User accounts", "Sign-up, login, sessions and password reset by email, written without a framework in Kanbanio."]],
            tags: ["PHP", "Symfony", "Doctrine", "Twig", "MVC"] }
        }
      },
      {
        id: "lasvegas", amb: "lasvegas", name: "Las Vegas",
        panel: {
          fr: { kicker: "Las Vegas · Données", title: "Bases de données",
            lead: "Je modélise avant de créer les tables, puis j'écris les requêtes.",
            items: [["MySQL", "Requêtes SQL, jointures et opérations CRUD sur des bases relationnelles."], ["Merise", "MCD puis MLD, pour poser les données avant le code."], ["Outils", "phpMyAdmin au quotidien, Doctrine et ses migrations sous Symfony."]],
            tags: ["SQL", "MySQL", "Merise", "Doctrine", "phpMyAdmin"] },
          en: { kicker: "Las Vegas · Data", title: "Databases",
            lead: "I model the data before creating tables, then write the queries.",
            items: [["MySQL", "SQL queries, joins and CRUD operations on relational databases."], ["Merise", "Conceptual then logical data models, to settle the data before the code."], ["Tools", "phpMyAdmin day to day, Doctrine and its migrations with Symfony."]],
            tags: ["SQL", "MySQL", "Merise", "Doctrine", "phpMyAdmin"] }
        }
      },
      {
        id: "miami", amb: "miami", name: "Miami",
        panel: {
          fr: { kicker: "Miami · Collins Avenue · Méthodes et outils", title: "Méthodes et outils",
            lead: "Ce qui entoure le code : versionner, tester, mettre en ligne, s'organiser.",
            items: [["Git · GitHub", "Chaque projet est versionné et publié."], ["Tests et mise en ligne", "Premiers tests de bout en bout avec Playwright, déploiement sur Vercel."], ["Organisation", "Méthode Agile et Kanban, maquettes sur Figma, suivi sur Trello."], ["À creuser", "L'IA appliquée au développement, une piste pour le master."]],
            tags: ["Git", "GitHub", "Playwright", "Vercel", "Figma", "Agile"] },
          en: { kicker: "Miami · Collins Avenue · Methods and tools", title: "Methods and tools",
            lead: "What surrounds the code: versioning, testing, deploying, getting organised.",
            items: [["Git · GitHub", "Every project is versioned and published."], ["Testing and deployment", "First end-to-end tests with Playwright, deployment on Vercel."], ["Organisation", "Agile and Kanban, mock-ups in Figma, tracking in Trello."], ["Next to explore", "AI applied to software development, a track for my Master's."]],
            tags: ["Git", "GitHub", "Playwright", "Vercel", "Figma", "Agile"] }
        }
      }
    ]
  },
  {
    id: "japan", section: "experience", code: "HND", flight: "AM 303", gate: "C07", time: "11:05",
    country: { fr: "Japon", en: "Japan" }, label: { fr: "Expériences", en: "Experience" }, accent: "#ff6fa3",
    cities: [
      {
        id: "tokyo", amb: "tokyo", name: "Tokyo",
        panel: {
          fr: { kicker: "Tokyo · Depuis sept. 2026", title: "DBF Automobiles · Alternante développeuse",
            lead: "Bruges (33). Mon premier poste de développeuse, en parallèle de mon Bachelor.",
            items: [["Stack", "PHP natif et MySQL."], ["Rythme", "Alternance entreprise / école."], ["Ce que j'y apprends", "Travailler sur du code réel, en production, au sein d'une équipe."]],
            tags: ["PHP", "MySQL", "Alternance"] },
          en: { kicker: "Tokyo · Since Sept 2026", title: "DBF Automobiles · Work-study developer",
            lead: "Bruges, near Bordeaux. My first developer role, alongside my Bachelor's.",
            items: [["Stack", "Plain PHP and MySQL."], ["Rhythm", "Alternating between company and school."], ["What I'm learning", "Working on real production code within a team."]],
            tags: ["PHP", "MySQL", "Work-study"] }
        }
      },
      {
        id: "kyoto", amb: "kyoto", name: "Kyoto",
        panel: {
          fr: { kicker: "Kyoto · 2021 → 2025", title: "Havas Voyages · Billettiste affaires",
            lead: "Mérignac (33).",
            items: [["Missions", "Analyse et traitement de demandes complexes, recherche de solutions adaptées."], ["Transmission", "Formation des collaborateurs sur les outils métiers."], ["Côté dev", "Décortiquer un problème, tester des pistes, documenter la solution."]],
            tags: ["Analyse", "Formation", "Outils métiers"] },
          en: { kicker: "Kyoto · 2021 → 2025", title: "Havas Voyages · Business travel agent",
            lead: "Mérignac, near Bordeaux.",
            items: [["Role", "Analysing and handling complex requests, finding tailored solutions."], ["Training", "Trained colleagues on business tools."], ["The dev angle", "Breaking a problem down, testing leads, documenting the fix."]],
            tags: ["Analysis", "Training", "Business tools"] }
        }
      },
      {
        id: "osaka", amb: "osaka", name: "Osaka",
        panel: {
          fr: { kicker: "Osaka · 2018 → 2021", title: "CMS Vacances · Billettiste affaires",
            lead: "Bordeaux (33).",
            items: [["Outils techniques", "Utilisation des GDS et résolution de problèmes."], ["Mon premier « projet »", "Conception d'un système de suivi des remboursements : 35 K€ gagnés par an."], ["Côté dev", "C'est là que j'ai compris que j'aimais construire des outils."]],
            tags: ["GDS", "Résolution de problèmes", "35 K€ / an"] },
          en: { kicker: "Osaka · 2018 → 2021", title: "CMS Vacances · Business travel agent",
            lead: "Bordeaux.",
            items: [["Technical tools", "GDS systems and problem solving."], ["My first \"project\"", "Designed a refund tracking system that saved €35K a year."], ["The dev angle", "That's when I realised I loved building tools."]],
            tags: ["GDS", "Problem solving", "€35K / year"] }
        }
      },
      {
        id: "nara", amb: "nara", name: "Nara",
        panel: {
          fr: { kicker: "Nara · 2013 → 2015", title: "AGR Évasions · Agent de voyages",
            lead: "Langon (33).",
            items: [["Autonomie", "Gestion autonome de l'activité."], ["Organisation", "Priorisation des tâches et respect des délais selon les besoins clients."]],
            tags: ["Autonomie", "Priorisation", "Délais"] },
          en: { kicker: "Nara · 2013 → 2015", title: "AGR Évasions · Travel consultant",
            lead: "Langon, near Bordeaux.",
            items: [["Autonomy", "Ran the activity independently."], ["Organisation", "Prioritised tasks and met deadlines based on client needs."]],
            tags: ["Autonomy", "Prioritisation", "Deadlines"] }
        }
      },
      {
        id: "sapporo", amb: "sapporo", name: "Sapporo",
        panel: {
          fr: { kicker: "Sapporo · 2010 → 2012", title: "Telligo Cousins · Chargée clientèle",
            lead: "Bagneux (92). Là où tout a commencé.",
            items: [["Relation client", "Résolution de problèmes au quotidien."], ["Coordination", "Gestion de prestations multiples en parallèle."]],
            tags: ["Relation client", "Coordination"] },
          en: { kicker: "Sapporo · 2010 → 2012", title: "Telligo Cousins · Customer relations",
            lead: "Bagneux, near Paris. Where it all began.",
            items: [["Customer relations", "Everyday problem solving."], ["Coordination", "Handling several services in parallel."]],
            tags: ["Customer relations", "Coordination"] }
        }
      }
    ]
  },
  {
    id: "australia", section: "projects", code: "SYD", flight: "AM 404", gate: "D21", time: "13:30",
    country: { fr: "Australie", en: "Australia" }, label: { fr: "Projets", en: "Projects" }, accent: "#ffc24b",
    cities: [
      {
        id: "sydney", amb: "sydney", name: "Sydney",
        panel: {
          fr: { kicker: "Sydney · Application React", title: "Les Petites Trouvailles",
            lead: "Une boutique de mode en ligne développée en React, déployée et testée.",
            items: [["Catalogue", "Recherche, filtres par catégorie, prix et note, tri et pagination, à partir de l'API publique DummyJSON."], ["Parcours d'achat", "Fiches produit, avis clients, favoris et panier conservés d'une visite à l'autre, thème clair ou sombre."], ["Qualité", "Tests de bout en bout avec Playwright, navigation au clavier, mise en ligne sur Vercel."]],
            tags: ["React", "React Router", "Vite", "API REST", "Playwright", "Vercel"], links: [["Voir le site", "https://les-petites-trouvailles-5u4p.vercel.app"], ["GitHub", "https://github.com/Annabelle-m/React-LesPetitesTrouvailles"]] },
          en: { kicker: "Sydney · React application", title: "Les Petites Trouvailles",
            lead: "An online fashion storefront built with React, deployed and tested.",
            items: [["Catalogue", "Search, filters by category, price and rating, sorting and pagination, using the public DummyJSON API."], ["Shopping flow", "Product pages, customer reviews, favourites and a cart kept between visits, light or dark theme."], ["Quality", "End-to-end tests with Playwright, keyboard navigation, deployed on Vercel."]],
            tags: ["React", "React Router", "Vite", "REST API", "Playwright", "Vercel"], links: [["View the site", "https://les-petites-trouvailles-5u4p.vercel.app"], ["GitHub", "https://github.com/Annabelle-m/React-LesPetitesTrouvailles"]] }
        }
      },
      {
        id: "melbourne", amb: "melbourne", name: "Melbourne",
        panel: {
          fr: { kicker: "Melbourne · Projet de fin de formation", title: "MoovBiz Travel",
            lead: "Une application Symfony pour organiser les déplacements professionnels. Mon ancien métier, version code.",
            items: [["Ce qu'elle fait", "Réservations, budgets et entreprises, avec un tableau de bord et un espace d'administration."], ["Technique", "Symfony, entités Doctrine et migrations, base MySQL, gabarits Twig."], ["Démarche", "Maquettes Figma, modélisation Merise, méthode Agile. Projet de fin d'année du titre DWWM."]],
            tags: ["Symfony", "PHP", "Doctrine", "MySQL", "Twig"], links: [["GitHub", "https://github.com/Annabelle-m/moovbiz-travel"]] },
          en: { kicker: "Melbourne · Final training project", title: "MoovBiz Travel",
            lead: "A Symfony application to organise business travel. My former job, rewritten in code.",
            items: [["What it does", "Bookings, budgets and companies, with a dashboard and an admin area."], ["Tech", "Symfony, Doctrine entities and migrations, MySQL database, Twig templates."], ["Approach", "Figma mock-ups, Merise data modelling, Agile method. Final project of my web developer diploma (DWWM)."]],
            tags: ["Symfony", "PHP", "Doctrine", "MySQL", "Twig"], links: [["GitHub", "https://github.com/Annabelle-m/moovbiz-travel"]] }
        }
      },
      {
        id: "brisbane", amb: "brisbane", name: "Brisbane",
        panel: {
          fr: { kicker: "Brisbane · PHP sans framework", title: "Kanbanio",
            lead: "Un gestionnaire de tâches façon Kanban, écrit en PHP natif et MySQL, du back-end à l'interface.",
            items: [["Fonctionnalités", "Tableaux par projet, tâches à faire, en cours ou terminées, étiquettes et dates d'échéance."], ["Comptes", "Inscription, connexion et réinitialisation du mot de passe par e-mail."], ["Ce que j'en retiens", "Structurer une application complète sans framework, avec sessions et base relationnelle."]],
            tags: ["PHP", "MySQL", "JavaScript", "PHPMailer"], links: [["GitHub", "https://github.com/Annabelle-m/PHP-kanbanio"]] },
          en: { kicker: "Brisbane · Framework-free PHP", title: "Kanbanio",
            lead: "A Kanban-style task manager written in plain PHP and MySQL, from back end to interface.",
            items: [["Features", "Boards per project, tasks to do, doing or done, tags and due dates."], ["Accounts", "Sign-up, login and password reset by email."], ["What I learned", "Structuring a complete application without a framework, with sessions and a relational database."]],
            tags: ["PHP", "MySQL", "JavaScript", "PHPMailer"], links: [["GitHub", "https://github.com/Annabelle-m/PHP-kanbanio"]] }
        }
      },
      {
        id: "goldcoast", amb: "goldcoast", name: "Gold Coast",
        panel: {
          fr: { kicker: "Gold Coast · Bachelor, front-end React", title: "Ma bibliothèque",
            lead: "Une série d'exercices React menés en Bachelor : une application qui cherche des livres et affiche leurs fiches.",
            items: [["React", "Composants, props et listes, puis état et effets."], ["API", "Recherche de livres avec l'API Google Books."], ["Routage", "Pages et fiches détaillées avec React Router."]],
            tags: ["React", "Vite", "React Router", "API"], links: [["GitHub", "https://github.com/Annabelle-m/B3-frontend-react"]] },
          en: { kicker: "Gold Coast · Bachelor's, React front end", title: "My library",
            lead: "A series of React exercises from my Bachelor's: an application that searches for books and shows their details.",
            items: [["React", "Components, props and lists, then state and effects."], ["API", "Book search with the Google Books API."], ["Routing", "Pages and detail views with React Router."]],
            tags: ["React", "Vite", "React Router", "API"], links: [["GitHub", "https://github.com/Annabelle-m/B3-frontend-react"]] }
        }
      },
      {
        id: "uluru", amb: "uluru", name: "Uluru",
        panel: {
          fr: { kicker: "Uluru · Projet personnel", title: "Ce portfolio",
            lead: "Un portfolio-jeu qui relie mon ancien métier au nouveau. J'ai passé un an en Australie en PVT : il fallait bien un détour par ici.",
            items: [["Technique", "JavaScript sans framework, moteur 3D en WebGL écrit pour l'occasion, contenu bilingue piloté par les données."], ["Idée", "Chaque pays du tableau des départs est une section de mon CV."]],
            tags: ["JavaScript", "WebGL", "i18n", "UX"], links: [["GitHub", "https://github.com/Annabelle-m"]] },
          en: { kicker: "Uluru · Personal project", title: "This portfolio",
            lead: "A game-like portfolio linking my former job to my new one. I spent a year in Australia on a working holiday visa, so a detour here felt right.",
            items: [["Tech", "Framework-free JavaScript, a WebGL 3D engine written for the occasion, data-driven bilingual content."], ["Idea", "Each country on the departures board is a section of my CV."]],
            tags: ["JavaScript", "WebGL", "i18n", "UX"], links: [["GitHub", "https://github.com/Annabelle-m"]] }
        }
      }
    ]
  },
  {
    id: "namibia", section: "contact", code: "WDH", flight: "AM 505", gate: "E05", time: "16:50",
    country: { fr: "Namibie", en: "Namibia" }, label: { fr: "Contact", en: "Contact" }, accent: "#ff9d5c",
    cities: [
      {
        id: "windhoek", amb: "windhoek", name: "Windhoek", contact: true,
        panel: {
          fr: { kicker: "Windhoek · Contact", title: "On se parle ?",
            lead: "Je cherche une alternance M1/M2 en développement. Écrivez-moi, je réponds vite.",
            items: [["Basée à", "Bordeaux · télétravail ou présentiel · permis B."]],
            tags: ["Alternance M1/M2", "Développement", "Bordeaux"] },
          en: { kicker: "Windhoek · Contact", title: "Shall we talk?",
            lead: "I'm looking for a Master's work-study position (M1/M2) in development. Drop me a line, I reply quickly.",
            items: [["Based in", "Bordeaux, France · remote or on-site · driving licence."]],
            tags: ["Master's work-study", "Development", "Bordeaux"] }
        }
      },
      {
        id: "sossusvlei", amb: "sossusvlei", name: "Sossusvlei", postcard: true,
        panel: {
          fr: { kicker: "Sossusvlei · Dernière escale", title: "Prochaine destination : votre équipe.",
            lead: "Sous le ciel le plus étoilé du monde, une carte postale à m'envoyer.",
            items: [], tags: [] },
          en: { kicker: "Sossusvlei · Last stop", title: "Next destination: your team.",
            lead: "Under the starriest sky on Earth, a postcard to send me.",
            items: [], tags: [] }
        }
      }
    ]
  }
];

/* Textes propres à la v2 (réseau routier et hub) */
Object.assign(UI.fr, {
  shortcutPrompt: "Hub central · retour à l'accueil", shortcutBtn: "Prendre la bretelle", shortcutArmed: "Bretelle sélectionnée", shortcutSide: { 1: "serrez à droite", "-1": "serrez à gauche" },
  hubTitle: "Hub central · Correspondances", hubLead: "D'ici, toutes les destinations sont à un trajet. Où allez-vous ?", hubHome: "Terminal · retour à l'accueil",
  continueHint: "↑ pour reprendre la route", closeAndGo: "Reprendre la route", noGL: "Votre navigateur ne permet pas l'affichage 3D. La version classique s'ouvre à la place.",
  controls: "↑ avancer · ↓ freiner / reculer · ← → se décaler", loading: "Chargement du décor…", hallLoading: "Préparation du voyage…", hallEnter: "Entrer dans l'aéroport"
});
Object.assign(UI.en, {
  shortcutPrompt: "Central hub · back home", shortcutBtn: "Take the exit", shortcutArmed: "Exit selected", shortcutSide: { 1: "keep right", "-1": "keep left" },
  hubTitle: "Central hub · Connections", hubLead: "From here, every destination is one ride away. Where to next?", hubHome: "Terminal · back to home",
  continueHint: "↑ to get back on the road", closeAndGo: "Back on the road", noGL: "Your browser can't display 3D. Opening the classic version instead.",
  controls: "↑ go · ↓ brake / reverse · ← → move across", loading: "Loading scenery…", hallLoading: "Getting ready to travel…", hallEnter: "Enter the airport"
});
