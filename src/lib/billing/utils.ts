import { format, differenceInDays } from "date-fns";

// Format currency for display
export function formatCurrencyDisplay(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Format date for display
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM dd, yyyy");
}

// Calculate days until next billing
export function getDaysUntilBilling(currentPeriodEnd: Date | string): number {
  const endDate =
    typeof currentPeriodEnd === "string"
      ? new Date(currentPeriodEnd)
      : currentPeriodEnd;
  return Math.max(0, differenceInDays(endDate, new Date()));
}

// Format trial status
export function formatTrialStatus(trialEnd: Date | string | null): string {
  if (!trialEnd) return "No trial";

  const trialEndDate =
    typeof trialEnd === "string" ? new Date(trialEnd) : trialEnd;
  const daysLeft = differenceInDays(trialEndDate, new Date());

  if (daysLeft <= 0) return "Trial expired";
  if (daysLeft === 1) return "1 day left";
  return `${daysLeft} days left`;
}

// Get plan color based on status
export function getPlanStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "text-green-600 bg-green-100";
    case "trialing":
      return "text-blue-600 bg-blue-100";
    case "past_due":
      return "text-yellow-600 bg-yellow-100";
    case "canceled":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

// Calculate usage percentage
export function calculateUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

// Get usage status color
export function getUsageStatusColor(percentage: number): string {
  if (percentage >= 90) return "text-red-600";
  if (percentage >= 75) return "text-yellow-600";
  return "text-green-600";
}

// Format SMS count with K/M suffixes
export function formatSMSCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
