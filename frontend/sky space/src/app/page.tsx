"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CloudSun,
  Droplets,
  Leaf,
  MapPin,
  Menu,
  Search,
  Sprout,
  Sun,
  TrendingUp,
  X,
  ChevronDown,
  Satellite,
  Cpu,
  ShieldCheck,
  ThermometerSun,
  Database,
} from "lucide-react";

const navigation = ["Overview", "Fields", "Crop planning", "Water", "Reports"];

const initialStats = [
  {
    label: "Total land",
    value: "128.5",
    unit: "hectares",
    change: "+4.8%",
    icon: MapPin,
    color: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  {
    label: "Active crops",
    value: "12",
    unit: "varieties",
    change: "+2 new",
    icon: Sprout,
    color: "bg-lime-100 text-lime-800 border border-lime-200",
  },
  {
    label: "Water used",
    value: "68.4",
    unit: "%",
    change: "-8.2%",
    icon: Droplets,
    color: "bg-sky-100 text-sky-800 border border-sky-200",
  },
  {
    label: "Expected yield",
    value: "94.2",
    unit: "tons",
    change: "+12.5%",
    icon: TrendingUp,
    color: "bg-amber-100 text-amber-800 border border-amber-200",
  },
];

const initialFields = [
  {
    name: "North Field · Giza Sector 1",
    crop: "Wheat (Heat-Resistant)",
    area: "32.5 ha",
    progress: 82,
    gdd: "1,420 GDD",
    soilScore: "94/100",
    status: "Optimal NDVI",
    color: "bg-gradient-to-r from-emerald-600 to-teal-500",
  },
  {
    name: "East Garden · Nile Delta",
    crop: "Maize → Legumes",
    area: "24.0 ha",
    progress: 64,
    gdd: "1,180 GDD",
    soilScore: "88/100",
    status: "SMAP Moisture OK",
    color: "bg-gradient-to-r from-lime-600 to-emerald-500",
  },
  {
    name: "South Valley · Reclamation",
    crop: "Winter Tomatoes",
    area: "18.5 ha",
    progress: 91,
    gdd: "1,650 GDD",
    soilScore: "91/100",
    status: "Harvest Ready",
    color: "bg-gradient-to-r from-amber-500 to-orange-500",
  },
];

const initialActivities = [
  {
    title: "SMAP Soil Moisture Sync",
    detail: "North Field · Zone A · +14% retention",
    time: "Today, 09:40 AM",
    icon: Droplets,
    color: "bg-sky-100 text-sky-800",
  },
  {
    title: "RAG Agronomic Advisory",
    detail: "South Valley · Potassium silicate applied",
    time: "Today, 08:15 AM",
    icon: Leaf,
    color: "bg-emerald-100 text-emerald-800",
  },
  {
    title: "NASA POWER GDD Alert",
    detail: "East Garden · Rotation shift scheduled",
    time: "Yesterday, 04:30 PM",
    icon: Sprout,
    color: "bg-lime-100 text-lime-800",
  },
];

const plans = [
  { name: "Standard", water: 420, yield: "82 tons", cost: "$2,400", sequence: "Wheat → Maize" },
  { name: "Balanced", water: 360, yield: "94 tons", cost: "$2,750", sequence: "Wheat → Legumes" },
  { name: "Efficient", water: 300, yield: "89 tons", cost: "$2,580", sequence: "Wheat → Clover Cover" },
];

function NasaOrbitalCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.8, 5.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const ambientLight = new THREE.AmbientLight(0xd1fae5, 1.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x34d399, 3, 20);
    pointLight.position.set(3, 4, 4);
    scene.add(pointLight);

    const earthGeo = new THREE.IcosahedronGeometry(1.35, 3);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      emissive: 0x022c22,
      roughness: 0.6,
      metalness: 0.2,
      flatShading: true,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    group.add(earthMesh);

    const wireGeo = new THREE.IcosahedronGeometry(1.37, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    group.add(wireMesh);

    const pyramidGeo = new THREE.ConeGeometry(0.28, 0.42, 4);
    const pyramidMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0x78350f,
      wireframe: true,
    });
    const pyramid = new THREE.Mesh(pyramidGeo, pyramidMat);
    pyramid.position.set(0.65, 1.15, 0.55);
    pyramid.rotation.z = -0.45;
    pyramid.rotation.x = 0.35;
    group.add(pyramid);

    const ringGeo = new THREE.TorusGeometry(2.05, 0.015, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
    });
    const orbitRing = new THREE.Mesh(ringGeo, ringMat);
    orbitRing.rotation.x = Math.PI / 2.3;
    orbitRing.rotation.y = 0.3;
    group.add(orbitRing);

    const satGroup = new THREE.Group();
    const satBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.18, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 })
    );
    const panelGeo = new THREE.BoxGeometry(0.75, 0.02, 0.22);
    const panelMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const panels = new THREE.Mesh(panelGeo, panelMat);
    satGroup.add(satBody);
    satGroup.add(panels);

    const scanGeo = new THREE.ConeGeometry(0.45, 1.1, 16, 1, true);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
    });
    const scanCone = new THREE.Mesh(scanGeo, scanMat);
    scanCone.position.y = -0.6;
    satGroup.add(scanCone);

    scene.add(satGroup);

    const particlesGeo = new THREE.BufferGeometry();
    const count = 140;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 7;
    }
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0xa7f3d0,
      size: 0.04,
      transparent: true,
      opacity: 0.7,
    });
    const stars = new THREE.Points(particlesGeo, particlesMat);
    scene.add(stars);

    let angle = 0;
    let reqId: number;

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      group.rotation.y += 0.0035;
      stars.rotation.y -= 0.0008;

      angle += 0.015;
      satGroup.position.x = Math.cos(angle) * 2.05;
      satGroup.position.z = Math.sin(angle) * 2.05;
      satGroup.position.y = Math.sin(angle * 2) * 0.45;
      satGroup.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="h-[290px] w-full sm:h-[340px]" />;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [budget, setBudget] = useState(360);
  const [selectedPlan, setSelectedPlan] = useState("Balanced");
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState(initialStats);
  const [fields, setFields] = useState(initialFields);
  const [activities, setActivities] = useState(initialActivities);

  // useEffect(() => {
  //   const controller = new AbortController();

  //   const fetchDashboard = async () => {
  //     try {
  //       const response = await fetch(
  //         `${process.env.NEXT_PUBLIC_API_URL}/dashboard`,
  //         {
  //           method: "GET",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           signal: controller.signal,
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new Error("Failed to fetch dashboard data");
  //       }

  //       const data = await response.json();

  //       setStats(data.stats);
  //       setFields(data.fields);
  //       setActivities(data.activities);
  //     } catch (error) {
  //       if (
  //         error instanceof Error &&
  //         error.name !== "AbortError"
  //       ) {
  //         console.error("Dashboard error:", error);
  //       }
  //     }
  //   };

  //   fetchDashboard();

  //   return () => controller.abort();
  // }, []);

  const filteredActivities = useMemo(
    () =>
      activities.filter((item) =>
        `${item.title} ${item.detail}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [activities, search],
  );

  const selected = plans.find((plan) => plan.name === selectedPlan) ?? plans[1];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#e8f0e6] via-[#f1f6ef] to-[#e4ede2] text-[#112318]">
      <header className="sticky top-0 z-50 border-b border-emerald-900/10 bg-[#f7faf6]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[82px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#" className="flex items-center gap-3.5 group">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-600/30 bg-[#0b2017] shadow-md transition-transform group-hover:scale-105">
              <img
                src="/transperent-logo.webp"
                alt="Sky Space Logo"
                className="h-full w-full object-cover object-center scale-110"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-[#0d2618]">
                  SKY
                </span>
                <span className="text-xl font-black tracking-tight text-emerald-600">
                  SPACE
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-800/70">
                Field Shift · NASA Giza
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-1.5 rounded-full border border-emerald-900/10 bg-[#ebf2e9] p-1.5 lg:flex">
            {navigation.map((item) => (
              <button
                key={item}
                onClick={() => setActiveNav(item)}
                className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
                  activeNav === item
                    ? "bg-[#123824] text-white shadow-sm"
                    : "text-[#4a6353] hover:bg-emerald-900/5 hover:text-[#112318]"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3.5 sm:flex">
            <div className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-900">
              <Satellite size={14} className="text-emerald-700 animate-pulse" />
              NASA POWER & SMAP LIVE
            </div>
            <button className="relative rounded-full border border-emerald-900/10 bg-white p-2.5 text-[#3b5243] shadow-sm hover:bg-emerald-50">
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-3 border-l border-emerald-900/10 pl-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-teal-900 text-sm font-bold text-white shadow-sm">
                HF
              </div>
              <div>
                <p className="text-sm font-bold text-[#112318]">Hope Farm</p>
                <p className="text-xs font-medium text-[#5e7466]">Giza Sector · Lead</p>
              </div>
              <ChevronDown size={16} className="text-[#5e7466]" />
            </div>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl border border-emerald-900/15 bg-white p-2.5 lg:hidden"
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-emerald-900/10 bg-[#f7faf6] px-5 py-4 lg:hidden">
            {navigation.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setActiveNav(item);
                  setMenuOpen(false);
                }}
                className={`block w-full rounded-xl px-4 py-3 text-left text-sm font-bold ${
                  activeNav === item
                    ? "bg-[#123824] text-white"
                    : "text-[#4a6353]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <section className="relative mb-9 overflow-hidden rounded-[32px] border border-emerald-500/20 bg-gradient-to-br from-[#071f14] via-[#0d3321] to-[#08221c] px-7 py-9 text-white shadow-xl sm:px-10 sm:py-11 lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:28px_28px] opacity-15" />

          <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-lime-400 animate-ping" />
                NASA Space Apps · Field Shift Telemetry
              </div>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Adapting Farms with
                <span className="block bg-gradient-to-r from-lime-300 via-emerald-300 to-sky-300 bg-clip-text text-transparent">
                  Orbital Precision & AI.
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-emerald-100/80 sm:text-base">
                Real-time crop scoring, soil moisture intelligence, and LangChain
                RAG rotation advisories engineered to protect Giza & MENA harvests
                against extreme climate shifts.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <CloudSun size={16} />
                    Giza Microclimate
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">24°C</span>
                    <span className="text-xs text-emerald-200/80">Clear Sky</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                    <Database size={16} />
                    ChromaDB RAG
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">98.4%</span>
                    <span className="text-xs text-emerald-200/80">Match Score</span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs font-semibold text-lime-300">Season Progress</p>
                  <p className="mt-2 text-2xl font-bold">76%</p>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                    <div className="h-full w-[76%] rounded-full bg-gradient-to-r from-lime-400 to-emerald-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full rounded-3xl border border-emerald-400/20 bg-black/25 p-2 backdrop-blur-sm">
                <NasaOrbitalCanvas />
                <div className="flex items-center justify-between px-4 pb-2 text-[11px] font-semibold text-emerald-300/80">
                  <span>3D ORBITAL SENSOR SIMULATION</span>
                  <span>LAT 30.0131° N · LON 31.2089° E</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-[24px] border border-emerald-900/10 bg-[#fbfdfb] p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#4a6353]">
                    {stat.label}
                  </span>
                  <div className={`rounded-xl p-2.5 ${stat.color}`}>
                    <Icon size={20} />
                  </div>
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-[#0d2618]">
                    {stat.value}
                  </span>
                  <span className="text-sm font-semibold text-[#6c8273]">
                    {stat.unit}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <ArrowUpRight size={15} />
                  {stat.change}
                  <span className="ml-1 font-medium text-[#6c8273]">
                    vs baseline season
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mb-9 grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_1fr]">
          <div className="rounded-[26px] border border-emerald-900/10 bg-[#fbfdfb] p-6 shadow-sm sm:p-7">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  <p className="text-lg font-extrabold text-[#0d2618]">
                    Field Shift Telemetry & SoilGrids
                  </p>
                </div>
                <p className="mt-1 text-sm text-[#5e7466]">
                  Live GDD thermal tracking and satellite vegetation indices
                </p>
              </div>
              <button className="flex items-center gap-2 rounded-full border border-emerald-900/15 bg-[#eff6ee] px-4 py-2 text-xs font-bold text-[#1e4d30] hover:bg-emerald-100">
                View all sectors <ArrowRight size={14} />
              </button>
            </div>

            <div className="space-y-6">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className="rounded-2xl border border-emerald-900/10 bg-[#f4f8f2] p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[#0d2618]">
                        {field.name}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-[#52695a]">
                        {field.crop} · {field.area}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {"gdd" in field && (
                        <span className="rounded-full border border-amber-500/30 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                          {field.gdd}
                        </span>
                      )}
                      <span className="rounded-full bg-emerald-900 text-white px-3 py-1 text-xs font-bold">
                        {field.status}
                      </span>
                    </div>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#dfeae0]">
                    <div
                      className={`h-full rounded-full ${field.color}`}
                      style={{ width: `${field.progress}%` }}
                    />
                  </div>
                  <div className="mt-2.5 flex justify-between text-xs font-bold text-[#4a6353]">
                    <span>SoilGrids Score: {"soilScore" in field ? field.soilScore : "90/100"}</span>
                    <span>{field.progress}% cycle complete</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[26px] border border-emerald-900/10 bg-[#fbfdfb] p-6 shadow-sm sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-extrabold text-[#0d2618]">
                    Water Balance Engine
                  </p>
                  <p className="mt-1 text-sm text-[#5e7466]">
                    Evapotranspiration vs irrigation quota
                  </p>
                </div>
                <span className="rounded-xl bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
                  NASA GPM
                </span>
              </div>

              <div className="flex items-center justify-center py-6">
                <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-[16px] border-[#e3ede2]">
                  <div
                    className="absolute inset-[-16px] rounded-full"
                    style={{
                      background:
                        "conic-gradient(#059669 0% 68%, transparent 68% 100%)",
                      mask: "radial-gradient(farthest-side, transparent calc(100% - 16px), #000 calc(100% - 15px))",
                      WebkitMask:
                        "radial-gradient(farthest-side, transparent calc(100% - 16px), #000 calc(100% - 15px))",
                    }}
                  />
                  <div className="text-center">
                    <p className="text-4xl font-black tracking-tight text-[#0d2618]">
                      68%
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#5e7466]">
                      Quota Utilized
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-emerald-900/10 bg-[#f1f6f0] p-4">
                <p className="text-xs font-bold text-[#5e7466]">Consumed</p>
                <p className="mt-1 text-xl font-black text-[#0d2618]">24,600</p>
                <p className="text-xs font-semibold text-emerald-700">Liters / ha</p>
              </div>
              <div className="rounded-2xl border border-emerald-900/10 bg-[#f1f6f0] p-4">
                <p className="text-xs font-bold text-[#5e7466]">Reserve</p>
                <p className="mt-1 text-xl font-black text-[#0d2618]">11,400</p>
                <p className="text-xs font-semibold text-sky-700">Liters / ha</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-9 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[26px] border border-emerald-900/10 bg-[#fbfdfb] p-6 shadow-sm sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-lg font-extrabold text-[#0d2618]">
                  AI Crop Rotation & Water Simulator
                </p>
                <p className="mt-1 text-sm text-[#5e7466]">
                  Test drought resilience and financial savings with FastAPI Scoring
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                <Cpu size={14} /> Scoring Engine v2.4
              </span>
            </div>

            <div className="mb-7 rounded-2xl border border-emerald-900/10 bg-[#f1f6f0] p-5">
              <div className="mb-4 flex items-center justify-between">
                <label htmlFor="budget" className="text-sm font-bold text-[#112318]">
                  Available Seasonal Water Budget
                </label>
                <span className="rounded-lg bg-[#123824] px-3 py-1 text-base font-black text-lime-300">
                  {budget} m³
                </span>
              </div>
              <input
                id="budget"
                type="range"
                min="200"
                max="500"
                step="10"
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
                className="h-2.5 w-full cursor-pointer rounded-lg bg-emerald-900/20 accent-emerald-700"
              />
              <div className="mt-2 flex justify-between text-xs font-bold text-[#5e7466]">
                <span>200 m³ (Severe Drought)</span>
                <span>350 m³ (Average)</span>
                <span>500 m³ (Surplus)</span>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-3">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.name;
                const fits = plan.water <= budget;

                return (
                  <button
                    key={plan.name}
                    onClick={() => setSelectedPlan(plan.name)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-emerald-700 bg-[#eaf4e8] ring-2 ring-emerald-700"
                        : "border-emerald-900/10 bg-white hover:border-emerald-600/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-extrabold text-[#0d2618]">
                        {plan.name}
                      </p>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          fits ? "bg-emerald-600" : "bg-amber-500"
                        }`}
                      />
                    </div>
                    {"sequence" in plan && (
                      <p className="mt-1 text-[11px] font-bold text-emerald-800">
                        {plan.sequence}
                      </p>
                    )}
                    <p className="mt-3 text-2xl font-black text-[#0d2618]">
                      {plan.water} m³
                    </p>
                    <p className="text-xs font-semibold text-[#5e7466]">
                      Water needed
                    </p>
                    <div className="my-3.5 h-px bg-emerald-900/10" />
                    <p className="text-sm font-bold text-[#0d2618]">{plan.yield}</p>
                    <p className="text-xs font-semibold text-[#5e7466]">
                      Expected yield
                    </p>
                    <p className="mt-2.5 text-sm font-black text-emerald-700">
                      {plan.cost} est. profit
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#0d2e1e] to-[#16462f] p-5 text-white shadow-md">
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} className="text-lime-300 shrink-0" />
                <div>
                  <p className="text-sm font-bold">{selected.name} Rotation Strategy</p>
                  <p className="mt-0.5 text-xs text-emerald-100/80">
                    {selected.water <= budget
                      ? "Verified feasible under current NASA SMAP & water quota constraints."
                      : "Warning: Exceeds current water threshold. Switch to Efficient legume rotation."}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold ${
                  selected.water <= budget
                    ? "bg-lime-300 text-[#0d2618]"
                    : "bg-amber-300 text-amber-950"
                }`}
              >
                {selected.water <= budget ? "Within Budget" : "Over Budget"}
              </span>
            </div>
          </div>

          <div className="rounded-[26px] border border-emerald-900/10 bg-[#fbfdfb] p-6 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-extrabold text-[#0d2618]">
                  Satellite & Field Logs
                </p>
                <p className="mt-1 text-sm text-[#5e7466]">
                  Live telemetry and RAG recommendations
                </p>
              </div>
              <div className="rounded-xl bg-amber-100 p-2.5 text-amber-800">
                <ThermometerSun size={20} />
              </div>
            </div>

            <div className="relative mb-5">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e7466]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search telemetry logs..."
                className="w-full rounded-xl border border-emerald-900/15 bg-[#f1f6f0] py-2.5 pl-10 pr-3 text-sm font-medium outline-none transition focus:border-emerald-700 focus:bg-white"
              />
            </div>

            <div className="space-y-4">
              {filteredActivities.length ? (
                filteredActivities.map((activity) => {
                  const Icon = activity.icon;

                  return (
                    <div
                      key={activity.title}
                      className="flex gap-3.5 rounded-2xl border border-emerald-900/5 bg-[#f4f8f2] p-3.5"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activity.color}`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#0d2618]">
                          {activity.title}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-[#4a6353]">
                          {activity.detail}
                        </p>
                        <p className="mt-1.5 text-[11px] font-bold text-emerald-700">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-8 text-center text-sm font-semibold text-[#5e7466]">
                  No matching telemetry logs found.
                </p>
              )}
            </div>
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-3 border-t border-emerald-900/10 py-6 text-xs font-bold text-[#4a6353] sm:flex-row sm:items-center">
          <p>© 2026 SKYSPACE · FIELD SHIFT. Adapting Farms with NASA Data in Giza.</p>
          <div className="flex items-center gap-2 text-emerald-800">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
            FastAPI · ChromaDB · NASA POWER Connected
          </div>
        </footer>
      </div>
    </main>
  );
}