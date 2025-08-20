import React from "react";
import {
  Field,
  Matcher,
  Action,
  Transform,
  DateTransform,
  StringTransform,
  FieldTransform,
  Rule,
} from "@/lib/api";
import { NewRuleState, ActionState } from "./types";
import { parseTimeFromUTC } from "@/lib/utils";
import { getCalendarSettings } from "@/lib/settings";

// Field and match type labels
export const getFieldLabel = (field: Field): string => {
  const labels = {
    Title: "Title",
    Description: "Description",
    Location: "Location",
    StartTime: "Start Time",
    EndTime: "End Time",
  };
  return labels[field];
};

export const getMatchTypeLabel = (matchType: Matcher["match_type"]): string => {
  const labels = {
    Exact: "equals",
    Contains: "contains",
    StartsWith: "starts with",
    EndsWith: "ends with",
    Regex: "matches regex",
    BetweenDates: "is within date range",
    Weekdays: "occurs on",
    TimeOfDay: "occurs",
  };
  return labels[matchType];
};

export const getActionColor = (actions: Action[]) => {
  if (actions.length === 0) return "outline";

  // For multiple actions, check if any are blocking
  const hasBlock = actions.some((action) => action === "Block");
  if (hasBlock) return "destructive";

  const hasAllow = actions.some((action) => action === "Allow");
  if (hasAllow) return "default";

  return "secondary"; // All transforms
};

// Transform description generator
export const getTransformDescription = (action: Action): string | null => {
  if (typeof action === "object" && "FieldTransform" in action) {
    const fieldTransform = action.FieldTransform;
    const field = getFieldLabel(fieldTransform.field);

    if ("StringTransform" in fieldTransform.transform) {
      const stringTransform = fieldTransform.transform.StringTransform;

      if (typeof stringTransform === "string" && stringTransform === "Remove") {
        return `Remove ${field}`;
      } else if (typeof stringTransform === "object") {
        if ("Substitute" in stringTransform) {
          return `Replace "${stringTransform.Substitute.from}" with "${stringTransform.Substitute.to}" in ${field}`;
        } else if ("Suffix" in stringTransform) {
          return `Add suffix "${stringTransform.Suffix.suffix}" to ${field}`;
        } else if ("Prefix" in stringTransform) {
          return `Add prefix "${stringTransform.Prefix.prefix}" to ${field}`;
        } else if ("RegexSubstitute" in stringTransform) {
          return `Replace pattern /${stringTransform.RegexSubstitute.pattern}/ with "${stringTransform.RegexSubstitute.replacement}" in ${field}`;
        } else if ("Replace" in stringTransform) {
          return `Replace ${field} with "${stringTransform.Replace.with}"`;
        } else if ("Substring" in stringTransform) {
          return `Extract substring (${stringTransform.Substring.start}-${stringTransform.Substring.end ?? "end"}) from ${field}`;
        }
      }
    } else if ("DateTransform" in fieldTransform.transform) {
      const dateTransform = fieldTransform.transform.DateTransform;

      if ("TimeDiff" in dateTransform) {
        const seconds = dateTransform.TimeDiff.seconds;
        const absSeconds = Math.abs(seconds);
        const isNegative = seconds < 0;

        let amount: number;
        let unit: string;

        if (absSeconds >= 86400 && absSeconds % 86400 === 0) {
          amount = absSeconds / 86400;
          unit = amount === 1 ? "day" : "days";
        } else if (absSeconds >= 3600 && absSeconds % 3600 === 0) {
          amount = absSeconds / 3600;
          unit = amount === 1 ? "hour" : "hours";
        } else if (absSeconds >= 60 && absSeconds % 60 === 0) {
          amount = absSeconds / 60;
          unit = amount === 1 ? "minute" : "minutes";
        } else {
          amount = absSeconds;
          unit = amount === 1 ? "second" : "seconds";
        }

        return `${isNegative ? "Subtract" : "Add"} ${amount} ${unit} ${isNegative ? "from" : "to"} ${field}`;
      }
    }
  }
  return null;
};

