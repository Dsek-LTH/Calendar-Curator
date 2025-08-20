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
import { PlusIcon, TrashIcon } from "lucide-react";
import { Matcher, Field, Rule } from "@/lib/api";
import { NewRuleState, ActionState } from "./types";
import { buildActionsFromNewRule, isAddRuleDisabled } from "./utils";
import { MatcherInput } from "./matcher-input";
import { TransformParamsInput } from "./transform-params-input";

interface NewRuleFormProps {
  onCreateRule: (rule: Rule) => Promise<void>;
}

export function NewRuleForm({ onCreateRule }: NewRuleFormProps) {
  const [newRule, setNewRule] = useState<NewRuleState>({
    actions: [{ type: "Block" }],
    matchers: [[]],
  });

  const addActionToNewRule = () => {
    const newAction: ActionState = { type: "Block" };
    setNewRule({
      ...newRule,
      actions: [...newRule.actions, newAction],
    });
  };

  const removeActionFromNewRule = (actionIndex: number) => {
    if (newRule.actions.length <= 1) return; // Keep at least one action

    const newActions = newRule.actions.filter((_, i) => i !== actionIndex);
    setNewRule({ ...newRule, actions: newActions });
  };

  const updateAction = (actionIndex: number, updates: Partial<ActionState>) => {
    const newActions = [...newRule.actions];
    const currentAction = newActions[actionIndex];

    // If field is being updated to a date field, set transform type to TimeDiff
    if (
      updates.transformField &&
      (updates.transformField === "StartTime" ||
        updates.transformField === "EndTime")
    ) {
      updates.transformType = "TimeDiff";
    }

    newActions[actionIndex] = {
      ...currentAction,
      ...updates,
    };
    setNewRule({ ...newRule, actions: newActions });
  };

  const addMatcherToNewRule = (groupIndex: number) => {
    const newMatcher: Matcher = {
      id: Date.now().toString(),
      field: "Title",
      match_type: "Contains",
      value: "",
      negated: false,
    };

    const newMatchers = [...newRule.matchers];
    newMatchers[groupIndex] = [...newMatchers[groupIndex], newMatcher];
    setNewRule({ ...newRule, matchers: newMatchers });
  };

  const addMatcherGroupToNewRule = () => {
    const newMatchers = [...newRule.matchers, []];
    setNewRule({ ...newRule, matchers: newMatchers });
  };

  const removeMatcherFromNewRule = (
    groupIndex: number,
    matcherIndex: number,
  ) => {
    const newMatchers = [...newRule.matchers];
    newMatchers[groupIndex] = newMatchers[groupIndex].filter(
      (_, i) => i !== matcherIndex,
    );

    if (newMatchers[groupIndex].length === 0 && newMatchers.length > 1) {
      newMatchers.splice(groupIndex, 1);
    }

    setNewRule({ ...newRule, matchers: newMatchers });
  };

  const updateNewRuleMatcher = (
    groupIndex: number,
    matcherIndex: number,
    updates: Partial<Matcher>,
  ) => {
    const newMatchers = [...newRule.matchers];
    const currentMatcher = newMatchers[groupIndex][matcherIndex];
    const oldIsDateField = ["StartTime", "EndTime"].includes(
      currentMatcher.field,
    );
    const newIsDateField = ["StartTime", "EndTime"].includes(
      updates.field || currentMatcher.field,
    );

    // If field is being updated to a date field, set match_type to BetweenDates
    if (!oldIsDateField && newIsDateField) {
      updates.match_type = "BetweenDates";
      updates.value = ""; // Reset value when changing field type
    }

    // If field is being updated to a non-date field, reset match_type
    if (oldIsDateField && !newIsDateField) {
      updates.match_type = "Contains"; // Default for non-date fields
      updates.value = ""; // Reset value when changing field type
    }

    newMatchers[groupIndex][matcherIndex] = {
      ...currentMatcher,
      ...updates,
    };
    setNewRule({ ...newRule, matchers: newMatchers });
  };

  const handleAddRule = async () => {
    if (
      newRule.matchers.some((group) =>
        group.some((matcher) => !matcher.value?.trim()),
      )
    )
      return;

    // Remove empty matcher groups
    newRule.matchers = newRule.matchers.filter((group) => group.length > 0);
    if (newRule.matchers.length === 0) {
      newRule.matchers = [[]]; // Ensure at least one group exists
    }

    const actions = buildActionsFromNewRule(newRule);
    const apiRule: Rule = {
      actions,
      matchers: newRule.matchers,
      id: "",
    };

    await onCreateRule(apiRule);

    setNewRule({
      actions: [{ type: "Block" }],
      matchers: [[]],
    });
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
      <div className="font-bold flex items-center gap-2 text-sm">New Rule</div>

      <div className="space-y-3">
        {/* Actions Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Actions (executed sequentially):
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addActionToNewRule}
              className="h-8"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Action
            </Button>
          </div>

          {newRule.actions.map((action, actionIndex) => (
            <div
              key={actionIndex}
              className="p-3 border rounded-lg bg-background space-y-3"
            >
              <div className="flex items-center justify-between">
                {/* Action Type Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Action Type:</Label>
                    <Select
                      value={action.type}
                      onValueChange={(value) =>
                        updateAction(actionIndex, {
                          type: value as "Block" | "Allow" | "FieldTransform",
                          transformField: undefined,
                          transformType: undefined,
                          transformParams: undefined,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Block">Block Event</SelectItem>
                        <SelectItem value="Allow">Allow Event</SelectItem>
                        <SelectItem value="FieldTransform">
                          Transform Field
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Transform Field Selection */}
                  {action.type === "FieldTransform" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Transform Field:
                      </Label>
                      <Select
                        value={action.transformField || ""}
                        onValueChange={(value) =>
                          updateAction(actionIndex, {
                            transformField: value as Field,
                            transformType: undefined,
                            transformParams: undefined,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Title">Title</SelectItem>
                          <SelectItem value="Description">
                            Description
                          </SelectItem>
                          <SelectItem value="Location">Location</SelectItem>
                          <SelectItem value="StartTime">Start Time</SelectItem>
                          <SelectItem value="EndTime">End Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                {newRule.actions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeActionFromNewRule(actionIndex)}
                    className="h-8 w-8 p-0"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Transform Type Selection */}
              {action.type === "FieldTransform" && action.transformField && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Transform Type:</Label>
                  <Select
                    value={action.transformType || ""}
                    onValueChange={(value) =>
                      updateAction(actionIndex, {
                        transformType: value as ActionState["transformType"],
                        transformParams: {},
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transform" />
                    </SelectTrigger>
                    <SelectContent>
                      {action.transformField === "StartTime" ||
                      action.transformField === "EndTime" ? (
                        <SelectItem value="TimeDiff">
                          Time Difference
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value="Substitute">
                            Substitute Text
                          </SelectItem>
                          <SelectItem value="Suffix">Add Suffix</SelectItem>
                          <SelectItem value="Prefix">Add Prefix</SelectItem>
                          <SelectItem value="RegexSubstitute">
                            Regex Substitute
                          </SelectItem>
                          <SelectItem value="Replace">
                            Replace Entire Field
                          </SelectItem>
                          <SelectItem value="Substring">
                            Extract Substring
                          </SelectItem>
                          <SelectItem value="Remove">Remove Field</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Transform Parameters */}
              <TransformParamsInput
                action={action}
                onUpdate={(updates) => updateAction(actionIndex, updates)}
              />
            </div>
          ))}
        </div>

        {/* Conditions */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Conditions (optional):</Label>
        </div>

        {newRule.matchers.map((group, groupIndex) => (
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
