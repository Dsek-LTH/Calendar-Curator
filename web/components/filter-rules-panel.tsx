"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  FilterIcon,
  GripVerticalIcon,
  PlusIcon,
  ScaleIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";

export interface FilterCondition {
  id: string;
  field: "title" | "description" | "location" | "organizer";
  operator:
    | "contains"
    | "equals"
    | "starts_with"
    | "ends_with"
    | "not_contains";
  value: string;
}

export interface FilterRule {
  id: string;
  conditions: FilterCondition[];
  conditionsOperator: "AND" | "OR";
  action: "block" | "highlight" | "hide" | "substitute";
  negated: boolean;
  // For substitute action
  substituteFrom?: string;
  substituteTo?: string;
  substituteField?: "title" | "description" | "location" | "organizer";
}

interface FilterRulesPanelProps {
  rules: FilterRule[];
  onRulesChange: (rules: FilterRule[]) => void;
}

export function FilterRulesPanel({
                                   rules,
                                   onRulesChange,
                                 }: FilterRulesPanelProps) {
  const [newRule, setNewRule] = useState<Partial<FilterRule>>({
    conditions: [],
    conditionsOperator: "AND",
    action: "block",
    negated: false,
    substituteField: "title",
  });

  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editRule, setEditRule] = useState<Partial<FilterRule>>({});

  const addConditionToNewRule = () => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      field: "title",
      operator: "contains",
      value: "",
    };
    setNewRule({
      ...newRule,
      conditions: [...(newRule.conditions || []), newCondition],
    });
  };

  const removeConditionFromNewRule = (conditionId: string) => {
    setNewRule({
      ...newRule,
      conditions: (newRule.conditions || []).filter(
        (c) => c.id !== conditionId,
      ),
    });
  };

  const updateNewRuleCondition = (
    conditionId: string,
    updates: Partial<FilterCondition>,
  ) => {
    setNewRule({
      ...newRule,
      conditions: (newRule.conditions || []).map((c) =>
        c.id === conditionId ? { ...c, ...updates } : c,
      ),
    });
  };

  const addConditionToEditRule = () => {
    const newCondition: FilterCondition = {
      id: Date.now().toString(),
      field: "title",
      operator: "contains",
      value: "",
    };
    setEditRule({
      ...editRule,
      conditions: [...(editRule.conditions || []), newCondition],
    });
  };

  const removeConditionFromEditRule = (conditionId: string) => {
    setEditRule({
      ...editRule,
      conditions: (editRule.conditions || []).filter(
        (c) => c.id !== conditionId,
      ),
    });
  };

  const updateEditRuleCondition = (
    conditionId: string,
    updates: Partial<FilterCondition>,
  ) => {
    setEditRule({
      ...editRule,
      conditions: (editRule.conditions || []).map((c) =>
        c.id === conditionId ? { ...c, ...updates } : c,
      ),
    });
  };

  const addRule = () => {
    if (
      newRule.action === "substitute" &&
      (!newRule.substituteFrom?.trim() || !newRule.substituteTo?.trim())
    )
      return;
    if (newRule.conditions?.some((c) => !c.value?.trim())) return;

    const rule: FilterRule = {
      id: Date.now().toString(),
      conditions: newRule.conditions || [],
      conditionsOperator: newRule.conditionsOperator || "AND",
      action: newRule.action as FilterRule["action"],
      negated: newRule.negated || false,
      substituteFrom: newRule.substituteFrom?.trim(),
      substituteTo: newRule.substituteTo?.trim(),
      substituteField: newRule.substituteField as FilterRule["substituteField"],
    };

    onRulesChange([...rules, rule]);
    setNewRule({
      conditions: [],
      conditionsOperator: "AND",
      action: "block",
      negated: false,
      substituteField: "title",
    });
  };

  const startEditRule = (rule: FilterRule) => {
    setEditingRule(rule.id);
    setEditRule(rule);
  };

  const saveEditRule = () => {
    if (!editingRule) return;

    const updatedRules = rules.map((rule) =>
      rule.id === editingRule ? ({ ...rule, ...editRule } as FilterRule) : rule,
    );
    onRulesChange(updatedRules);
    setEditingRule(null);
    setEditRule({});
  };

  const cancelEditRule = () => {
    setEditingRule(null);
    setEditRule({});
  };

  const removeRule = (ruleId: string) => {
    onRulesChange(rules.filter((rule) => rule.id !== ruleId));
  };

  const moveRuleUp = (index: number) => {
    if (index === 0) return;
    const newRules = [...rules];
    const temp = newRules[index];
    newRules[index] = newRules[index - 1];
    newRules[index - 1] = temp;
    onRulesChange(newRules);
  };

  const moveRuleDown = (index: number) => {
    if (index === rules.length - 1) return;
    const newRules = [...rules];
    const temp = newRules[index];
    newRules[index] = newRules[index + 1];
    newRules[index + 1] = temp;
    onRulesChange(newRules);
  };

  const toggleRuleLogicOperator = (ruleId: string) => {
    const updatedRules = rules.map((rule) =>
      rule.id === ruleId
        ? ({
          ...rule,
          conditionsOperator:
            rule.conditionsOperator === "AND" ? "OR" : "AND",
        } as FilterRule)
        : rule,
    );
    onRulesChange(updatedRules);
  };

  const getFieldLabel = (field: FilterCondition["field"]) => {
    const labels = {
      title: "Title",
      description: "Description",
      location: "Location",
      organizer: "Organizer",
    };
    return labels[field];
  };

  const getOperatorLabel = (operator: FilterCondition["operator"]) => {
    const labels = {
      contains: "contains",
      equals: "equals",
      starts_with: "starts with",
      ends_with: "ends with",
      not_contains: "does not contain",
    };
    return labels[operator];
  };

  const getActionColor = (action: FilterRule["action"]) => {
    const colors = {
      block: "destructive",
      highlight: "default",
      hide: "secondary",
      substitute: "outline",
    } as const;
    return colors[action];
  };

  const renderRuleDescription = (rule: FilterRule) => {
    if (rule.action === "substitute") {
      return (
        <div className="text-sm">
          <span className="font-medium">Substitute</span>
          <span className="text-muted-foreground mx-1">
            "{rule.substituteFrom}"
          </span>
          <span className="text-muted-foreground">with</span>
          <span className="text-muted-foreground mx-1">
            "{rule.substituteTo}"
          </span>
          <span className="text-muted-foreground">
            in {getFieldLabel(rule.substituteField || "title")}
          </span>
          {rule.conditions.length > 0 && (
            <>
              <span className="text-muted-foreground mx-1">when</span>
              {rule.conditions.map((condition, index) => (
                <span key={condition.id}>
                  {index > 0 && (
                    <Badge
                      variant="outline"
                      className="mx-1 text-xs cursor-pointer hover:bg-muted"
                      onClick={() => toggleRuleLogicOperator(rule.id)}
                    >
                      {rule.conditionsOperator}
                    </Badge>
                  )}
                  <span className="font-medium">
                    {getFieldLabel(condition.field)}
                  </span>
                  <span className="text-muted-foreground mx-1">
                    {getOperatorLabel(condition.operator)}
                  </span>
                  <span className="font-medium">"{condition.value}"</span>
                </span>
              ))}
            </>
          )}
        </div>
      );
    }

    return (
      <div className="text-sm">
        {rule.negated && <span className="text-red-500 font-medium">NOT </span>}
        {rule.conditions.length === 0 ? (
          <span className="text-muted-foreground italic">
            No conditions (applies to all events)
          </span>
        ) : (
          rule.conditions.map((condition, index) => (
            <span key={condition.id}>
              {index > 0 && (
                <Badge
                  variant="outline"
                  className="mx-1 text-xs cursor-pointer hover:bg-muted"
                  onClick={() => toggleRuleLogicOperator(rule.id)}
                >
                  {rule.conditionsOperator}
                </Badge>
              )}
              <span className="font-medium">
                {getFieldLabel(condition.field)}
              </span>
              <span className="text-muted-foreground mx-1">
                {getOperatorLabel(condition.operator)}
              </span>
              <span className="font-medium">"{condition.value}"</span>
            </span>
          ))
        )}
      </div>
    );
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="negate"
              checked={newRule.negated}
              onCheckedChange={(checked) =>
                setNewRule({ ...newRule, negated: checked as boolean })
              }
            />
            <Label htmlFor="negate" className="text-sm">
              Negate this rule (NOT)
            </Label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">
                Conditions (optional):
              </Label>
              {(newRule.conditions?.length || 0) > 1 && (
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() =>
                    setNewRule({
                      ...newRule,
                      conditionsOperator:
                        newRule.conditionsOperator === "AND" ? "OR" : "AND",
                    })
                  }
                >
                  {newRule.conditionsOperator}
                </Badge>
              )}
            </div>

            {newRule.conditions?.map((condition, index) => (
              <div key={condition.id} className="space-y-2">
                {index > 0 && (
                  <div className="flex justify-center">
                    <Badge variant="outline" className="text-xs">
                      {newRule.conditionsOperator}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    <Select
                      value={condition.field}
                      onValueChange={(value) =>
                        updateNewRuleCondition(condition.id, {
                          field: value as FilterCondition["field"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="description">Description</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="organizer">Organizer</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(value) =>
                        updateNewRuleCondition(condition.id, {
                          operator: value as FilterCondition["operator"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">contains</SelectItem>
                        <SelectItem value="equals">equals</SelectItem>
                        <SelectItem value="starts_with">starts with</SelectItem>
                        <SelectItem value="ends_with">ends with</SelectItem>
                        <SelectItem value="not_contains">
                          does not contain
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Enter value..."
                    value={condition.value}
                    onChange={(e) =>
                      updateNewRuleCondition(condition.id, {
                        value: e.target.value,
                      })
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeConditionFromNewRule(condition.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={addConditionToNewRule}
              className="w-full bg-transparent"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Condition
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={newRule.action}
              onValueChange={(value) =>
                setNewRule({
                  ...newRule,
                  action: value as FilterRule["action"],
                })
              }
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Block Event</SelectItem>
                <SelectItem value="highlight">Highlight Event</SelectItem>
                <SelectItem value="hide">Hide Event</SelectItem>
                <SelectItem value="substitute">Substitute Text</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={addRule}
              disabled={
                (newRule.action === "substitute" &&
                  (!newRule.substituteFrom?.trim() ||
                    !newRule.substituteTo?.trim())) ||
                newRule.conditions?.some((c) => !c.value?.trim())
              }
            >
              Add Rule
            </Button>
          </div>

          {newRule.action === "substitute" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Substitution Settings
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="From (text to replace)"
                  value={newRule.substituteFrom || ""}
                  onChange={(e) =>
                    setNewRule({ ...newRule, substituteFrom: e.target.value })
                  }
                />
                <Input
                  placeholder="To (replacement text)"
                  value={newRule.substituteTo || ""}
                  onChange={(e) =>
                    setNewRule({ ...newRule, substituteTo: e.target.value })
                  }
                />
              </div>
              <Select
                value={newRule.substituteField}
                onValueChange={(value) =>
                  setNewRule({
                    ...newRule,
                    substituteField: value as FilterRule["substituteField"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Field to substitute in" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                </SelectContent>
              </Select>
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

              {rules.map((rule, index) => (
                <div key={rule.id}>
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-card">
                    {editingRule === rule.id ? (
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editRule.negated}
                            onCheckedChange={(checked) =>
                              setEditRule({
                                ...editRule,
                                negated: checked as boolean,
                              })
                            }
                          />
                          <Label className="text-sm">Negate</Label>
                        </div>

                        {editRule.action === "substitute" ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                placeholder="From"
                                value={editRule.substituteFrom || ""}
                                onChange={(e) =>
                                  setEditRule({
                                    ...editRule,
                                    substituteFrom: e.target.value,
                                  })
                                }
                              />
                              <Input
                                placeholder="To"
                                value={editRule.substituteTo || ""}
                                onChange={(e) =>
                                  setEditRule({
                                    ...editRule,
                                    substituteTo: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <Select
                              value={editRule.substituteField}
                              onValueChange={(value) =>
                                setEditRule({
                                  ...editRule,
                                  substituteField:
                                    value as FilterRule["substituteField"],
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="title">Title</SelectItem>
                                <SelectItem value="description">
                                  Description
                                </SelectItem>
                                <SelectItem value="location">
                                  Location
                                </SelectItem>
                                <SelectItem value="organizer">
                                  Organizer
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Label className="text-sm font-medium">
                                Conditions:
                              </Label>
                              {(editRule.conditions?.length || 0) > 1 && (
                                <Badge
                                  variant="outline"
                                  className="cursor-pointer hover:bg-muted"
                                  onClick={() =>
                                    setEditRule({
                                      ...editRule,
                                      conditionsOperator:
                                        editRule.conditionsOperator === "AND"
                                          ? "OR"
                                          : "AND",
                                    })
                                  }
                                >
                                  {editRule.conditionsOperator}
                                </Badge>
                              )}
                            </div>

                            {editRule.conditions?.map(
                              (condition, condIndex) => (
                                <div key={condition.id} className="space-y-2">
                                  {condIndex > 0 && (
                                    <div className="flex justify-center">
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {editRule.conditionsOperator}
                                      </Badge>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <div className="grid grid-cols-2 gap-2 flex-1">
                                      <Select
                                        value={condition.field}
                                        onValueChange={(value) =>
                                          updateEditRuleCondition(
                                            condition.id,
                                            {
                                              field:
                                                value as FilterCondition["field"],
                                            },
                                          )
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="title">
                                            Title
                                          </SelectItem>
                                          <SelectItem value="description">
                                            Description
                                          </SelectItem>
                                          <SelectItem value="location">
                                            Location
                                          </SelectItem>
                                          <SelectItem value="organizer">
                                            Organizer
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        value={condition.operator}
                                        onValueChange={(value) =>
                                          updateEditRuleCondition(
                                            condition.id,
                                            {
                                              operator:
                                                value as FilterCondition["operator"],
                                            },
                                          )
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="contains">
                                            contains
                                          </SelectItem>
                                          <SelectItem value="equals">
                                            equals
                                          </SelectItem>
                                          <SelectItem value="starts_with">
                                            starts with
                                          </SelectItem>
                                          <SelectItem value="ends_with">
                                            ends with
                                          </SelectItem>
                                          <SelectItem value="not_contains">
                                            does not contain
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Input
                                      value={condition.value || ""}
                                      onChange={(e) =>
                                        updateEditRuleCondition(condition.id, {
                                          value: e.target.value,
                                        })
                                      }
                                      className="flex-1"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        removeConditionFromEditRule(
                                          condition.id,
                                        )
                                      }
                                    >
                                      <TrashIcon className="h-4 w-4"/>
                                    </Button>
                                  </div>
                                </div>
                              ),
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addConditionToEditRule}
                              className="w-full bg-transparent"
                            >
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Add Condition
                            </Button>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEditRule}>
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditRule}
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveRuleUp(index)}
                            disabled={index === 0}
                            className="h-6 w-6 p-0"
                          >
                            <ChevronUpIcon className="h-3 w-3" />
                          </Button>
                          <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveRuleDown(index)}
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
                            {rule.action === "block" && "Block"}
                            {rule.action === "highlight" && "Highlight"}
                            {rule.action === "hide" && "Hide"}
                            {rule.action === "substitute" && "Substitute"}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditRule(rule)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRule(rule.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
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
