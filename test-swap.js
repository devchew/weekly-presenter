// Test script to verify swap functionality
import fetch from "node-fetch";

const API_BASE_URL = "http://localhost:3004/api";

async function testSwap() {
  try {
    // First, create a team
    console.log("Creating team...");
    const teamResponse = await fetch(`${API_BASE_URL}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presentation_day: 1 }),
    });

    if (!teamResponse.ok) {
      throw new Error(`Failed to create team: ${teamResponse.status}`);
    }

    const team = await teamResponse.json();
    console.log("Team created:", team);

    // Add members
    console.log("Adding members...");
    const membersResponse = await fetch(
      `${API_BASE_URL}/teams/${team.id}/members`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: [
            { name: "Alice Johnson", position: 0 },
            { name: "Bob Smith", position: 1 },
          ],
        }),
      }
    );

    if (!membersResponse.ok) {
      throw new Error(`Failed to add members: ${membersResponse.status}`);
    }

    const members = await membersResponse.json();
    console.log("Members added:", members);

    // Test swap
    console.log("Testing swap...");
    const swapData = {
      members: [
        { id: members[0].id, position: 1 },
        { id: members[1].id, position: 0 },
      ],
    };
    console.log("Sending swap data:", JSON.stringify(swapData, null, 2));

    const swapResponse = await fetch(
      `${API_BASE_URL}/team-members/bulk-update`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(swapData),
      }
    );

    if (!swapResponse.ok) {
      const errorText = await swapResponse.text();
      throw new Error(
        `Failed to swap members: ${swapResponse.status} - ${errorText}`
      );
    }

    const swapResult = await swapResponse.json();
    console.log("Swap successful:", swapResult);

    // Verify swap
    console.log("Verifying swap...");
    const verifyResponse = await fetch(
      `${API_BASE_URL}/teams/${team.id}/members`
    );

    if (!verifyResponse.ok) {
      throw new Error(`Failed to verify swap: ${verifyResponse.status}`);
    }

    const updatedMembers = await verifyResponse.json();
    console.log("Updated members:", updatedMembers);

    // Check if positions are correctly swapped
    const alice = updatedMembers.find((m) => m.name === "Alice Johnson");
    const bob = updatedMembers.find((m) => m.name === "Bob Smith");

    console.log(
      "Alice position:",
      alice.position,
      "Bob position:",
      bob.position
    );

    if (alice.position === 1 && bob.position === 0) {
      console.log("✅ Swap test PASSED");
    } else {
      console.log("❌ Swap test FAILED");
    }
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testSwap();
