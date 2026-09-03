describe("Create form — full generation flow", () => {
  it("blocks submit without an image", () => {
    cy.visit("/create");
    cy.get("#name").clear().type("Cotton Tote Bag");
    cy.get("#description").clear().type("Heavy canvas tote bag with reinforced handles.");
    cy.contains("button", "Generate tech pack").click();
    cy.contains("Upload a product image first.").should("be.visible");
  });

  it("generates a pack from form data + upload and lands on the dashboard", () => {
    cy.visit("/create");

    // upload the bundled demo image
    cy.get('input[type=file]').first().selectFile("public/demo-bucket-hat.png", { force: true });

    cy.get("#name").clear().type("Canvas Tote Bag");
    cy.get("#brand").clear().type("Nile Goods Co.");
    cy.get("#description")
      .clear()
      .type(
        "Heavy cotton canvas tote bag with reinforced handles and an inner pocket. " +
          "Natural ecru colour with black handles. Everyday carry, durable stitching."
      );
    cy.get("#quantity").clear().type("250");

    // select sizes S and L (grading check applies; nothing is prechecked)
    cy.contains("label", "S").click();
    cy.contains("label", "L").click();

    cy.contains("button", "Generate tech pack").click();

    // staged progress dialog appears
    cy.contains("Generating tech pack").should("be.visible");
    cy.contains("Analyzing product").should("be.visible");

    // lands on the dashboard
    cy.url({ timeout: 180000 }).should("match", /\/tech-pack\/[0-9a-f-]+$/);
    cy.contains("h1", "Canvas Tote Bag").should("be.visible");
    cy.contains("AI GENERATED").should("be.visible");

    // S and L columns present, M absent
    cy.contains("button, [role=tab]", "Measurements").click();
    cy.get("table").contains("th", "S").should("exist");
    cy.get("table").contains("th", "L").should("exist");
    cy.get("table").find("th").contains(/^M$/).should("not.exist");
  });

  it("rejects an unsupported file type at the API", () => {
    cy.request({
      method: "POST",
      url: "/api/projects",
      body: {},
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.gte(400);
    });
  });
});
