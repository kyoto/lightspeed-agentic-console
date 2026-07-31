import {
  Alert,
  Button,
  Checkbox,
  ExpandableSection,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { LogViewer, LogViewerSearch } from '@patternfly/react-log-viewer';
import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSandboxLogStream } from '../../../hooks/useSandboxLogStream';
import { SandboxView } from '../../../models/agenticrun-views';

interface SandboxLogViewerProps {
  title: string;
  sandbox: SandboxView;
  sinceTime?: string;
  streaming?: boolean;
}

export const SandboxLogViewer: FC<SandboxLogViewerProps> = ({
  title,
  sandbox,
  sinceTime,
  streaming = false,
}) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const [hideHealthChecks, setHideHealthChecks] = useState(true);
  const logViewerRef = useRef<{ scrollToItem?: (index: number) => void }>(null);

  const { lines, loading, error } = useSandboxLogStream(
    sandbox,
    isExpanded,
    streaming,
    sinceTime,
    hideHealthChecks,
  );

  const prevLinesLengthRef = useRef(0);
  useEffect(() => {
    if (
      isFollowing &&
      lines.length > prevLinesLengthRef.current &&
      logViewerRef.current?.scrollToItem
    ) {
      logViewerRef.current.scrollToItem(lines.length - 1);
    }
    prevLinesLengthRef.current = lines.length;
  }, [lines.length, isFollowing]);

  const handleScroll = useCallback(
    ({
      scrollOffsetToBottom,
      scrollUpdateWasRequested,
    }: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollOffsetToBottom: number;
      scrollUpdateWasRequested: boolean;
    }) => {
      if (!scrollUpdateWasRequested) {
        setIsFollowing(scrollOffsetToBottom < 1);
      }
    },
    [],
  );

  const logData = useMemo(() => lines.join('\n'), [lines]);

  const toolbar = (
    <Toolbar>
      <ToolbarContent>
        <ToolbarItem>
          <LogViewerSearch minSearchChars={2} placeholder={t('Search logs...')} />
        </ToolbarItem>
        <ToolbarItem alignSelf="center">
          <Checkbox
            id={`health-check-filter-${title}`}
            isChecked={hideHealthChecks}
            label={t('Hide health checks')}
            onChange={(_e, checked) => setHideHealthChecks(checked)}
          />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );

  const footer =
    !isFollowing && streaming ? (
      <Button onClick={() => setIsFollowing(true)} variant="link">
        {t('Resume auto-scroll')}
      </Button>
    ) : undefined;

  return (
    <ExpandableSection
      isExpanded={isExpanded}
      onToggle={(_e, expanded) => setIsExpanded(expanded)}
      toggleText={
        isExpanded ? t('Hide {{title}} logs', { title }) : t('View {{title}} logs', { title })
      }
    >
      {error && <Alert isInline isPlain title={error} variant="warning" />}
      <LogViewer
        data={
          error
            ? t('Failed to load logs.')
            : loading && lines.length === 0
              ? t('Loading logs...')
              : logData || t('No logs available.')
        }
        footer={footer}
        hasLineNumbers
        height={400}
        innerRef={logViewerRef}
        isTextWrapped
        onScroll={handleScroll}
        toolbar={toolbar}
      />
    </ExpandableSection>
  );
};
