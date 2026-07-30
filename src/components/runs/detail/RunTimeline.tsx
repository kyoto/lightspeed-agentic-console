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
      toggleWrapper="h4"
      toggleText={t('Timeline')}
      onToggle={onToggle}
      isExpanded={isExpanded}
    >
      <ProgressStepper isVertical>
        {events.map((event, i) => (
          <ProgressStep
            key={i}
            id={`timeline-step-${i}`}
            titleId={`timeline-step-title-${i}`}
            variant={event.variant}
            isCurrent={event.isCurrent}
            description={
              <>
                {event.timestamp && <Timestamp simple timestamp={event.timestamp} />}
                {event.description && <> — {event.description}</>}
              </>
            }
          >
            {event.label}
          </ProgressStep>
        ))}
      </ProgressStepper>
    </ExpandableSection>
  );
};