// Action builder from action state
export const buildActionFromActionState = (
  actionState: ActionState,
): Action => {
  if (actionState.type === "Block" || actionState.type === "Allow") {
    return actionState.type;
  }

  // Build FieldTransform action
  if (!actionState.transformField || !actionState.transformType) {
    return "Block"; // fallback
  }

  let transform: Transform;

  // Handle date transforms
  if (actionState.transformType === "TimeDiff") {
    let multiplier = 60;
    if (actionState.transformParams?.unit === "hours") {
      multiplier = 3600;
    } else if (actionState.transformParams?.unit === "days") {
      multiplier = 86400;
    }
    const dateTransform: DateTransform = {
      TimeDiff: {
        seconds:
          (actionState.transformParams?.isNegative ? -1 : 1) *
          (actionState.transformParams?.value || 0) *
          multiplier,
      },
    };
    transform = {
      DateTransform: dateTransform,
    };
  } else {
    // Handle string transforms
    let stringTransform: StringTransform;

    switch (actionState.transformType) {
      case "Substitute":
        stringTransform = {
          Substitute: {
            from: actionState.transformParams?.from || "",
            to: actionState.transformParams?.to || "",
          },
        };
        break;
      case "Suffix":
        stringTransform = {
          Suffix: {
            suffix: actionState.transformParams?.suffix || "",
          },
        };
        break;
      case "Prefix":
        stringTransform = {
          Prefix: {
            prefix: actionState.transformParams?.prefix || "",
          },
        };
        break;
      case "RegexSubstitute":
        stringTransform = {
          RegexSubstitute: {
            pattern: actionState.transformParams?.pattern || "",
            replacement: actionState.transformParams?.replacement || "",
          },
        };
        break;
      case "Replace":
        stringTransform = {
          Replace: {
            with: actionState.transformParams?.with || "",
          },
        };
        break;
      case "Substring":
        stringTransform = {
          Substring: {
            start: actionState.transformParams?.start || 0,
            end: actionState.transformParams?.end,
          },
        };
        break;
      case "Remove":
        stringTransform = "Remove";
        break;
      default:
        stringTransform = "Remove";
    }

    transform = {
      StringTransform: stringTransform,
    };
  }

  const fieldTransform: FieldTransform = {
    field: actionState.transformField,
    transform: transform,
  };

  return {
    FieldTransform: fieldTransform,
  };
};

// Actions builder from new rule state
export const buildActionsFromNewRule = (newRule: NewRuleState): Action[] => {
  return newRule.actions.map((actionState) =>
    buildActionFromActionState(actionState),
  );
};

// Validation functions
export const isActionStateValid = (actionState: ActionState): boolean => {
  if (actionState.type === "Block" || actionState.type === "Allow") {
    return true;
  }

  if (actionState.type === "FieldTransform") {
    if (!actionState.transformField || !actionState.transformType) return false;

    switch (actionState.transformType) {
      case "Substitute":
        return !!actionState.transformParams?.from?.trim();
      // to is optional
      case "Suffix":
        return !!actionState.transformParams?.suffix?.trim();
      case "Prefix":
        return !!actionState.transformParams?.prefix?.trim();
      case "RegexSubstitute":
        return !!actionState.transformParams?.pattern?.trim();
      // to is optional
      case "Replace":
        return !!actionState.transformParams?.with?.trim();
      case "Substring":
        return actionState.transformParams?.start != null;
      case "Remove":
        return true;
      case "TimeDiff":
        return (
          typeof actionState.transformParams?.value === "number" &&
          !Number.isNaN(actionState.transformParams?.value) &&
          actionState.transformParams?.value !== 0
        );
      default:
        return false;
    }
  }

  return false;
};

export const isAddRuleDisabled = (newRule: NewRuleState): boolean => {
  // Check if there are any actions and all actions are valid
  if (newRule.actions.length === 0) return true;

  const hasInvalidActions = newRule.actions.some(
    (action) => !isActionStateValid(action),
  );
  if (hasInvalidActions) return true;

  // For date fields, allow empty values - no validation needed
  return newRule.matchers.some((group) =>
    group.some((matcher) => {
      // Date fields can have just a comma in them, not allowed
      if (matcher.field === "StartTime" || matcher.field === "EndTime") {
        return !matcher.value || matcher.value.trim() === ",";
      }
      // Other fields require non-empty values
      return !matcher.value?.trim();
    }),
  );
};

