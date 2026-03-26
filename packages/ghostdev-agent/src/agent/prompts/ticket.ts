interface Ticket {
  title: string;
  description: string;
  baseBranch: string;
  branchPrefix?: string;
}

export function buildTicketPrompt(ticket: Ticket): string {
  const prefix = ticket.branchPrefix ?? "feature";
  const branchName = `${prefix}/${ticket.title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")}`;
  return `## Ticket: ${ticket.title}

${ticket.description || "(No additional description provided)"}

## Instructions
- Base branch: \`${ticket.baseBranch}\`
- Implement this ticket completely
- Start by exploring the repository structure with listDirectory
- Read relevant files before making any changes
- Create a new branch named \`${branchName}\`
- After implementing, create a pull request with your changes`;
}
