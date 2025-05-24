--
-- PostgreSQL database dump
--

-- Dumped from database version 12.22 (Debian 12.22-1.pgdg120+1)
-- Dumped by pg_dump version 12.22 (Debian 12.22-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: FriendshipRequestStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FriendshipRequestStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'CANCELED'
);


ALTER TYPE public."FriendshipRequestStatus" OWNER TO postgres;

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MessageType" AS ENUM (
    'TEXT',
    'IMAGE',
    'MISSED_CALL',
    'CALL'
);


ALTER TYPE public."MessageType" OWNER TO postgres;

--
-- Name: UserGender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserGender" AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER'
);


ALTER TYPE public."UserGender" OWNER TO postgres;

--
-- Name: UserProvider; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserProvider" AS ENUM (
    'GOOGLE',
    'FACEBOOK'
);


ALTER TYPE public."UserProvider" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: direct-message-channels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."direct-message-channels" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."direct-message-channels" OWNER TO postgres;

--
-- Name: direct-messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."direct-messages" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "directMessageChannelId" text NOT NULL,
    "userId" text NOT NULL,
    type public."MessageType" NOT NULL,
    value text NOT NULL,
    duration integer
);


ALTER TABLE public."direct-messages" OWNER TO postgres;

--
-- Name: direct_image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.direct_image (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "imageUrl" text NOT NULL,
    "userId" text NOT NULL,
    "directMessageChannelId" text NOT NULL,
    "imageKey" text NOT NULL
);


ALTER TABLE public.direct_image OWNER TO postgres;

--
-- Name: diret-call-channels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."diret-call-channels" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdById" text NOT NULL,
    "acceptedAt" timestamp(3) without time zone
);


ALTER TABLE public."diret-call-channels" OWNER TO postgres;

