export async function fetchPRDiffs(GITHUB_API_URL: string) {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "PR-AI-Reviewer",
      },
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
    }

    const files = await response.json();
    let formattedDiffs = "";

    for (const file of files) {
      const patch = file.patch || "No diff (possibly binary or deleted file)";
      formattedDiffs += `\n=== ${file.filename} ===\n${patch}\n`;
    }

    return formattedDiffs;
  } catch (error) {
    console.error("Error fetching PR diffs:", error);
  }
}
