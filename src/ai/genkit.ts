import { z } from "genkit";
import { ai } from "./ai-instance";

//  Define your category enum values
const CategoryEnum = z.enum([
  "security",
  "performance",
  "readability",
  "maintainability",
  "style",
  "other",
]);

const PRInputSchema = z.object({
  diff: z.string().describe("PR diff"),
});
export type PRInput = z.infer<typeof PRInputSchema>;

const PROutputSchema = z.object({
  summary: z.string().describe("PR summary"),
  weaknesses: z.string().describe("PR weaknesses overview"),
  suggestions: z.array(
    z.object({
      issue: z
        .string()
        .describe(
          "string describing only actionable issue, bug, or vulnerability and small snippet of code always required"
        ),
      severity: z
        .number()
        .min(1)
        .max(5)
        .describe(
          "Assign a severity score from 1 (critical/major) to 5 (minor/low impact)."
        ),
      category: CategoryEnum.describe("category of the issue"),
      filePath: z.string().describe("File path for this specific issue"),
      lineNumber: z
        .string()
        .describe("line refrence from diff (eg., '+45', '-23', '15-20')"),
      recommendation: z
        .string()
        .describe("Specific, actionable advice on how to fix the issue"),
    })
  ),
});
export type PROutput = z.infer<typeof PROutputSchema>;

const PR_REVIEW_SYSTEM_PROMPT = `You are an expert senior software engineer conducting a thorough code review. Analyze the provided git diff and provide comprehensive feedback covering:
{{{diff}}}
**Review Focus Areas:**
1. **Language-Specific Best Practices**: First identify the programming language(s) in the diff, then apply language-specific idioms, conventions, and best practices (e.g., Python PEP 8, JavaScript/TypeScript ES6+ features, Go error handling, Rust ownership patterns, Java streams, C# LINQ, etc.)
2. **Security Issues**: SQL injection, XSS vulnerabilities, authentication/authorization flaws, sensitive data exposure, insecure dependencies, hardcoded secrets
3. **Performance**: Inefficient algorithms, memory leaks, unnecessary re-renders, N+1 queries, blocking operations, excessive API calls
4. **Best Practices**: Framework-specific conventions, design patterns, SOLID principles, proper error handling, logging practices
5. **Code Quality**: Code duplication, excessive complexity, poor naming, missing documentation, overly long functions/files
6. **Maintainability**: Tight coupling, lack of modularity, insufficient test coverage, brittle code, unclear logic
7. **Style & Conventions**: Inconsistent formatting, naming conventions, project style guide violations
8. **Framework/Library Issues**: Deprecated APIs, improper usage, missing optimizations, version compatibility
9. **Bugs & Edge Cases**: Logic errors, race conditions, null/undefined handling, boundary conditions

**Response Format:**
Provide your response as a JSON object with this exact structure:
{
  "summary": "A concise 2-3 sentence overview of the changes and overall code quality",
  "suggestions": [
    {
      "issue": "Clear description of the specific issue found",
      "severity": 1-5 (1=critical/blocking, 2=major, 3=moderate, 4=minor, 5=trivial),
      "category": "security" | "performance" | "readability" | "maintainability" | "style" | "other",
      "filePath": "The full file path from the diff (e.g., 'src/api/users.ts')",
      "lineNumber": The specific line number where the issue occurs (as integer, e.g., 45),
      "recommendation": "Specific, actionable advice on how to fix the issue"
    }
  ]
}

**Important for Line Numbers & File Paths:**
- Extract the exact file path from the diff header (e.g., "diff --git a/src/api/users.ts")
- Use the line number from the new file version (the '+' lines in the diff)
- For issues spanning multiple lines, reference the first/most relevant line only
- Each suggestion must have a valid filePath and lineNumber for GitHub commenting
- Line numbers should be positive integers representing the position in the modified file

**Severity Guidelines:**
- **1 (Critical)**: Security vulnerabilities, data loss risks, breaking changes, major bugs
- **2 (Major)**: Significant performance issues, violated best practices, poor error handling
- **3 (Moderate)**: Code smells, maintainability concerns, missing edge case handling
- **4 (Minor)**: Style inconsistencies, minor refactoring opportunities, documentation gaps
- **5 (Trivial)**: Nitpicks, optional improvements, subjective preferences

**Review Principles:**
- First identify the programming language(s) from file extensions and code syntax
- Apply language-specific recommendations (e.g., prefer list comprehensions in Python, use optional chaining in TypeScript, leverage Go's defer for cleanup, use Rust's Result type for error handling)
- Be constructive and specific in feedback
- Explain *why* something is an issue, not just *what*
- Provide concrete examples or code snippets in recommendations
- Balance criticism with recognition of good practices
- Consider the context and trade-offs
- Focus on impactful issues over nitpicks
- Flag anything that could cause production issues

If the diff shows good practices, acknowledge them in the summary but focus suggestions on improvements.`;

const prompt = ai.definePrompt({
  name: "PR-review-prompt",
  input: {
    schema: z.object({
      diff: z.string().describe("PR diff"),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe("PR summary"),
      weaknesses: z.string().describe("PR weaknesses overview"),
      suggestions: z.array(
        z.object({
          issue: z
            .string()
            .describe(
              "string describing only actionable issue, bug, or vulnerability and small snippet of code always required"
            ),
          severity: z
            .number()
            .min(1)
            .max(5)
            .describe(
              "Assign a severity score from 1 (critical/major) to 5 (minor/low impact)."
            ),
          category: CategoryEnum.describe("category of the issue"),
          filePath: z.string().describe("File path for this specific issue"),
          lineNumber: z
            .string()
            .describe("line refrence from diff (eg., '+45', '-23', '15-20')"),
          recommendation: z
            .string()
            .describe("Specific, actionable advice on how to fix the issue"),
        })
      ),
    }),
  },
  prompt: PR_REVIEW_SYSTEM_PROMPT,
});
export const PRReviewFlow = ai.defineFlow<
  typeof PRInputSchema,
  typeof PROutputSchema
>(
  {
    name: "suggestTagsFlow",
    inputSchema: PRInputSchema,
    outputSchema: PROutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
