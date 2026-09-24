"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Flame,
  Sprout,
  Wind,
  Droplets,
  Briefcase,
  ShieldAlert,
  Users2,
  Hourglass,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Compass,
  Star,
  LockKeyhole,
  MoonStar,
  Orbit,
  Sun,
  Zap,
  Layers
} from "lucide-react";
import { toast } from "sonner";
import { SIGNS, getSignByName, getDailySignReading, type ElementType, type SignData } from "@/lib/signs";
import { localDayKey } from "@/lib/daily";
import {
  getMoonPhase,
  PLANETS_OF_PROSPERITY,
  ELEMENTS_PROSPERITY,
  ASTROLOGY_TRIAD_GUIDE,
  type PlanetWealthInfo
} from "@/lib/astrology";

export type AppView = "home" | "signs" | "tree" | "missions" | "journal" | "profile" | "goal" | "chat";

interface SignsViewProps {
  profile: {
    name: string;
    sign: string;
    objective: string;
    plan?: "free" | "premium";
  };
  isPremium: boolean;
  openPaywall: (reason: string) => void;
  navigate: (view: AppView) => void;
}

const elementConfig: Record<ElementType, { label: string; icon: typeof Flame; colorClass: string; gradient: string }> = {
  fogo: {
    label: "Fogo",
    icon: Flame,
    colorClass: "element-fogo",
    gradient: "linear-gradient(135deg, rgba(239, 107, 74, 0.25), rgba(217, 182, 85, 0.15))",
  },
  terra: {
    label: "Terra",
    icon: Sprout,
    colorClass: "element-terra",
    gradient: "linear-gradient(135deg, rgba(78, 186, 111, 0.25), rgba(217, 182, 85, 0.15))",
  },
  ar: {
    label: "Ar",
    icon: Wind,
    colorClass: "element-ar",
    gradient: "linear-gradient(135deg, rgba(82, 178, 255, 0.25), rgba(217, 182, 85, 0.15))",
  },
  agua: {
    label: "Água",
    icon: Droplets,
    colorClass: "element-agua",
    gradient: "linear-gradient(135deg, rgba(142, 109, 255, 0.25), rgba(217, 182, 85, 0.15))",
  },
};

type ContentSection = "financas" | "carreira" | "pontos_cegos" | "parcerias" | "ritual";
type MainTab = "signos" | "astrologia";

