// Static snapshot of the MVNP repository data.
// This replaces the Django database — to add/edit studies, edit this file directly.

const CATEGORIES = [
  "Non-invasive (e.g., biodiversity surveys, visual observations)",
  "Sampling-based / minimal collection",
  "Commercial / high-impact"
];

const STUDY_TYPES = [
  "Journal Article",
  "Technical Report",
  "Undergraduate Thesis",
  "Graduate Thesis",
  "Post-Graduate Thesis",
  "Other"
];

const STUDIES = [
  {
    study_id: "modina2024",
    title: "First ecological notes on the Waray Dwarf Burrowing Snake",
    authors: "RM Modina, CB Cuta, KR Memoracion",
    year: 2024,
    study_type: "Journal Article",
    status: "MVNP-PAMB Approved Publication",
    featured: true,
    abstract: "",
    category: "Non-invasive (e.g., biodiversity surveys, visual observations)",
    pdf_file: "pdfs/Modina_et_al_2024.pdf"
  },
  {
    study_id: "preciados2020",
    title: "Economic Valuation of Protected Area\u2019s Ecosystem Services: The Case of Mahagnao Volcano Natural Park (MVNP) in Burauen and La Paz, Leyte Philippines",
    authors: "L. Preciados, RJ. Soria, F. Polenio",
    year: 2020,
    study_type: "Journal Article",
    status: "Legacy Study (Pre-Guidelines)",
    featured: true,
    abstract: "",
    category: "Non-invasive (e.g., biodiversity surveys, visual observations)",
    pdf_file: "pdfs/Preciados_et_al_2020.pdf"
  },
  {
    study_id: "francisco2001",
    title: "Bathymetry and Hydrobiology of Lake Mahagnao, Leyte",
    authors: "RA Francisco, et. al",
    year: 2001,
    study_type: "Journal Article",
    status: "Legacy Study (Pre-Guidelines)",
    featured: true,
    abstract: "",
    category: "Non-invasive (e.g., biodiversity surveys, visual observations)",
    pdf_file: "pdfs/Francisco_et_al_2001_Bathymetry.pdf"
  }
];