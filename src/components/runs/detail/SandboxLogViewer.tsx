import {
  Alert,
  Button,
  ExpandableSection,
  Label,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import RhUiDownloadIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-download-icon';
import RhUiExternalLinkIcon from '@patternfly/react-icons/dist/esm/icons/rh-ui-external-link-icon';
import { LogViewer, LogViewerSearch } from '@patternfly/react-log-viewer';
import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type OtelPhase, useRetainedLogs } from '../../../hooks/useRetainedLogs';
import { useSandboxLogStream } from '../../../hooks/useSandboxLogStream';
import { SandboxView } from '../../../models/agenticrun-views';
import { buildPodLogUrl } from '../../../utils/agenticrun-utils';
import { useRunUid } from '../RunUidContext';
import './SandboxLogViewer.css';

interface SandboxLogViewerProps {
  phase?: OtelPhase;
  title: string;
  sandbox: SandboxView;
  sinceTime?: string;
  streaming?: boolean;
}

export const SandboxLogViewer: FC<SandboxLogViewerProps> = ({
  phase,
  title,
  sandbox,
  sinceTime,
  streaming = false,
}) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');
  const runUid = useRunUid();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const logViewerRef = useRef<{ scrollToItem?: (index: number) => void }>(null);

  const retained = useRetainedLogs(runUid, isExpanded && !streaming, phase);
  const useOtel =
    retained.available && !streaming && !!runUid && !retained.error && retained.lines.length > 0;

  const podLogs = useSandboxLogStream(
    sandbox,
    isExpanded && !useOtel && !retained.loading,
    streaming,
    sinceTime,
  );

  const lines = useOtel ? retained.lines : podLogs.lines;
  const loading = retained.loading || (useOtel ? false : podLogs.loading);
  const error = useOtel
    ? retained.error
    : (podLogs.error ?? (podLogs.lines.length === 0 ? retained.error : undefined));

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

  // Unlike the viewer's own request, this omits sinceTime, follow and the tailLines cap. The
  // sandbox pod is per stage, so its whole log is this stage's log.
  const podLogUrl = useMemo(
    () => buildPodLogUrl(sandbox.namespace, sandbox.podName, { timestamps: 'true' }),
    [sandbox.namespace, sandbox.podName],
  );

  const downloadFilename = `${sandbox.podName.replace(/[^a-zA-Z0-9._-]/g, '_')}.log`;
  // A failed fetch would otherwise offer a download of the API server's error body
  const showLogActions = !useOtel && !retained.loading && !podLogs.error;

  const toolbar = (
    <Toolbar>
      <ToolbarContent>
        <ToolbarItem>
          <LogViewerSearch minSearchChars={2} placeholder={t('Search logs...')} />
        </ToolbarItem>
        {showLogActions && (
          <ToolbarGroup align={{ default: 'alignEnd' }} variant="action-group-plain">
            <ToolbarItem>
              <Tooltip aria="none" content={t('View raw logs')}>
                <Button
                  aria-label={t('View raw logs')}
                  component="a"
                  href={podLogUrl}
                  icon={<RhUiExternalLinkIcon />}
                  rel="noopener noreferrer"
                  target="_blank"
                  variant="plain"
                />
              </Tooltip>
            </ToolbarItem>
            <ToolbarItem>
              <Tooltip aria="none" content={t('Download')}>
                <Button
                  aria-label={t('Download')}
                  component="a"
                  download={downloadFilename}
                  href={podLogUrl}
                  icon={<RhUiDownloadIcon />}
                  variant="plain"
                />
              </Tooltip>
            </ToolbarItem>
          </ToolbarGroup>
        )}
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
      toggleContent={
        <>
          {isExpanded ? t('Hide {{title}} logs', { title }) : t('View {{title}} logs', { title })}
          {streaming && (
            <>
              {' '}
              <Label color="blue" isCompact>
                {t('Live')}
              </Label>
            </>
          )}
        </>
      }
    >
      {error && <Alert isInline isPlain title={error} variant="warning" />}
      <div className="ols-plugin__sandbox-log-viewer">
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
          height={280}
          innerRef={logViewerRef}
          isTextWrapped
          onScroll={handleScroll}
          toolbar={toolbar}
        />
      </div>
    </ExpandableSection>
  );
};
