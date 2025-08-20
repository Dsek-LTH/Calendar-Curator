import { useState, useEffect, useCallback } from "react";
import { Rule, fetchClient } from "@/lib/api";

export const useRulesManager = (
  calendarId: string | null,
  onRuleChange?: () => void,
) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadRules = useCallback(async () => {
    if (!calendarId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchClient.GET("/calendars/{id}/rules/list", {
        params: { path: { id: calendarId } },
      });

      if (response.data) {
        setRules(response.data);
      }
    } catch (err) {
      console.error("Failed to load rules:", err);
      setError("Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, [calendarId]);

  // Load rules when calendar ID changes
  useEffect(() => {
    if (calendarId) {
      loadRules();
    } else {
      setRules([]);
    }
  }, [calendarId, loadRules]);

  const createRule = async (rule: Rule) => {
    if (!calendarId) return;

    try {
      await fetchClient.POST("/calendars/{id}/rules/create", {
        params: { path: { id: calendarId } },
        body: rule,
      });

      setRules((prev) => [...prev, { ...rule, id: Date.now().toString() }]);

      // Reload rules after creation
      await loadRules();

      // Trigger event reload to update filtered_by
      onRuleChange?.();
    } catch (err) {
      console.error("Failed to create rule:", err);
      setError("Failed to create rule");
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!calendarId) return;

    try {
      await fetchClient.DELETE("/calendars/{id}/rules/{rule_id}/delete", {
        params: { path: { id: calendarId, rule_id: ruleId } },
      });

      setRules((prev) => prev.filter((rule) => rule.id !== ruleId));

      // Reload rules after deletion
      await loadRules();

      // Trigger event reload to update filtered_by
      onRuleChange?.();
    } catch (err) {
      console.error("Failed to delete rule:", err);
      setError("Failed to delete rule");
    }
  };

  const reorderRules = async (fromIndex: number, toIndex: number) => {
    if (!calendarId || fromIndex === toIndex) return;

    try {
      // Create new order array
      const newRules = [...rules];
      const [movedRule] = newRules.splice(fromIndex, 1);
      newRules.splice(toIndex, 0, movedRule);

      setRules(newRules);

      // Extract rule IDs in the new order
      const ruleIds = newRules.map((rule) => rule.id);

      await fetchClient.PUT("/calendars/{id}/rules/reorder", {
        params: { path: { id: calendarId } },
        body: { rule_ids: ruleIds },
      });

      // Reload rules after reordering
      await loadRules();

      // Trigger event reload to update filtered_by
      onRuleChange?.();
    } catch (err) {
      console.error("Failed to reorder rules:", err);
      setError("Failed to reorder rules");
    }
  };

  const updateRule = async (ruleId: string, rule: Rule) => {
    if (!calendarId) return;

    try {
      await fetchClient.PUT("/calendars/{id}/rules/{rule_id}/update", {
        params: { path: { id: calendarId, rule_id: ruleId } },
        body: rule,
      });

      // Reload rules after update
      await loadRules();

      // Trigger event reload to update filtered_by
      onRuleChange?.();
    } catch (err) {
      console.error("Failed to update rule:", err);
      setError("Failed to update rule");
    }
  };

  const duplicateRule = async (rule: Rule) => {
    if (!calendarId) return;

    try {
      await fetchClient.POST("/calendars/{id}/rules/{rule_id}/duplicate", {
        params: { path: { id: calendarId, rule_id: rule.id } },
      });

      // Reload rules after duplication
      await loadRules();

      // Trigger event reload to update filtered_by
      onRuleChange?.();
    } catch (err) {
      console.error("Failed to duplicate rule:", err);
      setError("Failed to duplicate rule");
    }
  };

  return {
    rules,
    loading,
    error,
    createRule,
    deleteRule,
    reorderRules,
    updateRule,
    duplicateRule,
    loadRules,
  };
};
