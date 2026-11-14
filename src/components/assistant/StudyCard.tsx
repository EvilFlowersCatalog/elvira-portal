import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheck, FiX } from 'react-icons/fi';
import {
  IAssistantCitation,
  IAssistantKeyConcepts,
  IAssistantQuiz,
  IAssistantStudy,
  IAssistantWalkthrough,
} from '../../utils/interfaces/assistant';
import { chipText } from '../../utils/func/assistantMessages';
import CitationChip from './CitationChip';

interface StudyActions {
  /** The citation behind a label, if the turn resolved it. */
  resolve: (label: string) => IAssistantCitation | undefined;
  onOpen: (citation: IAssistantCitation) => void;
  /** Sends a message (the next walkthrough step). Omitted while an answer streams. */
  onSend?: (message: string) => void;
  /** Marks the concepts in the reader's copy (AI highlights); only for a chat bound to one. */
  onHighlight?: (prompt: string) => Promise<void>;
}

/**
 * A study label's chip. The catalog resolves the labels on a card's items into the turn's `citations`
 * (EvilFlowersCatalog#145), so each chip opens its own paragraph; one still unresolved stays inert.
 */
function LabelChips({ labels, resolve, onOpen }: { labels: string[] } & Pick<StudyActions, 'resolve' | 'onOpen'>) {
  return (
    <>
      {labels.map((label) => (
        <CitationChip key={label} citation={resolve(label)} onOpen={onOpen}>
          {chipText(label)}
        </CitationChip>
      ))}
    </>
  );
}

function Header({ kind, data }: { kind: string; data: { section: string; title: string; page_range: [number, number] } }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-primary font-semibold">{kind}</span>
      <span className="text-sm font-semibold text-black dark:text-white">{data.section}</span>
      <span className="text-[11px] text-gray-500 dark:text-gray-400">
        {data.title} · {t('assistant.study.pages', { from: data.page_range[0], to: data.page_range[1] })}
      </span>
    </div>
  );
}

