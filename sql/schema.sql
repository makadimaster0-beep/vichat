-- ============================================================================
-- ViChat — SCHÉMA SQL COMPLET
-- À exécuter en une fois (Supabase SQL Editor, ou psql local).
-- Politique de stockage :
--   * BASE (ce fichier) : identités, messages clairs, messages cryptés,
--     professionnels, événements (créés par l'Admin), inscriptions,
--     demandes d'aide, voicemails IA, notifications, devis.
--   * APPAREIL (IndexedDB côté client, JAMAIS en base) : photos, photos
--     envoyées, vocaux, photo de profil.
-- Aucune donnée de démonstration : les tables sont alimentées uniquement par
-- les écritures applicatives et les seeds officiels ci-dessous (éditions).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) IDENTITÉS (Supabase : public.vichat_profiles)
-- ---------------------------------------------------------------------------
create table if not exists public.vichat_profiles (
  id          text primary key,
  name        text        not null,
  email       text        unique,
  handle      text        unique,
  phone       text,
  bio         text,
  city        text,
  role        text        default 'Particulier',
  updated_at  timestamptz default now()
);
comment on table public.vichat_profiles is 'Identités ViChat (base). La photo de profil reste sur l''appareil.';

-- ---------------------------------------------------------------------------
-- 2) MESSAGES (Supabase : public.vichat_messages) — clairs et cryptés
--    body    = texte clair (vide si encrypted = true)
--    cipher  = charge cryptée côté client (chiffrement AES/Vigenère local),
--              seule partie stockée pour les messages verrouillés VIP
-- ---------------------------------------------------------------------------
create table if not exists public.vichat_messages (
  id            bigint generated always as identity primary key,
  client_id     text        not null unique,
  conversation  text        not null,
  sender        text        not null,
  kind          text        default 'text',   -- text | voice | image | encrypted
  body          text,
  encrypted     boolean     default false,
  cipher        text,
  on_device     boolean     default false,    -- true si le média associé reste sur l'appareil
  created_at    timestamptz default now()
);
create index if not exists idx_vichat_messages_conv on public.vichat_messages (conversation, created_at desc);

-- ---------------------------------------------------------------------------
-- 3) PROFESSIONNELS VÉRIFIÉS (annuaire)
-- ---------------------------------------------------------------------------
create table if not exists public.pros (
  id            serial primary key,
  name          text not null,
  role          text not null,
  company       text not null,
  rating        text not null,
  reviews       integer default 0,
  price         text not null,          -- tarif de référence en EUR
  color         text not null,
  verified      boolean default true,
  online        boolean default true,
  specialty     text not null,
  category      text not null,          -- design | tech | photo-video | business | juridique | sante | maison | education | immobilier
  location      text default 'En ligne',
  response_time text default '~15 min',
  created_at    timestamptz default now()
);
create index if not exists idx_pros_category on public.pros (category);

