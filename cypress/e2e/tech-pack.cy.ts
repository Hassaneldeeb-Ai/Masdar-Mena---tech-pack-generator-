describe("AI Tech Pack Generator — demo dashboard", () => {
  let projectId: string;

  before(() => {
    cy.request("POST", "/api/demo")
      .its("body.id")
      .then((id) => {
        projectId = id;
      });
  });

  it("renders the landing page with demo entry point", () => {
    cy.visit("/");
    cy.contains("A factory-ready tech pack").should("be.visible");
    cy.contains("Try the live demo").should("be.visible");
    cy.contains("Create a tech pack").should("be.visible");
  });

  it("shows an empty, product-agnostic create form", () => {
    cy.visit("/create");
    cy.contains("Create tech pack").should("be.visible");
    cy.get("#name").should("have.value", "");
    cy.get("#brand").should("have.value", "");
    cy.get("#description").should("have.value", "");
    cy.get("#quantity").should("have.value", "");
    cy.get('button[role=checkbox][data-state=checked]').should("have.length", 0);
    cy.contains("Colourways are extracted automatically").should("be.visible");
  });

  it("lands on the generated pack with AI + review badges", () => {
    cy.visit(`/tech-pack/${projectId}`);
    cy.contains("h1", "Reversible Cotton Bucket Hat").should("be.visible");
    cy.contains("AI GENERATED").should("be.visible");
    cy.contains("REVIEW REQUIRED").should("be.visible");
    cy.contains("V1.0").should("be.visible");
  });

  it("Overview tab shows product meta, image and stitching", () => {
    cy.visit(`/tech-pack/${projectId}`);
    cy.contains("Stitching specification").should("be.visible");
    cy.contains("Lockstitch").should("be.visible");
    cy.contains("Small Egyptian Apparel Brand").should("be.visible");
  });

  it("BOM tab lists materials with provenance and est. consumption", () => {
    cy.visit(`/tech-pack/${projectId}`);
    cy.contains("button, [role=tab]", "BOM & Materials").click();
    cy.contains("Outer shell fabric").should("be.visible");
    cy.contains("100% cotton woven").should("be.visible");
    cy.contains("span", "est.").should("exist");
    cy.contains("Fabric weight (GSM) not specified").should("be.visible");
    cy.contains("inferred").should("exist");
  });

  it("Measurements tab grades every declared size with tolerances", () => {
    cy.visit(`/tech-pack/${projectId}`);
    cy.contains("button, [role=tab]", "Measurements").click();
    cy.contains("Head opening").should("be.visible");
    cy.get("table").contains("th", "S").should("exist");
    cy.get("table").contains("th", "M").should("exist");
    cy.get("table").contains("th", "L").should("exist");
    cy.contains("cm").should("exist");
  });

  it("edits a measurement value and bumps the version", () => {
    cy.visit(`/tech-pack/${projectId}`);
    cy.contains("button, [role=tab]", "Measurements").click();
    cy.contains("button", "Edit measurements").click();
    cy.get("table input[type=number]").first().clear().type("56.5");
    cy.contains("button", "Save all").click();
    cy.contains("V1.1").should("be.visible");
    cy.contains("button, [role=tab]", "Assumptions").click();
    cy.get("table").contains("td", "56.5").should("exist");
  });

  it("adds GSM via the inline adder and clears the GSM warning", () => {
    cy.visit(`/tech-pack/${projectId}`);
    cy.contains("button, [role=tab]", "BOM & Materials").click();
    // The QA check aggregates every fabric material lacking GSM — fill both.
    cy.contains("button", "Add GSM").click();
    cy.get('input[type=number][placeholder*="240"]')
      .should("have.length", 1)
      .type("240");
    cy.contains("button", "Save").click();
    // Wait for the PATCH round-trip to land in the parent state: the saved
    // value renders on the card. Otherwise the second click below can hit the
    // first (still unmounted-pending) adder and lose its open state.
    cy.contains("p", "240").should("exist");
    cy.contains("button", "Add GSM").click();
    cy.get('input[type=number][placeholder*="240"]')
      .should("have.length", 1)
      .type("240");
    cy.contains("button", "Save").click();
    cy.contains("Fabric weight (GSM) not specified").should("not.exist");
  });

  it("Construction and Colourways tabs show reversible detail", () => {
    cy.visit(`/tech-pack/${projectId}`);
    cy.contains("button, [role=tab]", "Construction").click();
    cy.contains("Reversible construction").should("be.visible");
    cy.contains("Construction").should("be.visible");
    cy.contains("Stitching specification").should("be.visible");
    cy.contains("button, [role=tab]", "Colourways").click();
    cy.contains("Reversible").should("be.visible");
    cy.contains("Face A (outer)").should("be.visible");
  });

  it("QC tab groups checks, lists labels and packaging", () => {
    cy.visit(`/tech-pack/${projectId}`);
    cy.contains("button, [role=tab]", "Quality Control").click();
    cy.contains("Quality control checklist").should("be.visible");
    cy.contains("button, [role=tab]", "Labels & Packaging").click();
    cy.contains("Brand label").should("be.visible");
    cy.contains("Polybag").should("be.visible");
  });

  it("Assumptions tab lists every AI assumption and QA warnings", () => {
    cy.visit(`/tech-pack/${projectId}`);
    cy.contains("button, [role=tab]", "Assumptions").click();
    cy.contains("AI assumptions").should("be.visible");
    cy.contains("Measurements are proposed starting specifications").should("exist");
    cy.contains("Warnings").should("be.visible");
    cy.contains("fabric_gsm_missing").should("not.exist");
    cy.contains("Measurements outside").should("not.exist");
  });

  it("QA panel shows completeness and no blocking errors", () => {
    cy.visit(`/tech-pack/${projectId}`);
    cy.contains("manufacturing checks passed").should("be.visible");
    cy.contains("Blocking").should("not.exist");
    cy.contains("Warnings").should("be.visible");
  });

  it("downloads the JSON export", () => {
    cy.visit(`/tech-pack/${projectId}`);
    cy.window().document().then(() => {
      // intercept download as a navigation and read it via the API instead
      cy.request(`/api/tech-pack/${projectId}/export`).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.headers["content-disposition"]).to.contain("attachment");
        expect(res.body).to.have.property("product");
        expect(res.body).to.have.property("bom");
      });
    });
  });

  it("renders the PDF preview in PDF workspace mode", () => {
    cy.visit(`/tech-pack/${projectId}`);
    cy.get("[data-testid=workspace-mode-pdf]").click();
    cy.get("iframe[title='Tech pack PDF preview']").should("exist");
    cy.get("body").then(($body) => {
      expect($body.text()).not.to.contain("Rendering PDF");
    });
  });

  it("rejects prototype-pollution patch attempts", () => {
    cy.request({
      method: "PATCH",
      url: `/api/tech-pack/${projectId}`,
      body: { patches: [{ field: "__proto__.polluted", value: "evil" }] },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(400);
    });
  });
});
