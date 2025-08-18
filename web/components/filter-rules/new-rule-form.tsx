import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon } from "lucide-react";
import { Matcher, Field, Rule } from "@/lib/api";
import { NewRuleState } from "./types";
import { buildActionFromNewRule, isAddRuleDisabled } from "./utils";
import { MatcherInput } from "./matcher-input";
import { TransformParamsInput } from "./transform-params-input";

interface NewRuleFormProps {
  onCreateRule: (rule: Rule) => Promise<void>;
}

export function NewRuleForm({ onCreateRule }: NewRuleFormProps) {
  const [newRule, setNewRule] = useState<NewRuleState>({
    action: "Block",
    filter: {
      matchers: [[]],
    },
  });

  const addMatcherToNewRule = (groupIndex: number) => {
    const newMatcher: Matcher = {
      id: Date.now().toString(),
      field: "Summary",
      match_type: "Contains",
      value: "",
      negated: false,
    };

    const newMatchers = [...newRule.filter.matchers];
    newMatchers[groupIndex] = [...newMatchers[groupIndex], newMatcher];
    setNewRule({ ...newRule, filter: { matchers: newMatchers } });
  };

  const addMatcherGroupToNewRule = () => {
    const newMatchers = [...newRule.filter.matchers, []];
    setNewRule({ ...newRule, filter: { matchers: newMatchers } });
  };

  const removeMatcherFromNewRule = (
    groupIndex: number,
    matcherIndex: number,
  ) => {
    const newMatchers = [...newRule.filter.matchers];
    newMatchers[groupIndex] = newMatchers[groupIndex].filter(
      (_, i) => i !== matcherIndex,
    );

    if (newMatchers[groupIndex].length === 0 && newMatchers.length > 1) {
      newMatchers.splice(groupIndex, 1);
    }

    setNewRule({ ...newRule, filter: { matchers: newMatchers } });
  };

  const updateNewRuleMatcher = (
    groupIndex: number,
    matcherIndex: number,
    updates: Partial<Matcher>,
  ) => {
    const newMatchers = [...newRule.filter.matchers];
    const currentMatcher = newMatchers[groupIndex][matcherIndex];

    // If field is being updated to a date field, set match_type to BetweenDates
    if (
      updates.field &&
      (updates.field === "StartDate" || updates.field === "EndDate")
    ) {
      updates.match_type = "BetweenDates";
    }

    newMatchers[groupIndex][matcherIndex] = {
      ...currentMatcher,
      ...updates,
    };
    setNewRule({ ...newRule, filter: { matchers: newMatchers } });
  };

  const handleAddRule = async () => {
    if (
      newRule.filter.matchers.some((group) =>
        group.some((matcher) => !matcher.value?.trim()),
      )
    )
      return;

    // Remove empty matcher groups
    newRule.filter.matchers = newRule.filter.matchers.filter(
      (group) => group.length > 0,
    );
    if (newRule.filter.matchers.length === 0) {
      newRule.filter.matchers = [[]]; // Ensure at least one group exists
    }

    const action = buildActionFromNewRule(newRule);
    const apiRule: Rule = {
      action,
      filter: newRule.filter,
      id: "",
    };

    await onCreateRule(apiRule);

    setNewRule({
      action: "Block",
      filter: {
        matchers: [[]],
      },
    });
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
      <div className="flex items-center gap-2 text-sm font-medium">
        <PlusIcon className="h-4 w-4" />
        Add New Rule
      </div>

      <div className="space-y-3">
        {/* Action Selection */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Action:</Label>
            <Select
              value={newRule.action}
              onValueChange={(value) =>
                setNewRule({
                  ...newRule,
                  action: value as "Block" | "Allow" | "FieldTransform",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Block">Block Event</SelectItem>
                <SelectItem value="Allow">Allow Event</SelectItem>
                <SelectItem value="FieldTransform">Transform Field</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transform Field Selection */}
          {newRule.action === "FieldTransform" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Transform Field:</Label>
              <Select
                value={newRule.transformField || ""}
                onValueChange={(value) =>
                  setNewRule({
                    ...newRule,
                    transformField: value as Field,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Summary">Title</SelectItem>
                  <SelectItem value="Description">Description</SelectItem>
                  <SelectItem value="Location">Location</SelectItem>
                  <SelectItem value="StartDate">Start Date</SelectItem>
                  <SelectItem value="EndDate">End Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Transform Type Selection */}
        {newRule.action === "FieldTransform" && newRule.transformField && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Transform Type:</Label>
            <Select
              value={newRule.transformType || ""}
              onValueChange={(value) =>
                setNewRule({
                  ...newRule,
                  transformType: value as NewRuleState["transformType"],
                  transformParams: {},
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transform" />
              </SelectTrigger>
              <SelectContent>
                {newRule.transformField === "StartDate" ||
                newRule.transformField === "EndDate" ? (
                  <SelectItem value="TimeDiff">Time Difference</SelectItem>
                ) : (
                  <>
                    <SelectItem value="Substitute">Substitute Text</SelectItem>
                    <SelectItem value="Suffix">Add Suffix</SelectItem>
                    <SelectItem value="Prefix">Add Prefix</SelectItem>
                    <SelectItem value="RegexSubstitute">
                      Regex Substitute
                    </SelectItem>
                    <SelectItem value="Replace">
                      Replace Entire Field
                    </SelectItem>
                    <SelectItem value="Substring">Extract Substring</SelectItem>
                    <SelectItem value="Remove">Remove Field</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Transform Parameters */}
        <TransformParamsInput
          newRule={newRule}
          onUpdate={(updates) => setNewRule({ ...newRule, ...updates })}
        />

        {/* Conditions */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Conditions (optional):</Label>
        </div>

        {newRule.filter.matchers.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2">
            {groupIndex > 0 && (
              <div className="flex justify-center">
                <Badge variant="outline" className="text-xs">
                  OR
                </Badge>
              </div>
            )}

            {group.map((matcher, matcherIndex) => (
              <div key={matcher.id}>
                {matcherIndex > 0 && (
                  <div className="flex justify-center mb-2">
                    <Badge variant="outline" className="text-xs">
                      AND
                    </Badge>
                  </div>
                )}
                <MatcherInput
                  matcher={matcher}
                  onUpdate={(updates) =>
                    updateNewRuleMatcher(groupIndex, matcherIndex, updates)
                  }
                  onRemove={() =>
                    removeMatcherFromNewRule(groupIndex, matcherIndex)
                  }
                />
              </div>
            ))}

            <div className="justify-center flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addMatcherToNewRule(groupIndex)}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add AND Condition
              </Button>
            </div>
          </div>
        ))}

        <div className="justify-center flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={addMatcherGroupToNewRule}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add OR Group
          </Button>
        </div>

        <Button
          onClick={handleAddRule}
          disabled={isAddRuleDisabled(newRule)}
          className="w-full"
        >
          Add Rule
        </Button>
      </div>
    </div>
  );
}