-- ---------------------------------------------------------------------------
-- 4) ÉVÉNEMENTS — CRÉÉS UNIQUEMENT PAR L'ADMIN
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id            serial primary key,
  title         text not null,
  description   text not null,
  category      text not null default 'Communauté',
  starts_label  text not null,
  location      text not null,
  organizer     text not null default 'Admin ViChat',
  image         text not null,
  is_live       boolean default false,
  attendees     integer default 0,
  price         text default 'Gratuit',
  created_by    text not null default 'admin',   -- auteur unique : l'Admin
  published_by  text not null default 'admin',
  published_at  timestamptz default now()
);
create index if not exists idx_events_live on public.events (is_live, published_at desc);
comment on column public.events.created_by is 'Seul l''''Admin ViChat peut créer/écrire un événement (contrôlé par x-admin-key sur l''API).';

-- ---------------------------------------------------------------------------
-- 5) INSCRIPTIONS AUX ÉVÉNEMENTS + RAPPELS AUTOMATIQUES
-- ---------------------------------------------------------------------------
create table if not exists public.registrations (
  id           serial primary key,
  event_id     integer not null references public.events(id) on delete cascade,
  user_email   text    not null,
  reminders    integer default 5,          -- J-7, J-3, J-1, H-1, direct
  status       text default 'confirmé',
  created_at   timestamptz default now()
);
create table if not exists public.notifications (
  id         serial primary key,
  title      text not null,
  body       text not null,
  type       text not null,                -- system | ai | silent | vip | event | help | db
  is_read    boolean default false,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 6) RENDEZ-VOUS IA (voicemails reçus téléphone éteint)
-- ---------------------------------------------------------------------------
create table if not exists public.voicemails (
  id         serial primary key,
  from_name  text not null,
  transcript text not null,                -- contient « IA dit : Laissez votre message après le bip… »
  duration   text not null,
  listened   boolean default false,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 7) DEMANDES D'AIDE (centre d'aide Pros)
-- ---------------------------------------------------------------------------
create table if not exists public.help_requests (
  id          serial primary key,
  ticket      text not null unique,        -- VC-AIDE-####
  category    text not null,
  pro_name    text,
  subject     text not null,
  description text not null,
  urgency     text default 'Normale',
  budget      text,
  contact     text,
  status      text default 'En attente d''un pro',
  created_at  timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 8) COMPTE UTILISATEUR + DEVIS
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id         serial primary key,
  name       text not null,
  email      text not null unique,
  phone      text,
  handle     text,
  bio        text,
  city       text,
  role       text default 'Particulier',
  is_vip     boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.devis (
  id           serial primary key,
  num          text not null unique,        -- DEV-AAAA-MMJJ-###
  pro          text not null,
  client       text not null,
  item         text not null,
  qty          numeric default 1,
  unit         text default 'h',
  price_eur    numeric not null,            -- base EUR, convertie F CFA / $ à l'affichage
  tva          numeric default 20,
  remise       numeric default 0,
  currency     text default 'EUR',          -- EUR | XOF | USD
  total_ttc    numeric not null,
  status       text default 'Brouillon',
  created_at   timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 9) ÉCHANGES (réplique de file d'attente locale si la base distante dort)
-- ---------------------------------------------------------------------------
create table if not exists public.message_log (
  id           serial primary key,
  client_id    text not null unique,
  conversation text not null,
  sender       text not null,
  kind         text default 'text',
  body         text,
  encrypted    boolean default false,
  cipher       text,
  on_device    boolean default false,
  remote       boolean default false,       -- true = confirmé par Supabase
  created_at   timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 10) RLS (Supabase) + droits
-- ---------------------------------------------------------------------------
alter table public.vichat_profiles enable row level security;
alter table public.vichat_messages enable row level security;

drop policy if exists "vi_profil" on public.vichat_profiles;
drop policy if exists "vi_msg"    on public.vichat_messages;
create policy "vi_profil" on public.vichat_profiles for all using (true) with check (true);
create policy "vi_msg"    on public.vichat_messages for all using (true) with check (true);

grant usage  on schema public to anon, authenticated;
grant all on all tables     in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 11) SEEDS OFFICIELS (seule écriture « automatique » autorisée)
-- ---------------------------------------------------------------------------
insert into public.pros (name, role, company, rating, reviews, price, color, specialty, category, location, response_time) values
('Léa Moreau','Designer UX/UI','Studio Nova','4.9',284,'45€/h','#07C160','Branding & Apps mobiles','design','Paris','~10 min'),
('Karim Benali','Développeur Full-Stack','TechFlow','5.0',312,'60€/h','#111827','SaaS & APIs','tech','Lyon','~5 min'),
('Sophie Laurent','Photographe','Atelier Lumière','4.8',197,'80€/séance','#F59E0B','Portrait & Événementiel','photo-video','Paris','~30 min'),
('Thomas Petit','Coach Business','Elevate','4.9',421,'70€/h','#0891B2','Stratégie & Vente','business','En ligne','~15 min'),
('Amina Diallo','Avocate','Cabinet Diallo','5.0',168,'90€/h','#7C3AED','Droit des affaires','juridique','Paris','~1 h'),
('Julien Roche','Architecte','Roche Design','4.8',256,'75€/h','#DC2626','Rénovation & 3D','immobilier','Bordeaux','~2 h'),
('Nora Haddad','Nutritionniste','Vitalis','4.9',339,'50€/consult.','#059669','Nutrition sportive','sante','En ligne','~20 min'),
('Maxime Leroy','Vidéaste','Frame Studio','4.9',203,'65€/h','#0F766E','Pub & Réseaux sociaux','photo-video','Nantes','~25 min'),
('Claire Dubois','Prof. de Mandarin','Lingua Pro','5.0',187,'35€/h','#EA580C','Cours particuliers','education','En ligne','~10 min'),
('Yanis Kaci','Expert Immobilier','Immo Conseil','4.8',294,'Commission 3%','#2563EB','Achat & Investissement','immobilier','Paris','~15 min'),
('Hugo Perrin','Plombier — Urgence 24/7','SOS Maison','4.9',512,'55€/intervention','#0284C7','Fuite, débouchage, urgence','maison','Paris & proche banlieue','~15 min'),
('Emma Bernard','Psychologue','Écoute & Vous','5.0',276,'55€/séance','#DB2777','Anxiété, écoute, thérapie','sante','En ligne','~30 min'),
('Lucas Fontaine','Développeur Mobile','AppCraft','4.8',231,'55€/h','#4F46E5','iOS, Android, Flutter','tech','Toulouse','~20 min'),
('Sarah Cohen','Community Manager','Social Boost','4.9',198,'40€/h','#E11D48','Instagram, TikTok, contenu','design','En ligne','~10 min'),
('Omar Sy','Électricien certifié','Volt Services','4.8',367,'50€/intervention','#D97706','Panne, installation, urgence','maison','Lille','~20 min'),
('Alice Nguyen','Traductrice EN/FR','Lingua Pro','4.9',154,'0,12€/mot','#0D9488','Documents, CV, sites web','education','En ligne','~1 h'),
('David Levy','Expert-comptable','Compta Conseil','4.9',289,'65€/h','#334155','Création entreprise, impôts','business','Paris','~45 min'),
('Fatou Ndiaye','Aide à domicile & Assistance','AidePlus','5.0',431,'22€/h','#16A34A','Aide seniors, courses, démarches','sante','Marseille','~15 min')
on conflict do nothing;

-- Événements publiés par l'Admin uniquement
insert into public.events (title, description, category, starts_label, location, organizer, image, is_live, attendees, price, created_by, published_by) values
('ViChat Live : L''avenir de la messagerie IA','Keynote Admin en direct : répondeur IA, messages cryptés VIP et appels nouvelle génération. Démo live, Q&A et cadeaux pour les participants.','Tech & IA','EN DIRECT • Commencé il y a 12 min','En ligne + Paris, Station F','Admin ViChat','https://images.pexels.com/photos/9275222/pexels-photo-9275222.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',true,2847,'Gratuit','admin','admin'),
('Masterclass Pros Vérifiés : Développer sa clientèle','18 professionnels vérifiés partagent leurs méthodes pour convertir sur ViChat Pros. Networking, ateliers pratiques et session de questions.','Business','Aujourd''hui • 18h30','Lyon, H7 & En ligne','Admin ViChat','https://images.pexels.com/photos/29180747/pexels-photo-29180747.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',false,1240,'19€','admin','admin'),
('Festival Créateurs & Vidéo Live','Rencontrez vidéastes, photographes et designers. Tournages en direct, concours créatif et remise de prix ViChat Creator Awards.','Créatif','Demain • 14h00','Bordeaux, Darwin Écosystème','ViChat Events','https://images.pexels.com/photos/18999478/pexels-photo-18999478.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',false,986,'Gratuit','admin','admin'),
('Immobilier 2026 : Investir malin','Yanis Kaci et des experts décryptent les quartiers qui montent, le financement et les pièges à éviter. Simulation d''investissement en direct.','Immobilier','Sam. 14 juin • 10h00','Paris, Palais Brongniart','Immo Conseil','https://images.pexels.com/photos/15141486/pexels-photo-15141486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',false,764,'29€','admin','admin')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 12) VUES UTILES
-- ---------------------------------------------------------------------------
create or replace view public.vichat_storage_policy as
select 'appareil' as rang, 'photos, photos envoyées, vocaux, photo de profil' as donnees union all
select 'base',     'identités, messages clairs, messages cryptés, pros, événements (admin), inscriptions, aide, devis';
