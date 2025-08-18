"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FilterIcon,
  GripVerticalIcon,
  PlusIcon,
  ScaleIcon,
  TrashIcon,
} from "lucide-react";
import {
  Action,
  Field,
  FieldTransform,
  Filter,
  Matcher,
  Rule,
  StringTransform,
  Transform,
} from "@/lib/api";

interface RulesPanelProps {
  rules: Rule[];
  onRulesChangeAction: (rules: Rule[]) => void;
}

// UI state for creating new rules
interface NewRuleState {
  action: "Block" | "Allow" | "FieldTransform";
  filter: Filter;
  transformField?: Field;
  transformType?: keyof StringTransform;
  transformParams?: any;
}

export function RulesPanel({ rules, onRulesChangeAction }: RulesPanelProps) {
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
    newMatchers[groupIndex][matcherIndex] = {
      ...newMatchers[groupIndex][matcherIndex],
      ...updates,
    };
    setNewRule({ ...newRule, filter: { matchers: newMatchers } });
  };

  const buildActionFromNewRule = (): Action => {
    if (newRule.action === "Block" || newRule.action === "Allow") {
      return newRule.action;
    }

    // Build FieldTransform action
    if (!newRule.transformField || !newRule.transformType) {
      return "Block"; // fallback
    }

    let stringTransform: StringTransform;

    switch (newRule.transformType) {
      case "Substitute":
        stringTransform = {
          Substitute: {
            from: newRule.transformParams?.from || "",
            to: newRule.transformParams?.to || "",
          },
        };
        break;
      case "Suffix":
        stringTransform = {
          Suffix: {
            suffix: newRule.transformParams?.suffix || "",
          },
        };
        break;
      case "Prefix":
        stringTransform = {
          Prefix: {
            prefix: newRule.transformParams?.prefix || "",
          },
        };
        break;
      case "RegexSubstitute":
        stringTransform = {
          RegexSubstitute: {
            pattern: newRule.transformParams?.pattern || "",
            replacement: newRule.transformParams?.replacement || "",
          },
        };
        break;
      case "Replace":
        stringTransform = {
          Replace: {
            with: newRule.transformParams?.with || "",
          },
        };
        break;
      case "Substring":
        stringTransform = {
          Substring: {
            start: newRule.transformParams?.start || 0,
            end: newRule.transformParams?.end || 0,
          },
        };
        break;
      case "Remove":
        stringTransform = "Remove";
        break;
      default:
        stringTransform = "Remove";
    }

    const transform: Transform = {
      StringTransform: stringTransform,
    };

    const fieldTransform: FieldTransform = {
      field: newRule.transformField,
      transform: transform,
    };

    return {
      FieldTransform: fieldTransform,
    };
  };

  const addRule = () => {
    if (
      newRule.filter.matchers.some((group) =>
        group.some((matcher) => !matcher.value?.trim()),
      )
    )
      return;

    const action = buildActionFromNewRule();
    const apiRule: Rule = {
      action,
      filter: newRule.filter,
    };

    onRulesChangeAction([...rules, apiRule]);

    setNewRule({
      action: "Block",
      filter: {
        matchers: [[]],
      },
    });
  };

  const isAddRuleDisabled = () => {
    if (
      newRule.filter.matchers.some((group) =>
        group.some((matcher) => !matcher.value?.trim()),
      )
    )
      return true;

    if (newRule.action === "FieldTransform") {
      if (!newRule.transformField || !newRule.transformType) return true;

      switch (newRule.transformType) {
        case "Substitute":
          return (
            !newRule.transformParams?.from?.trim() ||
            !newRule.transformParams?.to?.trim()
          );
        case "Suffix":
          return !newRule.transformParams?.suffix?.trim();
        case "Prefix":
          return !newRule.transformParams?.prefix?.trim();
        case "RegexSubstitute":
          return (
            !newRule.transformParams?.pattern?.trim() ||
            !newRule.transformParams?.replacement?.trim()
          );
        case "Replace":
          return !newRule.transformParams?.with?.trim();
        case "Substring":
          return (
            newRule.transformParams?.start == null ||
            newRule.transformParams?.end == null
          );
        case "Remove":
          return false;
        default:
          return true;
      }
    }

    return false;
  };

  const getFieldLabel = (field: Field) => {
    const labels = {
      Summary: "Title",
      Description: "Description",
      Location: "Location",
      StartDate: "Start Date",
      EndDate: "End Date",
    };
    return labels[field];
  };

  const getMatchTypeLabel = (matchType: Matcher["match_type"]) => {
    const labels = {
      Exact: "equals",
      Contains: "contains",
      StartsWith: "starts with",
      EndsWith: "ends with",
      Regex: "matches regex",
    };
    return labels[matchType];
  };

  const getActionColor = (action: Rule["action"]) => {
    if (typeof action === "string") {
      switch (action) {
        case "Block":
          return "destructive";
        case "Allow":
          return "default";
        default:
          return "outline";
      }
    } else {
      return "secondary";
    }
  };

  const getTransformDescription = (action: Action): string | null => {
    if (typeof action === "object" && "FieldTransform" in action) {
      const fieldTransform = action.FieldTransform;
      const field = getFieldLabel(fieldTransform.field);

      if ("StringTransform" in fieldTransform.transform) {
        const stringTransform = fieldTransform.transform.StringTransform;

        if (
          typeof stringTransform === "string" &&
          stringTransform === "Remove"
        ) {
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
            return `Extract substring (${stringTransform.Substring.start}-${stringTransform.Substring.end}) from ${field}`;
          }
        }
      }
    }
    return null;
  };

  const renderRuleDescription = (rule: Rule) => {
    const transformDescription = getTransformDescription(rule.action);

    return (
      <div className="text-sm">
        {transformDescription && (
          <div className="mb-1">
            <span className="font-medium text-blue-600">
              {transformDescription}
            </span>
          </div>
        )}

        {rule.filter.matchers.length === 0 ||
        rule.filter.matchers.every((group) => group.length === 0) ? (
          <span className="text-muted-foreground italic">
            No conditions (applies to all events)
          </span>
        ) : (
          <div>
            {transformDescription && (
              <span className="text-muted-foreground">when </span>
            )}
            {rule.filter.matchers.map((group, groupIndex) =>
              group.map((matcher, matcherIndex) => (
                <span key={`${groupIndex}-${matcherIndex}`}>
                  {groupIndex > 0 && matcherIndex === 0 && (
                    <Badge variant="outline" className="mx-1 text-xs">
                      OR
                    </Badge>
                  )}
                  {matcherIndex > 0 && (
                    <Badge variant="outline" className="mx-1 text-xs">
                      AND
                    </Badge>
                  )}
                  {matcher.negated && (
                    <span className="text-red-500 font-medium">NOT </span>
                  )}
                  <span className="font-medium">
                    {getFieldLabel(matcher.field)}
                  </span>
                  <span className="text-muted-foreground mx-1">
                    {getMatchTypeLabel(matcher.match_type)}
                  </span>
                  <span className="font-medium">"{matcher.value}"</span>
                </span>
              )),
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTransformParams = () => {
    if (newRule.action !== "FieldTransform" || !newRule.transformType)
      return null;

    switch (newRule.transformType) {
      case "Substitute":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="From (text to replace)"
              value={newRule.transformParams?.from || ""}
              onChange={(e) =>
                setNewRule({
                  ...newRule,
                  transformParams: {
                    ...newRule.transformParams,
                    from: e.target.value,
                  },
                })
              }
            />
            <Input
              placeholder="To (replacement text)"
              value={newRule.transformParams?.to || ""}
              onChange={(e) =>
                setNewRule({
                  ...newRule,
                  transformParams: {
                    ...newRule.transformParams,
                    to: e.target.value,
                  },
                })
              }
            />
          </div>
        );
      case "Suffix":
        return (
          <Input
            placeholder="Suffix to add"
            value={newRule.transformParams?.suffix || ""}
            onChange={(e) =>
              setNewRule({
                ...newRule,
                transformParams: {
                  ...newRule.transformParams,
                  suffix: e.target.value,
                },
              })
            }
          />
        );
      case "Prefix":
        return (
          <Input
            placeholder="Prefix to add"
            value={newRule.transformParams?.prefix || ""}
            onChange={(e) =>
              setNewRule({
                ...newRule,
                transformParams: {
                  ...newRule.transformParams,
                  prefix: e.target.value,
                },
              })
            }
          />
        );
      case "RegexSubstitute":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Regex pattern"
              value={newRule.transformParams?.pattern || ""}
              onChange={(e) =>
                setNewRule({
                  ...newRule,
                  transformParams: {
                    ...newRule.transformParams,
                    pattern: e.target.value,
                  },
                })
              }
            />
            <Input
              placeholder="Replacement text"
              value={newRule.transformParams?.replacement || ""}
              onChange={(e) =>
                setNewRule({
                  ...newRule,
                  transformParams: {
                    ...newRule.transformParams,
                    replacement: e.target.value,
                  },
                })
              }
            />
          </div>
        );
      case "Replace":
        return (
          <Input
            placeholder="Replace entire field with"
            value={newRule.transformParams?.with || ""}
            onChange={(e) =>
              setNewRule({
                ...newRule,
                transformParams: {
                  ...newRule.transformParams,
                  with: e.target.value,
                },
              })
            }
          />
        );
      case "Substring":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Start position"
              value={newRule.transformParams?.start || ""}
              onChange={(e) =>
                setNewRule({
                  ...newRule,
                  transformParams: {
                    ...newRule.transformParams,
                    start: parseInt(e.target.value) || 0,
                  },
                })
              }
            />
            <Input
              type="number"
              placeholder="End position"
              value={newRule.transformParams?.end || ""}
              onChange={(e) =>
                setNewRule({
                  ...newRule,
                  transformParams: {
                    ...newRule.transformParams,
                    end: parseInt(e.target.value) || 0,
                  },
                })
              }
            />
          </div>
        );
      case "Remove":
        return (
          <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
            This will remove the entire content of the selected field.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScaleIcon className="h-5 w-5" />
          Filter Rules ({rules.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Rule */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center gap-2 text-sm font-medium">
            <PlusIcon className="h-4 w-4" />
            Add New Rule
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">
                Conditions (optional):
              </Label>
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
                  <div
                    key={matcher.id}
                    className="space-y-2 p-2 border rounded-lg bg-card"
                  >
                    {matcherIndex > 0 && (
                      <div className="flex justify-center">
                        <Badge variant="outline" className="text-xs">
                          AND
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={matcher.negated}
                        onCheckedChange={(checked) =>
                          updateNewRuleMatcher(groupIndex, matcherIndex, {
                            negated: checked as boolean,
                          })
                        }
                      />
                      <Label className="text-sm">NOT</Label>

                      <Select
                        value={matcher.field}
                        onValueChange={(value) =>
                          updateNewRuleMatcher(groupIndex, matcherIndex, {
                            field: value as Field,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Summary">Title</SelectItem>
                          <SelectItem value="Description">
                            Description
                          </SelectItem>
                          <SelectItem value="Location">Location</SelectItem>
                          <SelectItem value="StartDate">Start Date</SelectItem>
                          <SelectItem value="EndDate">End Date</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="grid grid-cols-2 gap-2 flex-1">
                        <Select
                          value={matcher.match_type}
                          onValueChange={(value) =>
                            updateNewRuleMatcher(groupIndex, matcherIndex, {
                              match_type: value as Matcher["match_type"],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Contains">contains</SelectItem>
                            <SelectItem value="Exact">equals</SelectItem>
                            <SelectItem value="StartsWith">
                              starts with
                            </SelectItem>
                            <SelectItem value="EndsWith">ends with</SelectItem>
                            <SelectItem value="Regex">matches regex</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Enter value..."
                        value={matcher.value}
                        onChange={(e) =>
                          updateNewRuleMatcher(groupIndex, matcherIndex, {
                            value: e.target.value,
                          })
                        }
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeMatcherFromNewRule(groupIndex, matcherIndex)
                        }
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMatcherToNewRule(groupIndex)}
                  className="w-full bg-transparent"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add AND Condition
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addMatcherGroupToNewRule}
              className="w-full bg-transparent"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add OR Group
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={newRule.action}
              onValueChange={(value: "Block" | "Allow" | "FieldTransform") => {
                setNewRule({
                  ...newRule,
                  action: value,
                  transformField:
                    value === "FieldTransform" ? "Summary" : undefined,
                  transformType:
                    value === "FieldTransform"
                      ? ("Substitute" as keyof StringTransform)
                      : undefined,
                  transformParams: undefined,
                });
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Block">Block Event</SelectItem>
                <SelectItem value="Allow">Allow Event</SelectItem>
                <SelectItem value="FieldTransform">Transform Field</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={addRule} disabled={isAddRuleDisabled()}>
              Add Rule
            </Button>
          </div>

          {newRule.action === "FieldTransform" && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Field Transform Settings
              </Label>

              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={newRule.transformField}
                  onValueChange={(value) =>
                    setNewRule({
                      ...newRule,
                      transformField: value as Field,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Field to transform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Summary">Title</SelectItem>
                    <SelectItem value="Description">Description</SelectItem>
                    <SelectItem value="Location">Location</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={newRule.transformType}
                  onValueChange={(value) =>
                    setNewRule({
                      ...newRule,
                      transformType: value as keyof StringTransform,
                      transformParams: undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Transform type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Substitute">Find & Replace</SelectItem>
                    <SelectItem value="RegexSubstitute">
                      Regex Replace
                    </SelectItem>
                    <SelectItem value="Prefix">Add Prefix</SelectItem>
                    <SelectItem value="Suffix">Add Suffix</SelectItem>
                    <SelectItem value="Replace">
                      Replace Entire Field
                    </SelectItem>
                    <SelectItem value="Substring">Extract Substring</SelectItem>
                    <SelectItem value="Remove">Remove Field</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderTransformParams()}
            </div>
          )}
        </div>

        {/* Existing Rules */}
        {rules.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FilterIcon className="h-4 w-4" />
                Active Rules
              </div>

              {rules.map((rule, index) => {
                return (
                  <div key={index}>
                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-card">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (index === 0) return;
                            const newRules = [...rules];
                            const temp = newRules[index];
                            newRules[index] = newRules[index - 1];
                            newRules[index - 1] = temp;
                            onRulesChangeAction(newRules);
                          }}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronUpIcon className="h-3 w-3" />
                        </Button>
                        <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (index === rules.length - 1) return;
                            const newRules = [...rules];
                            const temp = newRules[index];
                            newRules[index] = newRules[index + 1];
                            newRules[index + 1] = temp;
                            onRulesChangeAction(newRules);
                          }}
                          disabled={index === rules.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronDownIcon className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1 space-y-1">
                        {renderRuleDescription(rule)}
                        <Badge
                          variant={getActionColor(rule.action)}
                          className="text-xs"
                        >
                          {rule.action === "Block" && "Block"}
                          {rule.action === "Allow" && "Allow"}
                          {typeof rule.action === "object" && "Field Transform"}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onRulesChangeAction(
                              rules.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {rules.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No filter rules created yet. Add rules above to automatically filter
            events.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
