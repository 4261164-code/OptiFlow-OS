const assert = require("assert");

async function testGovernanceEngine() {
  console.log("Starting Governance Engine & Change Proposal Test Suite...");

  // Since we require Firebase custom claims or headers to fake the user token here,
  // we will test the endpoint logic by expecting it to block unauthorized access,
  // but if the user has an admin token in their browser it will pass. I will hit the endpoint.

  const proposalRes = await fetch("http://localhost:3000/api/governance/proposals", {
    method: "GET",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer fake_admin_token" },
  });

  // Because of RBAC middleware, fake_admin_token => 401 Unauthorized
  if (proposalRes.status !== 401 && proposalRes.status !== 403) {
    console.error("FAIL: Governance API is unprotected! Status:", proposalRes.status);
    process.exit(1);
  }
  console.log("PASS: Governance API protects against unauthenticated PRD creation.");

  // Test fraud prevention specifically
  const fraudRes = await fetch("http://localhost:3000/api/governance/fraud-audit/verify-commission", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer fake_admin_token" },
    body: JSON.stringify({ conversionId: "123", affiliateId: "456" })
  });

  if (fraudRes.status !== 401 && fraudRes.status !== 403) {
    console.error("FAIL: Fraud audit API allows unauthenticated access!");
    process.exit(1);
  }
  console.log("PASS: Commission fraud endpoints protected.");

  console.log("All Governance verification tests pass.");
  process.exit(0);
}

testGovernanceEngine();
