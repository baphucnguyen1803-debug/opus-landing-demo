/* CRM + post-submit behaviour — paste your Google Form response URL and entry IDs when ready.
   How to get entry IDs: open the live form → View page source → search for "entry." */
window.SITE_CONFIG = {
  githubOwner: "baphucnguyen1803-debug",
  githubBranch: "main",
  googleFormAction: "",
  googleFormFields: {
    full_name: "",
    work_email: "",
    brand_name: "",
    country: "",
    footwear_category: "",
    development_stage: "",
    support: "",
    target_timeline: "",
    expected_volume: "",
    project_details: "",
    cta_source: "",
    page_url: ""
  },
  /* After a successful inquiry: "#top" = landing hero; set mainSiteUrl to an external homepage if needed. */
  afterSubmitRedirect: "#top",
  mainSiteUrl: "",
  /* Set true only when cad.jpg and render.jpg are the same shoe, angle, and framing. */
  comparisonReady: true,
  /* E.164 digits only, no + or spaces — e.g. Vietnam HQ. Leave empty to hide the FAB. */
  whatsappPhone: "84335012032",
  whatsappMessage: "Hello OPUS — I would like to discuss a footwear project."
};
