export const PRO_CATEGORIES=[
{id:"tous",label:"Tous",emoji:"✨"},
{id:"design",label:"Design & Créatif",emoji:"🎨"},
{id:"tech",label:"Tech & Web",emoji:"💻"},
{id:"photo-video",label:"Photo & Vidéo",emoji:"📸"},
{id:"business",label:"Business & Finance",emoji:"💼"},
{id:"juridique",label:"Juridique",emoji:"⚖️"},
{id:"sante",label:"Santé & Bien-être",emoji:"🩺"},
{id:"maison",label:"Maison & Urgences",emoji:"🔧"},
{id:"education",label:"Éducation",emoji:"🎓"},
{id:"immobilier",label:"Immobilier & Habitat",emoji:"🏠"}] as const;

export const PRO_SEED:{name:string;role:string;company:string;rating:string;reviews:number;price:string;color:string;specialty:string;category:string;location:string;responseTime:string}[]=[
{name:"Léa Moreau",role:"Designer UX/UI",company:"Studio Nova",rating:"4.9",reviews:284,price:"45€/h",color:"#07C160",specialty:"Branding & Apps mobiles",category:"design",location:"Paris",responseTime:"~10 min"},
{name:"Karim Benali",role:"Développeur Full-Stack",company:"TechFlow",rating:"5.0",reviews:312,price:"60€/h",color:"#111827",specialty:"SaaS & APIs",category:"tech",location:"Lyon",responseTime:"~5 min"},
{name:"Sophie Laurent",role:"Photographe",company:"Atelier Lumière",rating:"4.8",reviews:197,price:"80€/séance",color:"#F59E0B",specialty:"Portrait & Événementiel",category:"photo-video",location:"Paris",responseTime:"~30 min"},
{name:"Thomas Petit",role:"Coach Business",company:"Elevate",rating:"4.9",reviews:421,price:"70€/h",color:"#0891B2",specialty:"Stratégie & Vente",category:"business",location:"En ligne",responseTime:"~15 min"},
{name:"Amina Diallo",role:"Avocate",company:"Cabinet Diallo",rating:"5.0",reviews:168,price:"90€/h",color:"#7C3AED",specialty:"Droit des affaires",category:"juridique",location:"Paris",responseTime:"~1 h"},
{name:"Julien Roche",role:"Architecte",company:"Roche Design",rating:"4.8",reviews:256,price:"75€/h",color:"#DC2626",specialty:"Rénovation & 3D",category:"immobilier",location:"Bordeaux",responseTime:"~2 h"},
{name:"Nora Haddad",role:"Nutritionniste",company:"Vitalis",rating:"4.9",reviews:339,price:"50€/consult.",color:"#059669",specialty:"Nutrition sportive",category:"sante",location:"En ligne",responseTime:"~20 min"},
{name:"Maxime Leroy",role:"Vidéaste",company:"Frame Studio",rating:"4.9",reviews:203,price:"65€/h",color:"#0F766E",specialty:"Pub & Réseaux sociaux",category:"photo-video",location:"Nantes",responseTime:"~25 min"},
{name:"Claire Dubois",role:"Prof. de Mandarin",company:"Lingua Pro",rating:"5.0",reviews:187,price:"35€/h",color:"#EA580C",specialty:"Cours particuliers",category:"education",location:"En ligne",responseTime:"~10 min"},
{name:"Yanis Kaci",role:"Expert Immobilier",company:"Immo Conseil",rating:"4.8",reviews:294,price:"Commission 3%",color:"#2563EB",specialty:"Achat & Investissement",category:"immobilier",location:"Paris",responseTime:"~15 min"},
{name:"Hugo Perrin",role:"Plombier — Urgence 24/7",company:"SOS Maison",rating:"4.9",reviews:512,price:"55€/intervention",color:"#0284C7",specialty:"Fuite, débouchage, urgence",category:"maison",location:"Paris & proche banlieue",responseTime:"~15 min"},
{name:"Emma Bernard",role:"Psychologue",company:"Écoute & Vous",rating:"5.0",reviews:276,price:"55€/séance",color:"#DB2777",specialty:"Anxiété, écoute, thérapie",category:"sante",location:"En ligne",responseTime:"~30 min"},
{name:"Lucas Fontaine",role:"Développeur Mobile",company:"AppCraft",rating:"4.8",reviews:231,price:"55€/h",color:"#4F46E5",specialty:"iOS, Android, Flutter",category:"tech",location:"Toulouse",responseTime:"~20 min"},
{name:"Sarah Cohen",role:"Community Manager",company:"Social Boost",rating:"4.9",reviews:198,price:"40€/h",color:"#E11D48",specialty:"Instagram, TikTok, contenu",category:"design",location:"En ligne",responseTime:"~10 min"},
{name:"Omar Sy",role:"Électricien certifié",company:"Volt Services",rating:"4.8",reviews:367,price:"50€/intervention",color:"#D97706",specialty:"Panne, installation, urgence",category:"maison",location:"Lille",responseTime:"~20 min"},
{name:"Alice Nguyen",role:"Traductrice EN/FR",company:"Lingua Pro",rating:"4.9",reviews:154,price:"0,12€/mot",color:"#0D9488",specialty:"Documents, CV, sites web",category:"education",location:"En ligne",responseTime:"~1 h"},
{name:"David Levy",role:"Expert-comptable",company:"Compta Conseil",rating:"4.9",reviews:289,price:"65€/h",color:"#334155",specialty:"Création entreprise, impôts",category:"business",location:"Paris",responseTime:"~45 min"},
{name:"Fatou Ndiaye",role:"Aide à domicile & Assistance",company:"AidePlus",rating:"5.0",reviews:431,price:"22€/h",color:"#16A34A",specialty:"Aide seniors, courses, démarches",category:"sante",location:"Marseille",responseTime:"~15 min"}];

