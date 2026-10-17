/* CRM + post-submit behaviour — paste your Google Form response URL and entry IDs when ready.
   How to get entry IDs: open the live form → View page source → search for "entry." */
window.SITE_CONFIG = {
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
  comparisonReady: false
};