--
-- Name: friendship-requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."friendship-requests" (
    status public."FriendshipRequestStatus" DEFAULT 'PENDING'::public."FriendshipRequestStatus" NOT NULL,
    "fromUserId" text NOT NULL,
    "toUserId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."friendship-requests" OWNER TO postgres;

--
-- Name: friendships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friendships (
    "fromUserId" text NOT NULL,
    "toUserId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.friendships OWNER TO postgres;

--
-- Name: group-message-channels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."group-message-channels" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    name text NOT NULL,
    "groupId" text NOT NULL
);


ALTER TABLE public."group-message-channels" OWNER TO postgres;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    name text NOT NULL,
    "imageUrl" text NOT NULL,
    "ownerId" text NOT NULL,
    "inviteCode" text NOT NULL,
    "inviteCodeMaxNumberOfUses" integer DEFAULT 0 NOT NULL,
    "inviteCodeNumberOfUses" integer
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- Name: groups-messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."groups-messages" (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    type public."MessageType" NOT NULL,
    value text NOT NULL,
    "userId" text NOT NULL,
    "groupMessageChannelId" text NOT NULL
);


ALTER TABLE public."groups-messages" OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    "avatarUrl" text,
    "fullName" text,
    gender public."UserGender",
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "phoneNumber" text
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    provider public."UserProvider" NOT NULL,
    email text,
    "refreshToken" text,
    "wsId" text,
    "facebookId" text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_direct-call-channels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."users_direct-call-channels" (
    "userId" text NOT NULL,
    "directCallChannelId" text NOT NULL
);


ALTER TABLE public."users_direct-call-channels" OWNER TO postgres;

--
-- Name: users_direct-message-channels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."users_direct-message-channels" (
    "userId" text NOT NULL,
    "directMessageChannelId" text NOT NULL
);


ALTER TABLE public."users_direct-message-channels" OWNER TO postgres;

--
-- Name: users_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_groups (
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "isOwner" boolean NOT NULL,
    "userId" text NOT NULL,
    "groupId" text NOT NULL
);


ALTER TABLE public.users_groups OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
55b91ee8-14e8-4535-8555-c90f931d7996	f0ffc270d18896d4ce8d6c9ea00e9d5e6c5f6c6d11fdfa6b2f9b567812489755	2025-05-16 15:36:23.357831+00	20231224175937_	\N	\N	2025-05-16 15:36:23.350115+00	1
92fd8236-fc06-411d-947c-62c2ec516166	1e64141fa1f89a0d9500f727ec6aa2b6be23401d1a02eda47dcaf500b378787f	2025-05-16 15:36:22.840318+00	20231009162245_	\N	\N	2025-05-16 15:36:22.825731+00	1
6e8085cf-6dcb-4e5f-936e-c6bbf0c33b0e	6ab16a7c1d2cf6b1c9e4fb526b59f920aec20d99e0cee83f465c32a7d8b07e62	2025-05-16 15:36:23.175455+00	20231202074311_	\N	\N	2025-05-16 15:36:23.151339+00	1
d6cd91ca-eb33-496a-a000-485482291595	77e737d8bac44ed7a5526231b2f0effe3bd8718517f6d7fa1fb5f3722673a18d	2025-05-16 15:36:22.855594+00	20231009165132_	\N	\N	2025-05-16 15:36:22.848584+00	1
7c5fb186-cf98-4f02-8708-28ef0a82491a	4bb65c9df02d1cef8e61e71270c3df7178bc6ca9332336993dbd78d43b8d73b5	2025-05-16 15:36:22.869099+00	20231010102845_	\N	\N	2025-05-16 15:36:22.863878+00	1
95b32893-57fe-4882-ac84-4bab84fa58df	788023d7e27c9d797ed060693fd45d1b9fd3de036564397f8320ed2215a42891	2025-05-16 15:36:22.888437+00	20231011105159_	\N	\N	2025-05-16 15:36:22.877164+00	1
afa59104-f952-48d9-9b39-642ff2df29f5	81ec9845b5354c8c86bbd0f4b8639db011f56c773df521cf667d08c2bfe7a7a2	2025-05-16 15:36:23.198603+00	20231203170936_	\N	\N	2025-05-16 15:36:23.188864+00	1
9f67c1c6-f08e-40c7-b866-93567d2fd6eb	c9d9392851bddcc6e60be6f18c29a3f4dcf6ec668de9080a06c623a3204cfdd0	2025-05-16 15:36:22.913943+00	20231011110652_	\N	\N	2025-05-16 15:36:22.899874+00	1
12dfd8c4-296a-415d-8b55-0ca6d4490b0a	552c0ca920dea212fdd7c542f1c1164df6d80d45eabf0815a0bac45cc1b27edd	2025-05-16 15:36:22.939283+00	20231101163247_	\N	\N	2025-05-16 15:36:22.924905+00	1
f0efcbde-7669-431a-b264-1972b00791e8	c84a6e389fe0aae52eae3d0466588f3f660d32a6e10348cd278bbc1723f498a4	2025-05-16 15:36:22.955301+00	20231104142719_	\N	\N	2025-05-16 15:36:22.949436+00	1
b2a75d0a-3f5c-4a75-8437-df58e6a98aca	e39b30f04e41ab04b260a4be7587de69d19b6b9138d4587dd29cdcb76e754e50	2025-05-16 15:36:23.222419+00	20231204162349_	\N	\N	2025-05-16 15:36:23.209791+00	1
8f64567e-dbc8-4d02-8fa5-046dd838e761	545babb72c8ebf98d0cb46d3fe47370ac79871a1785bd3ff5bc33731a9323a56	2025-05-16 15:36:22.983847+00	20231104155441_	\N	\N	2025-05-16 15:36:22.968561+00	1
69418b6a-0676-4b62-887a-5935af6ad58c	8fad19af1cd325c95ac992cf3aa0f054b3a2962278325c3c16de97e59930fdac	2025-05-16 15:36:23.000826+00	20231104155824_	\N	\N	2025-05-16 15:36:22.993891+00	1
cec11dff-cab2-4a86-a6c4-2b7fcd727f1b	7ff739e9a7eac3bffc900c01e514a2eeb9e841b54e4bf3d1f1479a6ce3ffaad6	2025-05-16 15:36:23.374935+00	20231225164142_	\N	\N	2025-05-16 15:36:23.367675+00	1
55e4158f-7be9-4b89-b652-88d5fea5df15	4f92f30732ddef5c31ea54be14b9965f55029826b579f8f3c6319a2d16630f4e	2025-05-16 15:36:23.017229+00	20231104160054_	\N	\N	2025-05-16 15:36:23.010949+00	1
adb157b4-4b1a-4f6e-b9e3-3e1d437698dc	a08bc70f907d8c87e125521ddc9cf63bd3e17878f05dbaa1296469eb0052a937	2025-05-16 15:36:23.243945+00	20231204163720_	\N	\N	2025-05-16 15:36:23.236262+00	1
7264bc8d-0bea-4a4a-9ea8-a36ec9c5d3ea	17261058a8cbb2a54ba6617d0a3ecc50ad57c77cf205bf0db99ef660ac18905e	2025-05-16 15:36:23.051571+00	20231105071312_	\N	\N	2025-05-16 15:36:23.030081+00	1
eff093df-05dc-431f-93e9-b5614101a1b5	21d9b9d60e750c7057de1d4fc8dba7b0ea729a5f5ebb120b20d711584643d47b	2025-05-16 15:36:23.069803+00	20231114162345_	\N	\N	2025-05-16 15:36:23.06364+00	1
ecdd7661-82c5-4487-b119-89f896f71987	9fd244be97dab226acc3ad8be053b2e27a4439086f8f3253d88070bfaf56e18b	2025-05-16 15:36:23.095938+00	20231114163535_	\N	\N	2025-05-16 15:36:23.079278+00	1
17f415ed-70d4-4078-9fce-0f26816674ca	25b6cad916863b208b1a801964283993bd883fe2ee21c7d72d013bb6e747a301	2025-05-16 15:36:23.25905+00	20231210155438_	\N	\N	2025-05-16 15:36:23.25252+00	1
83337ca1-9b91-4061-b923-4c7077de91d1	263e4b4af86c16774a6d5cef69f123ceb32032af48c7ebb0c183661869f24e30	2025-05-16 15:36:23.112484+00	20231118190122_	\N	\N	2025-05-16 15:36:23.106549+00	1
e0ffc564-4398-4cda-8409-5a7078b89f8e	3fb5d7902b83c45b5b8335e60c30e3a786886b749f79633f9419317a499e2bcb	2025-05-16 15:36:23.135923+00	20231119092658_	\N	\N	2025-05-16 15:36:23.123029+00	1
85041c12-79ee-4626-9a3d-1ff214013c8e	f6a24508ae4b00230b5342a1696e5e18e741a674a85975a2693111dd43d2af80	2025-05-16 15:36:23.474156+00	20250120095430_change_email	\N	\N	2025-05-16 15:36:23.468507+00	1
4255c35f-15e3-410b-a2a9-024a89ca8fdf	abc2d21d4d1276e5d39ccebe04a0453ac38d2503dd7a341e19b9488eca2bbd4a	2025-05-16 15:36:23.27595+00	20231214095718_	\N	\N	2025-05-16 15:36:23.269345+00	1
dca2c888-6152-4ce2-9e2a-24fb86ed517a	3afbde049dbd8af2d4dad22cafae9f638368851d678ddc395417c00aabc2e995	2025-05-16 15:36:23.404545+00	20240125084534_	\N	\N	2025-05-16 15:36:23.387574+00	1
3b12cef3-2486-4705-8d21-78793a77e0f8	2a312882f62005ce8e7771214d43e19245ebe48071dab87bc738f17c2ba7e4e8	2025-05-16 15:36:23.298214+00	20231224150055_	\N	\N	2025-05-16 15:36:23.287697+00	1
0cd13a23-277a-467a-b77c-c8bd978a92ae	24f5c79d4e221d0a259c76f28667cb668e50a581421ca5e5cb1a0f19450e4497	2025-05-16 15:36:23.318831+00	20231224165741_	\N	\N	2025-05-16 15:36:23.309173+00	1
df7246a8-d71d-4290-83da-904af48b1c06	2f4f1bcb583bd3674dd728a3687ae357022b02c535b69ef9103aa7d6a702637d	2025-05-16 15:36:23.33785+00	20231224174642_	\N	\N	2025-05-16 15:36:23.330709+00	1
30cdacc2-e857-4550-80e2-212be0811d3f	c2c6aa2f6f7df195dae640577aee2a9b8a9be04f84adde4b8574e393aa81d680	2025-05-16 15:36:23.421223+00	20250108064037_add_phone_number_to_user	\N	\N	2025-05-16 15:36:23.414445+00	1
eb10a7ef-e5ba-4084-9c8f-35ca03cd34f5	ad4a2afccde987a84524078bf38d448997ebe323e7353c9f6e8eff6482ce4875	2025-05-16 15:36:23.496655+00	20250131102410_images_tables	\N	\N	2025-05-16 15:36:23.485555+00	1
2027ebf7-ada6-4cf6-9269-8f57289ad92b	31b6098b7d39ebe735ba28357a32b19ce7ae980e94c68a12c7e3f96f5a36d323	2025-05-16 15:36:23.439092+00	20250109090609_change	\N	\N	2025-05-16 15:36:23.431265+00	1
65de9c22-9756-4fc5-9a24-1fb3b9526600	f7522a32300a984a68d25feff96eb2b275bd0aa253e9459b02bfacfdeb10bc2d	2025-05-16 15:36:23.45738+00	20250120094904_change_table_user	\N	\N	2025-05-16 15:36:23.449536+00	1
4e73e3b8-0f45-4be5-9b67-ec0a52073591	efd473f9c3ec7dec13c9fcd55c879d631e7be47ac0c2d977c9d0a3fe376a5861	2025-05-16 15:36:23.512015+00	20250203045052_add_image_key	\N	\N	2025-05-16 15:36:23.505979+00	1
\.


--
-- Data for Name: direct-message-channels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."direct-message-channels" (id, "createdAt", "updatedAt", "isDeleted") FROM stdin;
\.


--
-- Data for Name: direct-messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."direct-messages" (id, "createdAt", "isDeleted", "updatedAt", "directMessageChannelId", "userId", type, value, duration) FROM stdin;
\.


--
-- Data for Name: direct_image; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.direct_image (id, "createdAt", "updatedAt", "isDeleted", "imageUrl", "userId", "directMessageChannelId", "imageKey") FROM stdin;
\.


--
-- Data for Name: diret-call-channels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."diret-call-channels" (id, "createdAt", "updatedAt", "isDeleted", "createdById", "acceptedAt") FROM stdin;
\.


--
-- Data for Name: friendship-requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."friendship-requests" (status, "fromUserId", "toUserId", "createdAt", "isDeleted", "updatedAt") FROM stdin;
\.


--
-- Data for Name: friendships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.friendships ("fromUserId", "toUserId", "createdAt", "isDeleted", "updatedAt") FROM stdin;
\.


--
-- Data for Name: group-message-channels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."group-message-channels" (id, "createdAt", "updatedAt", "isDeleted", name, "groupId") FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (id, "createdAt", "updatedAt", "isDeleted", name, "imageUrl", "ownerId", "inviteCode", "inviteCodeMaxNumberOfUses", "inviteCodeNumberOfUses") FROM stdin;
\.


--
-- Data for Name: groups-messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."groups-messages" (id, "createdAt", "updatedAt", "isDeleted", type, value, "userId", "groupMessageChannelId") FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles ("avatarUrl", "fullName", gender, "userId", "createdAt", "isDeleted", "updatedAt", "phoneNumber") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, "createdAt", "updatedAt", "isDeleted", provider, email, "refreshToken", "wsId", "facebookId") FROM stdin;
\.