// Format matcher value for display
export const formatMatcherValue = (matcher: Matcher): React.JSX.Element => {
  if (!matcher.value) return <span>""</span>;

  switch (matcher.match_type) {
    case "BetweenDates": {
      const dates = matcher.value.split(",");
      if (dates.length === 2) {
        const startDate = new Date(dates[0]).toLocaleDateString();
        const endDate = new Date(dates[1]).toLocaleDateString();
        return (
          <span>
            <span className="text-muted-foreground"> between </span>
            <span className="font-medium">{startDate}</span>
            <span className="text-muted-foreground"> and </span>
            <span className="font-medium">{endDate}</span>
          </span>
        );
      }
      return <span>"{matcher.value}"</span>;
    }

    case "Weekdays": {
      const weekdays = matcher.value.split(",").map((day) => day.trim());
      const weekdayNames = weekdays.map((day) => {
        // Only accept abbreviated names (Mon, Tue, etc.)
        const pluralNames: { [key: string]: string } = {
          Mon: "Mondays",
          Tue: "Tuesdays",
          Wed: "Wednesdays",
          Thu: "Thursdays",
          Fri: "Fridays",
          Sat: "Saturdays",
          Sun: "Sundays",
        };
        return pluralNames[day] || day;
      });

      return (
        <span>
          {weekdayNames.map((name, index) => (
            <span key={index}>
              {index > 0 && (
                <span className="text-muted-foreground">
                  {index === weekdayNames.length - 1 ? " and " : ", "}
                </span>
              )}
              <span className="font-medium">{name}</span>
            </span>
          ))}
        </span>
      );
    }

    case "TimeOfDay": {
      const times = matcher.value.split(",");
      if (times.length === 2) {
        const startTime = times[0].trim();
        const endTime = times[1].trim();

        const formatTime = (time: string) => {
          return parseTimeFromUTC(
            time,
            getCalendarSettings().timeFormat === "12h",
          );
        };

        // Handle partial ranges
        if (!startTime && endTime) {
          return (
            <span>
              <span className="text-muted-foreground">before </span>
              <span className="font-medium">{formatTime(endTime)}</span>
            </span>
          );
        } else if (startTime && !endTime) {
          return (
            <span>
              <span className="text-muted-foreground">after </span>
              <span className="font-medium">{formatTime(startTime)}</span>
            </span>
          );
        } else if (startTime && endTime) {
          return (
            <span>
              <span className="text-muted-foreground">between </span>
              <span className="font-medium">{formatTime(startTime)}</span>
              <span className="text-muted-foreground"> and </span>
              <span className="font-medium">{formatTime(endTime)}</span>
            </span>
          );
        }
      }
      return <span>"{matcher.value}"</span>;
    }

    default:
      return <span>"{matcher.value}"</span>;
  }
};

// Convert Rule to NewRuleState for editing
export const ruleToNewRuleState = (rule: Rule): NewRuleState => {
  const actions: ActionState[] = rule.actions.map((action) => {
    if (typeof action === "string") {
      return { type: action };
    }

    // Handle FieldTransform action
    const fieldTransform = action.FieldTransform;
    const actionState: ActionState = {
      type: "FieldTransform",
      transformField: fieldTransform.field,
    };

    if ("StringTransform" in fieldTransform.transform) {
      const stringTransform = fieldTransform.transform.StringTransform;

      if (typeof stringTransform === "string" && stringTransform === "Remove") {
        actionState.transformType = "Remove";
      } else if (typeof stringTransform === "object") {
        if ("Substitute" in stringTransform) {
          actionState.transformType = "Substitute";
          actionState.transformParams = {
            from: stringTransform.Substitute.from,
            to: stringTransform.Substitute.to,
          };
        } else if ("Suffix" in stringTransform) {
          actionState.transformType = "Suffix";
          actionState.transformParams = {
            suffix: stringTransform.Suffix.suffix,
          };
        } else if ("Prefix" in stringTransform) {
          actionState.transformType = "Prefix";
          actionState.transformParams = {
            prefix: stringTransform.Prefix.prefix,
          };
        } else if ("RegexSubstitute" in stringTransform) {
          actionState.transformType = "RegexSubstitute";
          actionState.transformParams = {
            pattern: stringTransform.RegexSubstitute.pattern,
            replacement: stringTransform.RegexSubstitute.replacement,
          };
        } else if ("Replace" in stringTransform) {
          actionState.transformType = "Replace";
          actionState.transformParams = {
            with: stringTransform.Replace.with,
          };
        } else if ("Substring" in stringTransform) {
          actionState.transformType = "Substring";
          actionState.transformParams = {
            start: stringTransform.Substring.start,
            end: stringTransform.Substring.end,
          };
        }
      }
    } else if ("DateTransform" in fieldTransform.transform) {
      const dateTransform = fieldTransform.transform.DateTransform;

      if ("TimeDiff" in dateTransform) {
        actionState.transformType = "TimeDiff";
        const seconds = dateTransform.TimeDiff.seconds;
        const absSeconds = Math.abs(seconds);
        const isNegative = seconds < 0;

        let value: number;
        let unit: string;

        if (absSeconds >= 86400 && absSeconds % 86400 === 0) {
          value = absSeconds / 86400;
          unit = "days";
        } else if (absSeconds >= 3600 && absSeconds % 3600 === 0) {
          value = absSeconds / 3600;
          unit = "hours";
        } else {
          value = absSeconds / 60;
          unit = "minutes";
        }

        actionState.transformParams = {
          value,
          unit,
          isNegative,
        };
      }
    }

    return actionState;
  });

  return {
    actions,
    matchers: rule.matchers,
  };
};

// Convert NewRuleState back to Rule for updating
export const newRuleStateToRule = (
  newRuleState: NewRuleState,
  ruleId: string,
): Rule => {
  return {
    id: ruleId,
    actions: buildActionsFromNewRule(newRuleState),
    matchers: newRuleState.matchers,
  };
};
