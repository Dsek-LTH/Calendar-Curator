import { Badge } from "@/components/ui/badge";
import { Rule } from "@/lib/api";
import {
  getFieldLabel,
  getMatchTypeLabel,
  getTransformDescription,
} from "./utils";

interface RuleDescriptionProps {
  rule: Rule;
}

export function RuleDescription({ rule }: RuleDescriptionProps) {
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
}