--
-- Data for Name: users_direct-call-channels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."users_direct-call-channels" ("userId", "directCallChannelId") FROM stdin;
\.


--
-- Data for Name: users_direct-message-channels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."users_direct-message-channels" ("userId", "directMessageChannelId") FROM stdin;
\.


--
-- Data for Name: users_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_groups ("createdAt", "updatedAt", "isDeleted", "isOwner", "userId", "groupId") FROM stdin;
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: direct-message-channels direct-message-channels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."direct-message-channels"
    ADD CONSTRAINT "direct-message-channels_pkey" PRIMARY KEY (id);


--
-- Name: direct-messages direct-messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."direct-messages"
    ADD CONSTRAINT "direct-messages_pkey" PRIMARY KEY (id);


--
-- Name: direct_image direct_image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direct_image
    ADD CONSTRAINT direct_image_pkey PRIMARY KEY (id);


--
-- Name: diret-call-channels diret-call-channels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."diret-call-channels"
    ADD CONSTRAINT "diret-call-channels_pkey" PRIMARY KEY (id);


--
-- Name: friendship-requests friendship-requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."friendship-requests"
    ADD CONSTRAINT "friendship-requests_pkey" PRIMARY KEY ("fromUserId", "toUserId");


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY ("fromUserId", "toUserId");


