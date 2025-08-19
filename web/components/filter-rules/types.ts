import { Field, Matcher } from "@/lib/api";

// UI state for a single action in a rule
export interface ActionState {
  type: "Block" | "Allow" | "FieldTransform";
  transformField?: Field;
  transformType?:
    | "Substitute"
    | "Suffix"
    | "Prefix"
    | "RegexSubstitute"
    | "Replace"
    | "Substring"
    | "Remove"
    | "TimeDiff";
  transformParams?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// UI state for creating new rules
export interface NewRuleState {
  actions: ActionState[];
  matchers: Matcher[][];
}
