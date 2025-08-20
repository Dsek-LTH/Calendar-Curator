import { useState, useEffect } from "react";
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
import { PlusIcon, TrashIcon, SaveIcon } from "lucide-react";
import { Matcher, Field, Rule } from "@/lib/api";
import { NewRuleState, ActionState } from "./types";
import {
  buildActionsFromNewRule,
  isAddRuleDisabled,
  ruleToNewRuleState,
  newRuleStateToRule,
} from "./utils";
import { MatcherInput } from "./matcher-input";
import { TransformParamsInput } from "./transform-params-input";

interface RuleFormProps {
  // For editing existing rules
  rule?: Rule;
  onUpdateRule?: (ruleId: string, rule: Rule) => Promise<void>;

  // For creating new rules
  onCreateRule?: (rule: Rule) => Promise<void>;
}

export function RuleForm({ rule, onUpdateRule, onCreateRule }: RuleFormProps) {
  const isEditing = !!rule;

  const [ruleState, setRuleState] = useState<NewRuleState>(() => {
    if (rule) {
      return ruleToNewRuleState(rule);
    }
    return {
      actions: [{ type: "Block" }],
      matchers: [[]],
    };
  });

  // Reset form when switching between create/edit modes
  useEffect(() => {
    if (rule) {
      setRuleState(ruleToNewRuleState(rule));
    } else {
      setRuleState({
        actions: [{ type: "Block" }],
        matchers: [[]],
      });
    }
  }, [rule]);

  const addAction = () => {
    const newAction: ActionState = { type: "Block" };
    setRuleState({
      ...ruleState,
      actions: [...ruleState.actions, newAction],
    });
  };

  const removeAction = (actionIndex: number) => {
    if (ruleState.actions.length <= 1) return; // Keep at least one action

    const newActions = ruleState.actions.filter((_, i) => i !== actionIndex);
    setRuleState({ ...ruleState, actions: newActions });
  };

  const updateAction = (actionIndex: number, updates: Partial<ActionState>) => {
    const newActions = [...ruleState.actions];
    const currentAction = newActions[actionIndex];
    const oldIsDateField = ["StartTime", "EndTime"].includes(
      currentAction.transformField || "",
    );
    const newIsDateField = ["StartTime", "EndTime"].includes(
      updates.transformField || currentAction.transformField || "",
    );

    if (!oldIsDateField && newIsDateField) {
      // If field is being updated to a date field, set transform type to TimeDiff
      updates.transformType = "TimeDiff";
      updates.transformParams = {}; // Reset params when changing field type
    } else if (oldIsDateField && !newIsDateField) {
      // If field is being updated to a non-date field, reset transform type
      updates.transformType = "Substitute"; // Default for non-date fields
      updates.transformParams = {}; // Reset params when changing field type
    } else {
      updates.transformType =
        updates.transformType || currentAction.transformType;
      updates.transformParams = {
        ...currentAction.transformParams,
        ...updates.transformParams,
      };
    }

    newActions[actionIndex] = {
      ...currentAction,
      ...updates,
    };
    setRuleState({ ...ruleState, actions: newActions });
  };

  const addMatcher = (groupIndex: number) => {
    const newMatcher: Matcher = {
      id: Date.now().toString(),
      field: "Title",
      match_type: "Contains",
      value: "",
      negated: false,
    };

    const newMatchers = [...ruleState.matchers];
    newMatchers[groupIndex] = [...newMatchers[groupIndex], newMatcher];
    setRuleState({ ...ruleState, matchers: newMatchers });
  };

  const addMatcherGroup = () => {
    const newMatchers = [...ruleState.matchers, []];
    setRuleState({ ...ruleState, matchers: newMatchers });
  };

  const removeMatcher = (groupIndex: number, matcherIndex: number) => {
    const newMatchers = [...ruleState.matchers];
    newMatchers[groupIndex] = newMatchers[groupIndex].filter(
      (_, i) => i !== matcherIndex,
    );

    if (newMatchers[groupIndex].length === 0 && newMatchers.length > 1) {
      newMatchers.splice(groupIndex, 1);
    }

    setRuleState({ ...ruleState, matchers: newMatchers });
  };

  const updateMatcher = (
    groupIndex: number,
    matcherIndex: number,
    updates: Partial<Matcher>,
  ) => {
    const newMatchers = [...ruleState.matchers];
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
    setRuleState({ ...ruleState, matchers: newMatchers });
  };

  const handleSubmit = async () => {
    if (
      ruleState.matchers.some((group) =>
        group.some((matcher) => !matcher.value?.trim()),
      )
    )
      return;

    // Remove empty matcher groups
    ruleState.matchers = ruleState.matchers.filter((group) => group.length > 0);
    if (ruleState.matchers.length === 0) {
      ruleState.matchers = [[]]; // Ensure at least one group exists
    }

    if (isEditing && rule && onUpdateRule) {
      // Update existing rule
      const updatedRule = newRuleStateToRule(ruleState, rule.id);
      await onUpdateRule(rule.id, updatedRule);
    } else if (onCreateRule) {
      // Create new rule
      const actions = buildActionsFromNewRule(ruleState);
      const apiRule: Rule = {
        actions,
        matchers: ruleState.matchers,
        id: "",
      };
      await onCreateRule(apiRule);

      // Reset form after creation
      setRuleState({
        actions: [{ type: "Block" }],
        matchers: [[]],
      });
    }
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
      <div className="font-bold flex items-center gap-2 text-sm">
        {isEditing ? `Edit Rule` : "New Rule"}
      </div>

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
              onClick={addAction}
              className="h-8"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Action
            </Button>
          </div>

          {ruleState.actions.map((action, actionIndex) => (
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
                {ruleState.actions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAction(actionIndex)}
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

        {ruleState.matchers.map((group, groupIndex) => (
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
                    updateMatcher(groupIndex, matcherIndex, updates)
                  }
                  onRemove={() => removeMatcher(groupIndex, matcherIndex)}
                />
              </div>
            ))}

            <div className="justify-center flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addMatcher(groupIndex)}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add AND Condition
              </Button>
            </div>
          </div>
        ))}

        <div className="justify-center flex items-center">
          <Button variant="outline" size="sm" onClick={addMatcherGroup}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add OR Group
          </Button>
        </div>

        {/* Submit/Cancel Buttons */}
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isAddRuleDisabled(ruleState)}
              className="flex-1"
            >
              <SaveIcon className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isAddRuleDisabled(ruleState)}
            className="w-full"
          >
            Add Rule
          </Button>
        )}
      </div>
    </div>
  );
}