--
-- Name: group-message-channels group-message-channels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."group-message-channels"
    ADD CONSTRAINT "group-message-channels_pkey" PRIMARY KEY (id);


--
-- Name: groups-messages groups-messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."groups-messages"
    ADD CONSTRAINT "groups-messages_pkey" PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: users_direct-call-channels users_direct-call-channels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."users_direct-call-channels"
    ADD CONSTRAINT "users_direct-call-channels_pkey" PRIMARY KEY ("userId", "directCallChannelId");


--
-- Name: users_direct-message-channels users_direct-message-channels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."users_direct-message-channels"
    ADD CONSTRAINT "users_direct-message-channels_pkey" PRIMARY KEY ("userId", "directMessageChannelId");


--
-- Name: users_groups users_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups
    ADD CONSTRAINT users_groups_pkey PRIMARY KEY ("userId", "groupId");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: profiles_phoneNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "profiles_phoneNumber_key" ON public.profiles USING btree ("phoneNumber");


--
-- Name: profiles_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "profiles_userId_key" ON public.profiles USING btree ("userId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_facebookId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "users_facebookId_key" ON public.users USING btree ("facebookId");


--
-- Name: direct-messages direct-messages_directMessageChannelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."direct-messages"
    ADD CONSTRAINT "direct-messages_directMessageChannelId_fkey" FOREIGN KEY ("directMessageChannelId") REFERENCES public."direct-message-channels"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: direct-messages direct-messages_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."direct-messages"
    ADD CONSTRAINT "direct-messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: direct_image direct_image_directMessageChannelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direct_image
    ADD CONSTRAINT "direct_image_directMessageChannelId_fkey" FOREIGN KEY ("directMessageChannelId") REFERENCES public."direct-message-channels"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: direct_image direct_image_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direct_image
    ADD CONSTRAINT "direct_image_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: diret-call-channels diret-call-channels_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."diret-call-channels"
    ADD CONSTRAINT "diret-call-channels_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: friendship-requests friendship-requests_fromUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."friendship-requests"
    ADD CONSTRAINT "friendship-requests_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: friendship-requests friendship-requests_toUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."friendship-requests"
    ADD CONSTRAINT "friendship-requests_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: friendships friendships_fromUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT "friendships_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: friendships friendships_toUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT "friendships_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: group-message-channels group-message-channels_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."group-message-channels"
    ADD CONSTRAINT "group-message-channels_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: groups-messages groups-messages_groupMessageChannelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."groups-messages"
    ADD CONSTRAINT "groups-messages_groupMessageChannelId_fkey" FOREIGN KEY ("groupMessageChannelId") REFERENCES public."group-message-channels"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: groups-messages groups-messages_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."groups-messages"
    ADD CONSTRAINT "groups-messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: groups groups_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "groups_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: profiles profiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users_direct-call-channels users_direct-call-channels_directCallChannelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."users_direct-call-channels"
    ADD CONSTRAINT "users_direct-call-channels_directCallChannelId_fkey" FOREIGN KEY ("directCallChannelId") REFERENCES public."diret-call-channels"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users_direct-call-channels users_direct-call-channels_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."users_direct-call-channels"
    ADD CONSTRAINT "users_direct-call-channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users_direct-message-channels users_direct-message-channels_directMessageChannelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."users_direct-message-channels"
    ADD CONSTRAINT "users_direct-message-channels_directMessageChannelId_fkey" FOREIGN KEY ("directMessageChannelId") REFERENCES public."direct-message-channels"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users_direct-message-channels users_direct-message-channels_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."users_direct-message-channels"
    ADD CONSTRAINT "users_direct-message-channels_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users_groups users_groups_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups
    ADD CONSTRAINT "users_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users_groups users_groups_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_groups
    ADD CONSTRAINT "users_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