export function SignsView({ profile, isPremium, openPaywall, navigate }: SignsViewProps) {
  const [mainTab, setMainTab] = useState<MainTab>("signos");
  const [selectedSignName, setSelectedSignName] = useState<string>(() => profile.sign || "Capricórnio");
  const [activeSection, setActiveSection] = useState<ContentSection>("financas");
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>("jupiter");
  const [copiedMantra, setCopiedMantra] = useState(false);

  const selectedSign: SignData = useMemo(() => {
    return getSignByName(selectedSignName);
  }, [selectedSignName]);

  const userNativeSign: SignData = useMemo(() => {
    return getSignByName(profile.sign || "Capricórnio");
  }, [profile.sign]);

  const isUserSign = selectedSign.name.toLowerCase() === userNativeSign.name.toLowerCase();

  const dayKey = useMemo(() => localDayKey(), []);
  const dailyReading = useMemo(() => {
    return getDailySignReading(selectedSign.name, dayKey);
  }, [selectedSign.name, dayKey]);

  const moonPhase = useMemo(() => getMoonPhase(), []);

  const selectedPlanet: PlanetWealthInfo = useMemo(() => {
    return PLANETS_OF_PROSPERITY.find((p) => p.id === selectedPlanetId) ?? PLANETS_OF_PROSPERITY[0];
  }, [selectedPlanetId]);

  const elementInfo = elementConfig[selectedSign.element];
  const ElementIcon = elementInfo.icon;

  // The sign strip scrolls sideways. Touch users swipe; mouse users need the arrows, which hide at each end.
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselEdges, setCarouselEdges] = useState({ start: true, end: false });
  const updateCarouselEdges = useCallback(() => {
    const strip = carouselRef.current;
    if (!strip) return;
    setCarouselEdges({ start: strip.scrollLeft <= 2, end: strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    const strip = carouselRef.current;
    if (!strip) return;
    updateCarouselEdges();
    const observer = new ResizeObserver(updateCarouselEdges);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [mainTab, updateCarouselEdges]);

  // Keep the chosen sign centred in the strip — including the native sign on first render.
  const centredOnce = useRef(false);
  useEffect(() => {
    const strip = carouselRef.current;
    const chip = strip?.querySelector<HTMLElement>(".sign-chip.selected");
    if (!strip || !chip) return;
    const stripBox = strip.getBoundingClientRect();
    const chipBox = chip.getBoundingClientRect();
    const left = strip.scrollLeft + (chipBox.left - stripBox.left) - (strip.clientWidth - chipBox.width) / 2;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({ left, behavior: centredOnce.current && !reduceMotion ? "smooth" : "auto" });
    centredOnce.current = true;
  }, [selectedSignName, mainTab]);

  function scrollSigns(direction: 1 | -1) {
    const strip = carouselRef.current;
    if (!strip) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    strip.scrollBy({ left: direction * strip.clientWidth * 0.7, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function handleSelectSign(name: string) {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try { navigator.vibrate(10); } catch { /* ignore */ }
    }
    setSelectedSignName(name);
  }

  function handleCopyMantra() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(selectedSign.prosperityMantra);
      setCopiedMantra(true);
      toast.success("Mantra de prosperidade copiado com sucesso!");
      setTimeout(() => setCopiedMantra(false), 2500);
    }
  }

  return (
    <div className="view-stack signs-view-container">
      {/* Top Main Navigation: Signos vs Astrologia */}
      <div className="signs-top-tablist" role="tablist" aria-label="Navegação da aba">
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === "signos"}
          className={`signs-top-tab ${mainTab === "signos" ? "active" : ""}`}
          onClick={() => setMainTab("signos")}
        >
          <Sparkles size={16} />
          <span>12 Signos</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === "astrologia"}
          className={`signs-top-tab ${mainTab === "astrologia" ? "active" : ""}`}
          onClick={() => setMainTab("astrologia")}
        >
          <MoonStar size={16} />
          <span>Astrologia & Céu</span>
        </button>
      </div>

      {mainTab === "signos" && (
        <>
          {/* Top Banner / Introduction */}
          <section className="surface-card signs-intro-card animate-fade-in">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Arquétipos do Zodíaco</p>
                <h2>Signos para Prosperar</h2>
              </div>
              <div className="zodiac-badge-mini" aria-hidden="true">
                <Sparkles size={18} />
              </div>
            </div>
            <p className="view-intro">
              Cada signo possui um canal próprio para gerar e multiplicar abundância. Explore seu signo nativo e descubra os padrões dos outros 11 signos.
            </p>
          </section>

          {/* 12 Signs Selector Carousel */}
          <div className={`signs-carousel ${carouselEdges.start ? "at-start" : ""} ${carouselEdges.end ? "at-end" : ""}`}>
          <button type="button" className="signs-carousel-arrow is-prev" onClick={() => scrollSigns(-1)} disabled={carouselEdges.start} aria-label="Ver signos anteriores"><ChevronLeft aria-hidden="true" /></button>
          <div ref={carouselRef} className="signs-carousel-wrapper" role="region" aria-label="Seletor de Signos" onScroll={updateCarouselEdges}>
            <div className="signs-carousel-track">
              {SIGNS.map((s) => {
                const isCurrent = s.name === selectedSign.name;
                const isNative = s.name === userNativeSign.name;
                return (
                  <button
                    type="button"
                    key={s.id}
                    className={`sign-chip ${isCurrent ? "selected" : ""} ${isNative ? "is-native" : ""}`}
                    onClick={() => handleSelectSign(s.name)}
                    aria-pressed={isCurrent}
                    aria-label={`Ver signo ${s.name}`}
                  >
                    <span className="sign-chip-glyph" aria-hidden="true">{s.glyph}</span>
                    <span className="sign-chip-name">{s.name}</span>
                    {isNative && <span className="sign-chip-dot" title="Seu signo nativo" aria-hidden="true">✦</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <button type="button" className="signs-carousel-arrow is-next" onClick={() => scrollSigns(1)} disabled={carouselEdges.end} aria-label="Ver próximos signos"><ChevronRight aria-hidden="true" /></button>
          </div>

          {/* Main Sign Showcase Card */}
          <section
            className={`surface-card sign-hero-card ${elementInfo.colorClass} animate-fade-in`}
            style={{ background: elementInfo.gradient }}
          >
            <div className="sign-hero-header">
              <div className="sign-hero-medallion">
                <span className="sign-hero-glyph">{selectedSign.glyph}</span>
              </div>

              <div className="sign-hero-titles">
                <div className="sign-tags">
                  <span className={`element-pill ${elementInfo.colorClass}`}>
                    <ElementIcon size={12} /> {elementInfo.label}
                  </span>
                  <span className="period-pill">{selectedSign.period}</span>
                  {isUserSign ? (
                    <span className="native-pill">
                      <Star size={12} /> Seu Signo Nativo
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="quick-back-native"
                      onClick={() => handleSelectSign(userNativeSign.name)}
                    >
                      Voltar para {userNativeSign.name}
                    </button>
                  )}
                </div>
                <h2>{selectedSign.name}</h2>
                <p className="sign-archetype">{selectedSign.archetype} · Regido por {selectedSign.rulingPlanet}</p>
              </div>
            </div>

            {/* Daily Cosmic Prosperity Energy */}
            <div className="daily-cosmic-box">
              <div className="daily-cosmic-header">
                <Sparkles size={16} />
                <span>Sintonia de Prosperidade para {selectedSign.name}</span>
              </div>
              <p className="daily-cosmic-energy">“{dailyReading.energy}”</p>
              <div className="daily-cosmic-action">
                <strong>Foco prático hoje:</strong> {dailyReading.action}
              </div>
            </div>

            {/* Prosperity Mantra Box */}
            <div className="mantra-container">
              <div className="mantra-content">
                <span className="mantra-tag">Mantra de Ativação</span>
                <p className="mantra-text">“{selectedSign.prosperityMantra}”</p>
              </div>
              <button
                type="button"
                className="mantra-copy-btn"
                onClick={handleCopyMantra}
                aria-label="Copiar mantra"
              >
                {copiedMantra ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedMantra ? "Copiado" : "Copiar"}</span>
              </button>
            </div>
          </section>

          {/* Navigation Pills for Sign Details */}
          <div className="sign-subnav" role="tablist" aria-label="Detalhes do signo">
            <button
              type="button"
              role="tab"
              aria-selected={activeSection === "financas"}
              className={`subnav-pill ${activeSection === "financas" ? "active" : ""}`}
              onClick={() => setActiveSection("financas")}
            >
              <Sparkles size={14} /> Finanças
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeSection === "carreira"}
              className={`subnav-pill ${activeSection === "carreira" ? "active" : ""}`}
              onClick={() => setActiveSection("carreira")}
            >
              <Briefcase size={14} /> Carreira
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeSection === "pontos_cegos"}
              className={`subnav-pill ${activeSection === "pontos_cegos" ? "active" : ""}`}
              onClick={() => setActiveSection("pontos_cegos")}
            >
              <ShieldAlert size={14} /> Pontos Cegos
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeSection === "parcerias"}
              className={`subnav-pill ${activeSection === "parcerias" ? "active" : ""}`}
              onClick={() => setActiveSection("parcerias")}
            >
              <Users2 size={14} /> Parcerias
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeSection === "ritual"}
              className={`subnav-pill ${activeSection === "ritual" ? "active" : ""}`}
              onClick={() => setActiveSection("ritual")}
            >
              <Hourglass size={14} /> Ritual
            </button>
          </div>

          {/* Dynamic Content Sections */}
          {activeSection === "financas" && (
            <section className="surface-card prosperity-detail-card animate-fade-in">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Mentalidade & Fluxo</p>
                  <h2>Como {selectedSign.name} Lida com Dinheiro</h2>
                </div>
                <Sparkles size={20} />
              </div>

              <p className="detail-narrative">{selectedSign.wealthMindset}</p>

              <div className="strength-cards-grid">
                <span className="grid-heading">Superpoderes de Realização</span>
                {selectedSign.strengths.map((str, idx) => (
                  <div key={idx} className="strength-item">
                    <span className="strength-num">0{idx + 1}</span>
                    <p>{str}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "carreira" && (
            <section className="surface-card prosperity-detail-card animate-fade-in">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Trabalho & Negócios</p>
                  <h2>Carreira & Posicionamento</h2>
                </div>
                <Briefcase size={20} />
              </div>

              <div className="career-block">
                <strong>Estilo de Liderança</strong>
                <p>{selectedSign.careerAndBusiness.leadershipStyle}</p>
              </div>

              <div className="career-block">
                <strong>Poder de Negociação</strong>
                <p>{selectedSign.careerAndBusiness.negotiationPower}</p>
              </div>

              <div className="career-fields">
                <strong>Campos Favoráveis de Crescimento:</strong>
                <div className="fields-tags">
                  {selectedSign.careerAndBusiness.bestFields.map((field, idx) => (
                    <span key={idx} className="field-tag">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeSection === "pontos_cegos" && (
            <section className="surface-card prosperity-detail-card caution-card animate-fade-in">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Prevenção de Perdas</p>
                  <h2>Armadilhas de Escassez</h2>
                </div>
                <ShieldAlert size={20} />
              </div>

              <div className="blind-spots-list">
                {selectedSign.blindSpots.map((spot, idx) => (
                  <div key={idx} className="blind-spot-item">
                    <span className="alert-bullet">⚠</span>
                    <p>{spot}</p>
                  </div>
                ))}
              </div>

              <div className="antidote-box">
                <div className="antidote-badge">Antídoto Prático</div>
                <p>{selectedSign.antidote}</p>
              </div>
            </section>
          )}

          {activeSection === "parcerias" && (
            <section className="surface-card prosperity-detail-card animate-fade-in">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Sinergia & Sociedades</p>
                  <h2>Parcerias Lucrativas</h2>
                </div>
                <Users2 size={20} />
              </div>

              <p className="detail-narrative">
                Nos negócios e investimentos, unir forças com signos complementares cria uma blindagem contra pontos cegos e acelera a realização.
              </p>

              <div className="partners-grid">
                {selectedSign.compatiblePartners.map((partner, idx) => (
                  <div key={idx} className="partner-card">
                    <div className="partner-header">
                      <strong>{partner.sign}</strong>
                      <span className="partner-badge">Sinergia</span>
                    </div>
                    <p>{partner.synergy}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "ritual" && (
            <section className="surface-card prosperity-detail-card ritual-card animate-fade-in">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Prática Elemental ({elementInfo.label})</p>
                  <h2>{selectedSign.prosperityRitual.title}</h2>
                </div>
                <Hourglass size={20} />
              </div>

              <div className="ritual-meta">
                <span>Duração recomendada: <strong>{selectedSign.prosperityRitual.duration}</strong></span>
              </div>

              <div className="ritual-practice-box">
                <p>{selectedSign.prosperityRitual.practice}</p>
              </div>

              <button
                type="button"
                className="gold-button w-full mt-4"
                onClick={() => {
                  toast.success("Ótima escolha! Anote sua percepção no Diário.");
                  navigate("journal");
                }}
              >
                <BookOpen size={16} /> Registrar Reflexão no Diário
              </button>
            </section>
          )}

          {/* Weekly Cosmic Forecast for Sign (Premium Feature) */}
          {!isPremium ? (
            <section className="surface-card signs-premium-preview animate-fade-in">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Ciclo Semanal Completo</p>
                  <h2>Previsão Astrológica de Prosperidade</h2>
                </div>
                <Sparkles size={20} />
              </div>
              <p className="detail-narrative">
                Acompanhe os movimentos lunares e trânsitos favoráveis para investimentos, negociações e decisões de carreira de {selectedSign.name}.
              </p>
              <button
                type="button"
                className="gold-button w-full"
                onClick={() => openPaywall("signs_weekly")}
              >
                <LockKeyhole size={16} /> Desbloquear Guia Semanal de {selectedSign.name} (Premium)
              </button>
            </section>
          ) : (
            <section className="surface-card signs-premium-preview is-active animate-fade-in">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Ciclo Semanal Exclusivo · Premium</p>
                  <h2>Guia Semanal de Prosperidade para {selectedSign.name}</h2>
                </div>
                <Sparkles size={20} />
              </div>
              <p className="detail-narrative">
                Nesta semana, a energia do elemento {elementInfo.label} favorece acordos baseados em método e entregas pontuais. Foque em solidificar o fluxo de caixa antes de assumir novos compromissos.
              </p>
              <div className="ritual-meta">
                <span>Dias de maior fluidez esta semana: <strong>Terça e Quinta-feira</strong></span>
              </div>
            </section>
          )}
        </>
      )}

      {/* Main Tab 2: Céu & Astrologia Prática */}
      {mainTab === "astrologia" && (
        <>
          {/* Moon Phase Real-time Card */}
          <section className="surface-card moon-phase-card animate-fade-in">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Céu de Hoje em Tempo Real</p>
                <h2>Ciclo Lunar & Prosperidade</h2>
              </div>
              <div className="moon-symbol-badge" aria-hidden="true">
                {moonPhase.symbol}
              </div>
            </div>

            <div className="moon-phase-details">
              <div className="moon-phase-tagline">
                <span className="phase-pill">{moonPhase.name}</span>
                <span className="illumination-pill">{moonPhase.illumination}% iluminada</span>
                <span className="theme-pill-small">✦ {moonPhase.theme}</span>
              </div>

              <p className="detail-narrative">{moonPhase.financialFocus}</p>

              <div className="moon-actions-grid">
                <div className="moon-action-item favorable">
                  <strong>O que impulsionar agora:</strong>
                  <p>{moonPhase.favorableAction}</p>
                </div>
                <div className="moon-action-item avoid">
                  <strong>O que convém moderar:</strong>
                  <p>{moonPhase.avoidAction}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Planets of Prosperity */}
          <section className="surface-card planets-card animate-fade-in">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Forças Cósmicas da Abundância</p>
                <h2>Planetas da Prosperidade</h2>
              </div>
              <Orbit size={20} />
            </div>

            <p className="detail-narrative">
              Na astrologia clássica, cada planeta rege uma dimensão específica da realização material e profissional. Escolha um planeta para sintonizar sua energia:
            </p>

            <div className="planets-selector-grid">
              {PLANETS_OF_PROSPERITY.map((planet) => {
                const isSelected = planet.id === selectedPlanet.id;
                return (
                  <button
                    type="button"
                    key={planet.id}
                    className={`planet-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedPlanetId(planet.id)}
                  >
                    <strong>{planet.name}</strong>
                    <small>{planet.archetype.split(" ")[0]}</small>
                  </button>
                );
              })}
            </div>

            <div className="planet-focus-card">
              <div className="planet-focus-header">
                <div>
                  <span className="planet-tag">Arquétipo Ativo</span>
                  <h3>{selectedPlanet.name} · {selectedPlanet.archetype}</h3>
                </div>
                <Sun size={22} className="planet-icon" />
              </div>

              <div className="planet-meta-block">
                <strong>Domínio Material:</strong>
                <p>{selectedPlanet.wealthDomain}</p>
              </div>

              <div className="planet-meta-block">
                <strong>Como Ativar no Trabalho & Negócios:</strong>
                <p>{selectedPlanet.howToActivate}</p>
              </div>

              <div className="planet-advice-box">
                <Zap size={16} />
                <p>“{selectedPlanet.weeklyAdvice}”</p>
              </div>
            </div>
          </section>

          {/* The 4 Elements Matrix */}
          <section className="surface-card elements-matrix-card animate-fade-in">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Equilíbrio da Roda</p>
                <h2>Os 4 Elementos da Prosperidade</h2>
              </div>
              <Layers size={20} />
            </div>

            <p className="detail-narrative">
              A verdadeira abundância surge quando você equilibra a coragem do <strong>Fogo</strong>, a estrutura da <strong>Terra</strong>, a estratégia do <strong>Ar</strong> e a intuição da <strong>Água</strong>.
            </p>

            <div className="elements-grid">
              {ELEMENTS_PROSPERITY.map((el) => (
                <div key={el.element} className={`element-card ${el.element}`}>
                  <div className="element-card-header">
                    <h4>{el.name}</h4>
                  </div>
                  <div className="element-meta-row">
                    <span>Superpoder:</span>
                    <p>{el.wealthSuperpower}</p>
                  </div>
                  <div className="element-meta-row alert">
                    <span>Armadilha:</span>
                    <p>{el.scarcityTrap}</p>
                  </div>
                  <div className="element-meta-row balance">
                    <span>Prática de Reequilíbrio:</span>
                    <p>{el.rebalancingPractice}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Cosmic Triad Guide */}
          <section className="surface-card triad-guide-card animate-fade-in">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Autoconhecimento Profundo</p>
                <h2>Sua Tríade de Prosperidade</h2>
              </div>
              <Sparkles size={20} />
            </div>

            <div className="triad-list">
              {ASTROLOGY_TRIAD_GUIDE.map((item, idx) => (
                <div key={idx} className="triad-item">
                  <div className="triad-number">0{idx + 1}</div>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Integration Banner to Action */}
      <section className="surface-card signs-callout-card">
        <div className="callout-content">
          <Compass size={24} className="callout-icon" />
          <div>
            <h3>Cultive seus frutos na Árvore</h3>
            <p>Conhecendo os padrões astrológicos, estabeleça metas claras na sua jornada para prosperar.</p>
          </div>
        </div>
        <button
          type="button"
          className="ghost-button"
          onClick={() => navigate("tree")}
        >
          <span>Ver Minha Árvore</span>
          <ArrowRight size={14} />
        </button>
      </section>
    </div>
  );
}
