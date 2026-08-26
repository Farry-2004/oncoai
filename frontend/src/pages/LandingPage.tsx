import { Link } from 'react-router-dom'
import { PublicNav } from '@/components/layout/PublicNav'
import { Hero3D } from '@/features/landing/Hero3D'
import { BrandMark } from '@/components/ui/BrandMark'

export function LandingPage() {
  return (
    <div>
      <PublicNav />

      {/* HERO */}
      <header className="hero">
        <Hero3D />
        <div className="container hero-inner">
          <span className="badge">
            <span className="badge-icon">MNH</span> Muhimbili National Hospital · Dar es Salaam, Tanzania
          </span>
          <h1>
            OncoAI Intelligent Oncology<span className="accent">East Africa</span>
          </h1>
          <div className="hero-copy">
            <p>
              OncoAI combines multi-modal clinical data analysis with explainable artificial
              intelligence to assist tumor board discussions and support evidence-based
              treatment decisions across Tanzania and East Africa.
            </p>
            <p>
              Developed in partnership with Muhimbili National Hospital — Tanzania's premier
              cancer center — our platform processes imaging, pathology, and genomics to
              deliver predictive insights aligned with WHO and NCCN guidelines.
            </p>
          </div>
          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary">
              Get Started →
            </Link>
            <a href="#solutions" className="btn btn-outline">
              Explore Platform
            </a>
          </div>
          <div className="hero-trust">
            <span>
              <svg className="icon" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M12 2 4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              WHO &amp; NCCN guideline-aligned
            </span>
            <span>
              <svg className="icon" viewBox="0 0 24 24" strokeWidth={2}>
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Clinician-in-the-loop, always
            </span>
            <span>
              <svg className="icon" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M4 12h4l2 7 4-14 2 7h4" />
              </svg>
              Deployed at Muhimbili National Hospital
            </span>
          </div>
        </div>
        <svg className="hero-ekg" viewBox="0 0 800 64" preserveAspectRatio="none">
          <path d="M0 40 L140 40 L160 12 L180 56 L200 40 L340 40 L360 12 L380 56 L400 40 L540 40 L560 12 L580 56 L600 40 L740 40 L760 12 L780 56 L800 40" />
        </svg>
      </header>

      {/* AI CAPABILITIES */}
      <section className="section" id="features">
        <div className="container">
          <span className="eyebrow">AI CAPABILITIES</span>
          <h2 className="section-title">
            Clinical Intelligence
            <br />
            Powered by Explainable AI
          </h2>

          <div className="capabilities-grid">
            <div>
              <div className="feature-cards">
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M9.5 2a4.5 4.5 0 0 0-4.4 5.5A4 4 0 0 0 4 15a4 4 0 0 0 3 6.9 4 4 0 0 0 2.5-.9V4.5A2.5 2.5 0 0 0 9.5 2Z" />
                      <path d="M14.5 2a4.5 4.5 0 0 1 4.4 5.5A4 4 0 0 1 20 15a4 4 0 0 1-3 6.9 4 4 0 0 1-2.5-.9V4.5A2.5 2.5 0 0 1 14.5 2Z" />
                    </svg>
                  </div>
                  <h4>Multi-Modal AI Analysis</h4>
                  <p>Fuses imaging, pathology, genomics, and clinical notes into a single, unified patient view.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M3 12h4l2 8 4-16 2 8h6" />
                    </svg>
                  </div>
                  <h4>Predictive Risk Scoring</h4>
                  <p>Quantifies disease progression and treatment-response risk with continuously validated models.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                      <path d="M9 13h6M9 17h6M9 9h1" />
                    </svg>
                  </div>
                  <h4>Explainable Clinical Reports</h4>
                  <p>Every prediction ships with an interpretable, guideline-referenced rationale for the tumor board.</p>
                </div>
              </div>

              <div className="stat-row">
                <div className="stat-item">
                  <div className="num">98.7%</div>
                  <div className="label">Diagnostic Concordance Rate</div>
                </div>
                <div className="stat-item">
                  <div className="num">12,000+</div>
                  <div className="label">Cases Analyzed at Muhimbili</div>
                </div>
              </div>
            </div>

            <div className="stat-panel">
              <div className="stat-panel-visual">
                <div className="scan-lines"></div>
                <svg className="vitals-wave" viewBox="0 0 300 42" preserveAspectRatio="none">
                  <path d="M0 21 L60 21 L70 6 L80 36 L90 21 L160 21 L170 6 L180 36 L190 21 L300 21" />
                </svg>
                <div className="vitals-readout">
                  <div>
                    <span className="v-label">HR</span>
                    <span className="v-num">78</span>
                    <span className="v-unit">bpm</span>
                  </div>
                  <div>
                    <span className="v-label">SpO₂</span>
                    <span className="v-num">97</span>
                    <span className="v-unit">%</span>
                  </div>
                  <div>
                    <span className="v-label">AI confidence</span>
                    <span className="v-num">96</span>
                    <span className="v-unit">%</span>
                  </div>
                </div>
                <div className="stat-panel-caption">
                  <strong>Multi-Modal Data Fusion</strong>
                  <span>Imaging · Pathology · Genomics · Clinical Notes</span>
                </div>
              </div>
              <a href="#solutions" className="btn btn-primary">
                Explore Platform →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="section section-cream" id="solutions">
        <div className="container">
          <span className="eyebrow">ONCOLOGY MODULES</span>
          <h2 className="section-title">
            Comprehensive<span className="serif-italic">Cancer Care Platform</span>
          </h2>

          <div className="modules-grid">
            <div className="module-card">
              <div className="module-visual imaging">
                <div className="scan-lines"></div>
                <div className="scan-reticle">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <svg className="icon" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1" />
                </svg>
              </div>
              <div className="module-name">Medical Imaging</div>
            </div>
            <div className="module-card">
              <div className="module-visual pathology">
                <svg className="icon" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="9" cy="10" r="1.4" fill="currentColor" stroke="none" />
                  <circle cx="14" cy="9" r="1" fill="currentColor" stroke="none" />
                  <circle cx="13" cy="14" r="1.6" fill="currentColor" stroke="none" />
                  <circle cx="9" cy="15" r="0.9" fill="currentColor" stroke="none" />
                  <circle cx="16" cy="14" r="0.7" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <div className="module-name">Digital Pathology</div>
            </div>
            <div className="module-card">
              <div className="module-visual genomics">
                <svg className="icon" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path d="M7 3c0 6 10 6 10 12s-10 6-10 12M17 3c0 6-10 6-10 12s10 6 10 12" />
                  <path d="M8 7h8M7.5 12h9M8 17h8" />
                  <circle cx="8" cy="7" r="0.8" fill="currentColor" stroke="none" />
                  <circle cx="16" cy="7" r="0.8" fill="currentColor" stroke="none" />
                  <circle cx="7.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
                  <circle cx="16.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
                  <circle cx="8" cy="17" r="0.8" fill="currentColor" stroke="none" />
                  <circle cx="16" cy="17" r="0.8" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <div className="module-name">Molecular Genomics</div>
            </div>
            <div className="module-card">
              <div className="module-visual treatment">
                <svg className="icon" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <rect x="3" y="11" width="18" height="7" rx="1.5" />
                  <path d="M5 11V8a2 2 0 0 1 2-2h3v5M9 6v5" />
                  <circle cx="8" cy="20" r="1.4" fill="currentColor" stroke="none" />
                  <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <div className="module-name">Treatment Planning</div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY ONCOAI */}
      <section className="section" id="research">
        <div className="container">
          <div className="why-grid">
            <div>
              <span className="eyebrow">WHY ONCOAI</span>
              <h2 className="section-title">Built with Muhimbili, for East Africa</h2>
              <p>
                OncoAI was developed in partnership with Muhimbili National Hospital —
                Tanzania's largest and most advanced cancer center — to address the critical
                need for evidence-based, transparent decision support in multidisciplinary
                tumor board reviews across East Africa.
              </p>
              <p>
                Our platform synthesizes patient history, imaging studies, pathology reports,
                and molecular profiling to generate holistic clinical assessments. Every
                prediction is accompanied by quantitative and interpretable explanations,
                ensuring clinicians at Muhimbili and partner hospitals maintain full oversight
                of AI-generated insights while benefiting from advanced pattern recognition
                across multi-modal data.
              </p>
            </div>
            <div className="why-visual">
              <span className="badge">Multidisciplinary Clinical Intelligence</span>
              <svg className="dna-strand" viewBox="0 0 120 200">
                <path d="M20 0c0 30 80 30 80 60s-80 30-80 60 80 30 80 60" />
                <path d="M100 0c0 30-80 30-80 60s80 30 80 60-80 30-80 60" />
                <line x1="20" y1="10" x2="100" y2="10" />
                <line x1="30" y1="30" x2="90" y2="30" />
                <line x1="45" y1="50" x2="75" y2="50" />
                <line x1="45" y1="70" x2="75" y2="70" />
                <line x1="30" y1="90" x2="90" y2="90" />
                <line x1="20" y1="110" x2="100" y2="110" />
                <line x1="30" y1="130" x2="90" y2="130" />
                <line x1="45" y1="150" x2="75" y2="150" />
                <line x1="45" y1="170" x2="75" y2="170" />
                <line x1="30" y1="190" x2="90" y2="190" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="section section-cream" id="about">
        <div className="container">
          <div className="testimonial">
            <div>
              <div className="quote-mark">&ldquo;</div>
              <blockquote>
                Muhimbili AI has transformed how our tumor board reviews complex cases. The
                explainable predictions give our team confidence in treatment decisions, and
                the multi-modal integration saves hours of prep time for our patients across
                Tanzania.
              </blockquote>
              <div className="testimonial-author">
                <div>
                  <strong>Dr. Grace Kibiki</strong>
                  <br />
                  <span className="stars">★ Muhimbili National Hospital, Dar es Salaam</span>
                </div>
              </div>
            </div>
            <div className="testimonial-photo">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-9 2.2-9 5v3h18v-3c0-2.8-4.6-5-9-5Z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta">
        <div className="container cta-inner">
          <span className="badge">
            <span className="badge-icon">MNH</span> Muhimbili Mloganzila · Dar es Salaam
          </span>
          <h2>Ready to Transform Oncology Care in Tanzania?</h2>
          <p className="lead">
            Join Muhimbili National Hospital and partner institutions using OncoAI to enhance
            clinical decision-making with transparent, evidence-based artificial intelligence
            built for East Africa.
          </p>
          <Link to="/login" className="btn btn-primary">
            Request a Demo →
          </Link>

          <div className="stat-row">
            <div className="stat-item on-dark">
              <div className="num">98.7%</div>
              <div className="label">Diagnostic Accuracy</div>
            </div>
            <div className="stat-item on-dark">
              <div className="num">12,000+</div>
              <div className="label">Cases Analyzed</div>
            </div>
            <div className="stat-item on-dark">
              <div className="num">7</div>
              <div className="label">Cancer Types</div>
            </div>
            <div className="stat-item on-dark">
              <div className="num">24/7</div>
              <div className="label">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <Link to="/" className="logo">
              <BrandMark onDark />
              OncoAI<span className="dot">.</span>
            </Link>
            <ul className="footer-links">
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#solutions">Solutions</a>
              </li>
              <li>
                <a href="#research">Research</a>
              </li>
              <li>
                <a href="#about">About</a>
              </li>
              <li>
                <Link to="/login">Log in</Link>
              </li>
            </ul>
          </div>
          <div className="footer-bottom">
            <span>© 2026 OncoAI. Built in partnership with Muhimbili National Hospital.</span>
            <span>Dar es Salaam, Tanzania</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