export const EVENT_SEED:{title:string;description:string;category:string;startsLabel:string;location:string;organizer:string;image:string;isLive:boolean;attendees:number;price:string}[]=[
{title:"ViChat Live : L'avenir de la messagerie IA",description:"Keynote Admin en direct : répondeur IA, messages cryptés VIP et appels nouvelle génération. Démo live, Q&A et cadeaux pour les participants.",category:"Tech & IA",startsLabel:"EN DIRECT • Commencé il y a 12 min",location:"En ligne + Paris, Station F",organizer:"Admin ViChat",image:"https://images.pexels.com/photos/9275222/pexels-photo-9275222.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",isLive:true,attendees:2847,price:"Gratuit"},
{title:"Masterclass Pros Vérifiés : Développer sa clientèle",description:"10 professionnels vérifiés partagent leurs méthodes pour convertir sur ViChat Pros. Networking, ateliers pratiques et session de questions.",category:"Business",startsLabel:"Aujourd'hui • 18h30",location:"Lyon, H7 & En ligne",organizer:"Admin ViChat",image:"https://images.pexels.com/photos/29180747/pexels-photo-29180747.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",isLive:false,attendees:1240,price:"19€"},
{title:"Festival Créateurs & Vidéo Live",description:"Rencontrez vidéastes, photographes et designers. Tournages en direct, concours créatif et remise de prix ViChat Creator Awards.",category:"Créatif",startsLabel:"Demain • 14h00",location:"Bordeaux, Darwin Écosystème",organizer:"ViChat Events",image:"https://images.pexels.com/photos/18999478/pexels-photo-18999478.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",isLive:false,attendees:986,price:"Gratuit"},
{title:"Immobilier 2026 : Investir malin",description:"Yanis Kaci et des experts décryptent les quartiers qui montent, le financement et les pièges à éviter. Simulation d'investissement en direct.",category:"Immobilier",startsLabel:"Sam. 14 juin • 10h00",location:"Paris, Palais Brongniart",organizer:"Immo Conseil",image:"https://images.pexels.com/photos/15141486/pexels-photo-15141486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",isLive:false,attendees:764,price:"29€"}];
