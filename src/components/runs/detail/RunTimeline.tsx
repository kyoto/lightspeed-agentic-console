import { Timestamp } from '@openshift-console/dynamic-plugin-sdk';
import { ExpandableSection, ProgressStep, ProgressStepper } from '@patternfly/react-core';
import { type FC, MouseEvent, useState } from 'react';
import { TimelineEvent } from '../../../models/agenticrun-views';
import { useTranslation } from 'react-i18next';

interface RunTimelineProps {
  events: TimelineEvent[];
}

export const RunTimeline: FC<RunTimelineProps> = ({ events }) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');
  const [isExpanded, setIsExpanded] = useState(false);

  const onToggle = (_event: MouseEvent, isExpanded: boolean) => {
    setIsExpanded(isExpanded);
  };
  return (
    <ExpandableSection
      isExpanded={isExpanded}
      onToggle={onToggle}
      toggleText={t('Timeline')}
      toggleWrapper="h4"
    >
      <ProgressStepper isVertical>
        {events.map((event, i) => (
          <ProgressStep
            description={
              <>
                {event.timestamp && <Timestamp simple timestamp={event.timestamp} />}
                {event.description && <> — {event.description}</>}
              </>
            }
            id={`timeline-step-${i}`}
            isCurrent={event.isCurrent}
            key={i}
            titleId={`timeline-step-title-${i}`}
            variant={event.variant}
          >
            {event.label}
          </ProgressStep>
        ))}
      </ProgressStepper>
    </ExpandableSection>
  );
};