function Quiz({ data, resolve, onOpen }: { data: IAssistantQuiz } & StudyActions) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = data.questions[index];
  const last = index === data.questions.length - 1;

  if (finished) {
    return (
      <div className="flex flex-col gap-2 items-start">
        <p className="text-sm font-semibold text-black dark:text-white" aria-live="polite">
          {t('assistant.study.score', { score, total: data.questions.length })}
        </p>
        <button
          type="button"
          onClick={() => {
            setIndex(0);
            setPicked(null);
            setScore(0);
            setFinished(false);
          }}
          className="text-xs px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primaryDark"
        >
          {t('assistant.study.again')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] text-gray-500 dark:text-gray-400">
        {t('assistant.study.question', { current: index + 1, total: data.questions.length })}
      </span>
      <p className="text-sm text-black dark:text-white">{question.question}</p>
      <div className="flex flex-col gap-1.5" role="radiogroup" aria-label={question.question}>
        {question.options.map((option, optionIndex) => {
          const answered = picked !== null;
          const right = optionIndex === question.answer_index;
          const chosen = optionIndex === picked;
          const tone = !answered
            ? 'border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            : right
              ? 'border-green-600 bg-green-600/10'
              : chosen
                ? 'border-red bg-red/10'
                : 'border-zinc-300 dark:border-zinc-600 opacity-60';
          return (
            <button
              key={optionIndex}
              type="button"
              role="radio"
              aria-checked={chosen}
              disabled={answered}
              onClick={() => {
                setPicked(optionIndex);
                if (right) setScore((value) => value + 1);
              }}
              className={`flex items-center gap-2 text-left text-sm px-3 py-2 rounded-md border text-black dark:text-white ${tone}`}
            >
              <span className="w-5 shrink-0 font-semibold">{String.fromCharCode(65 + optionIndex)}</span>
              <span className="flex-1">{option}</span>
              {answered && right ? <FiCheck className="text-green-600" aria-hidden="true" /> : null}
              {answered && chosen && !right ? <FiX className="text-red" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="text-xs font-semibold text-black dark:text-white">
            {picked === question.answer_index ? t('assistant.study.correct') : t('assistant.study.wrong')}
          </p>
          {question.explanation ? (
            <p className="text-xs text-gray-700 dark:text-gray-300">
              {question.explanation}{' '}
              <LabelChips labels={question.labels} resolve={resolve} onOpen={onOpen} />
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (last) {
                setFinished(true);
                return;
              }
              setIndex(index + 1);
              setPicked(null);
            }}
            className="self-start text-xs px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primaryDark"
          >
            {last ? t('assistant.study.finish') : t('assistant.study.next')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Walkthrough({ data, resolve, onOpen, onSend }: { data: IAssistantWalkthrough } & StudyActions) {
  const { t } = useTranslation();
  const next = data.next;
  const samePart = next && next.section === data.section;
  return (
    <div className="flex flex-col gap-2">
      {data.prerequisites?.length ? (
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          {t('assistant.study.readBefore')}:{' '}
          {data.prerequisites.map((item, index) => (
            <span key={`${item.entry_id}-${item.section}`}>
              {index > 0 ? ', ' : ''}
              <button
                type="button"
                className="hover:underline text-sky-700 dark:text-sky-300"
                onClick={() =>
                  onOpen({ label: '', entry_id: item.entry_id, section: item.section, page: item.page })
                }
              >
                {item.section}
              </button>
            </span>
          ))}
        </p>
      ) : null}
      <ol className="list-decimal pl-5 flex flex-col gap-1.5 text-sm text-black dark:text-white">
        {data.points.map((point, index) => (
          <li key={index}>
            {point.text} <LabelChips labels={point.labels} resolve={resolve} onOpen={onOpen} />
          </li>
        ))}
      </ol>
      {next && onSend ? (
        <button
          type="button"
          onClick={() =>
            onSend(
              samePart
                ? t('assistant.study.nextPartMessage', { section: next.section })
                : t('assistant.study.nextSectionMessage', { section: next.section }),
            )
          }
          className="self-start text-xs px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primaryDark"
        >
          {samePart ? t('assistant.study.nextPart') : `${t('assistant.study.nextSection')} ${next.section}`}
        </button>
      ) : null}
    </div>
  );
}

function KeyConcepts({ data, resolve, onOpen, onHighlight }: { data: IAssistantKeyConcepts } & StudyActions) {
  const { t } = useTranslation();
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'failed'>('idle');
  return (
    <div className="flex flex-col gap-2">
      <dl className="flex flex-col gap-1.5 text-sm">
        {data.concepts.map((concept) => (
          <div key={concept.term}>
            <dt className="font-semibold text-black dark:text-white">{concept.term}</dt>
            <dd className="text-gray-700 dark:text-gray-300">
              {concept.definition} <LabelChips labels={concept.labels} resolve={resolve} onOpen={onOpen} />
            </dd>
          </div>
        ))}
      </dl>
      {onHighlight ? (
        <button
          type="button"
          disabled={state === 'busy' || state === 'done'}
          onClick={async () => {
            setState('busy');
            try {
              await onHighlight(
                t('assistant.study.highlightPrompt', {
                  section: data.section,
                  terms: data.concepts.map((concept) => concept.term).join(', '),
                }),
              );
              setState('done');
            } catch {
              setState('failed');
            }
          }}
          className="self-start text-xs px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primaryDark disabled:opacity-60"
        >
          {state === 'busy'
            ? t('assistant.study.highlighting')
            : state === 'done'
              ? t('assistant.study.highlighted')
              : t('assistant.study.highlight')}
        </button>
      ) : null}
      {state === 'failed' ? <p className="text-xs text-redText dark:text-red">{t('assistant.study.highlightFailed')}</p> : null}
    </div>
  );
}

/** A study card that is the answer of its turn (IP-030 Phase 4): quiz, walkthrough or glossary. */
export default function StudyCard({ study, ...actions }: { study: IAssistantStudy } & StudyActions) {
  const { t } = useTranslation();
  const kind =
    study.mode === 'quiz'
      ? t('assistant.study.quiz')
      : study.mode === 'walkthrough'
        ? t('assistant.study.walkthrough')
        : t('assistant.study.keyConcepts');
  return (
    <div className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 p-3 flex flex-col gap-3 max-w-[85%]">
      <Header kind={kind} data={study.data} />
      {study.mode === 'quiz' ? <Quiz data={study.data} {...actions} /> : null}
      {study.mode === 'walkthrough' ? <Walkthrough data={study.data} {...actions} /> : null}
      {study.mode === 'key_concepts' ? <KeyConcepts data={study.data} {...actions} /> : null}
    </div>
  );
}
